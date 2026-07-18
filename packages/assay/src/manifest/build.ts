// builds the function manifest published at assay.sheets.wiki/manifest.json
// keyed by function name; consumed by sheets.wiki at build time

import {
  ALL_PLATFORMS,
  isPlatform,
  MANIFEST_VERSION,
  type Cause,
  type Category,
  type ManifestDvEntry,
  type ManifestEngineEntry,
  type ManifestV4,
  type ManifestV4AliasEntry,
  type ManifestV4FunctionEntry,
  type ManifestV4TestEntry,
  type Platform,
  type TestVerdict,
} from "@cartularium/contracts";
import { isCellError, type CellValue } from "../format/values.js";
import { isFunctionName } from "../format/catalogue.js";
import { normalizeToGrid } from "../format/parse.js";
import { classifyEngineResult } from "../format/classify.js";
import type { DvEntry, TestInfo } from "../catalogue-site/load.js";

// re-exported for callers that already imported it from this module
export { isFunctionName } from "../format/catalogue.js";

export interface BuildManifestInput {
  dvs: DvEntry[];
  tests: Map<string, TestInfo>;
  fixtures: Map<string, Map<string, unknown>>;
  generatedAt: string;
}

// auto-generated DV summaries end with a comma-separated subject list (often
// truncated with "(+N more)"). consumers want the engine-and-reason prefix;
// strip the tail at emit so every consumer renders the same clean text.
const SUBJECT_LIST_TAIL = / — [A-Z][A-Z0-9_.]*(?:, [A-Z][A-Z0-9_.]*)*(?:\s*\(\+\d+ more\))?$/;

export function cleanSummary(s: string): string {
  return s.replace(SUBJECT_LIST_TAIL, "");
}

export function buildManifest(input: BuildManifestInput): ManifestV4 {
  const fnSet = new Set<string>();
  for (const t of input.tests.values()) {
    if (isFunctionName(t.subject)) fnSet.add(t.subject);
  }
  for (const dv of input.dvs) {
    for (const s of dv.subjects) if (isFunctionName(s)) fnSet.add(s);
  }

  const dvsByFn = indexDvsByFunction(input.dvs, fnSet);
  const testsByFn = indexTestsByFunction(input.tests, fnSet);

  const functions: Record<string, ManifestV4FunctionEntry> = {};
  const referencedDvs = new Set<string>();
  for (const fn of [...fnSet].sort()) {
    const engines = {} as Record<Platform, ManifestEngineEntry>;
    for (const engine of ALL_PLATFORMS) {
      const entry = deriveStatus(fn, engine, dvsByFn, testsByFn, input.fixtures);
      engines[engine] = entry;
      if (entry.via) referencedDvs.add(entry.via);
    }
    const divergences = (dvsByFn.get(fn) ?? []).map((dv) => dv.id);
    for (const id of divergences) referencedDvs.add(id);
    functions[fn] = {
      engines,
      divergences,
      tests: (testsByFn.get(fn) ?? []).map((t) => t.ref),
    };
  }

  // emit only DVs reachable from a function entry — DVs whose subjects are all
  // non-functions (operators, language features) wouldn't be looked up by consumers
  const dvIndex: Record<string, ManifestDvEntry> = {};
  for (const dv of input.dvs) {
    if (!referencedDvs.has(dv.id)) continue;
    dvIndex[dv.id] = {
      summary: cleanSummary(dv.summary),
      cause: dv.cause as Cause,
      category: dv.category as Category,
      engines: dv.engines.filter(isPlatform),
    };
  }

  // tests index — function-subject tests only, matching the manifest scope
  const testIndex: Record<string, ManifestV4TestEntry> = {};
  const aliases: Record<string, ManifestV4AliasEntry> = {};
  const hashes: Record<`sha256:${string}`, string> = {};
  for (const [tid, t] of input.tests) {
    if (!isFunctionName(t.subject)) continue;
    const ref = t.ref ?? tid;
    const hash = manifestHash(t, ref);
    const canonicalGrid = normalizeToGrid(t.expect as CellValue | CellValue[] | CellValue[][]);
    const fxs = fixtureEntriesFor(input.fixtures, t, ref);
    const engines: Partial<Record<Platform, TestVerdict>> = {};
    for (const engine of ALL_PLATFORMS) {
      const fx = fxs?.get(engine);
      const verdict = classifyEngineResult(engine, fx, canonicalGrid, t.overrides[engine]);
      if (verdict.kind === "match" || verdict.kind === "diverge") {
        engines[engine] = verdict.kind;
      }
    }
    const entry: ManifestV4TestEntry = {
      ref,
      subject: t.subject,
      subjectRef: t.subjectRef ?? t.subject,
      name: t.name ?? ref.split("/").pop() ?? ref,
      suite: t.suite,
      hash,
      url: `/test/${ref}/`,
      engines,
    };
    if (t.aliases && t.aliases.length > 0) {
      entry.aliases = t.aliases;
      for (const alias of t.aliases) aliases[alias] = { target: ref, kind: "public-ref" };
    }
    testIndex[ref] = entry;
    hashes[hash] = ref;
  }

  return {
    version: MANIFEST_VERSION,
    generatedAt: input.generatedAt,
    engines: ALL_PLATFORMS,
    dvs: dvIndex,
    tests: testIndex,
    aliases,
    tombstones: {},
    hashes,
    functions,
  };
}

