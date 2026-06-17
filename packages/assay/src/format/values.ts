// Re-export hub (post @cartularium/drivers extraction). The shared VALUE SPINE comes
// from @cartularium/contracts (the conservative spine — so the catalogue/matcher depend
// on contracts, not drivers); the DRIVER-I/O vocab (DriverTask / DriverTaskResult / the
// §6.6 Outcome + accessors) comes from @cartularium/drivers. assay consumers keep
// importing value types from `format/values.js` unchanged — this file just routes each
// symbol to its post-extraction home.

// platform enum (canonical manifest surface)
export type { Platform } from "@cartularium/contracts";
export { ALL_PLATFORMS, isPlatform } from "@cartularium/contracts";

// value spine — rich cell-value contract + legacy scalar grid + rich/scalar discriminators
export {
  projectPrimitive,
  projectScalarGrid,
  isCellError,
  isRichGrid,
  toScalarGrid,
  canonicalizePrimitive,
  canonicalizeCell,
  circulatingKey,
} from "@cartularium/contracts";
export type {
  CellError,
  CellValue,
  CirculatingCell,
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

// driver-I/O vocab — owned by @cartularium/drivers
export {
  isEngineAttributable,
  outcomeGrid,
  outcomeErrorText,
  extentOf,
  valueOutcome,
  legacyToOutcome,
} from "@cartularium/drivers";
export type {
  DriverTask,
  DriverTaskResult,
  Outcome,
  Extent,
  CrashChannel,
  SkipCause,
  Observed,
} from "@cartularium/drivers";
