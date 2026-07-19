// load divergences, tests, and fixtures for the catalogue site

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as YAML from "yaml";
import type { ScopeClause } from "@cartularium/contracts";
import { loadTestSuite } from "../format/parse.js";
import { caseKey } from "../identity/index.js";
import {
  liftEntryToOutcome,
  type FixtureEntry,
  type LegacyEntry,
} from "../fixtures.js";
import { isPlatform, type Outcome, type Platform } from "../format/values.js";

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
  /** authored scope clauses (yaml `scope:`, 3f) — the seed exporter prefers this over the
   * `tests` ref-set fallback. When present alongside a predicate clause, `tests` is the V4
   * render substrate / materialized snapshot at reclassify time, not kept in sync. */
  scope?: ScopeClause[];
  seeded: string;
  lastConfirmed: string;
}

// YAML `scope:` sugar (reclassify-policy-2026-07-11.md D-3f-2): a clause is `refs` XOR the
// author-declared predicate dimensions (`tags` / `subjectIn`). Observed dimensions
// (`enginesAlone`/`valueKind`/`sentinel`) are NOT yaml-authorable — they ride the deferred
// fork-property matcher; the store schema admits them, the sugar just doesn't author them.
// Malformed scope fails the load (fail fast, never a silent ref-set fallback).
function parseDvScope(raw: unknown, id: string): ScopeClause[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`${id}: scope must be a non-empty list of clauses`);
  }
  return raw.map((clause, i) => {
    const at = `${id}: scope[${i}]`;
    if (typeof clause !== "object" || clause === null || Array.isArray(clause)) {
      throw new Error(`${at}: a clause must be a mapping`);
    }
    const keys = Object.keys(clause as Record<string, unknown>);
    const unknown = keys.filter((k) => !["refs", "tags", "subjectIn"].includes(k));
    if (unknown.length > 0) {
      throw new Error(`${at}: unknown clause key(s) ${unknown.join(", ")} (yaml-authorable: refs | tags/subjectIn)`);
    }
    const c = clause as { refs?: unknown; tags?: unknown; subjectIn?: unknown };
    const strList = (v: unknown, field: string): string[] => {
      if (!Array.isArray(v) || v.length === 0 || !v.every((s) => typeof s === "string" && s.trim().length > 0)) {
        throw new Error(`${at}: ${field} must be a non-empty list of non-empty strings`);
      }
      return v as string[];
    };
    if (c.refs !== undefined) {
      if (c.tags !== undefined || c.subjectIn !== undefined) {
        throw new Error(`${at}: a clause is refs XOR a predicate (tags/subjectIn), not both`);
      }
      return { kind: "ref-set", refs: strList(c.refs, "refs") };
    }
    if (c.tags === undefined && c.subjectIn === undefined) {
      throw new Error(`${at}: a clause needs refs or at least one of tags/subjectIn`);
    }
    return {
      kind: "predicate",
      query: {
        ...(c.tags !== undefined ? { tags: strList(c.tags, "tags") } : {}),
        ...(c.subjectIn !== undefined ? { subjectIn: strList(c.subjectIn, "subjectIn") } : {}),
      },
    };
  });
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
  /** author-declared case-property tags (yaml `tags:`); the manifest publishes these (through the
   * R1 hygiene gate) so tag-predicate annotation scopes can resolve (3e). */
  tags?: string[];
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
      scope: parseDvScope(raw.scope, raw.id),
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
        tags: Array.isArray(t.tags) ? (t.tags as string[]).filter((x) => typeof x === "string") : undefined,
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

// test key → engine → the §6.6 Outcome, lifted on read (legacy fixtures stay
// loadable until regenerated). The Outcome-aware sibling of loadFixtures — it
// keeps the full attribution (value/rejected/crashed/skipped/…) the V5 manifest
// partitions on, where loadFixtures discards everything but `.result`. Same key
// resolution (semantic-hash rows re-exposed under public refs).
export function loadFixtureOutcomes(
  dir: string,
  keep: Set<string> | Map<string, TestInfo>,
): Map<string, Map<Platform, Outcome>> {
  const out = new Map<string, Map<Platform, Outcome>>();
  if (!existsSync(dir)) return out;
  const keyTargets = fixtureKeyTargets(keep);
  for (const suite of readdirSync(dir)) {
    const suitePath = join(dir, suite);
    let stat;
    try { stat = readdirSync(suitePath); } catch { continue; }
    for (const f of stat) {
      if (!f.endsWith(".json")) continue;
      const engine = f.replace(/\.json$/, "");
      if (!isPlatform(engine)) continue;
      let fx: { results?: Record<string, LegacyEntry> };
      try {
        fx = JSON.parse(readFileSync(join(suitePath, f), "utf8"));
      } catch {
        continue;
      }
      for (const [tid, entry] of Object.entries(fx.results ?? {})) {
        const targets = keyTargets.get(tid) ?? (keep instanceof Set && isSemanticHash(tid) ? [tid] : undefined);
        if (!targets) continue;
        const outcome = liftEntryToOutcome(entry, engine);
        for (const target of targets) {
          if (!out.has(target)) out.set(target, new Map());
          out.get(target)!.set(engine, outcome);
        }
      }
    }
  }
  return out;
}

// test key → engine → the complete fixture entry. This is the
// publication-aware sibling of loadFixtureOutcomes: legacy outcomes are still
// lifted, but provenance is neither discarded nor synthesized.
export function loadFixtureEntries(
  dir: string,
  keep: Set<string> | Map<string, TestInfo>,
): Map<string, Map<Platform, FixtureEntry>> {
  const out = new Map<string, Map<Platform, FixtureEntry>>();
  if (!existsSync(dir)) return out;
  const keyTargets = fixtureKeyTargets(keep);
  for (const suite of readdirSync(dir)) {
    const suitePath = join(dir, suite);
    let stat;
    try { stat = readdirSync(suitePath); } catch { continue; }
    for (const f of stat) {
      if (!f.endsWith(".json")) continue;
      const engine = f.replace(/\.json$/, "");
      if (!isPlatform(engine)) continue;
      let fx: { results?: Record<string, LegacyEntry & Partial<FixtureEntry>> };
      try {
        fx = JSON.parse(readFileSync(join(suitePath, f), "utf8"));
      } catch {
        continue;
      }
      for (const [tid, persisted] of Object.entries(fx.results ?? {})) {
        const targets = keyTargets.get(tid) ?? (keep instanceof Set && isSemanticHash(tid) ? [tid] : undefined);
        if (!targets) continue;
        const entry: FixtureEntry = {
          ...persisted,
          outcome: liftEntryToOutcome(persisted, engine),
        };
        for (const target of targets) {
          if (!out.has(target)) out.set(target, new Map());
          out.get(target)!.set(engine, entry);
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
    // accepted: v2 rows key by declared id; v1 rows (hibernated engines,
    // pre-lift fossils) still key by semanticHash — both resolve here
    const acceptedKeys = new Set(
      [test.id, test.ref, test.semanticHash].filter((k): k is string => Boolean(k)),
    );
    const outputKeys = new Set(
      [test.id, test.ref, test.semanticHash].filter((k): k is string => Boolean(k)),
    );
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
