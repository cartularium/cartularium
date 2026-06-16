// three-bucket consensus:
//   agreement — all authorities match
//   intended  — status: observed (no canonical answer)
//   gap       — some override has cause: missing-function
// targets are scored against the chosen bucket value; unclassified
// disagreement is excluded for triage

import { loadFixture, type FixtureFile, type FixtureEntry } from "./fixtures.js";
import { loadTestSuite, getFormulaForPlatform } from "./format/parse.js";
import { gridsEqual, formatGrid } from "./format/match.js";
import {
  isCellError,
  outcomeErrorText,
  toScalarGrid,
  type GridValue,
  type Platform,
  type RichGridValue,
} from "./format/values.js";
import { type TestCase } from "./format/catalogue.js";
import { caseKey } from "./identity/index.js";

export interface BenchmarkOptions {
  authority: Platform[];
  target: Platform[];
  strictErrors?: boolean;
  consensusMode?: "strict" | "any";
  tags?: string[];
}

export interface BenchmarkExclusion {
  test: string;
  suite: string;
  reason:
    | "missing-authority-fixture"
    | "authority-error"
    | "authority-driver-issue"
    | "authority-disagreement"
    | "non-value-lane"
    | "no-formula-for-authority";
  detail?: string;
}

export type ConsensusClassification = "agreement" | "intended" | "gap";

export interface ConsensusEntry {
  file: string;
  suite: string;
  test: TestCase;
  expected: RichGridValue;
  alternates?: RichGridValue[];
  classification: ConsensusClassification;
  // which authority provided the primary expected value
  sourceAuthority?: Platform;
}

export interface BenchmarkScore {
  platform: Platform;
  passed: number;
  failed: number;
  errored: number;
  driverIssue: number;
  skipped: number;
  total: number;
  buckets: {
    agreement: { total: number; passed: number; failed: number; errored: number };
    intended: { total: number; matched: number; diverged: number; errored: number };
    gap: { total: number; passed: number; failed: number; errored: number };
  };
  results: Array<{
    suite: string;
    test: string;
    outcome: "pass" | "fail" | "error" | "driver-issue" | "skipped" | "diverged-intended";
    classification: ConsensusClassification;
    detail?: string;
  }>;
}

export interface BenchmarkResult {
  consensus: ConsensusEntry[];
  exclusions: BenchmarkExclusion[];
  scores: Record<string, BenchmarkScore>;
  counts: {
    totalTests: number;
    consensus: number;
    excluded: number;
    byBucket: { agreement: number; intended: number; gap: number };
  };
}

export interface FunctionRollup {
  byFunction: Record<
    string,
    Record<string, { pass: number; fail: number; error: number; skip: number; total: number }>
  >;
  functions: string[];
  engines: string[];
}

