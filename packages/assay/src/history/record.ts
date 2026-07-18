// orchestrates a single `assay history --record` invocation

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import { computeMatrix } from "../divergence-matrix.js";
import type { Platform } from "../format/values.js";
import { applySeedActions, applyStatusActions, diffClusters } from "./dv-lifecycle.js";
import { snapshotFixtures } from "./fixtures.js";
import { capabilitiesHash, fixtureBehaviorHash } from "./hash.js";
import { acquireLock, appendJsonl } from "./io.js";
import { parseCellKey, replayFixtureChanges } from "./replay.js";
import type { DvEventRow, FixtureChangeRow, RunRow } from "./types.js";
import { probeVersions } from "./versions.js";

export interface RecordOptions {
  // repo paths
  testsGlobFiles: string[];
  fixturesDir: string;
  divergencesDir: string;
  capabilitiesDir: string;
  historyDir: string;
  // run-row fields
  trigger: "cron" | "manual" | "pr";
  note?: string;
  // when true, computes deltas + prints summary but writes nothing
  dryRun?: boolean;
  // skip versionString() probes (saves ~10s, useful for tests)
  skipVersions?: boolean;
}

export interface RecordResult {
  run_id: string;
  fixture_changes: number;
  dv_events_by_kind: Record<string, number>;
  seeded_dvs: string[];
  vanished_dvs: string[];
  resurrected_dvs: string[];
  capabilities_snapshot_path: string;
  // null on dry-run
  paths_written: {
    runs_jsonl: string;
    dv_events_jsonl: string;
    fixture_changes_jsonl: string;
    capabilities_snapshot: string | null;
    seeded_dv_files: string[];
    status_updated_dv_files: string[];
  } | null;
}

export async function recordRun(opts: RecordOptions): Promise<RecordResult> {
  const now = new Date();
  const runId = generateRunId(now);
  const ts = now.toISOString();

  if (!existsSync(opts.historyDir)) mkdirSync(opts.historyDir, { recursive: true });
  const lock = acquireLock(join(opts.historyDir, ".lock"));
  try {
    return await runUnderLock(opts, runId, ts);
  } finally {
    lock.release();
  }
}

