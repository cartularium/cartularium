// read-only views over history/. inspect a single run, or list runs since a date

import { join } from "node:path";
import { readJsonl } from "./io.js";
import type { DvEventRow, FixtureChangeRow, RunRow } from "./types.js";

export interface InspectResult {
  run: RunRow;
  events_by_kind: Record<string, number>;
  events_grouped: Array<{ kind: string; rows: DvEventRow[] }>;
  fixture_changes_by_engine: Record<string, number>;
  fixture_change_sample: FixtureChangeRow[];
  fixture_changes_total: number;
}

export function inspectRun(runId: string, historyDir: string, sampleSize = 5): InspectResult {
  const runs = readJsonl<RunRow>(join(historyDir, "runs.jsonl"));
  const resolved = resolveRunId(runId, runs);
  const run = runs.find((r) => r.run_id === resolved);
  if (!run) throw new Error(`no run matches ${runId}`);

  const events = readJsonl<DvEventRow>(join(historyDir, "dv_events.jsonl"))
    .filter((e) => e.run_id === resolved);
  const events_by_kind: Record<string, number> = {};
  const grouped = new Map<string, DvEventRow[]>();
  for (const e of events) {
    events_by_kind[e.event] = (events_by_kind[e.event] ?? 0) + 1;
    if (!grouped.has(e.event)) grouped.set(e.event, []);
    grouped.get(e.event)!.push(e);
  }

  const changes = readJsonl<FixtureChangeRow>(join(historyDir, "fixture_changes.jsonl"))
    .filter((c) => c.run_id === resolved);
  const fixture_changes_by_engine: Record<string, number> = {};
  for (const c of changes) {
    fixture_changes_by_engine[c.engine] = (fixture_changes_by_engine[c.engine] ?? 0) + 1;
  }

  return {
    run,
    events_by_kind,
    events_grouped: [...grouped.entries()].map(([kind, rows]) => ({ kind, rows })),
    fixture_changes_by_engine,
    fixture_change_sample: changes.slice(0, sampleSize),
    fixture_changes_total: changes.length,
  };
}

// returns runs whose run_id is lexicographically >= the cutoff prefix.
// since run_id starts with iso-8601 utc, this is equivalent to chronological
export function listSince(cutoff: string, historyDir: string): RunRow[] {
  const runs = readJsonl<RunRow>(join(historyDir, "runs.jsonl"));
  return runs.filter((r) => r.run_id >= cutoff);
}

// resolves "latest" or a unique prefix to a full run_id. exact match wins
function resolveRunId(input: string, runs: RunRow[]): string {
  if (input === "latest") {
    if (runs.length === 0) throw new Error("no runs in history");
    return runs[runs.length - 1].run_id;
  }
  const exact = runs.find((r) => r.run_id === input);
  if (exact) return exact.run_id;
  const matches = runs.filter((r) => r.run_id.startsWith(input));
  if (matches.length === 1) return matches[0].run_id;
  if (matches.length === 0) throw new Error(`no run matches "${input}"`);
  throw new Error(`prefix "${input}" matches ${matches.length} runs — be more specific`);
}