// each fn → DVs touching it, sorted by id ascending
export function indexDvsByFunction(dvs: DvEntry[], fnSet: Set<string>): Map<string, DvEntry[]> {
  const out = new Map<string, DvEntry[]>();
  const sorted = [...dvs].sort((a, b) => a.id.localeCompare(b.id));
  for (const dv of sorted) {
    for (const s of dv.subjects) {
      if (!fnSet.has(s)) continue;
      const arr = out.get(s) ?? [];
      arr.push(dv);
      out.set(s, arr);
    }
  }
  return out;
}

// each fn → tests with that subject, in (suite-asc, yaml-source) order
export function indexTestsByFunction(tests: Map<string, TestInfo>, fnSet: Set<string>): Map<string, TestInfo[]> {
  // re-bucket so order is independent of loadTests' readdir
  const bySuite = new Map<string, TestInfo[]>();
  for (const t of tests.values()) {
    if (!fnSet.has(t.subject)) continue;
    const arr = bySuite.get(t.suite) ?? [];
    arr.push(t);
    bySuite.set(t.suite, arr);
  }
  const out = new Map<string, TestInfo[]>();
  for (const suite of [...bySuite.keys()].sort()) {
    for (const t of bySuite.get(suite)!) {
      const arr = out.get(t.subject) ?? [];
      arr.push(t);
      out.set(t.subject, arr);
    }
  }
  return out;
}

function deriveStatus(
  fn: string,
  engine: Platform,
  dvsByFn: Map<string, DvEntry[]>,
  testsByFn: Map<string, TestInfo[]>,
  fixtures: Map<string, Map<string, unknown>>,
): ManifestEngineEntry {
  const dvs = dvsByFn.get(fn) ?? [];

  const missingDv = dvs.find((dv) => dv.cause === "missing-function" && dv.engines.includes(engine));
  if (missingDv) return { status: "missing", via: missingDv.id };

  const otherDv = dvs.find((dv) => dv.cause !== "missing-function" && dv.engines.includes(engine));
  if (otherDv) {
    const tests = testsByFn.get(fn) ?? [];
    if (tests.length > 0 && allErrors(tests, engine, fixtures)) {
      return { status: "partial", via: otherDv.id };
    }
  }

  return { status: "available" };
}

function allErrors(tests: TestInfo[], engine: Platform, fixtures: Map<string, Map<string, unknown>>): boolean {
  let observed = 0;
  for (const t of tests) {
    const value = fixtureEntriesFor(fixtures, t, t.ref)?.get(engine);
    if (value === undefined) continue;
    observed++;
    if (!isAllErrors(value)) return false;
  }
  return observed > 0;
}

// every cell is a CellError. scalar form [[v]] or full grid both handled.
function isAllErrors(v: unknown): boolean {
  if (isCellError(v)) return true;
  if (!Array.isArray(v)) return false;
  if (v.length === 0) return false;
  for (const row of v) {
    if (!Array.isArray(row)) return isCellError(row as CellValue);
    for (const cell of row) if (!isCellError(cell)) return false;
  }
  return true;
}

export function manifestHash(test: TestInfo, ref: string): `sha256:${string}` {
  return test.semanticHash ?? (`sha256:${ref}` as `sha256:${string}`);
}

function fixtureEntriesFor(
  fixtures: Map<string, Map<string, unknown>>,
  test: TestInfo,
  ref: string,
): Map<string, unknown> | undefined {
  return (
    (test.semanticHash ? fixtures.get(test.semanticHash) : undefined) ??
    fixtures.get(ref) ??
    fixtures.get(test.id)
  );
}