async function runUnderLock(opts: RecordOptions, runId: string, ts: string): Promise<RecordResult> {
  // 1. snapshot current fixtures + replay prior state
  const { cells: current } = snapshotFixtures(opts.fixturesDir);
  const fixtureChangesPath = join(opts.historyDir, "fixture_changes.jsonl");
  const prior = replayFixtureChanges(fixtureChangesPath);

  // 2. compute fixture deltas (baseline rows on first run)
  const fixtureChangeRows: FixtureChangeRow[] = [];
  for (const [key, entry] of current) {
    const { test_id, engine } = parseCellKey(key);
    const toHash = fixtureBehaviorHash(entry);
    const fromCell = prior.get(key);
    if (!fromCell) {
      fixtureChangeRows.push({
        run_id: runId, ts, test_id, engine,
        from_hash: null, to_hash: toHash,
        from_value: null, to_value: entry,
      });
    } else if (fromCell.hash !== toHash) {
      fixtureChangeRows.push({
        run_id: runId, ts, test_id, engine,
        from_hash: fromCell.hash, to_hash: toHash,
        from_value: fromCell.value, to_value: entry,
      });
    }
  }
  for (const [key, fromCell] of prior) {
    if (current.has(key)) continue;
    const { test_id, engine } = parseCellKey(key);
    fixtureChangeRows.push({
      run_id: runId, ts, test_id, engine,
      from_hash: fromCell.hash, to_hash: null,
      from_value: fromCell.value, to_value: null,
    });
  }

  // 3. compute clusters → DV diff (no writes yet)
  const matrix = computeMatrix(opts.testsGlobFiles);
  const delta = diffClusters(matrix.clusters, opts.divergencesDir);
  const dvEventRows: DvEventRow[] = delta.events.map((e) => ({
    run_id: runId, ts, ...e,
  }));

  // 4. capabilities snapshot
  const capsHash = capabilitiesHash(opts.capabilitiesDir);
  const snapshotsDir = join(opts.historyDir, "capabilities-snapshots");
  const snapshotName = `${capsHash.replace(/^sha256:/, "")}.json`;
  const snapshotPath = join(snapshotsDir, snapshotName);
  const snapshotIsNovel = !existsSync(snapshotPath);

  // 5. probe versions
  const { versions, log: versionLog } = opts.skipVersions
    ? { versions: {} as Partial<Record<Platform, string | null>>, log: [] as Array<{ platform: Platform; result: string | null; ms: number }> }
    : await probeVersions();

  // 6. assemble run row
  const runRow: RunRow = {
    run_id: runId,
    trigger: opts.trigger,
    engine_versions: versions,
    capabilities_hash: capsHash,
    test_count: matrix.totalTests,
    dv_count: matrix.clusters.length,
    fixture_change_count: fixtureChangeRows.length,
    ...(opts.note ? { note: opts.note } : {}),
  };

  const dvEventsByKind: Record<string, number> = {};
  for (const e of delta.events) dvEventsByKind[e.event] = (dvEventsByKind[e.event] ?? 0) + 1;

  const vanishedIds = delta.statusActions.filter((a) => a.kind === "vanish").map((a) => a.dv_id);
  const resurrectedIds = delta.statusActions.filter((a) => a.kind === "resurrect").map((a) => a.dv_id);

  if (opts.dryRun) {
    return {
      run_id: runId,
      fixture_changes: fixtureChangeRows.length,
      dv_events_by_kind: dvEventsByKind,
      seeded_dvs: delta.seedActions.map((a) => a.dv_id),
      vanished_dvs: vanishedIds,
      resurrected_dvs: resurrectedIds,
      capabilities_snapshot_path: snapshotPath,
      paths_written: null,
    };
  }

  // 7. apply writes — order: capabilities snapshot → seed YAMLs → jsonls
  // capabilities first because run row references it; seed before events
  // because events reference dv_ids (including newly seeded ones)
  if (snapshotIsNovel) {
    if (!existsSync(snapshotsDir)) mkdirSync(snapshotsDir, { recursive: true });
    copyCapabilitiesTo(opts.capabilitiesDir, snapshotPath);
  }

  const today = ts.slice(0, 10);
  applySeedActions(delta.seedActions, today);
  applyStatusActions(delta.statusActions, today);

  appendJsonl(join(opts.historyDir, "runs.jsonl"), [runRow]);
  appendJsonl(join(opts.historyDir, "dv_events.jsonl"), dvEventRows);
  appendJsonl(fixtureChangesPath, fixtureChangeRows);

  // best-effort log of probe timings to stderr — useful for cron debugging
  if (versionLog.length > 0) {
    const total = versionLog.reduce((s, x) => s + x.ms, 0);
    process.stderr.write(`[history] versions probed in ${total}ms\n`);
  }

  return {
    run_id: runId,
    fixture_changes: fixtureChangeRows.length,
    dv_events_by_kind: dvEventsByKind,
    seeded_dvs: delta.seedActions.map((a) => a.dv_id),
    vanished_dvs: vanishedIds,
    resurrected_dvs: resurrectedIds,
    capabilities_snapshot_path: snapshotPath,
    paths_written: {
      runs_jsonl: join(opts.historyDir, "runs.jsonl"),
      dv_events_jsonl: join(opts.historyDir, "dv_events.jsonl"),
      fixture_changes_jsonl: fixtureChangesPath,
      capabilities_snapshot: snapshotIsNovel ? snapshotPath : null,
      seeded_dv_files: delta.seedActions.map((a) => a.path),
      status_updated_dv_files: delta.statusActions.map((a) => a.path),
    },
  };
}

// iso-8601 utc, second precision + 4 random hex chars to disambiguate
// same-second runs. lexicographic order on prefix = chronological order
function generateRunId(now: Date): string {
  const iso = now.toISOString().replace(/\.\d+/, "");
  const suffix = randomBytes(2).toString("hex");
  return `${iso}.${suffix}`;
}

// bundle all capability files into one content-addressable json blob
function copyCapabilitiesTo(srcDir: string, destPath: string): void {
  const blob: Record<string, unknown> = {};
  for (const f of readdirSync(srcDir).sort()) {
    if (!f.endsWith(".json")) continue;
    blob[f] = JSON.parse(readFileSync(join(srcDir, f), "utf8"));
  }
  writeFileSync(destPath, JSON.stringify(blob, null, 2));
}
