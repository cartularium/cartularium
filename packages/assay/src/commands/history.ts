// `assay history` — record runs, inspect deltas, list runs since a date

import { resolveFiles, values } from "./shared.js";
import { inspectRun, listSince } from "../history/inspect.js";
import { recordRun } from "../history/record.js";
import type { DvEventRow, RunRow } from "../history/types.js";

type DvEventKind = DvEventRow["event"];

export async function history(): Promise<void> {
  const record = values["record"] as boolean | undefined;
  const inspect = values["inspect"] as string | undefined;
  const since = values["since"] as string | undefined;
  const historyDir = (values["history-dir"] as string | undefined) ?? "history";

  const modeCount = (record ? 1 : 0) + (inspect !== undefined ? 1 : 0) + (since !== undefined ? 1 : 0);
  if (modeCount === 0) {
    console.error("history: pass --record, --inspect <run_id|latest>, or --since <iso-date>");
    process.exit(2);
  }
  if (modeCount > 1) {
    console.error("history: --record / --inspect / --since are mutually exclusive");
    process.exit(2);
  }

  if (record) return runRecord(historyDir);
  if (inspect !== undefined) return runInspect(inspect, historyDir);
  if (since !== undefined) return runSince(since, historyDir);
}

async function runRecord(historyDir: string): Promise<void> {
  const dryRun = values["dry-run"] as boolean | undefined;
  const skipVersions = values["skip-versions"] as boolean | undefined;
  const trigger = ((values["trigger"] as string | undefined) ?? "manual") as "cron" | "manual" | "pr";
  const note = values["note"] as string | undefined;

  if (!["cron", "manual", "pr"].includes(trigger)) {
    console.error(`history: --trigger must be one of cron|manual|pr (got ${trigger})`);
    process.exit(2);
  }

  const testsGlobFiles = resolveFiles([]);
  if (testsGlobFiles.length === 0) {
    console.error("history: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const result = await recordRun({
    testsGlobFiles,
    fixturesDir: "fixtures",
    divergencesDir: "divergences",
    capabilitiesDir: "capabilities",
    historyDir,
    trigger,
    note,
    dryRun,
    skipVersions,
  });

  const eventStr = Object.entries(result.dv_events_by_kind)
    .map(([k, n]) => `${n} ${k}`).join(" · ") || "none";
  console.log(`run ${result.run_id}${dryRun ? " (DRY RUN)" : ""}`);
  console.log(`  fixture changes: ${result.fixture_changes}`);
  console.log(`  dv events:       ${eventStr}`);
  if (result.seeded_dvs.length > 0) {
    console.log(`  auto-seeded:     ${result.seeded_dvs.join(", ")}`);
  }
  if (result.vanished_dvs.length > 0) {
    console.log(`  marked vanished: ${result.vanished_dvs.join(", ")}`);
  }
  if (result.resurrected_dvs.length > 0) {
    console.log(`  resurrected:     ${result.resurrected_dvs.join(", ")}`);
  }
  if (result.paths_written) {
    console.log(`  wrote:`);
    console.log(`    ${result.paths_written.runs_jsonl}`);
    console.log(`    ${result.paths_written.dv_events_jsonl}`);
    console.log(`    ${result.paths_written.fixture_changes_jsonl}`);
    if (result.paths_written.capabilities_snapshot) {
      console.log(`    ${result.paths_written.capabilities_snapshot} (new)`);
    }
    for (const p of result.paths_written.seeded_dv_files) {
      console.log(`    ${p} (new dv)`);
    }
    for (const p of result.paths_written.status_updated_dv_files) {
      console.log(`    ${p} (status updated)`);
    }
  }
}

function runInspect(target: string, historyDir: string): void {
  let r;
  try {
    r = inspectRun(target, historyDir);
  } catch (e) {
    console.error(`history: ${(e as Error).message}`);
    process.exit(1);
  }

  const { run, events_by_kind, events_grouped, fixture_changes_by_engine, fixture_change_sample, fixture_changes_total } = r;
  console.log(`run ${run.run_id}   trigger: ${run.trigger}`);
  if (run.note) console.log(`note: ${run.note}`);
  console.log(`tests:           ${run.test_count}`);
  console.log(`dvs (current):   ${run.dv_count}`);
  console.log(`fixture changes: ${run.fixture_change_count}`);
  console.log(`capabilities:    ${run.capabilities_hash}`);

  const versionEntries = Object.entries(run.engine_versions);
  if (versionEntries.length > 0) {
    console.log(`engine versions:`);
    for (const [eng, v] of versionEntries.sort()) {
      console.log(`  ${eng.padEnd(14)} ${v ?? "—"}`);
    }
  }

  const totalEvents = Object.values(events_by_kind).reduce((s, n) => s + n, 0);
  console.log(``);
  console.log(`DV events (${totalEvents}):`);
  const order: DvEventKind[] = ["confirmed", "grown", "shrunk", "seeded", "vanished", "reseeded"];
  for (const kind of order) {
    const grp = events_grouped.find((g) => g.kind === kind);
    if (!grp) continue;
    const detail = kind === "confirmed" ? "" : `  ${formatEventDetail(kind, grp.rows)}`;
    console.log(`  ${String(grp.rows.length).padStart(4)} ${kind.padEnd(10)}${detail}`);
  }

  console.log(``);
  console.log(`fixture changes by engine:`);
  for (const [eng, n] of Object.entries(fixture_changes_by_engine).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${eng.padEnd(14)} ${n}`);
  }

  if (fixture_change_sample.length > 0) {
    console.log(``);
    console.log(`fixture changes sample (${fixture_change_sample.length} of ${fixture_changes_total}):`);
    for (const c of fixture_change_sample) {
      const baseline = c.from_hash === null;
      const removed = c.to_hash === null;
      const arrow = baseline ? "(baseline)" : removed ? "(removed)" : "→";
      console.log(`  ${c.test_id}|${c.engine}  ${arrow}`);
    }
  }
}

function runSince(cutoff: string, historyDir: string): void {
  const runs = listSince(cutoff, historyDir);
  if (runs.length === 0) {
    console.log(`no runs at or after ${cutoff}`);
    return;
  }
  console.log(`${runs.length} run(s) at or after ${cutoff}:`);
  for (const r of runs) {
    console.log(`  ${formatRunLine(r)}`);
  }
}

function formatEventDetail(kind: DvEventKind, rows: Array<{ dv_id: string; delta: number; test_count: number }>): string {
  // lifecycle events get a wider inline cap — they're worth seeing in full
  const inlineCap = kind === "seeded" || kind === "vanished" || kind === "reseeded" ? 12 : 6;
  if (rows.length <= inlineCap) {
    if (kind === "grown" || kind === "shrunk") {
      return rows.map((r) => `${r.dv_id}(${r.delta > 0 ? "+" : ""}${r.delta} → ${r.test_count})`).join(", ");
    }
    return rows.map((r) => r.dv_id).join(", ");
  }
  const head = rows.slice(0, 4).map((r) => r.dv_id).join(", ");
  return `${head} … +${rows.length - 4} more`;
}

function formatRunLine(r: RunRow): string {
  const note = r.note ? `  "${r.note}"` : "";
  return `${r.run_id}  ${r.trigger.padEnd(7)} ${r.test_count} tests · ${r.dv_count} DVs · ${r.fixture_change_count} changes${note}`;
}
