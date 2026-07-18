import { Hono } from "hono"
import type { Env } from "../env"
import {
  ASSAY_API_VERSION,
  CLAIM_TIMEOUT_MS,
  CURRENT_PREVIEW_RESULT_CONTRACT,
  DEFAULT_REVIEW_PREVIEW_PLATFORMS,
  IMPLEMENTED_PREVIEW_PLATFORMS,
  MAX_PREVIEW_RESULT_BYTES,
  SUPPORTED_PREVIEW_INPUT_CONTRACT_LIST,
  SUPPORTED_PREVIEW_RESULT_CONTRACTS,
  SUPPORTED_PREVIEW_RESULT_CONTRACT_LIST,
} from "../assay-preview/config"
import { assayRunnerStatus } from "../assay-preview/status"
import type { AssayPreviewJobRow } from "../assay-preview/types"

const app = new Hono<{ Bindings: Env }>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function numberField(record: Record<string, unknown>, key: string): number | null {
  const value = record[key]
  return typeof value === "number" && Number.isInteger(value) ? value : null
}

function platformList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const platforms = value.filter((item): item is string => typeof item === "string" && item.trim() !== "")
  return platforms.length === value.length ? platforms : null
}

function numberList(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const versions = value.filter((item): item is number => typeof item === "number" && Number.isInteger(item))
  return versions.length === value.length ? versions : null
}

function hasBearer(request: Request, token: string): boolean {
  const authorization = request.headers.get("Authorization")
  return authorization === `Bearer ${token}`
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null)
  return isRecord(body) ? body : null
}

function supportsAll(requested: string[], supported: Set<string>): boolean {
  return requested.every((platform) => supported.has(platform))
}

function sameStringSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((value, index) => value === right[index])
}

function resultPayloadError(
  row: AssayPreviewJobRow,
  state: string,
  result: Record<string, unknown>,
): string | null {
  if (stringField(result, "jobId") !== row.id) return "bad_result_job"
  if (stringField(result, "candidateHash") !== row.candidate_hash) return "bad_result_candidate_hash"

  if (state === "completed") {
    const platforms = result.platforms
    if (!isRecord(platforms)) return "bad_result_platforms"
    const requestedPlatforms = JSON.parse(row.platforms_json) as string[]
    if (!sameStringSet(Object.keys(platforms), requestedPlatforms)) return "bad_result_platforms"
  }

  return null
}

function runnerJob(row: AssayPreviewJobRow, claimNonce: string, input: unknown) {
  return {
    id: row.id,
    submittedCaseId: row.submitted_case_id,
    draftId: row.draft_id,
    caseId: row.case_id,
    ownerId: row.owner_id,
    source: row.source,
    candidateHash: row.candidate_hash,
    inputContractVersion: row.input_contract_version,
    requestedPlatforms: JSON.parse(row.platforms_json) as string[],
    claimNonce,
    resultContractVersion: CURRENT_PREVIEW_RESULT_CONTRACT,
    input,
  }
}

app.use("*", async (c, next) => {
  if (!c.env.ASSAY_RUNNER_TOKEN || !hasBearer(c.req.raw, c.env.ASSAY_RUNNER_TOKEN)) {
    return c.json({ error: "unauthorized" }, 401)
  }
  return next()
})

app.get("/contracts", (c) => {
  return c.json({
    apiVersion: ASSAY_API_VERSION,
    runner: {
      supportedInputContracts: [...SUPPORTED_PREVIEW_INPUT_CONTRACT_LIST],
      supportedResultContracts: [...SUPPORTED_PREVIEW_RESULT_CONTRACT_LIST],
      previewRunnablePlatforms: [...IMPLEMENTED_PREVIEW_PLATFORMS],
      defaultReviewPlatforms: [...DEFAULT_REVIEW_PREVIEW_PLATFORMS],
      claimStrategy: {
        order: ["priority_desc", "created_at_asc"],
        requiresAllRequestedPlatforms: true,
      },
    },
    errorEnvelope: {
      legacy: "plain error strings remain on existing runner endpoints",
      versioned: ["error.code", "error.message", "error.requestId", "error.details"],
    },
  })
})

