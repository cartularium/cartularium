// Run lifecycle for the stability-substrate ledger: open → results →
// complete, under one pid lock. Evidence rows are appended after the run's
// fixture writes are committed (a separate step — the commit sha cannot
// exist before the commit). Corrections append at any time.

import { join } from "node:path";
import type { LockHandle } from "../history/io.js";
import { appendRows, lockLedger, newRowId, newRunId, readRows } from "./io.js";
import type {
  CompletionRow, CorrectionRow, EvidenceRow, ResultRow, RunId, RunRow, RunsFileRow,
} from "./types.js";

export const RUNS_FILE = "runs.jsonl";
export const RESULTS_FILE = "results.jsonl";

export class LedgerWriter {
  private lock: LockHandle;
  private readonly runsPath: string;
  private readonly resultsPath: string;
  private open = new Set<RunId>();

  constructor(private readonly historyDir: string) {
    this.lock = lockLedger(historyDir);
    this.runsPath = join(historyDir, RUNS_FILE);
    this.resultsPath = join(historyDir, RESULTS_FILE);
  }

  /** next human-facing sequence label: one past the highest on record */
  nextSeq(): number {
    const { rows } = readRows<RunsFileRow>(this.runsPath);
    let max = 0;
    for (const r of rows) if (r.row === "run" && r.seq > max) max = r.seq;
    return max + 1;
  }

  /** run_id may be pre-generated (newRunId) so sweep artifacts can reference
   * it before the row lands — rows are order-insensitive, so the run row
   * legally arrives after the sweep with its real observation windows */
  openRun(row: Omit<RunRow, "row" | "run_id" | "seq"> & { start: Date; run_id?: RunId }): RunRow {
    const { start, run_id, ...rest } = row;
    const run: RunRow = { row: "run", run_id: run_id ?? newRunId(start), seq: this.nextSeq(), ...rest };
    appendRows(this.runsPath, [run]);
    this.open.add(run.run_id);
    return run;
  }

  appendResults(rows: Array<Omit<ResultRow, "row" | "row_id">>): ResultRow[] {
    const full = rows.map((r): ResultRow => {
      if (!this.open.has(r.run_id)) {
        throw new Error(`ledger: run ${r.run_id} is not open in this writer`);
      }
      return { row: "result", row_id: newRowId(), ...r };
    });
    appendRows(this.resultsPath, full);
    return full;
  }

  complete(
    run_id: RunId,
    at: string,
    observed: CompletionRow["observed"],
    counts: CompletionRow["counts"],
    selection?: string[],
  ): CompletionRow {
    if (!this.open.has(run_id)) throw new Error(`ledger: run ${run_id} is not open in this writer`);
    const row: CompletionRow = {
      row: "complete",
      run_id,
      at,
      observed,
      ...(selection ? { selection } : {}),
      counts,
    };
    appendRows(this.runsPath, [row]);
    this.open.delete(run_id);
    return row;
  }

  appendEvidence(row: Omit<EvidenceRow, "row">): EvidenceRow {
    const full: EvidenceRow = { row: "evidence", ...row };
    appendRows(this.runsPath, [full]);
    return full;
  }

  appendCorrection(row: Omit<CorrectionRow, "row" | "row_id">): CorrectionRow {
    const full: CorrectionRow = { row: "correction", row_id: newRowId(), ...row };
    appendRows(this.runsPath, [full]);
    return full;
  }

  release(): void {
    this.lock.release();
  }
}

export interface LedgerView {
  runs: RunRow[];
  results: ResultRow[];
  completions: CompletionRow[];
  evidence: EvidenceRow[];
  corrections: CorrectionRow[];
  /** runs with no completion row: crashed, torn, or in flight */
  incomplete: RunId[];
  tornTail: boolean;
}

export function readLedger(historyDir: string): LedgerView {
  const runsRead = readRows<RunsFileRow>(join(historyDir, RUNS_FILE));
  const resultsRead = readRows<ResultRow>(join(historyDir, RESULTS_FILE));
  const runs = runsRead.rows.filter((r): r is RunRow => r.row === "run");
  const completions = runsRead.rows.filter((r): r is CompletionRow => r.row === "complete");
  const done = new Set(completions.map((c) => c.run_id));
  return {
    runs,
    results: resultsRead.rows.filter((r) => r.row === "result"),
    completions,
    evidence: runsRead.rows.filter((r): r is EvidenceRow => r.row === "evidence"),
    corrections: runsRead.rows.filter((r): r is CorrectionRow => r.row === "correction"),
    incomplete: runs.filter((r) => !done.has(r.run_id)).map((r) => r.run_id),
    tornTail: runsRead.tornTail || resultsRead.tornTail,
  };
}
