// load divergences, tests, and fixtures for the catalogue site

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as YAML from "yaml";
import { loadTestSuite } from "../format/parse.js";
import { caseKey } from "../identity/index.js";

export interface DvEntry {
  id: string;
  summary: string;
  cause: string;
  category: string;
  engines: string[];
  behavior: { signature: string };
  testCount: number;
  subjects: string[];
  tests: string[];
  seeded: string;
  lastConfirmed: string;
}

export interface TestInfo {
  id: string;
  ref: string;
  subject: string;
  subjectRef?: string;
  name?: string;
  semanticHash?: `sha256:${string}`;
  formula: string;
  category: string;
  suite: string;
  expect: unknown;
  aliases?: string[];
  // only fields the site actually renders — override.expect / .note not loaded
  overrides: Record<string, { cause: string; recorded?: unknown }>;
}

// test ids are "<suite>/<6-char-hex>"; the tail reads as the test "name"
export function testIdTail(id: string, suite: string): string {
  return id.slice(suite.length + 1);
}

export function loadDvs(dir: string): DvEntry[] {
  if (!existsSync(dir)) {
    throw new Error(`catalogue directory not found: ${dir}`);
  }
  const files = readdirSync(dir).filter((f) => /^DV-\d+\.yaml$/.test(f)).sort();
  const dvs: DvEntry[] = [];
  for (const f of files) {
    const raw = YAML.parse(readFileSync(join(dir, f), "utf8"));
    dvs.push({
      id: raw.id,
      summary: raw.summary,
      cause: raw.cause,
      category: raw.category,
      engines: raw.engines ?? [],
      behavior: raw.behavior ?? { signature: "" },
      testCount: raw["test-count"] ?? raw.tests?.length ?? 0,
      subjects: raw.subjects ?? [],
      tests: raw.tests ?? [],
      seeded: raw.seeded ?? "",
      lastConfirmed: raw["last-confirmed"] ?? "",
    });
  }
  return dvs;
}

export function loadTests(dir: string): Map<string, TestInfo> {
  const out = new Map<string, TestInfo>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".yaml")) continue;
    const path = join(dir, f);
    let doc: ReturnType<typeof loadTestSuite>;
    try {
      doc = loadTestSuite(path);
    } catch {
      continue;
    }
    const suite = f.replace(/\.yaml$/, "");
    for (const t of (doc?.tests ?? [])) {
      if (typeof t.id !== "string") continue;
      const formula = typeof t.formula === "string"
        ? t.formula
        : JSON.stringify(t.formula);
      const overrides: TestInfo["overrides"] = {};
      if (t.overrides && typeof t.overrides === "object") {
        for (const [eng, ov] of Object.entries(t.overrides as Record<string, unknown>)) {
          if (ov && typeof ov === "object") {
            const o = ov as Record<string, unknown>;
            overrides[eng] = {
              cause: typeof o.cause === "string" ? o.cause : "TODO",
              recorded: o.recorded,
            };
          }
        }
      }
      const ref = t.id;
      out.set(ref, {
        id: ref,
        ref,
        subject: typeof t.subject === "string" ? t.subject : "",
        subjectRef: typeof t.subjectRef === "string" ? t.subjectRef : undefined,
        name: typeof t.name === "string" ? t.name : undefined,
        semanticHash: typeof t.semanticHash === "string" ? t.semanticHash : undefined,
        formula,
        category: typeof t.category === "string" ? t.category : "",
        suite,
        expect: t.expect,
        aliases: Array.isArray(t.aliases) ? t.aliases : undefined,
        overrides,
      });
    }
  }
  return out;
}

// test key → engine → fixture result, filtered to requested tests. When full
// test metadata is available, semantic-hash fixture rows are also exposed under
// public refs so catalogue pages can keep user-facing URLs stable.
export function loadFixtures(
  dir: string,
  keep: Set<string> | Map<string, TestInfo>,
): Map<string, Map<string, unknown>> {
  const out = new Map<string, Map<string, unknown>>();
  if (!existsSync(dir)) return out;
  const keyTargets = fixtureKeyTargets(keep);
  for (const suite of readdirSync(dir)) {
    const suitePath = join(dir, suite);
    let stat;
    try { stat = readdirSync(suitePath); } catch { continue; }
    for (const f of stat) {
      if (!f.endsWith(".json")) continue;
      const engine = f.replace(/\.json$/, "");
      let fx: { results?: Record<string, { result?: unknown }> };
      try {
        fx = JSON.parse(readFileSync(join(suitePath, f), "utf8"));
      } catch {
        continue;
      }
      for (const [tid, entry] of Object.entries(fx.results ?? {})) {
        const targets = keyTargets.get(tid) ?? (keep instanceof Set && isSemanticHash(tid) ? [tid] : undefined);
        if (!targets) continue;
        for (const target of targets) {
          if (!out.has(target)) out.set(target, new Map());
          out.get(target)!.set(engine, entry?.result);
        }
      }
    }
  }
  return out;
}

function fixtureKeyTargets(keep: Set<string> | Map<string, TestInfo>): Map<string, string[]> {
  if (keep instanceof Set) {
    return new Map([...keep].map((key) => [key, [key]]));
  }

  const out = new Map<string, Set<string>>();
  for (const test of keep.values()) {
    const acceptedKeys = new Set([test.id, test.ref, caseKey(test)].filter(Boolean));
    const outputKeys = new Set([test.id, test.ref, caseKey(test)].filter(Boolean));
    for (const acceptedKey of acceptedKeys) {
      const targets = out.get(acceptedKey) ?? new Set<string>();
      for (const outputKey of outputKeys) targets.add(outputKey);
      out.set(acceptedKey, targets);
    }
  }
  return new Map([...out].map(([key, targets]) => [key, [...targets]]));
}

function isSemanticHash(key: string): key is `sha256:${string}` {
  return key.startsWith("sha256:");
}
