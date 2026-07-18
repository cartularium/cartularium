import type { CellValue, DriverTask, DriverTaskResult, Platform, RichGridValue } from "../format/values.js";

// driver contract: evaluate a formula at the target cell, optionally with grid
// values around it, return the result grid. drivers with amortised setup
// (workbook open, subprocess, network) implement evaluateBatch — preferred by the runner.
//
// Post-coalescing (2026-05-23): evaluate returns RichGridValue (rich per-cell
// shape with engine extras). Input grid stays as scalar CellValue
// (test-authoring ergonomics). Drivers project their internal rich
// representation directly; minimal stubs use lift.ts helpers during the
// per-driver migration.

// Capability contract (ratified driver contract §3.3) — report-only: *what's
// possible* on this engine, descriptive only. `native` runs as-is; `partial` is
// achievable but not natively (assay's generation layer rewrites it via an adapter —
// the adapter HOW is a generation-layer fact, NOT a capability value); `absent` can't.
// (Supersedes the file-level "wrapped": that's the generation rewrite, mapped to
// `partial` here.) Lives with the Driver — extracts to `@cartularium/drivers`.
export type FeatureFidelity = "native" | "partial" | "absent";

export interface CapabilityDescriptor {
  features: Record<string, FeatureFidelity>;
}

export interface Driver {
  readonly platform: Platform;

  init(): Promise<void>;

  evaluate(
    formula: string,
    grid?: Record<string, CellValue>,
  ): Promise<RichGridValue>;

  evaluateBatch?(tasks: DriverTask[]): Promise<DriverTaskResult[]>;

  // Report-only capability descriptor — the probe asks "can this engine do
  // feature:X?" without running; generation gates on it; M3 Coverage is derivable.
  capabilities(): CapabilityDescriptor;

  // null when unprobeable (e.g. gsheets — uses sentinel fingerprint instead)
  versionString(): Promise<string | null>;

  destroy(): Promise<void>;
}
