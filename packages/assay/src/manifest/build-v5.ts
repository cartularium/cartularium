// Builds ManifestV5 — the verdict-free comparison-output contract (CP3 step 4).
//
// Replaces the V4 per-engine TestVerdict (match|diverge, scored against a canonicalGrid from
// `expect`) with the two relation-layer axes, computed MECHANICALLY from per-engine Outcomes:
//   - the agreement PARTITION (partitionByAgreement over value outcomes) — uniform vs forked,
//   - per-engine CAPABILITY (EngineObservation) — value / rejected / crashed / unsupported / no-data.
// No canonical value, no reference engine, no verdict. The manifest is OBSERVATION ONLY:
// every interpretive layer (oracles, and the cause/summary annotation layer) is out-of-band,
// joined by case-ref — never a field here (the no-authority-over-meaning refinement, 2026-06-19).
//
// "Capability not cause" is mechanical: only `value` outcomes enter the partition; a
// missing-function that produces no value is `unsupported` (uniform, no fork), while one that
// runs and returns #NAME? is a value → an error-value fork. The capability/partition split is
// the whole story — there is no annotation gate, because there are no annotations.
//
// Added alongside the V4 builder (build.ts) during the CP3 transition; the catalogue-site still
// renders off V4. The V4 builder + classify.ts retire with the website rework.

import {
  ALL_PLATFORMS,
  canonicalizeCell,
  circulatingKey,
  type Platform,
  type Category,
  type CirculatingGrid,
  type EngineObservation,
  type ManifestClass,
  type ManifestEngineEntry,
  type ManifestV5,
  type ManifestV5AliasEntry,
  type ManifestV5FunctionEntry,
  type ManifestV5TestEntry,
  type ManifestV5TombstoneEntry,
} from "@cartularium/contracts";
import { partitionByAgreement } from "../format/relations.js";
import type { Outcome, RichGridValue } from "../format/values.js";
import { isFunctionName } from "../format/catalogue.js";
import type { DvEntry, TestInfo } from "../catalogue-site/load.js";
import { indexTestsByFunction, manifestHash } from "./build.js";

export const MANIFEST_V5_VERSION = 5 as const;

// R1 hygiene GATE (annotation-store-design §4): publishing case tags into the manifest is a
// relation-layer boundary, so OUTCOME-CLAIM tags — ones that assert a cross-engine verdict rather
// than describe the case — are dropped here. Only descriptive case-property tags reach the
// observation manifest, where tag-predicates resolve against them. A GATE re-applied every build
// (not a one-time sweep), since new tags keep being authored; extend the set as new outcome-claim
// tags surface.
const OUTCOME_CLAIM_TAGS = new Set([
  "divergence",
  "coercion-divergence",
  "excel-only",
  // asserts a cross-engine outcome; found published on 10 regex cases (3f audit, 2026-07-11) —
  // the predicted denylist-rot leak this gate exists to catch. Maintainer confirmed it belongs
  // here 2026-07-18 (internal provenance sign-off item 7).
  "engine-divergence",
]);

function gateTags(tags: string[] | undefined): string[] | undefined {
  if (!tags) return undefined;
  const kept = tags.filter((t) => !OUTCOME_CLAIM_TAGS.has(t));
  return kept.length > 0 ? kept : undefined;
}

export interface BuildManifestV5Input {
  dvs: DvEntry[];
  tests: Map<string, TestInfo>;
  /** hash/ref/id → platform → the §6.6 Outcome (already lifted from legacy entries). */
  outcomes: Map<string, Map<Platform, Outcome>>;
  generatedAt: string;
}

/** Map a per-engine Outcome to its capability. `classOf` is the engine's agreement-class index
 * (only defined for `value` outcomes — they are the only ones in the partition). `pending` is
 * never published (a manifest is a completed run) → returns undefined, the engine is omitted. */
