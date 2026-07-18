import { CLAIM_TIMEOUT_MS } from "./config"
import type { AssayPreviewJobRow, AssayPreviewResultRow } from "./types"

type JobState = "queued" | "claimed" | "running"

interface StatusJob {
  id: string
  submittedCaseId: string | null
  draftId: string
  caseId: string
  ownerId: string
  state: JobState
  requestedPlatforms: string[]
  claimedBy: string | null
  heartbeatAt: string | null
  createdAt: string
  updatedAt: string
  errorCode: string | null
  errorMessage: string | null
}

interface PlatformSetStatus {
  platforms: string[]
  queued: number
  claimed: number
  running: number
}

interface RunnerStatus {
  runnerId: string
  activeJobCount: number
  staleJobCount: number
  states: {
    claimed: number
    running: number
  }
  lastHeartbeatAt: string | null
  lastCompletedAt: string | null
  lastResultState: string | null
  lastErrorCode: string | null
  lastErrorMessage: string | null
}

function parsePlatforms(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : []
  } catch {
    return []
  }
}

function maxIso(left: string | null, right: string | null): string | null {
  if (!left) return right
  if (!right) return left
  return right > left ? right : left
}

function isStale(row: AssayPreviewJobRow, staleBefore: string): boolean {
  return (
    (row.state === "claimed" || row.state === "running") &&
    (!row.heartbeat_at || row.heartbeat_at < staleBefore)
  )
}

function statusJob(row: AssayPreviewJobRow): StatusJob {
  return {
    id: row.id,
    submittedCaseId: row.submitted_case_id,
    draftId: row.draft_id,
    caseId: row.case_id,
    ownerId: row.owner_id,
    state: row.state as JobState,
    requestedPlatforms: parsePlatforms(row.platforms_json),
    claimedBy: row.claimed_by,
    heartbeatAt: row.heartbeat_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
  }
}

export async function assayRunnerStatus(db: D1Database, now = new Date()) {
  const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS).toISOString()
  const [activeRows, recentResults] = await Promise.all([
    db.prepare(
      `SELECT * FROM assay_preview_jobs
        WHERE state IN ('queued', 'claimed', 'running')
        ORDER BY created_at ASC
        LIMIT 200`,
    ).all<AssayPreviewJobRow>(),
    db.prepare(
      `SELECT * FROM assay_preview_results
        ORDER BY completed_at DESC
        LIMIT 100`,
    ).all<AssayPreviewResultRow>(),
  ])

  const jobs = {
    queued: 0,
    claimed: 0,
    running: 0,
    stale: 0,
    completedRecent: 0,
    failedRecent: 0,
  }
  const platformSets = new Map<string, PlatformSetStatus>()
  const runners = new Map<string, RunnerStatus>()
  const staleJobs: StatusJob[] = []

  for (const row of activeRows.results ?? []) {
    if (row.state !== "queued" && row.state !== "claimed" && row.state !== "running") continue
    jobs[row.state] += 1

    const platforms = parsePlatforms(row.platforms_json)
    const platformKey = JSON.stringify(platforms)
    const platformSet = platformSets.get(platformKey) ?? {
      platforms,
      queued: 0,
      claimed: 0,
      running: 0,
    }
    platformSet[row.state] += 1
    platformSets.set(platformKey, platformSet)

    const stale = isStale(row, staleBefore)
    if (stale) {
      jobs.stale += 1
      if (staleJobs.length < 20) staleJobs.push(statusJob(row))
    }

    if (row.claimed_by && (row.state === "claimed" || row.state === "running")) {
      const runner = runners.get(row.claimed_by) ?? {
        runnerId: row.claimed_by,
        activeJobCount: 0,
        staleJobCount: 0,
        states: { claimed: 0, running: 0 },
        lastHeartbeatAt: null,
        lastCompletedAt: null,
        lastResultState: null,
        lastErrorCode: null,
        lastErrorMessage: null,
      }
      runner.activeJobCount += 1
      runner.states[row.state] += 1
      if (stale) runner.staleJobCount += 1
      runner.lastHeartbeatAt = maxIso(runner.lastHeartbeatAt, row.heartbeat_at)
      runners.set(row.claimed_by, runner)
    }
  }

  for (const result of recentResults.results ?? []) {
    if (result.state === "completed") jobs.completedRecent += 1
    if (result.state === "failed") jobs.failedRecent += 1

    const runner = runners.get(result.runner_id) ?? {
      runnerId: result.runner_id,
      activeJobCount: 0,
      staleJobCount: 0,
      states: { claimed: 0, running: 0 },
      lastHeartbeatAt: null,
      lastCompletedAt: null,
      lastResultState: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    }
    if (!runner.lastCompletedAt || result.completed_at > runner.lastCompletedAt) {
      runner.lastCompletedAt = result.completed_at
      runner.lastResultState = result.state
      runner.lastErrorCode = result.error_code
      runner.lastErrorMessage = result.error_message
    }
    runners.set(result.runner_id, runner)
  }

  return {
    status: jobs.stale > 0 ? "degraded" : "ok",
    generatedAt: now.toISOString(),
    claimTimeoutMs: CLAIM_TIMEOUT_MS,
    jobs,
    platformSets: [...platformSets.values()].sort((a, b) => (
      a.platforms.join(",").localeCompare(b.platforms.join(","))
    )),
    runners: [...runners.values()].sort((a, b) => a.runnerId.localeCompare(b.runnerId)),
    staleJobs,
  }
}
