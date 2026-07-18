// public library API
// lets other tools (e.g. formulary) run assay suites without shelling out
// the CLI in src/cli.ts is a thin wrapper over the same exports

export {
  loadTestSuite,
  getFormulaForPlatform,
  resolveFormulaForPlatform,
  effectiveExpect,
  normalizeToGrid,
  evaluateMatcher,
  isMatcherObject,
  loadCapability,
  reconcileFeatures,
  applyAdapter,
} from "./format/index.js";

export {
  evaluateSuite,
  runSuite,
  runFromFixtures,
  type RunOptions,
  type RunResult,
  type EvalCallbacks,
} from "./runner.js";

export { printReport, jsonReport } from "./report.js";

export {
  loadFunctionUniverse,
  scaffoldFunction,
  scaffoldMany,
  classifySignature,
  extractArgs,
  parseTsv,
  type FunctionSpec,
  type Pattern,
  type ScaffoldResult,
} from "./scaffold.js";

export {
  computeCoverage,
  printCoverageReport,
  type CoverageReport,
} from "./coverage.js";

export {
  runBenchmark,
  printBenchmark,
  consensusAsFixture,
  rollupByFunction,
  printFunctionRollup,
  rollupAsCsv,
  gridsAgree,
  type FunctionRollup,
  type BenchmarkOptions,
  type BenchmarkResult,
  type BenchmarkScore,
  type BenchmarkExclusion,
} from "./benchmark.js";

export {
  loadFixture,
  saveFixture,
  fixturePath,
  type FixtureFile,
  type FixtureEntry,
} from "./fixtures.js";

export {
  createWorkbook,
  cleanupWorkbook,
  type WorkbookResult,
} from "./workbook.js";

export {
  PREVIEW_INPUT_CONTRACT_VERSION,
  PREVIEW_RESULT_CONTRACT_VERSION,
  computeCandidateHash,
  runAssayPreview,
  type AssayPreviewDiagnostic,
  type AssayPreviewInput,
  type AssayPreviewOptions,
  type AssayPreviewResult,
} from "./preview.js";

export {
  caseKey,
  canonicalJson,
  deriveCategory,
  derivePublicRef,
  deriveSubjectRef,
  parseAssayRef,
  semanticHashForCase,
  validateCaseName,
  validateSubjectRef,
} from "./identity/index.js";

export type { Driver, CapabilityDescriptor, FeatureFidelity } from "@cartularium/drivers";
export { ExcelDriver } from "@cartularium/drivers";
export { GSheetsDriver } from "@cartularium/drivers";
export { LatticeDriver } from "@cartularium/drivers";
export { IronCalcDriver } from "@cartularium/drivers";
export { HyperFormulaDriver } from "@cartularium/drivers";
export { LibreOfficeDriver } from "@cartularium/drivers";
export { FormulasDriver } from "@cartularium/drivers";
export { PycelDriver } from "@cartularium/drivers";
// construction factory (ratified §3.4) — the typed pure-vs-live asymmetry
export {
  createDriver,
  type PureEngine,
  type ExcelConfig,
  type GSheetsConfig,
} from "@cartularium/drivers";

export { getAccessToken, login } from "./auth.js";

export type {
  CellValue,
  CellError,
  EngineExtras,
  GridValue,
  PrimitiveValue,
  RichCellValue,
  RichGridValue,
  Platform,
} from "./format/values.js";

export type {
  Matcher,
  MatcherObject,
  Override,
  Status,
  Cause,
  Category,
  Links,
  PlatformFormula,
  TestCase,
  TestSuite,
  TestResult,
  Divergence,
} from "./format/catalogue.js";

export {
  isCellError,
  isRichGrid,
  projectPrimitive,
  projectScalarGrid,
  toScalarGrid,
} from "./format/values.js";