app.get("/status", async (c) => {
  return c.json(await assayRunnerStatus(c.env.ASSAY_PREVIEW_DB))
})

app.post("/jobs/claim", async (c) => {
  const body = await readJsonObject(c.req.raw)
  if (!body) return c.json({ error: "bad_json" }, 400)
  const runnerId = stringField(body, "runnerId")
  const supportedPlatforms = platformList(body.supportedPlatforms)
  const supportedInputContracts = numberList(body.supportedInputContracts)
  const supportedResultContracts = body.supportedResultContracts === undefined
    ? [...SUPPORTED_PREVIEW_RESULT_CONTRACT_LIST]
    : numberList(body.supportedResultContracts)
  if (!runnerId || !supportedPlatforms || !supportedInputContracts || !supportedResultContracts) {
    return c.json({ error: "bad_claim_request" }, 400)
  }
  if (!supportedResultContracts.includes(CURRENT_PREVIEW_RESULT_CONTRACT)) {
    return c.json({ job: null })
  }

  const supported = new Set(supportedPlatforms)
  const supportedContracts = new Set(supportedInputContracts)
  const now = new Date()
  const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS).toISOString()
  await c.env.ASSAY_PREVIEW_DB.prepare(
    `UPDATE assay_preview_jobs
      SET state = 'queued',
        claimed_by = NULL,
        claim_nonce = NULL,
        claimed_at = NULL,
        heartbeat_at = NULL,
        updated_at = ?
      WHERE state IN ('claimed', 'running') AND heartbeat_at < ?`,
  )
    .bind(now.toISOString(), staleBefore)
    .run()

  const candidates = await c.env.ASSAY_PREVIEW_DB.prepare(
    `SELECT * FROM assay_preview_jobs
      WHERE state = 'queued'
      ORDER BY priority DESC, created_at ASC
      LIMIT 20`,
  ).all<AssayPreviewJobRow>()

  for (const row of candidates.results ?? []) {
    const requested = JSON.parse(row.platforms_json) as string[]
    if (!supportsAll(requested, supported)) continue
    if (!supportedContracts.has(row.input_contract_version)) continue

    const now = new Date().toISOString()
    const claimNonce = crypto.randomUUID()
    const updated = await c.env.ASSAY_PREVIEW_DB.prepare(
      `UPDATE assay_preview_jobs
        SET state = 'claimed',
          claimed_by = ?,
          claim_nonce = ?,
          claimed_at = ?,
          heartbeat_at = ?,
          updated_at = ?
        WHERE id = ? AND state = 'queued'`,
    )
      .bind(runnerId, claimNonce, now, now, now, row.id)
      .run()

    if (updated.meta.changes !== 1) continue

    const object = await c.env.ASSAY_PREVIEW.get(row.input_r2_key)
    if (!object) {
      await c.env.ASSAY_PREVIEW_DB.prepare(
        `UPDATE assay_preview_jobs
          SET state = 'failed', error_code = 'missing_input', updated_at = ?, completed_at = ?
          WHERE id = ?`,
      )
        .bind(now, now, row.id)
        .run()
      continue
    }

    const input = await object.json()
    return c.json({ job: runnerJob(row, claimNonce, input) })
  }

  return c.json({ job: null })
})

app.post("/jobs/:jobId/heartbeat", async (c) => {
  const body = await readJsonObject(c.req.raw)
  if (!body) return c.json({ error: "bad_json" }, 400)

  const jobId = c.req.param("jobId")
  const runnerId = stringField(body, "runnerId")
  const claimNonce = stringField(body, "claimNonce")
  const state = stringField(body, "state") ?? "running"
  if (!runnerId || !claimNonce || (state !== "claimed" && state !== "running")) {
    return c.json({ error: "bad_heartbeat_request" }, 400)
  }

  const now = new Date().toISOString()
  const updated = await c.env.ASSAY_PREVIEW_DB.prepare(
    `UPDATE assay_preview_jobs
      SET state = ?,
        heartbeat_at = ?,
        updated_at = ?
      WHERE id = ?
        AND state IN ('claimed', 'running')
        AND claimed_by = ?
        AND claim_nonce = ?`,
  )
    .bind(state, now, now, jobId, runnerId, claimNonce)
    .run()

  if (updated.meta.changes !== 1) return c.json({ error: "claim_conflict" }, 409)
  return c.json({ ok: true, state })
})

