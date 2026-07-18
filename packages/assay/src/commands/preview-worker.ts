import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { values } from "./shared.js";
import {
  IMPLEMENTED_PREVIEW_PLATFORMS,
  PREVIEW_INPUT_CONTRACT_VERSION,
  PREVIEW_RESULT_CONTRACT_VERSION,
  type AssayPreviewInput,
  type AssayPreviewResult,
} from "../preview.js";
import { isPlatform, type Platform } from "../format/values.js";

interface ClaimJob {
  id: string;
  submittedCaseId?: string | null;
  draftId: string;
  ownerId: string;
  candidateHash: string;
  resultContractVersion?: number;
  requestedPlatforms: Platform[];
  claimNonce: string;
  input: AssayPreviewInput;
}

interface ClaimResponse {
  job: ClaimJob | null;
}

interface PreviewWorkerConfig {
  baseUrl: string;
  token: string;
  runnerId: string;
  platforms: Platform[];
  inputContracts: number[];
  resultContracts: number[];
  pollMs: number;
  timeoutMs: number;
  workDir: string;
  once: boolean;
}

interface PreviewRun {
  result: AssayPreviewResult;
  state: "completed" | "failed";
}

export const DEFAULT_PREVIEW_WORKER_PLATFORMS: Platform[] = ["excel", "gsheets"];

export async function previewWorker(): Promise<void> {
  const config = readConfig();
  mkdirSync(config.workDir, { recursive: true });

  while (true) {
    const job = await claimJob(config);
    if (!job) {
      if (config.once) return;
      await sleep(config.pollMs);
      continue;
    }

    await heartbeatJob(config, job, "running");
    const run = await runPreviewJob(config, job);
    await postResult(config, job, run);
    if (config.once) return;
  }
}

function readConfig(): PreviewWorkerConfig {
  const token = stringOption("token") ?? process.env.ASSAY_RUNNER_TOKEN;
  if (!token) throw new Error("ASSAY_RUNNER_TOKEN is required, or pass --token");

  return {
    baseUrl: trimTrailingSlash(
      stringOption("base-url") ?? process.env.ASSAY_RUNNER_BASE_URL ?? "https://sheets.wiki/api/edit",
    ),
    token,
    runnerId: stringOption("runner-id") ?? process.env.ASSAY_RUNNER_ID ?? hostname(),
    platforms: parseRunnerPlatforms(),
    inputContracts: [PREVIEW_INPUT_CONTRACT_VERSION],
    resultContracts: [PREVIEW_RESULT_CONTRACT_VERSION],
    pollMs: positiveIntOption("poll-ms", 15_000),
    timeoutMs: positiveIntOption("timeout-ms", 60_000),
    workDir: resolve(stringOption("work-dir") ?? process.env.ASSAY_RUNNER_WORK_DIR ?? join(tmpdir(), "assay-runner")),
    once: Boolean(values.once),
  };
}

async function claimJob(config: PreviewWorkerConfig): Promise<ClaimJob | null> {
  const res = await fetch(`${config.baseUrl}/assay-runner/jobs/claim`, {
    method: "POST",
    headers: runnerHeaders(config),
    body: JSON.stringify({
      runnerId: config.runnerId,
      supportedPlatforms: config.platforms,
      supportedInputContracts: config.inputContracts,
      supportedResultContracts: config.resultContracts,
    }),
  });
  if (!res.ok) throw new Error(`claim failed: ${res.status} ${await res.text()}`);
  const body = await res.json() as ClaimResponse;
  return body.job;
}

async function heartbeatJob(config: PreviewWorkerConfig, job: ClaimJob, state: "claimed" | "running"): Promise<void> {
  const res = await fetch(`${config.baseUrl}/assay-runner/jobs/${encodeURIComponent(job.id)}/heartbeat`, {
    method: "POST",
    headers: runnerHeaders(config),
    body: JSON.stringify({
      runnerId: config.runnerId,
      claimNonce: job.claimNonce,
      state,
    }),
  });
  if (!res.ok) throw new Error(`heartbeat failed: ${res.status} ${await res.text()}`);
}