export function runBenchmark(suiteFiles: string[], options: BenchmarkOptions): BenchmarkResult {
  const strictErrors = options.strictErrors ?? true;
  const consensusMode = options.consensusMode ?? "strict";
  const minAuthorities = consensusMode === "strict" ? 2 : 1;
  const consensus: ConsensusEntry[] = [];
  const exclusions: BenchmarkExclusion[] = [];

  const allPlatforms = Array.from(new Set([...options.authority, ...options.target]));
  const fixtureCache = new Map<string, Record<Platform, FixtureFile | null>>();
  for (const file of suiteFiles) {
    const perPlatform = {} as Record<Platform, FixtureFile | null>;
    for (const p of allPlatforms) perPlatform[p] = loadFixture(file, p);
    fixtureCache.set(file, perPlatform);
  }

  let totalTests = 0;

  for (const file of suiteFiles) {
    const suite = loadTestSuite(file);
    const suiteName = suite.name || file;
    const tagSet = options.tags?.length ? new Set(options.tags) : null;
    const tests = tagSet
      ? suite.tests.filter((t) => t.tags?.some((tag) => tagSet.has(tag)))
      : suite.tests;
    const fixtures = fixtureCache.get(file)!;

    for (const test of tests) {
      totalTests++;
      const key = caseKey(test);

      const lane = nonValueLane(test);
      if (lane !== null) {
        exclusions.push({
          suite: suiteName,
          test: test.id,
          reason: "non-value-lane",
          detail: `${lane}${test.supportLevel ? `/${test.supportLevel}` : ""}`,
        });
        continue;
      }

      // collect authority results (value + error info)
      const authResults: Array<{
        platform: Platform;
        entry: FixtureEntry | null;
        hasFormula: boolean;
        hasValue: boolean;
        isError: boolean;
      }> = [];

      let anyFormula = false;
      let firstBlocker: BenchmarkExclusion | null = null;

      for (const auth of options.authority) {
        const formula = getFormulaForPlatform(test.formula, auth);
        if (formula === null) {
          authResults.push({
            platform: auth,
            entry: null,
            hasFormula: false,
            hasValue: false,
            isError: false,
          });
          continue;
        }
        anyFormula = true;

        const fixture = fixtures[auth];
        const entry = fixture?.results[key] ?? null;

        if (!entry) {
          firstBlocker ??= {
            suite: suiteName,
            test: test.id,
            reason: "missing-authority-fixture",
            detail: `${auth}: no fixture entry`,
          };
          authResults.push({
            platform: auth,
            entry,
            hasFormula: true,
            hasValue: false,
            isError: false,
          });
          continue;
        }
        if (entry.outcome.kind !== "value") {
          // Non-value: skipped is absence (not a blocker); everything else
          // (rejected/crashed/infra/driver-error/...) is a blocker, attributed by kind.
          const isErr = entry.outcome.kind !== "skipped";
          if (isErr) {
            const reason =
              entry.outcome.kind === "driver-error"
                ? ("authority-driver-issue" as const)
                : ("authority-error" as const);
            firstBlocker ??= {
              suite: suiteName,
              test: test.id,
              reason,
              detail: `${auth}: ${outcomeErrorText(entry.outcome) ?? entry.outcome.kind}`,
            };
          }
          authResults.push({
            platform: auth,
            entry,
            hasFormula: true,
            hasValue: false,
            isError: isErr,
          });
          continue;
        }
        authResults.push({
          platform: auth,
          entry,
          hasFormula: true,
          hasValue: true,
          isError: false,
        });
      }

      if (!anyFormula) {
        exclusions.push({ suite: suiteName, test: test.id, reason: "no-formula-for-authority" });
        continue;
      }

      const withValues = authResults.filter((a) => a.hasValue);

      // "any" mode: legacy behavior with classification overlay
      if (consensusMode === "any") {
        if (withValues.length === 0) {
          exclusions.push(
            firstBlocker ?? {
              suite: suiteName,
              test: test.id,
              reason: "missing-authority-fixture",
              detail: `no usable authority results`,
            },
          );
          continue;
        }
        const first = gridOrEmpty(withValues[0].entry);
        const alternates: RichGridValue[] = [];
        for (let i = 1; i < withValues.length; i++) {
          const r = gridOrEmpty(withValues[i].entry);
          if (
            !gridsAgree(first, r, strictErrors) &&
            !alternates.some((a) => gridsAgree(a, r, strictErrors))
          ) {
            alternates.push(r);
          }
        }
        const classification = classifyDisagreement(test, authResults, alternates);
        consensus.push({
          file,
          suite: suiteName,
          test,
          expected: first,
          ...(alternates.length > 0 ? { alternates } : {}),
          classification,
          sourceAuthority: withValues[0].platform,
        });
        continue;
      }

      // strict mode with three-bucket classification

      if (withValues.length < minAuthorities) {
        // not enough authorities — check for gap scenario
        if (withValues.length >= 1 && (isAnnotatedGap(test) || isAutoGap(authResults))) {
          // bucket 3: one authority has a value, the other errored
          const entry = withValues[0];
          consensus.push({
            file,
            suite: suiteName,
            test,
            expected: gridOrEmpty(entry.entry),
            classification: "gap",
            sourceAuthority: entry.platform,
          });
          continue;
        }
        exclusions.push(
          firstBlocker ?? {
            suite: suiteName,
            test: test.id,
            reason: "missing-authority-fixture",
            detail: `need ≥${minAuthorities} authority result(s), got ${withValues.length}`,
          },
        );
        continue;
      }

      const first = gridOrEmpty(withValues[0].entry);
      const allAgree = withValues.every(({ entry }) =>
        gridsAgree(first, gridOrEmpty(entry), strictErrors),
      );

      if (allAgree) {
        // bucket 1: all authorities agree
        consensus.push({
          file,
          suite: suiteName,
          test,
          expected: first,
          classification: "agreement",
          sourceAuthority: withValues[0].platform,
        });
        continue;
      }

      // authorities disagree with values — check auto-gap or annotation
      if (!isIntended(test) && isAutoGap(authResults)) {
        // one authority returned #NAME?/#N/A, the other has a real value
        const realAuth = withValues.find((a) => !isUnimplementedResult(a.entry));
        if (realAuth) {
          consensus.push({
            file,
            suite: suiteName,
            test,
            expected: gridOrEmpty(realAuth.entry),
            classification: "gap",
            sourceAuthority: realAuth.platform,
          });
          continue;
        }
      }

      if (isIntended(test)) {
        // bucket 2: intended divergence — collect alternates
        const alternates: RichGridValue[] = [];
        for (let i = 1; i < withValues.length; i++) {
          const r = gridOrEmpty(withValues[i].entry);
          if (
            !gridsAgree(first, r, strictErrors) &&
            !alternates.some((a) => gridsAgree(a, r, strictErrors))
          ) {
            alternates.push(r);
          }
        }
        consensus.push({
          file,
          suite: suiteName,
          test,
          expected: first,
          alternates: alternates.length > 0 ? alternates : undefined,
          classification: "intended",
          sourceAuthority: withValues[0].platform,
        });
        continue;
      }

      if (isAnnotatedGap(test)) {
        // bucket 3 by annotation — both have values but one is a "gap" result
        consensus.push({
          file,
          suite: suiteName,
          test,
          expected: first,
          classification: "gap",
          sourceAuthority: withValues[0].platform,
        });
        continue;
      }

      // unclassified disagreement — exclude (needs triage)
      const detail = withValues
        .map(({ platform, entry }) => `${platform}=${formatCompact(gridOrEmpty(entry))}`)
        .join("  ");
      exclusions.push({
        suite: suiteName,
        test: test.id,
        reason: "authority-disagreement",
        detail,
      });
    }
  }

  // score each target

  const bucketCounts = { agreement: 0, intended: 0, gap: 0 };
  for (const c of consensus) bucketCounts[c.classification]++;

  const scores: Record<string, BenchmarkScore> = {};
  for (const target of options.target) {
    const score: BenchmarkScore = {
      platform: target,
      passed: 0,
      failed: 0,
      errored: 0,
      driverIssue: 0,
      skipped: 0,
      total: consensus.length,
      buckets: {
        agreement: { total: 0, passed: 0, failed: 0, errored: 0 },
        intended: { total: 0, matched: 0, diverged: 0, errored: 0 },
        gap: { total: 0, passed: 0, failed: 0, errored: 0 },
      },
      results: [],
    };

    for (const { file, suite, test, expected, alternates, classification } of consensus) {
      const key = caseKey(test);
      const formula = getFormulaForPlatform(test.formula, target);
      if (formula === null) {
        score.skipped++;
        score.results.push({ suite, test: test.id, outcome: "skipped", classification });
        continue;
      }

      const fixture = fixtureCache.get(file)?.[target];
      const entry = fixture?.results[key];

      if (!entry || entry.outcome.kind !== "value") {
        if (!entry) {
          score.errored++;
          score.buckets[classification].errored++;
          score.results.push({
            suite,
            test: test.id,
            outcome: "error",
            classification,
            detail: "no fixture",
          });
        } else if (entry.outcome.kind === "skipped") {
          score.skipped++;
          score.results.push({
            suite,
            test: test.id,
            outcome: "skipped",
            classification,
            detail: entry.outcome.reason,
          });
        } else if (entry.outcome.kind === "driver-error") {
          score.driverIssue++;
          score.results.push({
            suite,
            test: test.id,
            outcome: "driver-issue",
            classification,
            detail: outcomeErrorText(entry.outcome),
          });
        } else {
          score.errored++;
          score.buckets[classification].errored++;
          score.results.push({
            suite,
            test: test.id,
            outcome: "error",
            classification,
            detail: outcomeErrorText(entry.outcome),
          });
        }
        score.buckets[classification].total++;
        continue;
      }

      score.buckets[classification].total++;

      const grid = entry.outcome.grid;
      const matchesPrimary = gridsAgree(expected, grid, strictErrors);
      const matchesAlternate = alternates?.some((a) => gridsAgree(a, grid, strictErrors)) ?? false;

      if (classification === "intended") {
        if (matchesPrimary || matchesAlternate) {
          score.passed++;
          score.buckets.intended.matched++;
          score.results.push({ suite, test: test.id, outcome: "pass", classification });
        } else {
          // intentional divergence from all authorities — not a failure
          score.buckets.intended.diverged++;
          score.results.push({
            suite,
            test: test.id,
            outcome: "diverged-intended",
            classification,
            detail: `diverges from all authorities: got ${formatCompact(grid)}`,
          });
        }
      } else {
        // agreement or gap — must match
        if (matchesPrimary || matchesAlternate) {
          score.passed++;
          score.buckets[classification].passed++;
          score.results.push({ suite, test: test.id, outcome: "pass", classification });
        } else {
          score.failed++;
          score.buckets[classification].failed++;
          const expectedStr = alternates?.length
            ? [expected, ...alternates].map(formatCompact).join(" | ")
            : formatCompact(expected);
          score.results.push({
            suite,
            test: test.id,
            outcome: "fail",
            classification,
            detail: `expected ${expectedStr}, got ${formatCompact(grid)}`,
          });
        }
      }
    }
    scores[target] = score;
  }

  return {
    consensus,
    exclusions,
    scores,
    counts: {
      totalTests,
      consensus: consensus.length,
      excluded: exclusions.length,
      byBucket: bucketCounts,
    },
  };
}

