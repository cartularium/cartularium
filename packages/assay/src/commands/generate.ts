// generate fixtures by evaluating tests on real engines

import { basename, dirname, resolve } from "node:path";
import { loadTestSuite, resolveFormulaForPlatform } from "../format/index.js";
import { outcomeErrorText, type CellValue, type Platform } from "../format/values.js";
import { evaluateTasks } from "../runner.js";
import type { TestSuite } from "../format/catalogue.js";
import { isRetryable, loadFixture, saveFixture, type FixtureEntry } from "../fixtures.js";
import { caseKey } from "../identity/index.js";
import { FPV, fingerprintOutcome } from "../fingerprint/index.js";
import { dirname as pathDirname, join as pathJoin } from "node:path";
import { fileURLToPath } from "node:url";
import { LedgerWriter } from "../ledger/writer.js";
import { newRunId } from "../ledger/io.js";
import { engineRunInfo, parseConditionsFile, preflightCorpusCommit } from "../ledger/record.js";
import type { EngineRunInfo, ResultRow, RunId } from "../ledger/types.js";
import { cleanupWorkbook, createWorkbook, type WorkbookResult } from "../workbook.js";
import {
  buildDrivers,
  clearProgress,
  mergeRequires,
  parsePlatforms,
  parseTags,
  printPlatformSummary,
  progress,
  resolveFiles,
  values,
  type SuiteTally,
} from "./shared.js";

