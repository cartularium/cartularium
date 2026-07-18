// Value vocabulary — the cell / grid / driver-I/O types a *driver* speaks:
// everything a driver consumes (input grids) or produces (rich results), plus
// the scalar projection that serves as the tested spine. Depends only on
// `@cartularium/contracts`.
//
// Layering rule: the catalogue vocabulary (TestCase / Matcher / Override / …)
// lives in `./catalogue.ts` and depends on THIS file, never the reverse.
// Keeping that dependency one-way is what lets the driver surface extract to
// its own package later — see docs/driver-contract-design-*.md.

import type { CellValue, RichGridValue } from "@cartularium/contracts";

// platform enum (canonical manifest surface) — the engines a driver can target
export type { Platform } from "@cartularium/contracts";
export { ALL_PLATFORMS, isPlatform } from "@cartularium/contracts";

// The shared VALUE SPINE all lives in @cartularium/contracts (the conservative spine):
// the rich cell-value contract + the legacy scalar grid + the rich/scalar
// discriminators. assay re-exports them for ergonomics. Only the DRIVER-I/O vocab
// below (DriverTask / DriverTaskResult / the §6.6 Outcome) is assay-owned here, and
// moves to @cartularium/drivers at extraction.
export {
  projectPrimitive,
  projectScalarGrid,
  isCellError,
  isRichGrid,
  toScalarGrid,
} from "@cartularium/contracts";
export type {
  CellError,
  CellValue,
  GridValue,
  EngineExtras,
  ExcelExtras,
  FormulasExtras,
  GSheetsExtras,
  HyperformulaExtras,
  IroncalcExtras,
  LatticeExtras,
  LibreofficeExtras,
  PrimitiveValue,
  PycelExtras,
  RichCellValue,
  RichGridValue,
} from "@cartularium/contracts";

// Input grid stays scalar — test authoring (grid:) is scalar-ergonomic per D1.
// Driver results are rich. When `skip` is set, drivers should return a skipped
// DriverTaskResult with a rich placeholder result when they can provide one.
export interface DriverTask {
  formula: string;
  grid?: Record<string, CellValue>;
  skip?: string;
}

export interface DriverTaskResult {
  outcome: Outcome;
  observed?: Observed;
}

// === §6.6 outcome union — FINALIZED 2026-06-15 (seeding-isolation §6.6) ===
// One task's outcome, partitioned by ATTRIBUTION: engine-attributable
// (value/rejected/crashed/pending — catalogue-worthy) vs not (skipped/
// driver-error/infra — excluded from divergence), with `unclassified` as the
// openness floor (capability-never-divergence: observed-but-unattributable =>
// honest no-data, never force-fit). Replaces the conflating `error: string` +
// `driverIssue` boolean (and the benchmark regex that disambiguated them).
// Sub-tags (CrashChannel/SkipCause) are OPEN — novelty enters as data, not a
// union edit; the only closed set is the top-level `kind` (overflow = unclassified).

export interface Extent {
  rows: number;
  cols: number;
}

export type CrashChannel = "process-death" | "host-wedge" | "timeout" | "capacity" | (string & {});

export type SkipCause =
  | "capability"
  | "seed-infidelity"
  | "policy"
  | "environment-incompatible"
  | (string & {});

/** Extensible monitored-signal record; host-effect signals accrete here (§6.4). */
export interface Observed {
  asOf?: string;
  engineVersion?: string;
  durationMs?: number;
  [signal: string]: unknown;
}

export type Outcome =
  // engine-attributable (catalogue-worthy)
  | { kind: "value"; grid: RichGridValue; extent: Extent; digest?: string }
  | { kind: "rejected"; reason: string; code?: string }
  | { kind: "crashed"; channel: CrashChannel; detail?: string }
  | { kind: "pending"; source?: string }
  // NOT engine-attributable (excluded from divergence)
  | { kind: "skipped"; cause: SkipCause; reason?: string }
  | { kind: "driver-error"; detail: string }
  | { kind: "infra"; detail: string; retryable?: boolean }
  // openness floor — observed but unattributable => honest no-data
  | { kind: "unclassified"; raw: unknown; note?: string };

/** The §6.6 load-bearing line: engine-attributable outcomes are catalogue-worthy;
 * the rest are excluded from divergence. */
export function isEngineAttributable(o: Outcome): boolean {
  return (
    o.kind === "value" || o.kind === "rejected" || o.kind === "crashed" || o.kind === "pending"
  );
}

/** Grid of a `value` outcome; undefined otherwise. */
export function outcomeGrid(o: Outcome): RichGridValue | undefined {
  return o.kind === "value" ? o.grid : undefined;
}

/** Human-readable message for non-value error-ish outcomes; undefined for
 * value/skipped/pending. Migration aid for the legacy `entry.error` string. */
export function outcomeErrorText(o: Outcome): string | undefined {
  switch (o.kind) {
    case "rejected":
      return o.reason;
    case "crashed":
      return o.detail ? `crashed[${o.channel}]: ${o.detail}` : `crashed[${o.channel}]`;
    case "infra":
      return o.detail;
    case "driver-error":
      return o.detail;
    case "unclassified":
      return o.note ?? "unclassified";
    default:
      return undefined;
  }
}

export function extentOf(grid: RichGridValue): Extent {
  return { rows: grid.length, cols: grid[0]?.length ?? 0 };
}

/** Construct a `value` outcome from a result grid (extent derived). */
export function valueOutcome(grid: RichGridValue): Outcome {
  return { kind: "value", grid, extent: extentOf(grid) };
}

/** Best-effort lift of a legacy persisted entry to an Outcome — for loadFixture
 * back-compat (full corpus regen deferred, §6.6). */
export function legacyToOutcome(legacy: {
  result?: RichGridValue;
  error?: string;
  driverIssue?: boolean;
  skipped?: string;
}): Outcome {
  if (legacy.skipped !== undefined) {
    return { kind: "skipped", cause: "policy", reason: legacy.skipped };
  }
  if (legacy.error) {
    if (legacy.driverIssue) return { kind: "driver-error", detail: legacy.error };
    if (/^(aborted|auth error|quota)/i.test(legacy.error))
      return { kind: "infra", detail: legacy.error, retryable: true };
    return { kind: "rejected", reason: legacy.error };
  }
  if (legacy.result) return valueOutcome(legacy.result);
  return { kind: "unclassified", raw: legacy, note: "empty legacy entry" };
}