// §6.6: an engine lacks a function when WE declined it (skipped{capability}) or when it
// emits a single-cell #NAME?/#N/IMPL!/#N/A value. (Killed the old error-string regex —
// driver/transport outcomes are blockers, attributed by kind upstream, not "unimplemented".)
function isUnimplementedResult(entry: FixtureEntry | null): boolean {
  if (!entry) return false;
  const o = entry.outcome;
  if (o.kind === "skipped") return o.cause === "capability";
  if (o.kind !== "value") return false;
  const g = o.grid;
  if (g.length === 1 && g[0]?.length === 1) {
    const cell = g[0][0];
    if (cell && (cell.primitive.kind === "error" || cell.primitive.kind === "extended-error")) {
      const s = cell.primitive.sentinel;
      return s === "#NAME?" || s === "#N/IMPL!" || s === "#N/A";
    }
  }
  return false;
}

// the value grid of a fixture entry, or an empty placeholder for non-value outcomes
// (call sites are gated to value-bearing entries).
function gridOrEmpty(entry: FixtureEntry | null): RichGridValue {
  return entry && entry.outcome.kind === "value" ? entry.outcome.grid : [[null]];
}

function isAutoGap(allResults: Array<{ entry: FixtureEntry | null; hasValue: boolean }>): boolean {
  const hasReal = allResults.some((a) => a.hasValue && !isUnimplementedResult(a.entry));
  const hasUnimpl = allResults.some((a) => isUnimplementedResult(a.entry));
  return hasReal && hasUnimpl;
}