app.post("/jobs/:jobId/result", async (c) => {
  const contentLength = Number(c.req.header("Content-Length") ?? "0")
  if (contentLength > MAX_PREVIEW_RESULT_BYTES) return c.json({ error: "preview_result_too_large" }, 413)

  const body = await readJsonObject(c.req.raw)
  if (!body) return c.json({ error: "bad_json" }, 400)

  const jobId = c.req.param("jobId")
  const runnerId = stringField(body, "runnerId")
  const claimNonce = stringField(body, "claimNonce")
  const state = stringField(body, "state")
  const result = body.result
  if (!runnerId || !claimNonce || (state !== "completed" && state !== "failed") || !isRecord(result)) {
    return c.json({ error: "bad_result_request" }, 400)
  }
  const resultContractVersion = numberField(result, "contractVersion")
  if (!resultContractVersion || !SUPPORTED_PREVIEW_RESULT_CONTRACTS.has(resultContractVersion)) {
    return c.json({ error: "unsupported_result_contract" }, 400)
  }
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > MAX_PREVIEW_RESULT_BYTES) {
    return c.json({ error: "preview_result_too_large" }, 413)
  }

  const row = await c.env.ASSAY_PREVIEW_DB.prepare(
    `SELECT * FROM assay_preview_jobs WHERE id = ?`,
  )
    .bind(jobId)
    .first<AssayPreviewJobRow>()
  if (!row) return c.json({ error: "not_found" }, 404)
  if (
    (row.state !== "claimed" && row.state !== "running") ||
    row.claimed_by !== runnerId ||
    row.claim_nonce !== claimNonce
  ) {
    return c.json({ error: "claim_conflict" }, 409)
  }
  const payloadError = resultPayloadError(row, state, result)
  if (payloadError) return c.json({ error: payloadError }, 400)

  const now = new Date().toISOString()
  const resultKey = `assay-preview/results/${jobId}.json`
  await c.env.ASSAY_PREVIEW.put(resultKey, JSON.stringify(result), {
    httpMetadata: { contentType: "application/json" },
  })

  const errorCode = state === "failed" ? stringField(body, "errorCode") : null
  const errorMessage = state === "failed" ? stringField(body, "errorMessage") : null
  const updated = await c.env.ASSAY_PREVIEW_DB.prepare(
    `UPDATE assay_preview_jobs
      SET state = ?,
        result_r2_key = ?,
        result_contract_version = ?,
        updated_at = ?,
        completed_at = ?,
        error_code = ?,
        error_message = ?
      WHERE id = ? AND state IN ('claimed', 'running') AND claimed_by = ? AND claim_nonce = ?`,
  )
    .bind(state, resultKey, resultContractVersion, now, now, errorCode, errorMessage, jobId, runnerId, claimNonce)
    .run()
  if (updated.meta.changes !== 1) return c.json({ error: "claim_conflict" }, 409)

  const resultId = crypto.randomUUID()
  await c.env.ASSAY_PREVIEW_DB.prepare(
    `INSERT INTO assay_preview_results (
      id, job_id, submitted_case_id, draft_id, case_id, owner_id, source,
      candidate_hash, result_contract_version, platforms_json, result_r2_key,
      state, runner_id, created_at, completed_at, error_code, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      resultId,
      row.id,
      row.submitted_case_id,
      row.draft_id,
      row.case_id,
      row.owner_id,
      row.source,
      row.candidate_hash,
      resultContractVersion,
      row.platforms_json,
      resultKey,
      state,
      runnerId,
      now,
      now,
      errorCode,
      errorMessage,
    )
    .run()

  return c.json({ ok: true, resultKey, resultId })
})

export default app