function toObservation(o: Outcome, classOf: number | undefined): EngineObservation | undefined {
  switch (o.kind) {
    case "value":
      return { capability: "value", class: classOf ?? 0 };
    case "rejected":
      return { capability: "rejected", reason: o.reason, code: o.code };
    case "crashed":
      return { capability: "crashed", channel: o.channel };
    case "skipped":
      // capability-skip = "engine lacks this" → the absent/partial signal; other skip causes
      // are genuinely unknown (not a capability claim).
      if (o.cause === "capability") return { capability: "unsupported" };
      if (o.cause === "policy" || o.cause === "seed-infidelity" || o.cause === "environment-incompatible") {
        // guarded — SkipCause's open `(string & {})` member blocks ===-narrowing on its own
        return { capability: "no-data", cause: o.cause as "policy" | "seed-infidelity" | "environment-incompatible" };
      }
      return { capability: "no-data", cause: "unclassified" };
    case "infra":
      return { capability: "no-data", cause: "infra" };
    case "driver-error":
      return { capability: "no-data", cause: "driver-error" };
    case "unclassified":
      return { capability: "no-data", cause: "unclassified" };
    case "pending":
      return undefined;
  }
}

/** The distinct circulating grids of a class — set-valued (deduped by exact structural key).
 * Length 1 for exact agreement; >1 reveals the relative-tolerance spread. */
function distinctValues(grids: RichGridValue[]): CirculatingGrid[] {
  const seen = new Map<string, CirculatingGrid>();
  for (const grid of grids) {
    const cg: CirculatingGrid = grid.map((row) => row.map((cell) => canonicalizeCell(cell)));
    const key = cg.map((row) => row.map(circulatingKey).join("")).join("");
    if (!seen.has(key)) seen.set(key, cg);
  }
  return [...seen.values()];
}

function outcomesFor(
  outcomes: Map<string, Map<Platform, Outcome>>,
  test: TestInfo,
  ref: string,
): Map<Platform, Outcome> | undefined {
  return (
    (test.semanticHash ? outcomes.get(test.semanticHash) : undefined) ??
    outcomes.get(ref) ??
    outcomes.get(test.id)
  );
}

/** Build one test entry: the partition (over value outcomes) + per-engine capability. */
function buildTestEntry(t: TestInfo, ref: string, byEngine: Map<Platform, Outcome>): ManifestV5TestEntry {
  // value grids feed the partition; everything else is capability-only (not in any class).
  const valueGrids: Record<string, RichGridValue> = {};
  for (const [engine, o] of byEngine) if (o.kind === "value") valueGrids[engine] = o.grid;

  const classes = partitionByAgreement(valueGrids);
  const classOf = new Map<Platform, number>();
  classes.forEach((cls, i) => cls.engines.forEach((e) => classOf.set(e, i)));

  const partition: ManifestClass[] = classes.map((cls) => ({
    engines: cls.engines,
    values: distinctValues(cls.engines.map((e) => valueGrids[e])),
  }));

  const engines: Partial<Record<Platform, EngineObservation>> = {};
  for (const [engine, o] of byEngine) {
    const obs = toObservation(o, classOf.get(engine));
    if (obs) engines[engine] = obs;
  }

  const tags = gateTags(t.tags);

  return {
    ref,
    subject: t.subject,
    subjectRef: t.subjectRef ?? t.subject,
    name: t.name ?? ref.split("/").pop() ?? ref,
    suite: t.suite,
    hash: manifestHash(t, ref),
    url: `/test/${ref}/`,
    category: t.category as Category,
    engines,
    ...(t.aliases && t.aliases.length > 0 ? { aliases: t.aliases } : {}),
    ...(tags ? { tags } : {}),
    partition,
  };
}

/** Roll the per-case capability observations up to a function/engine status (descriptive).
 * available = always produced a value; missing = never produced + at least one `unsupported`;
 * else partial (mixed, or never produced but only ever no-data — genuinely unknown). */
function rollupStatus(observations: EngineObservation[]): ManifestEngineEntry {
  if (observations.length === 0) return { status: "missing" };
  const produced = observations.filter((o) => o.capability === "value").length;
  if (produced === observations.length) return { status: "available" };
  if (produced === 0 && observations.some((o) => o.capability === "unsupported")) {
    return { status: "missing" };
  }
  return { status: "partial" };
}