export async function generate(args: string[]): Promise<void> {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("generate: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const platforms = parsePlatforms();
  const tags = parseTags();
  const onlyMissing = values.missing as boolean;
  const verbose = values.verbose as boolean;
  const quiet = values.quiet as boolean;

  // --record: the recorded pipeline (stability substrate §3). The run row
  // lands BEFORE the sweep so a crash leaves a visibly incomplete run;
  // observation windows land in the completion row.
  const record = values.record as boolean;
  const pkgDir = pathJoin(pathDirname(fileURLToPath(import.meta.url)), "..", "..");
  let recording: {
    writer: LedgerWriter;
    runId: RunId;
    resultRows: Array<Omit<ResultRow, "row" | "row_id">>;
    observed: Record<string, { from: string; to: string }>;
    counts: Record<string, { selected: number; attempted: number; recorded: number; outcomes: Record<string, number> }>;
    selection: Set<string>;
  } | null = null;
  if (record) {
    const conditionsPath = values.conditions as string | undefined;
    if (!conditionsPath) {
      console.error("generate --record requires --conditions <file> (the declared D-row set per engine)");
      process.exit(1);
    }
    const repoRoot = pathJoin(pkgDir, "..", "..");
    const corpusCommit = preflightCorpusCommit(repoRoot);
    const conditions = parseConditionsFile(conditionsPath, platforms as Platform[]);
    const historyDir = pathJoin(pkgDir, "history");
    const driversDir = pathJoin(pkgDir, "..", "drivers");
    const writer = new LedgerWriter(historyDir);
    const start = new Date();
    const runId = newRunId(start);
    recording = {
      writer,
      runId,
      resultRows: [],
      observed: {},
      counts: {},
      selection: new Set(),
    };
    // engines' static info is known before the sweep; probe versions now
    const engines: Partial<Record<Platform, EngineRunInfo>> = {};
    const probeDrivers = await buildDrivers(platforms, undefined);
    try {
      for (const d of probeDrivers) {
        engines[d.platform as Platform] = engineRunInfo({
          driversDir,
          historyDir,
          corpusCommit,
          engineVersion: await d.versionString(),
          conditions: conditions[d.platform],
        });
      }
    } finally {
      for (const d of probeDrivers) await d.destroy();
    }
    writer.openRun({
      start,
      run_id: runId,
      trigger: "manual",
      scope: onlyMissing ? { kind: "subset" } : { kind: "full" },
      corpus_commit: corpusCommit,
      engines,
      note: (values.note as string | undefined) ?? undefined,
    });
    if (!quiet) console.log(`recording run ${runId}`);
  }

  const suites: Array<{ file: string; suite: TestSuite }> = [];
  for (const file of files) suites.push({ file, suite: loadTestSuite(file) });

  let workbook: WorkbookResult | null = null;
  const allRequires = mergeRequires(
    suites.map((s) => ({ dir: dirname(resolve(s.file)), requires: s.suite.requires })),
  );
  if (allRequires && platforms.includes("excel")) {
    if (!quiet) console.log("Installing packages into temp workbook...");
    workbook = await createWorkbook(allRequires.requires, allRequires.baseDir);
    if (!quiet) console.log(`  → ${workbook.path}`);
  }

  const drivers = await buildDrivers(platforms, workbook?.path);

  const tallies: Record<string, Record<string, SuiteTally>> = {};
  const driverIssuesLog: Array<{ platform: string; suite: string; test: string; error: string }> =
    [];

  try {
    for (const driver of drivers) {
      const platform = driver.platform as Platform;

      const fileTasks: Array<{
        file: string;
        suiteName: string;
        tests: Array<{
          id: string;
          key: string;
          stimulus?: `sha256:${string}`;
          formula: string;
          asEvaluated: string;
          grid?: Record<string, CellValue>;
          skip?: string;
        }>;
      }> = [];

      for (const { file, suite } of suites) {
        let tests = tags
          ? suite.tests.filter((t) => t.tags?.some((tag) => tags.includes(tag)))
          : suite.tests;

        if (onlyMissing) {
          const existing = loadFixture(file, platform);
          if (existing) {
            tests = tests.filter((t) => {
              const key = caseKey(t);
              // v1 files key by semanticHash — transitional fallback until
              // the hibernation item retires them
              const entry = existing.results[key] ?? (t.semanticHash ? existing.results[t.semanticHash] : undefined);
              return isRetryable(entry, t.stimulusHash);
            });
          }
        }

        const resolved: (typeof fileTasks)[number]["tests"] = [];
        for (const t of tests) {
          const r = resolveFormulaForPlatform(t, platform);
          if (r === null) continue;
          resolved.push({
            id: t.id,
            key: caseKey(t),
            stimulus: t.stimulusHash,
            formula: r.formula,
            asEvaluated: r.asEvaluated,
            grid: t.grid,
            skip: r.skip ? (r.skipReason ?? "feature absent") : undefined,
          });
        }
        if (resolved.length > 0) {
          fileTasks.push({
            file,
            suiteName: suite.name || basename(file, ".yaml"),
            tests: resolved,
          });
        }
      }

      if (fileTasks.length === 0) {
        if (!quiet) console.log(`  ${platform}: nothing to do`);
        continue;
      }

      const allTasks = fileTasks.flatMap((ft) => ft.tests);
      const started = Date.now();

      // One generation layer over the execution contract (decision 1): batch-vs-single
      // is dispatched inside evaluateTasks, not branched here.
      if (!quiet) progress(`${platform}  running ${allTasks.length} task(s)...`);
      // observation instants: per task for sequential drivers, per batch for
      // batch drivers (all tasks in a batch complete at its instant) — the
      // approved per-result-or-ordered-batch grain
      const sweepFrom = new Date().toISOString();
      const instants: string[] = [];
      let lastCompleted = 0;
      const allOutcomes = await evaluateTasks(
        driver,
        allTasks.map((t) => ({ formula: t.formula, grid: t.grid, ...(t.skip ? { skip: t.skip } : {}) })),
        (completed) => {
          const now = new Date().toISOString();
          for (let k = lastCompleted; k < completed; k++) instants[k] = now;
          lastCompleted = completed;
        },
      );
      for (let k = lastCompleted; k < allTasks.length; k++) instants[k] = new Date().toISOString();
      const sweepTo = new Date().toISOString();
      if (recording) recording.observed[platform] = { from: sweepFrom, to: sweepTo };
      if (!quiet) clearProgress();

      let offset = 0;
      for (const ft of fileTasks) {
        const entries: Record<string, FixtureEntry> = {};
        for (let i = 0; i < ft.tests.length; i++) {
          const r = allOutcomes[offset + i];
          const { id, key, stimulus, asEvaluated } = ft.tests[i];
          const fingerprint = fingerprintOutcome(r.outcome);
          const at = instants[offset + i];
          // recorded runs carry real provenance; ad-hoc generates are
          // visibly outside the ledger (preLedger, per the charter's
          // recorded-pipeline commitment)
          entries[key] = recording
            ? { outcome: r.outcome, "formula-as-evaluated": asEvaluated, stimulus, fingerprint, fpv: FPV, run_id: recording.runId, at }
            : { outcome: r.outcome, "formula-as-evaluated": asEvaluated, stimulus, fingerprint, fpv: FPV, run_id: null, at: null, preLedger: true };
          if (recording && stimulus) {
            recording.selection.add(key);
            recording.resultRows.push({
              run_id: recording.runId,
              case: key,
              stimulus,
              engine: platform,
              at,
              outcome: r.outcome.kind,
              fingerprint,
              fpv: FPV,
            });
            const c = (recording.counts[platform] ??= { selected: 0, attempted: 0, recorded: 0, outcomes: {} });
            c.selected += 1;
            if (r.outcome.kind !== "skipped") c.attempted += 1;
            c.recorded += 1;
            c.outcomes[r.outcome.kind] = (c.outcomes[r.outcome.kind] ?? 0) + 1;
          }
          // Surface non-value/non-skipped outcomes (rejected/crashed/infra/…) to the log.
          if (r.outcome.kind !== "value" && r.outcome.kind !== "skipped") {
            driverIssuesLog.push({
              platform,
              suite: ft.suiteName,
              test: id,
              error: outcomeErrorText(r.outcome) ?? r.outcome.kind,
            });
          }
        }
        const { ok, driverIssue, skipped } = saveFixture(ft.file, platform, entries, {
          prune: !onlyMissing,
        });
        (tallies[platform] ??= {})[ft.suiteName] = {
          ok,
          driverIssue,
          skipped,
          total: ft.tests.length,
          ms: 0,
        };
        offset += ft.tests.length;
      }
      const msTotal = Date.now() - started;
      const perSuite = msTotal / Math.max(fileTasks.length, 1);
      for (const ft of fileTasks) tallies[platform][ft.suiteName].ms = Math.round(perSuite);

      if (!quiet) printPlatformSummary(platform, tallies[platform]);
    }
  } catch (e) {
    // a crashed recorded sweep leaves its run row with no completion —
    // visibly incomplete, per the write protocol; release only the lock
    recording?.writer.release();
    throw e;
  } finally {
    for (const driver of drivers) await driver.destroy();
    if (workbook) cleanupWorkbook(workbook);
  }

  if (recording) {
    recording.writer.appendResults(recording.resultRows);
    recording.writer.complete(
      recording.runId,
      new Date().toISOString(),
      recording.observed,
      recording.counts,
      // a subset run's realized selection is discovered during the sweep,
      // so it rides the completion row (rows are immutable)
      onlyMissing ? [...recording.selection].sort() : undefined,
    );
    recording.writer.release();
    if (!quiet) {
      console.log(
        `run ${recording.runId} recorded (${recording.resultRows.length} results). ` +
          `Commit the fixture changes, then run: assay ledger --evidence ${recording.runId}`,
      );
    }
  }

  if (driverIssuesLog.length > 0) {
    if (verbose) {
      console.log(`\nDriver issues (${driverIssuesLog.length}):`);
      for (const d of driverIssuesLog) {
        console.log(`  ${d.platform.padEnd(10)} ${d.suite.padEnd(20)} ${d.test}`);
        console.log(`    ${d.error}`);
      }
    } else if (!quiet) {
      console.log(
        `\n${driverIssuesLog.length} driver issue(s) persisted in fixtures (driverIssue: true). Use -v to list.`,
      );
    }
  }
}