function classifyDisagreement(
  test: TestCase,
  authResults: Array<{ platform: Platform; entry: FixtureEntry | null; hasValue: boolean }>,
  alternates: RichGridValue[],
): ConsensusClassification {
  if (isIntended(test)) return "intended";
  if (isAnnotatedGap(test)) return "gap";
  if (isAutoGap(authResults)) return "gap";
  if (alternates.length === 0) return "agreement";
  return "intended";
}

// v2 equivalents for v1's `authority_divergence:` annotation
//   intended → "no canonical answer" → status: observed
//   gap      → "one engine lacks the function" → override.cause: missing-function
function isIntended(test: TestCase): boolean {
  return test.status === "observed";
}

function isAnnotatedGap(test: TestCase): boolean {
  if (!test.overrides) return false;
  for (const ov of Object.values(test.overrides)) {
    if (ov && ov.cause === "missing-function") return true;
  }
  return false;
}

// The headline benchmark scores only pure formula-value tests; everything else is
// excluded so a scalar fixture comparison cannot manufacture false confidence.
// This lane is *derived* from a test's existing signals — `semanticDomain` was
// dissolved (2026-06-16) as a redundant author field. `null` = stays in the scored
// lane. Verified lossless against the prior author declarations across the corpus.
function nonValueLane(test: TestCase): string | null {
  const subject = test.subject ?? "";
  if (test.status === "volatile" || test.category === "volatile" || isVolatileSubject(subject)) return "volatile";
  if (test.category === "format") return "display";
  if (test.category === "interaction") return "grid-context";
  if (isMetadataSubject(subject)) return "metadata";
  if (test.features?.includes("external-io")) return "external-effect";
  if (test.supportLevel && test.supportLevel !== "full") return "partial";
  return null;
}

