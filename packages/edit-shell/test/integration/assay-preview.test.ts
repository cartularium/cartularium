import { env, SELF } from "cloudflare:test"
import { beforeEach, describe, expect, it } from "vitest"
import { createSession } from "../../src/auth/session"
import { githubHandlers } from "../fixtures/github-handlers"

const SCHEMA = `
CREATE TABLE IF NOT EXISTS assay_preview_jobs (
  id TEXT PRIMARY KEY,
  submitted_case_id TEXT,
  draft_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  source TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  input_contract_version INTEGER NOT NULL DEFAULT 1,
  result_contract_version INTEGER,
  platforms_json TEXT NOT NULL,
  input_r2_key TEXT NOT NULL,
  result_r2_key TEXT,
  state TEXT NOT NULL CHECK (
    state IN ('queued', 'claimed', 'running', 'completed', 'failed', 'canceled')
  ),
  priority INTEGER NOT NULL DEFAULT 0,
  claimed_by TEXT,
  claim_nonce TEXT,
  claimed_at TEXT,
  heartbeat_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  error_code TEXT,
  error_message TEXT
);`

const SUBMITTED_CASE_SCHEMA = `
CREATE TABLE IF NOT EXISTS assay_submitted_cases (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  draft_id TEXT NOT NULL,
  local_case_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('draft', 'submitted', 'accepted', 'rejected', 'expired')
  ),
  case_hash TEXT NOT NULL,
  input_contract_version INTEGER NOT NULL,
  case_schema_version INTEGER NOT NULL,
  requested_platforms_json TEXT NOT NULL,
  case_r2_key TEXT NOT NULL,
  source TEXT NOT NULL,
  canonical_case_id TEXT,
  accepted_result_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  accepted_at TEXT,
  rejected_at TEXT,
  error_code TEXT,
  error_message TEXT
);`

const RESULT_SCHEMA = `
CREATE TABLE IF NOT EXISTS assay_preview_results (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  submitted_case_id TEXT,
  draft_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  source TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  result_contract_version INTEGER NOT NULL,
  platforms_json TEXT NOT NULL,
  result_r2_key TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('completed', 'failed')),
  runner_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT
);`

async function makeSession(user = "alice", forkRepo: string | null = null): Promise<string> {
  return createSession(env.SESSIONS, {
    user_login: user,
    user_id: 1,
    user_token: "ghu_x",
    token_expiry: Date.now() + 3600_000,
    fork_repo: forkRepo,
  })
}

async function submitPreviewJob(sessionId: string) {
  return SELF.fetch("https://sheets.wiki/api/edit/assay/preview-jobs", {
    method: "POST",
    headers: {
      Cookie: `__cart_sess=${sessionId}`,
      Origin: "https://sheets.wiki",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      draftId: "draft/alice/indirect-proof",
      caseId: "indirect-lattice-binding",
      candidateHash: "1256a1",
      requestedPlatforms: ["hyperformula"],
      input: {
        contractVersion: 1,
        jobId: "local-job",
        candidate: { name: "INDIRECT lattice binding", category: "function", formula: "=1+1" },
        requestedPlatforms: ["hyperformula"],
      },
    }),
  })
}

async function submitCase(sessionId: string, submitter = "alice") {
  return SELF.fetch("https://sheets.wiki/api/edit/assay/submitted-cases", {
    method: "POST",
    headers: {
      Cookie: `__cart_sess=${sessionId}`,
      Origin: "https://sheets.wiki",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contractVersion: 1,
      draftId: `draft/${submitter}/indirect-proof`,
      requestedPlatforms: ["hyperformula"],
      case: {
        id: "indirect-lattice-binding",
        subject: "INDIRECT",
        category: "value",
        formula: "=1+1",
        expect: 2,
        features: [],
        tags: ["proof", "indirect"],
      },
    }),
  })
}

