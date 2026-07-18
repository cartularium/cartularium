import { describe, expect, it } from "vitest";
import {
  formatRunnerStatus,
  runnerStatusExitCode,
  runPreviewStatus,
  type RunnerStatusPayload,
} from "./preview-status.js";

const okStatus: RunnerStatusPayload = {
  status: "ok",
  generatedAt: "2026-05-11T23:11:29.785Z",
  claimTimeoutMs: 300000,
  jobs: {
    queued: 0,
    claimed: 0,
    running: 0,
    stale: 0,
    completedRecent: 2,
    failedRecent: 0,
  },
  platformSets: [],
  runners: [{
    runnerId: "mac-mini-runner-review",
    activeJobCount: 0,
    staleJobCount: 0,
    states: { claimed: 0, running: 0 },
    lastHeartbeatAt: null,
    lastCompletedAt: "2026-05-11T18:12:26.971Z",
    lastResultState: "completed",
    lastErrorCode: null,
    lastErrorMessage: null,
  }],
  staleJobs: [],
};

describe("preview-status", () => {
  it("fetches runner status with the runner bearer token", async () => {
    const calls: Array<{ url: string; headers: Headers }> = [];
    const logs: string[] = [];

    const exitCode = await runPreviewStatus({
      baseUrl: "https://sheets.wiki/api/edit/",
      token: "runner-token",
      json: false,
      fetch: async (url, init) => {
        calls.push({ url: String(url), headers: new Headers(init?.headers) });
        return new Response(JSON.stringify(okStatus), { status: 200 });
      },
      log: (line) => logs.push(line),
    });

    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://sheets.wiki/api/edit/assay-runner/status");
    expect(calls[0].headers.get("Authorization")).toBe("Bearer runner-token");
    expect(logs.join("\n")).toContain("assay runner status: ok");
  });

  it("returns a failing health exit code for degraded status", () => {
    const degraded: RunnerStatusPayload = {
      ...okStatus,
      status: "degraded",
      jobs: { ...okStatus.jobs, queued: 2, claimed: 1, stale: 1 },
      platformSets: [{
        platforms: ["excel", "gsheets"],
        queued: 2,
        claimed: 1,
        running: 0,
      }],
      staleJobs: [{
        id: "job-stale-1",
        submittedCaseId: "submitted-1",
        draftId: "draft/alice/status",
        caseId: "EXPAND/pad-value",
        ownerId: "alice",
        state: "claimed",
        requestedPlatforms: ["excel", "gsheets"],
        claimedBy: "mac-mini-runner-review",
        heartbeatAt: "2026-05-11T22:00:00.000Z",
        createdAt: "2026-05-11T21:00:00.000Z",
        updatedAt: "2026-05-11T22:00:00.000Z",
        errorCode: null,
        errorMessage: null,
      }],
    };

    expect(runnerStatusExitCode(degraded)).toBe(2);
    expect(formatRunnerStatus(degraded)).toContain("stale jobs:");
    expect(formatRunnerStatus(degraded)).toContain("job-stale-1 claimed excel,gsheets");
  });
});