function isVolatileSubject(subject: string): boolean {
  return subject === "RAND" || subject === "RANDBETWEEN" || subject === "RANDARRAY" || subject === "NOW" || subject === "TODAY";
}

function isMetadataSubject(subject: string): boolean {
  return subject === "CELL" || subject === "SHEET" || subject === "SHEETS";
}

export function gridsAgree(
  a: GridValue | RichGridValue,
  b: GridValue | RichGridValue,
  strictErrors: boolean,
): boolean {
  if (strictErrors) return gridsEqual(a, b);
  // Project to scalar for the per-cell error-equivalence loop below; the
  // structural-rich extras don't affect benchmark agreement (primitive axis
  // only per coalescing default).
  const sa = toScalarGrid(a);
  const sb = toScalarGrid(b);
  if (sa.length !== sb.length) return false;
  for (let r = 0; r < sa.length; r++) {
    if (sa[r].length !== sb[r].length) return false;
    for (let c = 0; c < sa[r].length; c++) {
      const x = sa[r][c];
      const y = sb[r][c];
      if (isCellError(x) && isCellError(y)) continue;
      if (!gridsEqual([[x]], [[y]])) return false;
    }
  }
  return true;
}

const formatCompact = formatGrid;

export function printBenchmark(result: BenchmarkResult, verbose = false): void {
  const { counts, exclusions, scores } = result;

  console.log(`\n── Benchmark ──`);
  console.log(`  total tests considered: ${counts.totalTests}`);
  console.log(`  consensus (benchmark):  ${counts.consensus}`);
  console.log(`    bucket 1 (agreement):      ${counts.byBucket.agreement}`);
  console.log(`    bucket 2 (intended div):   ${counts.byBucket.intended}`);
  console.log(`    bucket 3 (gap):            ${counts.byBucket.gap}`);
  console.log(`  excluded:               ${counts.excluded}`);

  if (exclusions.length > 0) {
    const byReason = new Map<string, number>();
    for (const e of exclusions) byReason.set(e.reason, (byReason.get(e.reason) ?? 0) + 1);
    console.log(`\n  exclusion breakdown:`);
    for (const [reason, n] of byReason) {
      console.log(`    ${reason.padEnd(30)} ${n}`);
    }
  }

  console.log(`\n── Target scores ──`);
  for (const target of Object.keys(scores)) {
    const s = scores[target];
    const effective = s.total - s.skipped - s.driverIssue;
    const pct = effective > 0 ? ((s.passed / effective) * 100).toFixed(1) : "n/a";
    console.log(
      `\n  ${target}:  ${s.passed}/${effective}  (${pct}%)  ` +
        `[pass ${s.passed}  fail ${s.failed}  err ${s.errored}  drv-issue ${s.driverIssue}  skip ${s.skipped}]`,
    );

    const b = s.buckets;
    if (b.agreement.total > 0) {
      console.log(
        `    agreement:      ${b.agreement.passed}/${b.agreement.total - b.agreement.errored}` +
          (b.agreement.errored > 0 ? `  (${b.agreement.errored} errored)` : "") +
          (b.agreement.failed > 0 ? `  (${b.agreement.failed} failed)` : ""),
      );
    }
    if (b.intended.total > 0) {
      console.log(
        `    intended div:   ${b.intended.matched} matched` +
          (b.intended.diverged > 0 ? `, ${b.intended.diverged} intentional diverge` : "") +
          (b.intended.errored > 0 ? `, ${b.intended.errored} errored` : ""),
      );
    }
    if (b.gap.total > 0) {
      console.log(
        `    gap:            ${b.gap.passed}/${b.gap.total - b.gap.errored}` +
          (b.gap.errored > 0 ? `  (${b.gap.errored} errored)` : "") +
          (b.gap.failed > 0 ? `  (${b.gap.failed} failed)` : ""),
      );
    }
  }

  if (verbose) {
    console.log(`\n── Detail ──`);
    for (const target of Object.keys(scores)) {
      const s = scores[target];
      console.log(`\n  ${target}:`);
      for (const r of s.results) {
        if (r.outcome === "pass") continue;
        const sym =
          r.outcome === "fail"
            ? "✗"
            : r.outcome === "error"
              ? "!"
              : r.outcome === "driver-issue"
                ? "⚠"
                : r.outcome === "diverged-intended"
                  ? "◇"
                  : "-";
        const bucket = ` [${r.classification}]`;
        const detail = r.detail ? ` — ${r.detail}` : "";
        console.log(`    ${sym}${bucket} [${r.suite}] ${r.test}${detail}`);
      }
    }

    if (exclusions.length > 0) {
      console.log(`\n  exclusions:`);
      for (const e of exclusions) {
        const detail = e.detail ? ` — ${e.detail}` : "";
        console.log(`    - [${e.suite}] ${e.test} (${e.reason})${detail}`);
      }
    }
  }
}

