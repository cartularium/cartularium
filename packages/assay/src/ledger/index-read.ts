import { readRows, validateRunRow } from "./io.js";
import type { CompletionRow, EvidenceRow, RunRow, RunsFileRow } from "./types.js";

export interface LedgerRunStatus {
  run?: RunRow;
  complete?: CompletionRow;
  evidence?: EvidenceRow;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRunRow(row: unknown): row is RunRow {
  if (!isRecord(row)) return false;
  return row.row === "run" &&
    typeof row.run_id === "string" &&
    typeof row.seq === "number" &&
    (row.trigger === "manual" || row.trigger === "ci") &&
    isRecord(row.scope) &&
    (row.scope.kind === "full" || row.scope.kind === "subset") &&
    typeof row.corpus_commit === "string" &&
    isRecord(row.engines);
}

function isCompletionRow(row: unknown): row is CompletionRow {
  if (!isRecord(row)) return false;
  return row.row === "complete" &&
    typeof row.run_id === "string" &&
    typeof row.at === "string" &&
    isRecord(row.observed) &&
    isRecord(row.counts);
}

function isEvidenceRow(row: unknown): row is EvidenceRow {
  if (!isRecord(row)) return false;
  return row.row === "evidence" &&
    typeof row.run_id === "string" &&
    typeof row.commit === "string" &&
    isRecord(row.files);
}

export function loadLedgerIndex(path: string): Map<string, LedgerRunStatus> {
  const index = new Map<string, LedgerRunStatus>();
  const { rows } = readRows<RunsFileRow>(path);

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const runId = (row as { run_id?: unknown }).run_id;
    if (typeof runId !== "string") continue;
    const status = index.get(runId) ?? {};
    if (isRunRow(row)) {
      try {
        status.run = validateRunRow(row);
      } catch {
        continue;
      }
    } else if (isCompletionRow(row)) {
      status.complete = row;
    } else if (isEvidenceRow(row)) {
      status.evidence = row;
    } else {
      continue;
    }
    index.set(runId, status);
  }

  return index;
}
