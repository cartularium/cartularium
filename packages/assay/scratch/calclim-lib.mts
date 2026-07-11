import { createDriver } from "@cartularium/drivers";
import { getAccessToken } from "../src/auth.js";
import { appendFileSync } from "node:fs";

export const SPREADSHEET_ID = "1OCPDxnyEvc0hXyn6iZzLCRIYXajMW4zHuaB5wh30Rhs";
export const RESULTS_JSONL =
  "/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/deep-dive-2026-07-11/calc-limits/results.jsonl";

export interface Probe {
  id: string;
  formula: string;
  grid?: Record<string, unknown>;
  expectation: string; // human-readable expected outcome
}

export interface ProbeResult {
  id: string;
  formula: string;
  expectation: string;
  observed: string; // compact rendering of the outcome scalar/error/kind
  ms: number;
  verdict?: string; // filled in by caller
}

/** Compact one driver outcome to a short observed string. */
export function renderOutcome(outcome: any): string {
  if (!outcome) return "no-outcome";
  if (outcome.kind !== "value") {
    return `[${outcome.kind}]${outcome.channel ? " " + outcome.channel : ""}${
      outcome.detail ? " " + outcome.detail : ""
    }${outcome.reason ? " " + outcome.reason : ""}`;
  }
  const grid = outcome.grid as Array<Array<any>>;
  const ext = outcome.extent;
  const cell = grid?.[0]?.[0];
  const p = cell?.primitive;
  let head: string;
  if (!p) head = "null";
  else if (p.kind === "number") head = String(p.value);
  else if (p.kind === "string") head = JSON.stringify(p.value);
  else if (p.kind === "boolean") head = String(p.value);
  else if (p.kind === "error" || p.kind === "extended-error") head = p.sentinel;
  else if (p.kind === "blank") head = "<blank>";
  else if (p.kind === "null") head = "<null>";
  else head = JSON.stringify(p);
  return `${head} (${ext?.rows ?? "?"}x${ext?.cols ?? "?"})`;
}

export async function makeDriver() {
  const token = await getAccessToken();
  if (!token) throw new Error("no access token");
  const d = createDriver("gsheets", { spreadsheetId: SPREADSHEET_ID, accessToken: token });
  await d.init();
  return d;
}

/**
 * Run probes in sequential sub-batches. Times each batch; per-probe ms is the
 * batch wall-clock / batch size (approximate — good enough for red-flag detection).
 * Appends each result as JSONL and prints a line. Returns the results array.
 */
export async function runProbes(
  probes: Probe[],
  opts: { batchSize?: number; tag: string } = { tag: "run" },
): Promise<ProbeResult[]> {
  const batchSize = opts.batchSize ?? 6;
  const d = await makeDriver();
  const out: ProbeResult[] = [];
  for (let i = 0; i < probes.length; i += batchSize) {
    const batch = probes.slice(i, i + batchSize);
    const t0 = Date.now();
    const results = await d.evaluateBatch(
      batch.map((p) => ({ formula: p.formula, grid: p.grid as any })),
    );
    const batchMs = Date.now() - t0;
    const per = Math.round(batchMs / batch.length);
    for (let j = 0; j < batch.length; j++) {
      const observed = renderOutcome(results[j]?.outcome);
      const r: ProbeResult = {
        id: batch[j].id,
        formula: batch[j].formula,
        expectation: batch[j].expectation,
        observed,
        ms: per,
      };
      out.push(r);
      appendFileSync(RESULTS_JSONL, JSON.stringify({ ...r, tag: opts.tag }) + "\n");
      const flag = batchMs > 60000 ? "  <<< BATCH >60s RED FLAG" : "";
      console.log(`${r.id}\t${observed}\t| want: ${r.expectation}\t(${per}ms)${flag}`);
    }
    console.log(`  -- batch ${i / batchSize} wall ${batchMs}ms (${batch.length} probes) --`);
  }
  return out;
}
