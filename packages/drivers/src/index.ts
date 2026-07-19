// @cartularium/drivers — the engine driver layer (ratified driver contract). The
// execution + capability contracts, the 8 drivers + createDriver factory, the
// driver-I/O vocab (DriverTask / DriverTaskResult / the §6.6 Outcome) + a re-export of
// the contracts value-spine, the batch model (contract/*), and the report-only
// capability descriptor data. Depends only on @cartularium/contracts. The generation
// layer (orchestrator + proto-translation adapters), catalogue, matcher, and manifest
// stay in assay.

export type { Driver, CapabilityDescriptor, FeatureFidelity } from "./drivers/driver.js";
export {
  createDriver,
  type PureEngine,
  type ExcelConfig,
  type GSheetsConfig,
} from "./drivers/create.js";
export { ExcelDriver } from "./drivers/excel.js";
export { GSheetsDriver } from "./drivers/gsheets.js";
export { LatticeDriver } from "./drivers/lattice.js";
export { IronCalcDriver } from "./drivers/ironcalc.js";
export { HyperFormulaDriver } from "./drivers/hyperformula.js";
export { LibreOfficeDriver } from "./drivers/libreoffice.js";
export { FormulasDriver } from "./drivers/formulas.js";
export { PycelDriver } from "./drivers/pycel.js";
// driver-I/O vocab ONLY (DriverTask/DriverTaskResult/§6.6 Outcome + accessors). NOT a
// bare `export *` — format/values.ts re-exports the value spine from contracts for the
// drivers' own internal use, but the spine must NOT be reachable through this package
// (consumers get the spine from @cartularium/contracts directly, so the catalogue layer
// depends on contracts, not drivers — the extraction's load-bearing invariant).
export {
  isEngineAttributable,
  outcomeGrid,
  outcomeErrorText,
  extentOf,
  valueOutcome,
  legacyToOutcome,
} from "./format/values.js";
export type {
  DriverTask,
  DriverTaskResult,
  Outcome,
  Extent,
  CrashChannel,
  ExecutionLimit,
  LimitMechanism,
  SkipCause,
  Observed,
} from "./format/values.js";
// report-only capability descriptor data (loadCapability, capabilityDescriptorFor, …)
export * from "./format/capability-data.js";
// scalar→rich lift helpers (used by assay's fixtures/runner during the migration)
export { liftScalarToRich, liftScalarGrid, liftTaskResults } from "./drivers/lift.js";
// the batch-model surface assay/tooling reaches for (the rest of contract/* is internal)
export {
  analyzeFormula,
  coHostPlacement,
  isLumpable,
  requiresIsolation,
  type CoHostPlacement,
} from "./drivers/contract/cohost.js";