export function rollupByFunction(result: BenchmarkResult): FunctionRollup {
  const byFunction: FunctionRollup["byFunction"] = {};
  const engines = Object.keys(result.scores);

  // v2: derive functions from test.subject (bare uppercase = function name)
  // non-function subjects (op:*, lit:*, ref:*, feature:*) are excluded from
  // the function rollup — they're tracked separately by namespace
  const testFuncs = new Map<string, string[]>();
  for (const { test } of result.consensus) {
    const funcs: string[] = [];
    if (test.subject && /^[A-Z][A-Z0-9_.]*$/.test(test.subject)) {
      funcs.push(test.subject);
    }
    testFuncs.set(test.id, funcs);
  }

  for (const engine of engines) {
    for (const row of result.scores[engine].results) {
      const funcs = testFuncs.get(row.test) ?? [];
      if (funcs.length === 0) continue;
      for (const fn of funcs) {
        const entry = (byFunction[fn] ??= {});
        const e = (entry[engine] ??= { pass: 0, fail: 0, error: 0, skip: 0, total: 0 });
        e.total++;
        if (row.outcome === "pass") e.pass++;
        else if (row.outcome === "fail") e.fail++;
        else if (row.outcome === "error" || row.outcome === "driver-issue") e.error++;
        else if (row.outcome === "skipped") e.skip++;
      }
    }
  }

  const functions = Object.keys(byFunction).sort();
  return { byFunction, functions, engines };
}

export function printFunctionRollup(rollup: FunctionRollup): void {
  const { functions, engines, byFunction } = rollup;
  if (functions.length === 0) {
    console.log("\n── Per-function rollup ──\n  (no tests carry func: tags — backfill first)");
    return;
  }

  const funcCol = Math.max(...functions.map((f) => f.length), 8);
  const engCol = Math.max(...engines.map((e) => e.length), 5);

  console.log("\n── Per-function rollup ──\n");
  const header = `${"function".padEnd(funcCol)}  ${engines.map((e) => e.padStart(engCol)).join("  ")}`;
  console.log(header);
  console.log("-".repeat(header.length));

  for (const fn of functions) {
    const cells = engines.map((e) => {
      const v = byFunction[fn]?.[e];
      if (!v) return "-".padStart(engCol);
      return `${v.pass}/${v.total}`.padStart(engCol);
    });
    console.log(`${fn.padEnd(funcCol)}  ${cells.join("  ")}`);
  }
}

export function rollupAsCsv(rollup: FunctionRollup): string {
  const rows: string[] = ["function,engine,pass,fail,error,skip,total,pass_rate"];
  for (const fn of rollup.functions) {
    for (const e of rollup.engines) {
      const v = rollup.byFunction[fn]?.[e];
      if (!v) continue;
      const rate = v.total > 0 ? (v.pass / v.total).toFixed(3) : "";
      rows.push(`${fn},${e},${v.pass},${v.fail},${v.error},${v.skip},${v.total},${rate}`);
    }
  }
  return rows.join("\n") + "\n";
}

export function consensusAsFixture(result: BenchmarkResult): {
  version: number;
  generatedAt: string;
  tests: Array<{
    suite: string;
    name: string;
    formula: unknown;
    expected: RichGridValue;
    alternates?: RichGridValue[];
    classification: ConsensusClassification;
  }>;
} {
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    tests: result.consensus.map(({ suite, test, expected, alternates, classification }) => ({
      suite,
      name: test.id,
      formula: test.formula,
      expected,
      ...(alternates && alternates.length > 0 ? { alternates } : {}),
      classification,
    })),
  };
}