export function buildManifestV5(input: BuildManifestV5Input): ManifestV5 {
  // `input.dvs` now only widens the function universe (a DV references real functions); the
  // observation-only manifest reads no `dv.cause`/annotation. The DV-identity re-founding moves
  // even this seeding out of band (a later checkpoint).
  const fnSet = new Set<string>();
  for (const t of input.tests.values()) if (isFunctionName(t.subject)) fnSet.add(t.subject);
  for (const dv of input.dvs) for (const s of dv.subjects) if (isFunctionName(s)) fnSet.add(s);

  const testsByFn = indexTestsByFunction(input.tests, fnSet);

  // per-test entries — EVERY corpus case, function-subject or not (op:* / lit:* / feature:* /
  // legacy:*). The V4-era function-only gate silently dropped 88 observed cases (86 with live
  // fixture outcomes, several fork-bearing) from the published relation layer, clipping the
  // subject universe (danglings 17 → 0 once they publish). The maintainer ratified this widening
  // 2026-07-18 (internal provenance sign-off item 2), recording the scope rule for Assay's
  // charter: Assay's subject universe is everything that can be read by or affected by spreadsheet
  // formulas — operators and literals are formula-facing, so they belong in it. Widened 2026-07-11
  // (3f, reclassify-policy D-3f-4): the `functions` rollup below stays function-scoped (it iterates
  // fnSet), so this only ADDS test entries; it cannot leak non-functions into the rollup.
  const tests: Record<string, ManifestV5TestEntry> = {};
  const aliases: Record<string, ManifestV5AliasEntry> = {};
  const hashes: Record<`sha256:${string}`, string> = {};
  const forkedRefs = new Set<string>();
  // engine observations per (function, engine), for the capability rollup
  const fnEngineObs = new Map<string, Map<Platform, EngineObservation[]>>();

  for (const [tid, t] of input.tests) {
    const ref = t.ref ?? tid;
    const byEngine = outcomesFor(input.outcomes, t, ref) ?? new Map<Platform, Outcome>();
    const entry = buildTestEntry(t, ref, byEngine);
    tests[ref] = entry;
    hashes[entry.hash] = ref;
    if (entry.partition.length > 1) forkedRefs.add(ref);
    if (t.aliases) for (const a of t.aliases) aliases[a] = { target: ref, kind: "public-ref" };

    const perEngine = fnEngineObs.get(t.subject) ?? new Map<Platform, EngineObservation[]>();
    for (const [engine, obs] of Object.entries(entry.engines) as [Platform, EngineObservation][]) {
      const arr = perEngine.get(engine) ?? [];
      arr.push(obs);
      perEngine.set(engine, arr);
    }
    fnEngineObs.set(t.subject, perEngine);
  }

  // function rollup — capability status per engine + the fn's observed forked cases
  const functions: Record<string, ManifestV5FunctionEntry> = {};
  for (const fn of [...fnSet].sort()) {
    const perEngine = fnEngineObs.get(fn) ?? new Map<Platform, EngineObservation[]>();
    const engines = {} as Record<Platform, ManifestEngineEntry>;
    for (const engine of ALL_PLATFORMS) engines[engine] = rollupStatus(perEngine.get(engine) ?? []);

    const caseRefs = (testsByFn.get(fn) ?? []).map((t) => t.ref);
    const fnForkedCases = caseRefs.filter((ref) => forkedRefs.has(ref));

    functions[fn] = {
      engines,
      forks: fnForkedCases,
      tests: caseRefs,
    };
  }

  return {
    version: MANIFEST_V5_VERSION,
    generatedAt: input.generatedAt,
    engines: ALL_PLATFORMS,
    rung: "circulating",
    tests,
    functions,
    aliases,
    tombstones: {} as Record<string, ManifestV5TombstoneEntry>,
    hashes,
  };
}
