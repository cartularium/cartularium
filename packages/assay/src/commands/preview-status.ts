import { values } from "./shared.js";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface RunnerStatusPayload {
  status: "ok" | "degraded";
  generatedAt: string;
  claimTimeoutMs: number;
  jobs: {
    queued: number;
    claimed: number;
    running: number;
    stale: number;
    completedRecent: number;
    failedRecent: number;
  };
  platformSets: Array<{
    platforms: string[];
    queued: number;
    claimed: number;
    running: number;
  }>;
  runners: Array<{
    runnerId: string;
    activeJobCount: number;
    staleJobCount: number;
    states: {
      claimed: number;
      running: number;
    };
    lastHeartbeatAt: string | null;
    lastCompletedAt: string | null;
    lastResultState: string | null;
    lastErrorCode: string | null;
    lastErrorMessage: string | null;
  }>;
  staleJobs: Array<{
    id: string;
    submittedCaseId: string | null;
    draftId: string;
    caseId: string;
    ownerId: string;
    state: "claimed" | "running";
    requestedPlatforms: string[];
    claimedBy: string | null;
    heartbeatAt: string | null;
    createdAt: string;
    updatedAt: string;
    errorCode: string | null;
    errorMessage: string | null;
  }>;
}

export interface RunPreviewStatusOptions {
  baseUrl: string;
  token: string;
  json: boolean;
  fetch: FetchLike;
  log: (line: string) => void;
}

export async function previewStatus(): Promise<void> {
  const token = stringOption("token") ?? process.env.ASSAY_RUNNER_TOKEN;
  if (!token) throw new Error("ASSAY_RUNNER_TOKEN is required, or pass --token");

  const exitCode = await runPreviewStatus({
    baseUrl: stringOption("base-url") ?? process.env.ASSAY_RUNNER_BASE_URL ?? "https://sheets.wiki/api/edit",
    token,
    json: Boolean(values.json),
    fetch,
    log: console.log,
  });

  if (exitCode !== 0) process.exitCode = exitCode;
}

export async function runPreviewStatus(options: RunPreviewStatusOptions): Promise<number> {
  const res = await options.fetch(`${trimTrailingSlash(options.baseUrl)}/assay-runner/status`, {
    headers: {
      Authorization: `Bearer ${options.token}`,
    },
  });
  if (!res.ok) throw new Error(`runner status failed: ${res.status} ${await res.text()}`);

  const status = await res.json() as RunnerStatusPayload;
  options.log(options.json ? JSON.stringify(status, null, 2) : formatRunnerStatus(status));
  return runnerStatusExitCode(status);
}

export function runnerStatusExitCode(status: RunnerStatusPayload): number {
  return status.status === "ok" ? 0 : 2;
}

export function formatRunnerStatus(status: RunnerStatusPayload): string {
  const lines = [
    `assay runner status: ${status.status}`,
    `generated: ${status.generatedAt}  claim_timeout_ms=${status.claimTimeoutMs}`,
    `jobs: queued=${status.jobs.queued} claimed=${status.jobs.claimed} running=${status.jobs.running} stale=${status.jobs.stale} recent_completed=${status.jobs.completedRecent} recent_failed=${status.jobs.failedRecent}`,
  ];

  if (status.platformSets.length > 0) {
    lines.push("platform sets:");
    for (const set of status.platformSets) {
      lines.push(`  ${set.platforms.join(",")} queued=${set.queued} claimed=${set.claimed} running=${set.running}`);
    }
  }

  if (status.runners.length > 0) {
    lines.push("runners:");
    for (const runner of status.runners) {
      const result = runner.lastResultState
        ? ` last_result=${runner.lastResultState}`
        : "";
      const error = runner.lastErrorCode
        ? ` error=${runner.lastErrorCode}`
        : "";
      lines.push(
        `  ${runner.runnerId} active=${runner.activeJobCount} stale=${runner.staleJobCount} claimed=${runner.states.claimed} running=${runner.states.running}${result}${error}`,
      );
    }
  }

  if (status.staleJobs.length > 0) {
    lines.push("stale jobs:");
    for (const job of status.staleJobs) {
      const runner = job.claimedBy ? ` runner=${job.claimedBy}` : "";
      const heartbeat = job.heartbeatAt ? ` heartbeat=${job.heartbeatAt}` : "";
      lines.push(`  ${job.id} ${job.state} ${job.requestedPlatforms.join(",")}${runner}${heartbeat}`);
    }
  }

  return lines.join("\n");
}

function stringOption(name: string): string | undefined {
  const value = values[name as keyof typeof values];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
