export {
  loadTestSuite,
  normalizeToGrid,
  resolveFormulaForPlatform,
  getFormulaForPlatform,
  featureSkipFor,
  effectiveExpect,
  type ResolvedFormula,
} from "./parse.js";
export {
  evaluateMatcher,
  isMatcherObject,
  cellsEqual,
  gridsEqual,
  isScalarGrid,
  unwrapScalar,
  formatCell,
  formatGrid,
  type MatchResult,
} from "./match.js";
// circulating projection — the comparison unit + published class value (contracts spine)
export {
  canonicalizePrimitive,
  canonicalizeCell,
  circulatingKey,
  type CirculatingCell,
} from "./values.js";
// rich-aware divergence equality (B1) — the fingerprint/digest ride this
export {
  canonicalEquals,
  richCellsEqual,
  richGridsEqual,
  DEFAULT_NUM_TOL,
} from "./equality.js";
// M3 relation layer — verdict-free cross-engine agreement partition
export { partitionByAgreement, isDivergent, type AgreementClass } from "./relations.js";
// capability DATA (moves to @cartularium/drivers) vs ADAPTERS (stay in assay)
export {
  loadCapability,
  capabilityDescriptorFor,
  type FeatureCapability,
  type FeatureSupport,
  type AdapterName,
  type CapabilityFile,
} from "@cartularium/drivers";
export { reconcileFeatures, applyAdapter, type Reconciled } from "./capabilities.js";
// value vocabulary a driver speaks (cells, grids, driver I/O, rich contract)
export {
  isCellError,
  isRichGrid,
  projectPrimitive,
  projectScalarGrid,
  toScalarGrid,
  ALL_PLATFORMS,
  type CellValue,
  type CellError,
  type EngineExtras,
  type PrimitiveValue,
  type RichCellValue,
  type RichGridValue,
  type GridValue,
  type DriverTask,
  type DriverTaskResult,
  type Platform,
  // §6.6 outcome union
  type Outcome,
  type Extent,
  type CrashChannel,
  type SkipCause,
  type Observed,
  isEngineAttributable,
  outcomeGrid,
  outcomeErrorText,
  extentOf,
  valueOutcome,
  legacyToOutcome,
} from "./values.js";
// catalogue vocabulary (tests, suites, matchers, overrides, results)
export {
  type Matcher,
  type MatcherObject,
  type Override,
  type Status,
  type Cause,
  type Category,
  type Links,
  type PlatformFormula,
  type TestCase,
  type TestSuite,
  type TestResult,
  type Divergence,
} from "./catalogue.js";
