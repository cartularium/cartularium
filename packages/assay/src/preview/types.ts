import type { CellValue, GridValue, Platform } from "../format/values.js";
import type { Matcher } from "../format/catalogue.js";

export const PREVIEW_INPUT_CONTRACT_VERSION = 1;
export const PREVIEW_RESULT_CONTRACT_VERSION = 1;
export const PREVIEW_ASSAY_SCHEMA_VERSION = 2;

export const IMPLEMENTED_PREVIEW_PLATFORMS = new Set<Platform>(["gsheets", "excel", "hyperformula"]);
export const MAX_GRID_CELLS = 400;
export const MAX_FORMULA_LENGTH = 8_000;
export const MAX_FORMULA_COUNT = 8;
export const DEFAULT_PLATFORM_TIMEOUT_MS = 30_000;

export const BLOCKED_FORMULA_RE =
  /\b(?:IMPORT(?:DATA|FEED|HTML|XML|RANGE)|WEBSERVICE|HYPERLINK|RTD|FILTERXML)\b/i;

export interface AssayPreviewInput {
  contractVersion: number;
  jobId: string;
  draftId: string;
  ownerId: string;
  candidateHash: string;
  requestedPlatforms: Platform[];
  candidate: {
    id: string;
    subject: string;
    formula: string | Record<string, string>;
    category: string;
    expect?: Matcher;
    grid?: Record<string, CellValue>;
    features?: string[];
    tags?: string[];
    note?: string;
  };
  createdAt: string;
}

export type AssayPreviewDiagnostic = {
  severity: "error" | "warning" | "info";
  message: string;
  field?: string;
};

export interface AssayPreviewResult {
  contractVersion: number;
  jobId: string;
  draftId: string;
  candidateHash: string;
  runnerId: string;
  startedAt: string;
  completedAt: string;
  platforms: Record<string, {
    state: "succeeded" | "failed" | "skipped";
    result?: GridValue;
    error?: string;
    passed?: boolean | null;
    expected?: GridValue;
    // TODO: populate once runner.ts exposes FixtureEntry["formula-as-evaluated"].
    formulaAsEvaluated?: string;
    durationMs?: number;
  }>;
  diagnostics: AssayPreviewDiagnostic[];
}

export interface AssayPreviewOptions {
  runnerId?: string;
  supportedPlatforms?: Platform[];
  platformTimeoutMs?: number;
}
