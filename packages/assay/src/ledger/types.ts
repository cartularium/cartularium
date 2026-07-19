// On-disk row schemas for the stability-substrate ledger (design approved
// 2026-07-18: internal/research/assay/stability-substrate-design-2026-07-18.md
// §3, per decisions/2026-07-18-assay-stability-substrate-approval.md).
//
// The ledger is append-only. Rows are never edited; a mistake is corrected
// by a CorrectionRow that names the erroneous row and leaves it in place.
// Row order carries no meaning. JSONL is interim storage — these row
// semantics, not the format, are the contract a future store must preserve.
//
// Files under history/:
//   runs.jsonl     — RunRow | CompletionRow | EvidenceRow | CorrectionRow
//   results.jsonl  — ResultRow (one per observed (case, engine) per run)
//   continuity.jsonl — ContinuityRow (corpus shape changes; validated by
//                      scripts/validate-identity.mjs)

import type { Platform } from "../format/values.js";

/** durable run id: UTC start instant + random suffix — branch-merge safe */
export type RunId = `${string}Z.${string}`;

// v1: rows written before the schema field existed (absence = schema 1)
export interface EngineRunInfoV1 {
  /** driver identity: package version + git sha of the built tree */
  driver: string;
  /** null when the engine exposes no version string (gsheets) */
  engine_version: string | null;
  /** content-addressed snapshot under history/capabilities/<sha>.json */
  capabilities: `sha256:${string}`;
  /** the closed D-row set (decision point 5): locale + calc settings */
  conditions: {
    locale: string;
    calc: { epoch: string; iterative: boolean; precision: string };
  };
  /** capacity is a monitored signal, never a constant: events at the seam */
  capacity_events: Array<{ at: string; event: string }>;
}

// v2: capabilities may disappear with the source capability directory;
// limits_model names the execution-limit regime once packet C lands
export interface EngineRunInfoV2 {
  /** driver identity: package version + git sha of the built tree */
  driver: string;
  /** null when the engine exposes no version string (gsheets) */
  engine_version: string | null;
  /** content-addressed snapshot under history/capabilities/<sha>.json */
  capabilities?: `sha256:${string}`;
  /** execution-limit regime; absent until per-task driver events land */
  limits_model?: { kind: "per-task-driver-events"; version: number };
  /** the closed D-row set (decision point 5): locale + calc settings */
  conditions: {
    locale: string;
    calc: { epoch: string; iterative: boolean; precision: string };
  };
  /** capacity is a monitored signal, never a constant: events at the seam */
  capacity_events: Array<{ at: string; event: string }>;
}

export type EngineRunInfo = EngineRunInfoV2;

export interface RunRowV1 {
  row: "run";
  run_id: RunId;
  /** human-facing sequence label; no row references it, renumberable */
  seq: number;
  trigger: "manual" | "ci";
  /** intent; a subset run's realized selection lands on the completion row
   * (it is discovered during the sweep, and rows are immutable) */
  scope: { kind: "full" } | { kind: "subset" };
  /** git sha of the corpus as run — recording requires a clean tree */
  corpus_commit: string;
  engines: Partial<Record<Platform, EngineRunInfoV1>>;
  note?: string;
}

export interface RunRowV2 {
  row: "run";
  schema: 2;
  run_id: RunId;
  /** human-facing sequence label; no row references it, renumberable */
  seq: number;
  trigger: "manual" | "ci";
  /** intent; a subset run's realized selection lands on the completion row
   * (it is discovered during the sweep, and rows are immutable) */
  scope: { kind: "full" } | { kind: "subset" };
  /** git sha of the corpus as run — recording requires a clean tree */
  corpus_commit: string;
  engines: Partial<Record<Platform, EngineRunInfoV2>>;
  note?: string;
}

export type RunRow = RunRowV1 | RunRowV2;

export interface ResultRow {
  row: "result";
  row_id: string;
  run_id: RunId;
  /** declared case id */
  case: string;
  /** stimulus hash at observation time (assay-stimulus-v1) */
  stimulus: `sha256:${string}`;
  engine: Platform;
  /** observation instant — brackets an engine change to a moment */
  at: string;
  /** outcome class; the full grid lives in the fixture snapshot */
  outcome: string;
  fingerprint: `sha256:${string}`;
  /** fingerprint schema version — a projection revision is an epoch event */
  fpv: number;
}

/** closes a run; a run without one is visibly incomplete. The run row is
 * appended BEFORE the sweep (so a crash leaves an incomplete run, never
 * fixture entries referencing an unknown run); the observation windows,
 * unknowable at open, land here. Per-result instants live on result rows. */
export interface CompletionRow {
  row: "complete";
  run_id: RunId;
  at: string;
  observed: Partial<Record<Platform, { from: string; to: string }>>;
  /** subset runs: the case ids that were selected (union across engines) */
  selection?: string[];
  counts: Partial<
    Record<
      Platform,
      { selected: number; attempted: number; recorded: number; outcomes: Record<string, number> }
    >
  >;
}

/** appended after the run's fixture writes are committed: the record→grid link */
export interface EvidenceRow {
  row: "evidence";
  run_id: RunId;
  commit: string;
  /** repo-relative fixture paths written by the run → content sha256 */
  files: Record<string, `sha256:${string}`>;
}

export interface CorrectionRow {
  row: "correction";
  row_id: string;
  /** row_id (results) or run_id (run rows) of the erroneous row */
  corrects: string;
  at: string;
  /** bounded: a decision-record or work-item reference, never free prose */
  per: string;
  /** replacement facts, field-by-field; the original row stays */
  replaces: Record<string, unknown>;
}

export type RunsFileRow = RunRow | CompletionRow | EvidenceRow | CorrectionRow;

export type ContinuityRow =
  | { kind: "renamed"; from: string; to: string; date: string }
  | { kind: "revised"; case: string; from_stimulus: string; to_stimulus: string; date: string }
  | { kind: "moved"; case: string; from_suite: string; to_suite: string; date: string }
  | { kind: "retired"; case: string; per: string; date: string };