async function postResult(config: PreviewWorkerConfig, job: ClaimJob, run: PreviewRun): Promise<void> {
  const res = await fetch(`${config.baseUrl}/assay-runner/jobs/${encodeURIComponent(job.id)}/result`, {
    method: "POST",
    headers: runnerHeaders(config),
    body: JSON.stringify({
      runnerId: config.runnerId,
      claimNonce: job.claimNonce,
      state: run.state,
      result: run.result,
      errorCode: run.state === "failed" ? "preview_failed" : undefined,
      errorMessage: run.state === "failed" ? firstError(run.result) : undefined,
    }),
  });
  if (!res.ok) throw new Error(`result upload failed: ${res.status} ${await res.text()}`);
}

async function runPreviewJob(config: PreviewWorkerConfig, job: ClaimJob): Promise<PreviewRun> {
  const dir = join(config.workDir, job.id);
  mkdirSync(dir, { recursive: true });
  const inputPath = join(dir, "input.json");
  const resultPath = join(dir, "result.json");
  const input = normalizeInput(job, config.runnerId);
  writeFileSync(inputPath, `${JSON.stringify(input, null, 2)}\n`);

  try {
    const exitCode = await runPreviewCli(inputPath, resultPath, config.runnerId, config.timeoutMs);
    const result = JSON.parse(readFileSync(resultPath, "utf8")) as AssayPreviewResult;
    const hasError = result.diagnostics.some((diagnostic) => diagnostic.severity === "error");
    return { result, state: exitCode === 0 && !hasError ? "completed" : "failed" };
  } catch (error) {
    const now = new Date().toISOString();
    return {
      state: "failed",
      result: {
        contractVersion: PREVIEW_RESULT_CONTRACT_VERSION,
        jobId: job.id,
        draftId: job.draftId,
        candidateHash: job.candidateHash,
        runnerId: config.runnerId,
        startedAt: now,
        completedAt: now,
        platforms: {},
        diagnostics: [{
          severity: "error",
          field: "runner",
          message: error instanceof Error ? error.message : String(error),
        }],
      },
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runPreviewCli(inputPath: string, resultPath: string, runnerId: string, timeoutMs: number): Promise<number> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [process.argv[1] ?? "build/cli.js", "preview", inputPath, resultPath, "--runner-id", runnerId],
      { stdio: "inherit" },
    );
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      if (timedOut) reject(new Error(`preview timed out after ${timeoutMs}ms`));
      else if (signal) reject(new Error(`preview exited with signal ${signal}`));
      else resolvePromise(code ?? 1);
    });
  });
}

function normalizeInput(job: ClaimJob, runnerId: string): AssayPreviewInput {
  return {
    ...job.input,
    jobId: job.id,
    draftId: job.draftId,
    ownerId: job.ownerId,
    candidateHash: job.candidateHash,
    requestedPlatforms: job.requestedPlatforms,
  };
}

function runnerHeaders(config: PreviewWorkerConfig): HeadersInit {
  return {
    Authorization: `Bearer ${config.token}`,
    "Content-Type": "application/json",
  };
}

function firstError(result: AssayPreviewResult): string | undefined {
  return result.diagnostics.find((diagnostic) => diagnostic.severity === "error")?.message;
}

function positiveIntOption(name: string, fallback: number): number {
  const raw = stringOption(name);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`--${name} must be a positive integer`);
  return parsed;
}

function stringOption(name: string): string | undefined {
  const value = values[name as keyof typeof values];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function parsePreviewWorkerPlatforms(raw: string | undefined): Platform[] {
  const platforms = raw && raw.trim()
    ? raw.split(",").map((platform) => platform.trim()).filter(Boolean)
    : DEFAULT_PREVIEW_WORKER_PLATFORMS;
  if (platforms.length === 0) throw new Error("At least one preview-worker platform is required");
  return platforms.map((platform) => {
    if (!isPlatform(platform)) throw new Error(`Unknown platform: ${platform}`);
    if (!IMPLEMENTED_PREVIEW_PLATFORMS.has(platform)) {
      throw new Error(`${platform} is not enabled for preview-worker jobs`);
    }
    return platform;
  });
}

function parseRunnerPlatforms(): Platform[] {
  const raw = hasPlatformOption() ? stringOption("platform") : process.env.ASSAY_RUNNER_PLATFORMS;
  return parsePreviewWorkerPlatforms(raw);
}

function hasPlatformOption(argv: string[] = process.argv.slice(2)): boolean {
  return argv.some((arg) => arg === "--platform" || arg.startsWith("--platform=") || arg === "-p" || /^-p.+/.test(arg));
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}
