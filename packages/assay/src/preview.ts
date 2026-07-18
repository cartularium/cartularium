import { createHash } from "node:crypto";
import { getAccessToken } from "./auth.js";
import type { Driver } from "@cartularium/drivers";
import { ExcelDriver } from "@cartularium/drivers";
import { GSheetsDriver } from "@cartularium/drivers";
import { HyperFormulaDriver } from "@cartularium/drivers";
import { ALL_PLATFORMS, isPlatform, projectScalarGrid, type CellValue, type Platform } from "./format/values.js";
import { isCategory, type TestCase, type TestSuite } from "./format/catalogue.js";
import {
  BLOCKED_FORMULA_RE,
  DEFAULT_PLATFORM_TIMEOUT_MS,
  IMPLEMENTED_PREVIEW_PLATFORMS,
  MAX_FORMULA_COUNT,
  MAX_FORMULA_LENGTH,
  MAX_GRID_CELLS,
  PREVIEW_ASSAY_SCHEMA_VERSION,
  PREVIEW_INPUT_CONTRACT_VERSION,
  PREVIEW_RESULT_CONTRACT_VERSION,
  type AssayPreviewDiagnostic,
  type AssayPreviewInput,
  type AssayPreviewOptions,
  type AssayPreviewResult,
} from "./preview/types.js";
import { runSuite } from "./runner.js";

export {
  PREVIEW_INPUT_CONTRACT_VERSION,
  PREVIEW_RESULT_CONTRACT_VERSION,
  IMPLEMENTED_PREVIEW_PLATFORMS,
  type AssayPreviewDiagnostic,
  type AssayPreviewInput,
  type AssayPreviewOptions,
  type AssayPreviewResult,
} from "./preview/types.js";

export function computeCandidateHash(input: Pick<AssayPreviewInput, "candidate" | "requestedPlatforms">): string {
  const requestedPlatforms = Array.isArray(input.requestedPlatforms) ? input.requestedPlatforms : [];
  const payload = {
    contractVersion: PREVIEW_INPUT_CONTRACT_VERSION,
    assaySchemaVersion: PREVIEW_ASSAY_SCHEMA_VERSION,
    candidate: normalizeCandidateForHash(input.candidate),
    requestedPlatforms: [...requestedPlatforms].sort(),
  };
  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}