async function insertPreviewJob(fields: {
  id: string
  state?: string
  inputContractVersion?: number
  platforms?: string[]
  heartbeatAt?: string | null
}) {
  const now = new Date().toISOString()
  const isClaimed = fields.state === "claimed" || fields.state === "running"
  await env.ASSAY_PREVIEW.put(`assay-preview/inputs/${fields.id}.json`, JSON.stringify({
    contractVersion: fields.inputContractVersion ?? 1,
    requestedPlatforms: fields.platforms ?? ["hyperformula"],
    candidate: { formula: "=1+1" },
  }))
  await env.ASSAY_PREVIEW_DB.prepare(
    `INSERT INTO assay_preview_jobs (
      id, draft_id, case_id, owner_id, source, candidate_hash, input_contract_version,
      platforms_json, input_r2_key, state, priority, claimed_by, claim_nonce,
      claimed_at, heartbeat_at, created_at, updated_at
    ) VALUES (?, 'draft', ?, 'alice', 'test', 'hash', ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      fields.id,
      fields.id,
      fields.inputContractVersion ?? 1,
      JSON.stringify(fields.platforms ?? ["hyperformula"]),
      `assay-preview/inputs/${fields.id}.json`,
      fields.state ?? "queued",
      isClaimed ? "stale-runner" : null,
      isClaimed ? "stale-nonce" : null,
      fields.heartbeatAt ?? null,
      fields.heartbeatAt ?? null,
      now,
      now,
    )
    .run()
}

describe("assay preview jobs", () => {
  beforeEach(async () => {
    await env.ASSAY_PREVIEW_DB.prepare(SCHEMA).run()
    await env.ASSAY_PREVIEW_DB.prepare(SUBMITTED_CASE_SCHEMA).run()
    await env.ASSAY_PREVIEW_DB.prepare(RESULT_SCHEMA).run()
    await env.ASSAY_PREVIEW_DB.exec("DELETE FROM assay_preview_jobs")
    await env.ASSAY_PREVIEW_DB.exec("DELETE FROM assay_preview_results")
    await env.ASSAY_PREVIEW_DB.exec("DELETE FROM assay_submitted_cases")
  })

  it("publishes assay API and runner contract discovery", async () => {
    const sessionId = await makeSession()

    const apiContracts = await SELF.fetch("https://sheets.wiki/api/edit/assay/contracts", {
      headers: { Cookie: `__cart_sess=${sessionId}` },
    })

    expect(apiContracts.status).toBe(200)
    expect(await apiContracts.json()).toMatchObject({
      apiVersion: 1,
      contracts: {
        submittedCase: { current: 1, supported: [1] },
        previewInput: { current: 1, supported: [1] },
        previewResult: { current: 1, supported: [1] },
      },
      platforms: {
        // hyperformula dropped per the hibernation decision (2026-07-18)
        previewRunnable: ["gsheets", "excel"],
        defaultReview: ["excel", "gsheets"],
      },
      errorEnvelope: { shape: "versioned" },
    })

    const runnerContracts = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/contracts", {
      headers: { Authorization: "Bearer test-runner-token" },
    })

    expect(runnerContracts.status).toBe(200)
    expect(await runnerContracts.json()).toMatchObject({
      apiVersion: 1,
      runner: {
        supportedInputContracts: [1],
        supportedResultContracts: [1],
        defaultReviewPlatforms: ["excel", "gsheets"],
      },
    })
  })

  it("reports runner queue status to runner tokens and maintainers", async () => {
    const maintainerSessionId = await makeSession("alice")
    const submitterSessionId = await makeSession("bob")
    await insertPreviewJob({ id: "queued-review", platforms: ["excel", "gsheets"] })
    await insertPreviewJob({ id: "queued-hyperformula", platforms: ["hyperformula"] })
    await insertPreviewJob({
      id: "active-running",
      state: "running",
      platforms: ["hyperformula"],
      heartbeatAt: new Date().toISOString(),
    })
    await insertPreviewJob({
      id: "stale-claimed",
      state: "claimed",
      platforms: ["excel", "gsheets"],
      heartbeatAt: "2026-01-01T00:00:00.000Z",
    })

    const runnerStatus = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/status", {
      headers: { Authorization: "Bearer test-runner-token" },
    })

    expect(runnerStatus.status).toBe(200)
    const statusJson = await runnerStatus.json()
    expect(statusJson).toMatchObject({
      status: "degraded",
      claimTimeoutMs: 300000,
      jobs: {
        queued: 2,
        claimed: 1,
        running: 1,
        stale: 1,
      },
      platformSets: expect.arrayContaining([
        expect.objectContaining({
          platforms: ["excel", "gsheets"],
          queued: 1,
          claimed: 1,
          running: 0,
        }),
        expect.objectContaining({
          platforms: ["hyperformula"],
          queued: 1,
          claimed: 0,
          running: 1,
        }),
      ]),
      runners: expect.arrayContaining([
        expect.objectContaining({
          runnerId: "stale-runner",
          activeJobCount: 2,
          staleJobCount: 1,
        }),
      ]),
      staleJobs: expect.arrayContaining([
        expect.objectContaining({
          id: "stale-claimed",
          state: "claimed",
          claimedBy: "stale-runner",
          requestedPlatforms: ["excel", "gsheets"],
        }),
      ]),
    })

    const unauthorizedRunnerStatus = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/status")
    expect(unauthorizedRunnerStatus.status).toBe(401)

    const maintainerStatus = await SELF.fetch("https://sheets.wiki/api/edit/assay/runner-status", {
      headers: { Cookie: `__cart_sess=${maintainerSessionId}` },
    })
    expect(maintainerStatus.status).toBe(200)
    expect(await maintainerStatus.json()).toMatchObject({
      status: "degraded",
      jobs: { queued: 2, stale: 1 },
    })

    const submitterStatus = await SELF.fetch("https://sheets.wiki/api/edit/assay/runner-status", {
      headers: { Cookie: `__cart_sess=${submitterSessionId}` },
    })
    expect(submitterStatus.status).toBe(403)
    expect(await submitterStatus.json()).toMatchObject({
      error: { code: "assay_maintainer_required" },
    })
  })

  it("stores valid submitted cases before they become canonical", async () => {
    const sessionId = await makeSession()

    const submit = await submitCase(sessionId)

    expect(submit.status).toBe(201)
    const body = (await submit.json()) as {
      submittedCase: { id: string; status: string; caseHash: string; requestedPlatforms: string[] }
    }
    expect(body.submittedCase).toMatchObject({
      status: "draft",
      requestedPlatforms: ["hyperformula"],
    })
    expect(body.submittedCase.caseHash).toMatch(/^[a-f0-9]{64}$/)

    const row = await env.ASSAY_PREVIEW_DB.prepare(
      "SELECT owner_id, draft_id, local_case_id, status, case_hash, case_r2_key FROM assay_submitted_cases WHERE id = ?",
    )
      .bind(body.submittedCase.id)
      .first<{
        owner_id: string
        draft_id: string
        local_case_id: string
        status: string
        case_hash: string
        case_r2_key: string
      }>()

    expect(row).toMatchObject({
      owner_id: "alice",
      draft_id: "draft/alice/indirect-proof",
      local_case_id: "indirect-lattice-binding",
      status: "draft",
      case_hash: body.submittedCase.caseHash,
    })
    const caseObject = await env.ASSAY_PREVIEW.get(row?.case_r2_key ?? "")
    expect(await caseObject?.json()).toMatchObject({
      contractVersion: 1,
      case: { id: "indirect-lattice-binding", formula: "=1+1" },
      requestedPlatforms: ["hyperformula"],
    })
  })

  it("defaults submitted cases to the Excel and GSheets review lane", async () => {
    const sessionId = await makeSession()

    const submit = await SELF.fetch("https://sheets.wiki/api/edit/assay/submitted-cases", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${sessionId}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contractVersion: 1,
        draftId: "draft/alice/default-review-lane",
        case: {
          id: "default-review-lane",
          subject: "SUM",
          category: "value",
          formula: "=SUM(1,1)",
          expect: 2,
        },
      }),
    })

    expect(submit.status).toBe(201)
    const body = (await submit.json()) as { submittedCase: { id: string; requestedPlatforms: string[] } }
    expect(body.submittedCase.requestedPlatforms).toEqual(["excel", "gsheets"])

    const row = await env.ASSAY_PREVIEW_DB.prepare(
      "SELECT requested_platforms_json, case_r2_key FROM assay_submitted_cases WHERE id = ?",
    )
      .bind(body.submittedCase.id)
      .first<{ requested_platforms_json: string; case_r2_key: string }>()
    expect(JSON.parse(row?.requested_platforms_json ?? "[]")).toEqual(["excel", "gsheets"])
    const caseObject = await env.ASSAY_PREVIEW.get(row?.case_r2_key ?? "")
    expect(await caseObject?.json()).toMatchObject({
      requestedPlatforms: ["excel", "gsheets"],
    })
  })

  it("queues preview jobs from submitted cases and reads their draft-local results", async () => {
    const sessionId = await makeSession()
    const submit = await submitCase(sessionId)
    const submitted = (await submit.json()) as {
      submittedCase: { id: string; caseHash: string }
    }

    const queue = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/preview-jobs`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority: 5 }),
      },
    )

    expect(queue.status).toBe(202)
    const queued = (await queue.json()) as {
      job: { id: string; submittedCaseId: string; candidateHash: string; state: string }
    }
    expect(queued.job).toMatchObject({
      submittedCaseId: submitted.submittedCase.id,
      candidateHash: submitted.submittedCase.caseHash,
      state: "queued",
    })

    const inputRow = await env.ASSAY_PREVIEW_DB.prepare(
      "SELECT submitted_case_id, input_r2_key, candidate_hash, priority FROM assay_preview_jobs WHERE id = ?",
    )
      .bind(queued.job.id)
      .first<{ submitted_case_id: string; input_r2_key: string; candidate_hash: string; priority: number }>()
    expect(inputRow).toMatchObject({
      submitted_case_id: submitted.submittedCase.id,
      candidate_hash: submitted.submittedCase.caseHash,
      priority: 5,
    })
    const inputObject = await env.ASSAY_PREVIEW.get(inputRow?.input_r2_key ?? "")
    expect(await inputObject?.json()).toMatchObject({
      jobId: queued.job.id,
      draftId: "draft/alice/indirect-proof",
      ownerId: "alice",
      candidateHash: submitted.submittedCase.caseHash,
      candidate: { id: "indirect-lattice-binding", formula: "=1+1" },
    })

    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    expect(claim.status).toBe(200)
    const claimed = (await claim.json()) as {
      job: { id: string; submittedCaseId: string; claimNonce: string }
    }
    expect(claimed.job).toMatchObject({
      id: queued.job.id,
      submittedCaseId: submitted.submittedCase.id,
    })

    const resultPayload = {
      contractVersion: 1,
      jobId: queued.job.id,
      candidateHash: submitted.submittedCase.caseHash,
      platforms: {
        hyperformula: {
          state: "succeeded",
          result: [[2]],
          expected: [[2]],
          passed: true,
        },
      },
      diagnostics: [],
    }
    const result = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${queued.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: resultPayload,
        }),
      },
    )
    expect(result.status).toBe(200)
    const uploaded = (await result.json()) as { resultId: string; resultKey: string }
    expect(uploaded.resultId).toMatch(/^[0-9a-f-]+$/)

    const resultRow = await env.ASSAY_PREVIEW_DB.prepare(
      `SELECT job_id, submitted_case_id, owner_id, state, runner_id, result_contract_version,
        result_r2_key, candidate_hash
      FROM assay_preview_results
      WHERE id = ?`,
    )
      .bind(uploaded.resultId)
      .first<{
        job_id: string
        submitted_case_id: string
        owner_id: string
        state: string
        runner_id: string
        result_contract_version: number
        result_r2_key: string
        candidate_hash: string
      }>()
    expect(resultRow).toMatchObject({
      job_id: queued.job.id,
      submitted_case_id: submitted.submittedCase.id,
      owner_id: "alice",
      state: "completed",
      runner_id: "mac-mini-1",
      result_contract_version: 1,
      result_r2_key: uploaded.resultKey,
      candidate_hash: submitted.submittedCase.caseHash,
    })

    const latest = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/runs/latest`,
      {
        headers: { Cookie: `__cart_sess=${sessionId}` },
      },
    )
    expect(latest.status).toBe(200)
    expect(await latest.json()).toMatchObject({
      job: {
        id: queued.job.id,
        submittedCaseId: submitted.submittedCase.id,
        state: "completed",
      },
      resultSummary: {
        id: uploaded.resultId,
        resultR2Key: uploaded.resultKey,
      },
      result: resultPayload,
    })
  })

  it("lets maintainers read submitted-case preview payloads from other submitters", async () => {
    const maintainerSessionId = await makeSession("alice")
    const submitterSessionId = await makeSession("bob")
    const submittedResponse = await submitCase(submitterSessionId, "bob")
    const submitted = (await submittedResponse.json()) as {
      submittedCase: { id: string; caseHash: string }
    }
    await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/submit`,
      {
        method: "POST",
        headers: { Cookie: `__cart_sess=${submitterSessionId}`, Origin: "https://sheets.wiki" },
      },
    )
    const queuedResponse = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/preview-jobs`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${submitterSessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority: 10 }),
      },
    )
    const queued = (await queuedResponse.json()) as { job: { id: string } }
    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    const claimed = (await claim.json()) as { job: { claimNonce: string } }
    const resultPayload = {
      contractVersion: 1,
      jobId: queued.job.id,
      candidateHash: submitted.submittedCase.caseHash,
      platforms: {
        hyperformula: { state: "succeeded", result: [[2]], expected: [[2]], passed: true },
      },
      diagnostics: [],
    }
    const upload = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${queued.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: resultPayload,
        }),
      },
    )
    const uploaded = (await upload.json()) as { resultId: string; resultKey: string }

    const latest = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/runs/latest`,
      {
        headers: { Cookie: `__cart_sess=${maintainerSessionId}` },
      },
    )

    expect(latest.status).toBe(200)
    expect(await latest.json()).toMatchObject({
      job: {
        id: queued.job.id,
        submittedCaseId: submitted.submittedCase.id,
        ownerId: "bob",
      },
      resultSummary: {
        id: uploaded.resultId,
        ownerId: "bob",
        resultR2Key: uploaded.resultKey,
      },
      result: resultPayload,
    })
  })

  it("submits, rejects, and accepts submitted cases with lifecycle guards", async () => {
    const sessionId = await makeSession()
    const firstSubmit = await submitCase(sessionId)
    const first = (await firstSubmit.json()) as {
      submittedCase: { id: string }
    }

    const submittedResponse = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${first.submittedCase.id}/submit`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )
    expect(submittedResponse.status).toBe(200)
    expect(await submittedResponse.json()).toMatchObject({
      submittedCase: {
        id: first.submittedCase.id,
        status: "submitted",
      },
    })

    const reject = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${first.submittedCase.id}/reject`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorCode: "needs_evidence",
          errorMessage: "Needs a completed preview run.",
        }),
      },
    )
    expect(reject.status).toBe(200)
    expect(await reject.json()).toMatchObject({
      submittedCase: {
        id: first.submittedCase.id,
        status: "rejected",
        errorCode: "needs_evidence",
        errorMessage: "Needs a completed preview run.",
      },
    })

    const secondSubmit = await submitCase(sessionId)
    const second = (await secondSubmit.json()) as {
      submittedCase: { id: string }
    }
    const submitSecond = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${second.submittedCase.id}/submit`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )
    expect(submitSecond.status).toBe(200)

    const submittedQueue = await SELF.fetch("https://sheets.wiki/api/edit/assay/submitted-cases?status=submitted", {
      headers: { Cookie: `__cart_sess=${sessionId}` },
    })
    expect(submittedQueue.status).toBe(200)
    expect(await submittedQueue.json()).toMatchObject({
      submittedCases: expect.arrayContaining([
        expect.objectContaining({
          id: second.submittedCase.id,
          status: "submitted",
          latestJob: null,
          latestResult: null,
        }),
      ]),
    })

    const blockedAccept = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${second.submittedCase.id}/accept`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canonicalCaseId: "canonical/indirect-lattice-binding",
        }),
      },
    )
    expect(blockedAccept.status).toBe(409)
    expect(await blockedAccept.json()).toMatchObject({
      error: {
        code: "missing_successful_result",
        message: "Submitted case needs a completed compatible preview result before acceptance.",
      },
    })

    const queue = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${second.submittedCase.id}/preview-jobs`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )
    const queued = (await queue.json()) as { job: { id: string; candidateHash: string } }
    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    const claimed = (await claim.json()) as { job: { claimNonce: string } }
    const result = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${queued.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: {
            contractVersion: 1,
            jobId: queued.job.id,
            candidateHash: queued.job.candidateHash,
            platforms: { hyperformula: { state: "passed", values: [[2]] } },
            diagnostics: [],
          },
        }),
      },
    )
    expect(result.status).toBe(200)
    const acceptedResult = (await result.json()) as { resultId: string; resultKey: string }

    const invalidAccept = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${second.submittedCase.id}/accept`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canonicalCaseId: "Bad Ref/Name With Spaces",
        }),
      },
    )
    expect(invalidAccept.status).toBe(400)
    expect(await invalidAccept.json()).toMatchObject({
      error: {
        code: "invalid_canonical_case_id",
        details: expect.arrayContaining([
          expect.objectContaining({ field: "canonicalCaseId" }),
        ]),
      },
    })

    const accept = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${second.submittedCase.id}/accept`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${sessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canonicalCaseId: "submitted/indirect-lattice-binding",
        }),
      },
    )
    expect(accept.status).toBe(200)
    expect(await accept.json()).toMatchObject({
      submittedCase: {
        id: second.submittedCase.id,
        status: "accepted",
        canonicalCaseId: "submitted/indirect-lattice-binding",
        acceptedResultId: acceptedResult.resultId,
      },
    })

    const proposal = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${second.submittedCase.id}/pr-proposal`,
      {
        headers: { Cookie: `__cart_sess=${sessionId}` },
      },
    )
    expect(proposal.status).toBe(200)
    const proposalJson = (await proposal.json()) as {
      proposal: {
        yaml: string
        prBody: string
        files: Array<{ path: string; content: string }>
        reviewReferences: {
          submittedCase: { d1Id: string; r2Key: string }
          previewJob: { d1Id: string; inputR2Key: string }
          acceptedResult: { d1Id: string; r2Key: string }
          caseHash: string
        }
      }
    }
    expect(proposalJson).toMatchObject({
      proposal: {
        submittedCaseId: second.submittedCase.id,
        acceptedResultId: acceptedResult.resultId,
        canonicalCaseId: "submitted/indirect-lattice-binding",
        suggestedPath: "packages/assay/tests/submitted.yaml",
        files: [
          {
            path: "packages/assay/tests/submitted.yaml",
          },
        ],
        omitted: ["fixtures"],
        maintainerChecklist: expect.arrayContaining([
          "Run fixture generation during review; fixtures are intentionally omitted from this proposal.",
          "Review public ref, suite placement, tags, and divergence links before merge.",
        ]),
      },
    })
    expect(proposalJson.proposal.yaml).toContain("subject: INDIRECT")
    expect(proposalJson.proposal.yaml).toContain("name: indirect-lattice-binding")
    expect(proposalJson.proposal.yaml).toContain("formula: '=1+1'")
    expect(proposalJson.proposal.yaml).not.toContain("id:")
    expect(proposalJson.proposal.yaml).not.toContain("features:")
    expect(proposalJson.proposal.prBody).toContain(`Submitted assay case: ${second.submittedCase.id}`)
    expect(proposalJson.proposal.prBody).toContain(`Accepted preview result: ${acceptedResult.resultId}`)
    expect(proposalJson.proposal.prBody).toContain("Stimulus hash:")
    expect(proposalJson.proposal.prBody).toContain("schemaVersion: 3")
    expect(proposalJson.proposal.prBody).toContain("## Maintainer references")
    expect(proposalJson.proposal.prBody).toContain(`Submitted case D1: ${second.submittedCase.id}`)
    expect(proposalJson.proposal.prBody).toContain("Submitted case R2: assay/submitted-cases/")
    expect(proposalJson.proposal.prBody).toContain(`Preview job D1: ${queued.job.id}`)
    expect(proposalJson.proposal.prBody).toContain(`Accepted result D1: ${acceptedResult.resultId}`)
    expect(proposalJson.proposal.prBody).toContain(`Accepted result R2: ${acceptedResult.resultKey}`)
    expect(proposalJson.proposal.reviewReferences).toMatchObject({
      submittedCase: {
        d1Id: second.submittedCase.id,
        r2Key: expect.stringContaining("assay/submitted-cases/"),
      },
      previewJob: {
        d1Id: queued.job.id,
        inputR2Key: expect.stringContaining("assay-preview/inputs/"),
      },
      acceptedResult: {
        d1Id: acceptedResult.resultId,
        r2Key: acceptedResult.resultKey,
      },
      caseHash: queued.job.candidateHash,
    })
    expect(proposalJson.proposal.files.some((file) => file.path.includes("fixtures"))).toBe(false)

    const detail = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${second.submittedCase.id}`,
      {
        headers: { Cookie: `__cart_sess=${sessionId}` },
      },
    )
    expect(detail.status).toBe(200)
    const detailJson = await detail.json()
    expect(detailJson).toMatchObject({
      submittedCase: {
        id: second.submittedCase.id,
        status: "accepted",
        acceptedResultId: acceptedResult.resultId,
      },
      latestJob: {
        id: queued.job.id,
        state: "completed",
      },
      latestResult: {
        id: acceptedResult.resultId,
        jobId: queued.job.id,
        resultR2Key: acceptedResult.resultKey,
      },
      reviewReferences: proposalJson.proposal.reviewReferences,
    })
    expect(detailJson).not.toHaveProperty("result")

    const acceptedQueue = await SELF.fetch("https://sheets.wiki/api/edit/assay/submitted-cases?status=accepted", {
      headers: { Cookie: `__cart_sess=${sessionId}` },
    })
    expect(acceptedQueue.status).toBe(200)
    expect(await acceptedQueue.json()).toMatchObject({
      submittedCases: expect.arrayContaining([
        expect.objectContaining({
          id: second.submittedCase.id,
          status: "accepted",
          latestJob: expect.objectContaining({ id: queued.job.id }),
          latestResult: expect.objectContaining({ id: acceptedResult.resultId }),
        }),
      ]),
    })
  })

  it("renders accepted PR proposals as v3 YAML without authored ids", async () => {
    const sessionId = await makeSession()
    const now = new Date().toISOString()
    const submittedCaseId = "submitted-expand-pad-value"
    const previewJobId = "preview-expand-pad-value"
    const acceptedResultId = "result-expand-pad-value"
    const candidate = {
      subject: "EXPAND",
      name: "pad-value",
      formula: "=EXPAND({1,2}, 2, 3, 0)",
      expect: [
        [1, 2, 0],
        [0, 0, 0],
      ],
      features: ["dynamic-arrays"],
    }
    const caseR2Key = `assay/submitted-cases/${submittedCaseId}/case.v1.json`
    const resultR2Key = `assay-preview/results/${acceptedResultId}.json`

    await env.ASSAY_PREVIEW.put(caseR2Key, JSON.stringify({
      contractVersion: 1,
      assaySchemaVersion: 3,
      id: submittedCaseId,
      ownerId: "alice",
      draftId: "draft/alice/expand-pad-value",
      caseHash: "preview-input-hash",
      requestedPlatforms: ["excel", "gsheets"],
      case: candidate,
      createdAt: now,
    }))
    await env.ASSAY_PREVIEW_DB.prepare(
      `INSERT INTO assay_submitted_cases (
        id, owner_id, draft_id, local_case_id, status, case_hash, input_contract_version,
        case_schema_version, requested_platforms_json, case_r2_key, source,
        canonical_case_id, accepted_result_id, created_at, updated_at, submitted_at, accepted_at
      ) VALUES (?, 'alice', 'draft/alice/expand-pad-value', 'local-expand-pad-value', 'accepted',
        'preview-input-hash', 1, 3, ?, ?, 'sheets-wiki', 'EXPAND/pad-value', ?, ?, ?, ?, ?)`,
    )
      .bind(
        submittedCaseId,
        JSON.stringify(["excel", "gsheets"]),
        caseR2Key,
        acceptedResultId,
        now,
        now,
        now,
        now,
      )
      .run()
    await env.ASSAY_PREVIEW_DB.prepare(
      `INSERT INTO assay_preview_jobs (
        id, submitted_case_id, draft_id, case_id, owner_id, source, candidate_hash,
        input_contract_version, result_contract_version, platforms_json, input_r2_key,
        state, priority, created_at, updated_at, completed_at
      ) VALUES (?, ?, 'draft/alice/expand-pad-value', 'local-expand-pad-value', 'alice', 'sheets-wiki',
        'preview-input-hash', 1, 1, ?, 'assay-preview/inputs/preview-expand-pad-value.json',
        'completed', 0, ?, ?, ?)`,
    )
      .bind(previewJobId, submittedCaseId, JSON.stringify(["excel", "gsheets"]), now, now, now)
      .run()
    await env.ASSAY_PREVIEW.put(resultR2Key, JSON.stringify({
      contractVersion: 1,
      jobId: previewJobId,
      candidateHash: "preview-input-hash",
      platforms: { excel: { state: "passed" }, gsheets: { state: "passed" } },
      diagnostics: [],
    }))
    await env.ASSAY_PREVIEW_DB.prepare(
      `INSERT INTO assay_preview_results (
        id, job_id, submitted_case_id, draft_id, case_id, owner_id, source, candidate_hash,
        result_contract_version, platforms_json, result_r2_key, state, runner_id, created_at, completed_at
      ) VALUES (?, ?, ?, 'draft/alice/expand-pad-value', 'local-expand-pad-value', 'alice', 'sheets-wiki',
        'preview-input-hash', 1, ?, ?, 'completed', 'test-runner', ?, ?)`,
    )
      .bind(
        acceptedResultId,
        previewJobId,
        submittedCaseId,
        JSON.stringify(["excel", "gsheets"]),
        resultR2Key,
        now,
        now,
      )
      .run()

    const proposalResponse = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submittedCaseId}/pr-proposal`,
      {
        headers: { Cookie: `__cart_sess=${sessionId}` },
      },
    )

    expect(proposalResponse.status).toBe(200)
    const { proposal } = (await proposalResponse.json()) as {
      proposal: {
        yaml: string
        prBody: string
        files: [{ content: string }]
      }
    }
    expect(proposal.files[0].content).toContain("schemaVersion: 3")
    expect(proposal.yaml).toContain("subject: EXPAND")
    expect(proposal.yaml).toContain("name: pad-value")
    expect(proposal.yaml).not.toContain("id:")
    expect(proposal.prBody).toContain("Stimulus hash:")
    expect(proposal.prBody).toContain("Fixture files are intentionally omitted")
  })

  it("lets maintainers review and accept submitted cases from other users", async () => {
    const maintainerSessionId = await makeSession("alice", "alice/cartularium")
    const submitterSessionId = await makeSession("bob")
    const strangerSessionId = await makeSession("charlie")

    const submit = await submitCase(submitterSessionId, "bob")
    const submitted = (await submit.json()) as {
      submittedCase: { id: string }
    }
    const markSubmitted = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/submit`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${submitterSessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )
    expect(markSubmitted.status).toBe(200)

    const strangerDetail = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}`,
      {
        headers: { Cookie: `__cart_sess=${strangerSessionId}` },
      },
    )
    expect(strangerDetail.status).toBe(404)

    const maintainerQueue = await SELF.fetch("https://sheets.wiki/api/edit/assay/submitted-cases?status=submitted", {
      headers: { Cookie: `__cart_sess=${maintainerSessionId}` },
    })
    expect(maintainerQueue.status).toBe(200)
    expect(await maintainerQueue.json()).toMatchObject({
      submittedCases: expect.arrayContaining([
        expect.objectContaining({
          id: submitted.submittedCase.id,
          ownerId: "bob",
          status: "submitted",
        }),
      ]),
    })

    const maintainerDetail = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}`,
      {
        headers: { Cookie: `__cart_sess=${maintainerSessionId}` },
      },
    )
    expect(maintainerDetail.status).toBe(200)
    expect(await maintainerDetail.json()).toMatchObject({
      submittedCase: {
        id: submitted.submittedCase.id,
        ownerId: "bob",
        status: "submitted",
      },
    })

    const queue = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/preview-jobs`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${submitterSessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )
    const queued = (await queue.json()) as { job: { id: string; candidateHash: string } }
    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    const claimed = (await claim.json()) as { job: { claimNonce: string } }
    const result = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${queued.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: {
            contractVersion: 1,
            jobId: queued.job.id,
            candidateHash: queued.job.candidateHash,
            platforms: { hyperformula: { state: "passed", values: [[2]] } },
            diagnostics: [],
          },
        }),
      },
    )
    expect(result.status).toBe(200)
    const acceptedResult = (await result.json()) as { resultId: string }

    const strangerAccept = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/accept`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${strangerSessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canonicalCaseId: "submitted/bob-indirect-lattice-binding" }),
      },
    )
    expect(strangerAccept.status).toBe(404)

    const accept = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/accept`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${maintainerSessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canonicalCaseId: "submitted/bob-indirect-lattice-binding" }),
      },
    )
    expect(accept.status).toBe(200)
    expect(await accept.json()).toMatchObject({
      submittedCase: {
        id: submitted.submittedCase.id,
        ownerId: "bob",
        status: "accepted",
        canonicalCaseId: "submitted/bob-indirect-lattice-binding",
        acceptedResultId: acceptedResult.resultId,
      },
    })

    const submitterProposal = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/pr-proposal`,
      {
        headers: { Cookie: `__cart_sess=${submitterSessionId}` },
      },
    )
    expect(submitterProposal.status).toBe(403)
    expect(await submitterProposal.json()).toMatchObject({
      error: { code: "assay_maintainer_required" },
    })

    const proposal = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/pr-proposal`,
      {
        headers: { Cookie: `__cart_sess=${maintainerSessionId}` },
      },
    )
    expect(proposal.status).toBe(200)
    expect(await proposal.json()).toMatchObject({
      proposal: {
        submittedCaseId: submitted.submittedCase.id,
        acceptedResultId: acceptedResult.resultId,
        reviewReferences: {
          submittedCase: { d1Id: submitted.submittedCase.id },
        },
      },
    })

    const branch = `draft/alice/assay-submitted-bob-indirect-lattice-binding-${submitted.submittedCase.id.slice(0, 8)}`
    githubHandlers.getContentMissing(
      "cartularium",
      "cartularium",
      "packages/assay/tests/submitted.yaml",
      "main",
    )
    githubHandlers.getRefMissing("alice", "cartularium", `heads/${branch}`)
    githubHandlers.getDefaultBranchSha("alice", "cartularium")
    githubHandlers.createRef("alice", "cartularium")
    githubHandlers.getRefExists("alice", "cartularium", `heads/${branch}`)
    githubHandlers.getContentMissing(
      "alice",
      "cartularium",
      "packages/assay/tests/submitted.yaml",
      "main",
    )
    githubHandlers.putContent("alice", "cartularium", "packages/assay/tests/submitted.yaml", "assay-content-sha", {
      expectBase64Content: true,
      expectNonEmptyMessage: true,
    })
    githubHandlers.compareCommits("alice", "cartularium", "main", branch, [], {
      commits: [{ sha: "assay-tip" }],
    })
    githubHandlers.createPullRequest(151, {
      expectHead: `alice:${branch}`,
    })
    githubHandlers.getPullRequest(151, true)

    const pr = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay/submitted-cases/${submitted.submittedCase.id}/pr`,
      {
        method: "POST",
        headers: {
          Cookie: `__cart_sess=${maintainerSessionId}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    )
    expect(pr.status).toBe(200)
    expect(await pr.json()).toMatchObject({
      branch,
      file: {
        path: "packages/assay/tests/submitted.yaml",
        mode: "add-or-append-test",
      },
      proposal: {
        submittedCaseId: submitted.submittedCase.id,
        acceptedResultId: acceptedResult.resultId,
      },
      pullRequest: {
        number: 151,
        url: "https://github.com/cartularium/cartularium/pull/151",
        mergeable: true,
      },
    })
  })

  it("rejects malformed submitted cases with a versioned error envelope before storage", async () => {
    const sessionId = await makeSession()

    const submit = await SELF.fetch("https://sheets.wiki/api/edit/assay/submitted-cases", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${sessionId}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contractVersion: 1,
        draftId: "draft/alice/bad-proof",
        requestedPlatforms: ["hyperformula"],
        case: {
          id: "bad-formula",
          subject: "SUM",
          category: "value",
          formula: "SUM(1,1)",
        },
      }),
    })

    expect(submit.status).toBe(400)
    expect(await submit.json()).toMatchObject({
      error: {
        code: "invalid_submitted_case",
        message: "Submitted case is not valid enough to store.",
        details: expect.arrayContaining([
          expect.objectContaining({ field: "case.formula" }),
        ]),
      },
    })

    const row = await env.ASSAY_PREVIEW_DB.prepare(
      "SELECT COUNT(*) AS count FROM assay_submitted_cases",
    ).first<{ count: number }>()
    expect(row?.count).toBe(0)
  })

  it("submits, claims, completes, and reads latest preview results", async () => {
    const sessionId = await makeSession()
    const submit = await submitPreviewJob(sessionId)
    expect(submit.status).toBe(202)
    const submitted = (await submit.json()) as {
      job: { id: string; state: string; candidateHash: string }
    }
    expect(submitted.job.state).toBe("queued")

    const inputRow = await env.ASSAY_PREVIEW_DB.prepare(
      "SELECT input_r2_key, owner_id, input_contract_version, platforms_json FROM assay_preview_jobs WHERE id = ?",
    )
      .bind(submitted.job.id)
      .first<{ input_r2_key: string; owner_id: string; input_contract_version: number; platforms_json: string }>()
    expect(inputRow?.owner_id).toBe("alice")
    expect(inputRow?.input_contract_version).toBe(1)
    expect(JSON.parse(inputRow?.platforms_json ?? "[]")).toEqual(["hyperformula"])
    const inputObject = await env.ASSAY_PREVIEW.get(inputRow?.input_r2_key ?? "")
    expect(inputObject).not.toBeNull()
    await inputObject?.arrayBuffer()

    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    expect(claim.status).toBe(200)
    const claimed = (await claim.json()) as {
      job: { id: string; claimNonce: string; resultContractVersion: number; input: { candidate: { formula: string } } }
    }
    expect(claimed.job.id).toBe(submitted.job.id)
    expect(claimed.job.resultContractVersion).toBe(1)
    expect(claimed.job.input.candidate.formula).toBe("=1+1")

    const badResult = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${submitted.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: "wrong",
          state: "completed",
          result: { contractVersion: 1, ok: false },
        }),
      },
    )
    expect(badResult.status).toBe(409)

    const resultPayload = {
      contractVersion: 1,
      jobId: submitted.job.id,
      candidateHash: "1256a1",
      platforms: { hyperformula: { state: "passed", values: [[2]] } },
      diagnostics: [],
    }
    const result = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${submitted.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: resultPayload,
        }),
      },
    )
    expect(result.status).toBe(200)
    const completed = (await result.json()) as { resultKey: string; resultId: string }
    expect(completed.resultId).toMatch(/^[0-9a-f-]+$/)
    const resultObject = await env.ASSAY_PREVIEW.get(completed.resultKey)
    expect(await resultObject?.json()).toEqual(resultPayload)

    const latest = await SELF.fetch(
      "https://sheets.wiki/api/edit/assay/cases/indirect-lattice-binding/runs/latest?draftId=draft%2Falice%2Findirect-proof",
      {
        headers: { Cookie: `__cart_sess=${sessionId}` },
      },
    )
    expect(latest.status).toBe(200)
    expect(await latest.json()).toMatchObject({
      job: {
        id: submitted.job.id,
        state: "completed",
        requestedPlatforms: ["hyperformula"],
      },
      result: resultPayload,
    })
  })

  it("does not claim jobs the runner cannot execute", async () => {
    const sessionId = await makeSession()
    const submit = await submitPreviewJob(sessionId)
    expect(submit.status).toBe(202)

    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["excel"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    expect(claim.status).toBe(200)
    expect(await claim.json()).toEqual({ job: null })
  })

  it("does not claim jobs with unsupported input contracts", async () => {
    await insertPreviewJob({ id: "future-contract", inputContractVersion: 99 })

    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })

    expect(claim.status).toBe(200)
    expect(await claim.json()).toEqual({ job: null })
  })

  it("requeues stale claimed jobs before claiming", async () => {
    await insertPreviewJob({
      id: "stale-job",
      state: "claimed",
      heartbeatAt: "2026-01-01T00:00:00.000Z",
    })

    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })

    expect(claim.status).toBe(200)
    const body = (await claim.json()) as { job: { id: string } | null }
    expect(body.job?.id).toBe("stale-job")
  })

  it("accepts runner heartbeats and allows running jobs to complete", async () => {
    const sessionId = await makeSession()
    const submit = await submitPreviewJob(sessionId)
    const submitted = (await submit.json()) as { job: { id: string } }
    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    const claimed = (await claim.json()) as { job: { claimNonce: string } }

    const heartbeat = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${submitted.job.id}/heartbeat`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "running",
        }),
      },
    )
    expect(heartbeat.status).toBe(200)
    expect(await heartbeat.json()).toEqual({ ok: true, state: "running" })

    const row = await env.ASSAY_PREVIEW_DB.prepare(
      "SELECT state, claimed_by, heartbeat_at FROM assay_preview_jobs WHERE id = ?",
    )
      .bind(submitted.job.id)
      .first<{ state: string; claimed_by: string; heartbeat_at: string }>()
    expect(row?.state).toBe("running")
    expect(row?.claimed_by).toBe("mac-mini-1")
    expect(row?.heartbeat_at).toMatch(/T/)

    const result = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${submitted.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: {
            contractVersion: 1,
            jobId: submitted.job.id,
            candidateHash: "1256a1",
            platforms: { hyperformula: { state: "passed", values: [[2]] } },
            diagnostics: [],
          },
        }),
      },
    )
    expect(result.status).toBe(200)
  })

  it("rejects runner results that do not match the claimed job", async () => {
    const sessionId = await makeSession()
    const submit = await submitPreviewJob(sessionId)
    const submitted = (await submit.json()) as { job: { id: string } }
    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    const claimed = (await claim.json()) as { job: { claimNonce: string } }

    const mismatchedHash = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${submitted.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: {
            contractVersion: 1,
            jobId: submitted.job.id,
            candidateHash: "not-the-claimed-candidate",
            platforms: { hyperformula: { state: "passed", values: [[2]] } },
            diagnostics: [],
          },
        }),
      },
    )
    expect(mismatchedHash.status).toBe(400)
    expect(await mismatchedHash.json()).toEqual({ error: "bad_result_candidate_hash" })

    const stillClaimed = await env.ASSAY_PREVIEW_DB.prepare(
      "SELECT state, result_r2_key FROM assay_preview_jobs WHERE id = ?",
    )
      .bind(submitted.job.id)
      .first<{ state: string; result_r2_key: string | null }>()
    expect(stillClaimed).toMatchObject({ state: "claimed", result_r2_key: null })

    const missingPlatform = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${submitted.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: {
            contractVersion: 1,
            jobId: submitted.job.id,
            candidateHash: "1256a1",
            platforms: {},
            diagnostics: [],
          },
        }),
      },
    )
    expect(missingPlatform.status).toBe(400)
    expect(await missingPlatform.json()).toEqual({ error: "bad_result_platforms" })
  })

  it("requeues stale running jobs before claiming", async () => {
    await insertPreviewJob({
      id: "stale-running-job",
      state: "running",
      heartbeatAt: "2026-01-01T00:00:00.000Z",
    })

    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })

    expect(claim.status).toBe(200)
    const body = (await claim.json()) as { job: { id: string } | null }
    expect(body.job?.id).toBe("stale-running-job")
  })

  it("rejects unsupported input and result contracts", async () => {
    const sessionId = await makeSession()
    const badSubmit = await SELF.fetch("https://sheets.wiki/api/edit/assay/preview-jobs", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${sessionId}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        draftId: "draft",
        caseId: "case",
        candidateHash: "hash",
        requestedPlatforms: ["hyperformula"],
        input: {
          contractVersion: 99,
          requestedPlatforms: ["hyperformula"],
          candidate: { formula: "=1+1" },
        },
      }),
    })
    expect(badSubmit.status).toBe(400)
    expect(await badSubmit.json()).toEqual({ error: "unsupported_input_contract" })

    const submit = await submitPreviewJob(sessionId)
    const submitted = (await submit.json()) as { job: { id: string } }
    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-runner-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    const claimed = (await claim.json()) as { job: { claimNonce: string } }

    const badResult = await SELF.fetch(
      `https://sheets.wiki/api/edit/assay-runner/jobs/${submitted.job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-runner-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runnerId: "mac-mini-1",
          claimNonce: claimed.job.claimNonce,
          state: "completed",
          result: { contractVersion: 99 },
        }),
      },
    )
    expect(badResult.status).toBe(400)
    expect(await badResult.json()).toEqual({ error: "unsupported_result_contract" })
  })

  it("requires the runner bearer token", async () => {
    const claim = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
        supportedResultContracts: [1],
      }),
    })
    expect(claim.status).toBe(403)
    expect(await claim.json()).toEqual({ error: "missing_origin" })

    const badToken = await SELF.fetch("https://sheets.wiki/api/edit/assay-runner/jobs/claim", {
      method: "POST",
      headers: {
        Authorization: "Bearer wrong",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        runnerId: "mac-mini-1",
        supportedPlatforms: ["hyperformula"],
        supportedInputContracts: [1],
      }),
    })
    expect(badToken.status).toBe(401)
  })
})
