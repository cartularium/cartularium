// build-time derivation: per-run value deltas, so the browser can replay state
// and classify tests under any (target, refs) selection — same UX as compare

import { join } from "node:path";
import { ALL_PLATFORMS } from "../format/values.js";
import type { Platform } from "../format/values.js";
import type { FixtureEntry } from "../fixtures.js";
import { readJsonl } from "./io.js";
import type { FixtureChangeRow, RunRow } from "./types.js";

export interface AgreementDelta {
  tid: string;
  engine: Platform;
  // null = cell removed (test deleted, engine gap, etc.)
  to: unknown | null;
}

export interface AgreementSnapshot {
  run_id: string;
  ts: string;
  test_count: number;
  engine_versions: Partial<Record<Platform, string | null>>;
  // delta from prior run; first run carries all baselines
  delta: AgreementDelta[];
}

export interface AgreementHistory {
  engines: readonly Platform[];
  runs: AgreementSnapshot[];
}

export function computeAgreementHistory(historyDir: string): AgreementHistory {
  const runs = readJsonl<RunRow>(join(historyDir, "runs.jsonl"));
  const changes = readJsonl<FixtureChangeRow>(join(historyDir, "fixture_changes.jsonl"));

  const changesByRun = new Map<string, FixtureChangeRow[]>();
  for (const c of changes) {
    const arr = changesByRun.get(c.run_id);
    if (arr) arr.push(c);
    else changesByRun.set(c.run_id, [c]);
  }

  const snapshots: AgreementSnapshot[] = runs.map((run) => {
    const myChanges = changesByRun.get(run.run_id) ?? [];
    const delta: AgreementDelta[] = myChanges.map((c) => ({
      tid: c.test_id,
      engine: c.engine,
      to: c.to_hash === null ? null : changeResultValue(c),
    }));
    return {
      run_id: run.run_id,
      ts: tsFromRunId(run.run_id),
      test_count: run.test_count,
      engine_versions: run.engine_versions,
      delta,
    };
  });

  return { engines: ALL_PLATFORMS, runs: snapshots };
}

function changeResultValue(c: FixtureChangeRow): unknown {
  // History rows store full fixture entries so inspect/diff tooling can show
  // provenance. The agreement chart uses only the observable grid, matching
  // catalogue /compare.
  if (isFixtureEntry(c.to_value))
    return c.to_value.outcome.kind === "value" ? c.to_value.outcome.grid : undefined;
  return c.to_value;
}

function isFixtureEntry(v: unknown): v is FixtureEntry {
  return !!v && typeof v === "object" && "outcome" in v;
}

function tsFromRunId(runId: string): string {
  const dotIdx = runId.lastIndexOf(".");
  return dotIdx > 0 ? runId.slice(0, dotIdx) : runId;
}