export async function runAssayPreview(
  input: AssayPreviewInput,
  options: AssayPreviewOptions = {},
): Promise<AssayPreviewResult> {
  const startedAt = new Date().toISOString();
  const runnerId = options.runnerId ?? "local-preview";
  const platformTimeoutMs = options.platformTimeoutMs ?? DEFAULT_PLATFORM_TIMEOUT_MS;
  const diagnostics: AssayPreviewResult["diagnostics"] = [];
  const platforms: AssayPreviewResult["platforms"] = {};

  diagnostics.push(...validatePreviewShape(input));
  if (hasErrorDiagnostic(diagnostics)) {
    return finish(input, runnerId, startedAt, platforms, diagnostics);
  }

  const expectedHash = computeCandidateHash(input);
  if (input.candidateHash !== expectedHash) {
    diagnostics.push(error("candidateHash", `candidate hash mismatch: expected ${expectedHash}`));
    return finish(input, runnerId, startedAt, platforms, diagnostics);
  }

  diagnostics.push(...validatePreviewInput(input, options.supportedPlatforms).diagnostics);
  if (hasErrorDiagnostic(diagnostics)) {
    return finish(input, runnerId, startedAt, platforms, diagnostics);
  }

  const suite = buildSuite(input);
  const entries = await createDrivers(input.requestedPlatforms);

  try {
    for (const entry of entries) {
      const platform = entry.platform;
      if (entry.setupError) {
        platforms[platform] = {
          state: "failed",
          result: [[null]],
          error: entry.setupError,
          passed: false,
          durationMs: 0,
        };
        diagnostics.push(error(`platforms.${platform}`, entry.setupError));
        continue;
      }
      const driver = entry.driver!;
      const platformStartedAt = Date.now();
      try {
        const run = await withTimeout(
          runSuite(suite, [driver]),
          platformTimeoutMs,
          `${platform} preview timed out after ${platformTimeoutMs}ms.`,
        );
        const durationMs = Date.now() - platformStartedAt;
        const result = run.results.find((r) => r.platform === platform && r.test.id === input.candidate.id);
        if (!result) {
          platforms[platform] = { state: "skipped", error: "No formula was available for this platform.", durationMs };
          continue;
        }
        platforms[platform] = {
          state: result.error ? "failed" : "succeeded",
          // Preview wire-format result is scalar (AssayPreviewPlatformPayload);
          // project rich runner output to scalar. Task 9 lifts the wire format
          // to rich; for now keep the preview contract stable.
          result: projectScalarGrid(result.actual),
          passed: result.error ? false : result.passed,
          expected: result.expected,
          error: result.error,
          durationMs,
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        platforms[platform] = {
          state: "failed",
          result: [[null]],
          error: message,
          passed: false,
          durationMs: Date.now() - platformStartedAt,
        };
        diagnostics.push(error(`platforms.${platform}`, message));
      }
    }
  } finally {
    await destroyDrivers(entries.flatMap((entry) => (entry.driver ? [entry.driver] : [])));
  }

  return finish(input, runnerId, startedAt, platforms, diagnostics);
}

function buildSuite(input: AssayPreviewInput): TestSuite {
  const test: TestCase = {
    id: input.candidate.id,
    subject: input.candidate.subject,
    category: input.candidate.category as TestCase["category"],
    formula: input.candidate.formula,
    expect: input.candidate.expect,
    grid: input.candidate.grid,
    features: input.candidate.features,
    tags: input.candidate.tags,
  };
  return {
    schemaVersion: PREVIEW_ASSAY_SCHEMA_VERSION,
    name: `preview ${input.jobId}`,
    tests: [test],
  };
}

function validatePreviewInput(
  input: AssayPreviewInput,
  supportedPlatforms: Platform[] | undefined,
): Pick<AssayPreviewResult, "diagnostics"> {
  const diagnostics: AssayPreviewResult["diagnostics"] = [];
  if (!input.jobId.trim()) diagnostics.push(error("jobId", "jobId is required."));
  if (!input.draftId.trim()) diagnostics.push(error("draftId", "draftId is required."));
  if (!input.ownerId.trim()) diagnostics.push(error("ownerId", "ownerId is required."));
  if (!input.candidate.id.trim()) diagnostics.push(error("candidate.id", "candidate id is required."));
  if (!input.candidate.subject.trim()) diagnostics.push(error("candidate.subject", "candidate subject is required."));
  if (!isCategory(input.candidate.category)) diagnostics.push(error("candidate.category", `${input.candidate.category} is not a valid assay category.`));

  const supported = new Set(supportedPlatforms ?? [...IMPLEMENTED_PREVIEW_PLATFORMS]);
  for (const platform of input.requestedPlatforms) {
    if (!isPlatform(platform)) {
      diagnostics.push(error("requestedPlatforms", `${platform} is not a known assay platform.`));
      continue;
    }
    if (!IMPLEMENTED_PREVIEW_PLATFORMS.has(platform)) {
      diagnostics.push(error("requestedPlatforms", `${platform} is not implemented for preview jobs.`));
      continue;
    }
    if (!supported.has(platform)) {
      diagnostics.push(error("requestedPlatforms", `${platform} is not enabled for preview jobs.`));
    }
  }

  const formulas = formulaValues(input.candidate.formula);
  if (formulas.length === 0) diagnostics.push(error("candidate.formula", "At least one formula is required."));
  if (formulas.length > MAX_FORMULA_COUNT) {
    diagnostics.push(error("candidate.formula", `Too many platform formulas; maximum is ${MAX_FORMULA_COUNT}.`));
  }

  for (const formula of formulas) {
    if (!formula.startsWith("=")) {
      diagnostics.push(error("candidate.formula", "Formula must start with '='."));
    }
    if (formula.length > MAX_FORMULA_LENGTH) {
      diagnostics.push(error("candidate.formula", `Formula exceeds ${MAX_FORMULA_LENGTH} characters.`));
    }
    if (BLOCKED_FORMULA_RE.test(formula)) {
      diagnostics.push(error("candidate.formula", "Formula uses external or network-capable functions and cannot be previewed by default."));
    }
  }

  const gridSize = countGridCells(input.candidate.grid);
  if (gridSize > MAX_GRID_CELLS) {
    diagnostics.push(error("candidate.grid", `Grid has ${gridSize} cells; maximum is ${MAX_GRID_CELLS}.`));
  }

  return { diagnostics };
}

function validatePreviewShape(input: AssayPreviewInput): AssayPreviewResult["diagnostics"] {
  const diagnostics: AssayPreviewResult["diagnostics"] = [];
  if (!isRecord(input)) {
    return [error("input", "Preview input must be a JSON object.")];
  }
  for (const field of ["jobId", "draftId", "ownerId", "candidateHash", "createdAt"] as const) {
    if (typeof input[field] !== "string") diagnostics.push(error(field, `${field} must be a string.`));
  }
  if (input.contractVersion !== PREVIEW_INPUT_CONTRACT_VERSION) {
    diagnostics.push(error("contractVersion", `contractVersion must be ${PREVIEW_INPUT_CONTRACT_VERSION}.`));
  }
  if (!Array.isArray(input.requestedPlatforms)) {
    diagnostics.push(error("requestedPlatforms", "requestedPlatforms must be an array."));
  } else if (input.requestedPlatforms.length === 0) {
    diagnostics.push(error("requestedPlatforms", "At least one preview platform is required."));
  } else if (!input.requestedPlatforms.every((p) => typeof p === "string")) {
    diagnostics.push(error("requestedPlatforms", "requestedPlatforms must contain only strings."));
  }

  if (!isRecord(input.candidate)) {
    diagnostics.push(error("candidate", "candidate must be an object."));
    return diagnostics;
  }

  for (const field of ["id", "subject", "category"] as const) {
    if (typeof input.candidate[field] !== "string") diagnostics.push(error(`candidate.${field}`, `candidate.${field} must be a string.`));
  }
  if (!isFormulaShape(input.candidate.formula)) {
    diagnostics.push(error("candidate.formula", "candidate.formula must be a string or platform-to-formula object."));
  }
  if (input.candidate.features !== undefined && !isStringArray(input.candidate.features)) {
    diagnostics.push(error("candidate.features", "candidate.features must be an array of strings."));
  }
  if (input.candidate.tags !== undefined && !isStringArray(input.candidate.tags)) {
    diagnostics.push(error("candidate.tags", "candidate.tags must be an array of strings."));
  }
  if (input.candidate.grid !== undefined && !isRecord(input.candidate.grid)) {
    diagnostics.push(error("candidate.grid", "candidate.grid must be an object keyed by cell reference."));
  }
  return diagnostics;
}

function formulaValues(formula: string | Record<string, string>): string[] {
  return typeof formula === "string" ? [formula] : Object.values(formula);
}

function normalizeCandidateForHash(candidate: AssayPreviewInput["candidate"]): AssayPreviewInput["candidate"] {
  return {
    ...candidate,
    features: candidate.features ? [...candidate.features].sort() : undefined,
    tags: candidate.tags ? [...candidate.tags].sort() : undefined,
  };
}

function isFormulaShape(formula: unknown): formula is string | Record<string, string> {
  if (typeof formula === "string") return true;
  if (!isRecord(formula)) return false;
  return Object.entries(formula).every(([platform, value]) => ALL_PLATFORMS.includes(platform as Platform) && typeof value === "string");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countGridCells(grid: Record<string, CellValue> | undefined): number {
  return grid ? Object.keys(grid).length : 0;
}

function error(field: string, message: string): AssayPreviewDiagnostic {
  return { severity: "error", field, message };
}

function hasErrorDiagnostic(diagnostics: AssayPreviewDiagnostic[]): boolean {
  return diagnostics.some((d) => d.severity === "error");
}

interface DriverEntry {
  platform: Platform;
  driver?: Driver;
  setupError?: string;
}

async function createDrivers(platforms: Platform[]): Promise<DriverEntry[]> {
  const entries: DriverEntry[] = [];
  for (const platform of platforms) {
    try {
      entries.push({ platform, driver: await constructDriver(platform) });
    } catch (e) {
      entries.push({ platform, setupError: e instanceof Error ? e.message : String(e) });
    }
  }
  for (const entry of entries) {
    if (!entry.driver) continue;
    try {
      await entry.driver.init();
    } catch (e) {
      const driver = entry.driver;
      entry.driver = undefined;
      entry.setupError = e instanceof Error ? e.message : String(e);
      try {
        await driver.destroy();
      } catch {
        // best-effort: a driver that failed to init may not destroy cleanly
      }
    }
  }
  return entries;
}

async function constructDriver(platform: Platform): Promise<Driver> {
  switch (platform) {
    case "gsheets": {
      const token = await getAccessToken();
      if (!token) throw new Error("Google Sheets is not authenticated. Run: assay login");
      const spreadsheetId = process.env.ASSAY_SPREADSHEET_ID ?? "1QCumjdFqQO8SYnXhKwI2AJevhnb_JsXqjMTLCoPnOmo";
      return new GSheetsDriver({ spreadsheetId, accessToken: token });
    }
    case "hyperformula":
      return new HyperFormulaDriver();
    case "excel":
      return new ExcelDriver(process.env.ASSAY_VERBOSE === "1", null);
    default:
      throw new Error(`${platform} is not enabled for preview jobs.`);
  }
}

async function destroyDrivers(drivers: Driver[]): Promise<void> {
  await Promise.allSettled(drivers.map((driver) => driver.destroy()));
}

// Polite watchdog only: this cannot interrupt synchronous engine work or cancel
// the underlying operation. The Mac runner still needs process-level timeouts.
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timer = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timer]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

function finish(
  input: AssayPreviewInput,
  runnerId: string,
  startedAt: string,
  platforms: AssayPreviewResult["platforms"],
  diagnostics: AssayPreviewResult["diagnostics"],
): AssayPreviewResult {
  return {
    contractVersion: PREVIEW_RESULT_CONTRACT_VERSION,
    jobId: stringField(input, "jobId"),
    draftId: stringField(input, "draftId"),
    candidateHash: stringField(input, "candidateHash"),
    runnerId,
    startedAt,
    completedAt: new Date().toISOString(),
    platforms,
    diagnostics,
  };
}

export function stringField(value: unknown, field: string): string {
  if (!isRecord(value)) return "";
  const entry = value[field];
  return typeof entry === "string" ? entry : "";
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForJson(value));
}

// Any behavior change here changes persisted candidate hashes. Bump
// PREVIEW_INPUT_CONTRACT_VERSION when this contract changes intentionally.
function sortForJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForJson);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const v = (value as Record<string, unknown>)[key];
    if (v !== undefined) out[key] = sortForJson(v);
  }
  return out;
}
