// Typed wrappers around /api/edit/*. Browser-only. Relies on the cookie session
// set by /api/edit/auth/callback (Domain=.sheets.wiki). All requests use
// `credentials: "include"` so the cookie rides along.
//
// In dev (localhost:8083), Vite proxies /api/edit/* to deployed sheets.wiki
// (per packages/sheets-wiki-editor/vite.config.ts). In production
// (sheets.wiki/edit/*), requests are same-origin and the cookie is direct.
//
// NOTE on content encoding: the edit-shell server (packages/edit-shell) already
// decodes base64 in its readFile helper before responding. The GET /contents/:path
// response shape is { content: string, sha: string } with content as plain UTF-8.

import type { AssayPreviewResultPayload } from "@cartularium/contracts"

export interface MeResponse {
  login: string
  id: number
  fork_repo: string | null
}

export interface FileResponse {
  content: string // plain UTF-8, decoded by the server
  sha: string
  path: string
}

export interface SaveDraftResult {
  branch: string
  commit_sha: string
  content_sha: string
}

export interface SaveDraftOptions {
  branch?: string
  message?: string
}

export interface AssetResponse {
  url: string
  key: string
}

export interface DraftFileSummary {
  path: string
  added: number
  removed: number
}

export interface DraftSummary {
  branch: string
  slug: string
  commit_sha: string
  updated_at: string
  files: DraftFileSummary[]
  added: number
  removed: number
}

export interface ListDraftsResponse {
  drafts: DraftSummary[]
}

export interface ListDraftFilesResponse {
  files: DraftFileSummary[]
}

export interface SubmitDraftRequest {
  branch: string
  title: string
  body: string
}

export interface SubmitDraftSuccess {
  ok: true
  number: number
  url: string
  mergeable: boolean | null
}

export interface SubmitDraftConflict {
  ok: false
  kind: "conflict"
  prUrl: string
  prNumber: number
  message: string
}

export interface SubmitDraftError {
  ok: false
  kind: "error"
  status: number
  message: string
  requestId?: string
}

export type SubmitDraftResult = SubmitDraftSuccess | SubmitDraftConflict | SubmitDraftError

export type AssaySubmittedCaseStatus = "draft" | "submitted" | "accepted" | "rejected" | "expired"

export interface AssayCaseCandidate {
  id: string
  subject: string
  subjectRef?: string
  name?: string
  category: string
  formula: string | Record<string, string>
  grid?: Record<string, unknown>
  expect?: unknown
  features?: string[]
  tags?: string[]
}

export interface AssaySubmittedCase {
  id: string
  draftId: string
  localCaseId: string
  ownerId: string
  status: AssaySubmittedCaseStatus
  caseHash: string
  inputContractVersion: number
  caseSchemaVersion: number
  requestedPlatforms: string[]
  source: string
  canonicalCaseId: string | null
  acceptedResultId: string | null
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  errorCode: string | null
  errorMessage: string | null
}

export interface AssayPreviewJob {
  id: string
  submittedCaseId?: string | null
  draftId?: string
  caseId?: string
  ownerId?: string
  source?: string
  candidateHash?: string
  inputContractVersion?: number
  resultContractVersion?: number | null
  requestedPlatforms?: string[]
  state: string
  priority?: number
  claimedBy?: string | null
  createdAt?: string
  updatedAt?: string
  completedAt?: string | null
  errorCode?: string | null
  errorMessage?: string | null
}

export interface AssayPreviewResult {
  id: string
  jobId?: string
  submittedCaseId?: string | null
  draftId?: string
  caseId?: string
  ownerId?: string
  source?: string
  candidateHash?: string
  resultContractVersion?: number
  requestedPlatforms?: string[]
  resultR2Key?: string
  state: string
  runnerId?: string
  createdAt?: string
  completedAt?: string
  errorCode?: string | null
  errorMessage?: string | null
}

export interface AssayReviewReferences {
  submittedCase: { d1Id: string; r2Key: string }
  previewJob: { d1Id: string; inputR2Key: string } | null
  acceptedResult: { d1Id: string; r2Key: string } | null
  caseHash: string
}

export interface AssaySubmittedCaseSummary extends AssaySubmittedCase {
  latestJob: AssayPreviewJob | null
  latestResult: AssayPreviewResult | null
  reviewReferences: AssayReviewReferences
}

export interface AssayContractsResponse {
  apiVersion: number
  contracts?: Record<string, unknown>
  platforms: {
    known?: string[]
    previewRunnable?: string[]
    defaultReview: string[]
  }
}

export interface AssayRunnerStatusResponse {
  status: string
  generatedAt?: string
  claimTimeoutMs?: number
  jobs: {
    queued: number
    claimed: number
    running: number
    stale: number
    completedRecent: number
    failedRecent: number
  }
  runners: Array<{
    runnerId: string
    activeJobCount: number
    staleJobCount?: number
    lastResultState?: string | null
    lastCompletedAt?: string | null
  }>
}

export interface CreateSubmittedCaseRequest {
  contractVersion: number
  draftId: string
  requestedPlatforms?: string[]
  source?: string
  case: AssayCaseCandidate
}

export interface SubmittedCaseResponse {
  submittedCase: AssaySubmittedCase
}

export interface SubmittedCaseDetailResponse {
  submittedCase: AssaySubmittedCase
  latestJob: AssayPreviewJob | null
  latestResult: AssayPreviewResult | null
  reviewReferences: AssayReviewReferences
}

export interface ListSubmittedCasesResponse {
  submittedCases: AssaySubmittedCaseSummary[]
}

export interface PreviewSubmittedCaseResponse {
  job: AssayPreviewJob
}

export interface AssayPreviewRunResponse {
  job: AssayPreviewJob | null
  resultSummary: AssayPreviewResult | null
  result: AssayPreviewResultPayload | null
}

export interface AssayPrProposalResponse {
  proposal: {
    submittedCaseId: string
    acceptedResultId: string
    canonicalCaseId: string
    suggestedPath: string
    yaml: string
    prTitle: string
    prBody: string
    reviewReferences: AssayReviewReferences
  }
}

export interface GetFileOptions {
  // Read from the session's fork_repo instead of the canonical repo. Used by
  // the editor on load to pick up a previously-saved draft. Pair with `ref`
  // to read a specific branch (e.g., the draft branch); without `ref` reads
  // the fork's default branch (typically `main`).
  fork?: boolean
  // Git ref / branch to read. If omitted the default branch is used.
  ref?: string
}

export class AuthRequiredError extends Error {
  constructor() {
    super("authentication required")
    this.name = "AuthRequiredError"
  }
}

export class EditShellError extends Error {
  readonly status: number
  readonly requestId?: string
  constructor(status: number, message: string, requestId?: string) {
    super(message)
    this.name = "EditShellError"
    this.status = status
    this.requestId = requestId
  }
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const requestId = res.headers.get("X-Request-Id") ?? undefined
  if (res.status === 401) throw new AuthRequiredError()
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    let errorRequestId = requestId
    try {
      const body = (await res.json()) as {
        error?: string | { code?: string; message?: string; requestId?: string }
      }
      if (typeof body.error === "string") {
        message = `${res.status} ${body.error}`
      } else if (body.error) {
        const code = body.error.code ?? "error"
        const detail = body.error.message ? `: ${body.error.message}` : ""
        message = `${res.status} ${code}${detail}`
      }
      const bodyRequestId =
        typeof body.error === "object" && body.error ? body.error.requestId : undefined
      errorRequestId = bodyRequestId ?? requestId
    } catch {
      // body wasn't JSON; keep status text
    }
    throw new EditShellError(res.status, message, errorRequestId)
  }
  return res.json() as Promise<T>
}

export const editShell = {
  async getMe(): Promise<MeResponse> {
    return jsonFetch<MeResponse>("/api/edit/auth/me")
  },

  async getFile(filePath: string, opts: GetFileOptions = {}): Promise<FileResponse> {
    // edit-shell's readFile helper decodes base64 server-side, so the response
    // content is already plain UTF-8. The raw shape is { content, sha }.
    const params = new URLSearchParams()
    if (opts.fork) params.set("fork", "true")
    if (opts.ref) params.set("ref", opts.ref)
    const query = params.toString()
    const url = `/api/edit/contents/${encodeURIComponent(filePath)}${query ? `?${query}` : ""}`
    const raw = await jsonFetch<{ content: string; sha: string }>(url)
    return { content: raw.content, sha: raw.sha, path: filePath }
  },

  async saveDraft(
    filePath: string,
    content: string,
    opts: SaveDraftOptions = {},
  ): Promise<SaveDraftResult> {
    const body: Record<string, unknown> = { content }
    if (opts.branch) body.branch = opts.branch
    if (opts.message) body.message = opts.message
    return jsonFetch<SaveDraftResult>(`/api/edit/contents/${encodeURIComponent(filePath)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  },

  async uploadAsset(file: File): Promise<AssetResponse> {
    const body = new FormData()
    body.append("file", file)
    // Don't set Content-Type — fetch sets it automatically with the correct
    // multipart boundary. Going around jsonFetch because that helper assumes
    // a JSON body (sets Content-Type: application/json), which would break
    // the multipart upload.
    const res = await fetch("/api/edit/assets", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
      body,
    })
    const requestId = res.headers.get("X-Request-Id") ?? undefined
    if (res.status === 401) throw new AuthRequiredError()
    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`
      try {
        const errBody = (await res.json()) as { error?: string }
        if (errBody.error) message = `${res.status} ${errBody.error}`
      } catch {
        // body wasn't JSON
      }
      throw new EditShellError(res.status, message, requestId)
    }
    return res.json() as Promise<AssetResponse>
  },

  async listDrafts(): Promise<ListDraftsResponse> {
    return jsonFetch<ListDraftsResponse>("/api/edit/drafts")
  },

  async listDraftFiles(branch: string): Promise<ListDraftFilesResponse> {
    // The Hono route /:branch{.+}/files accepts encoded path params, so
    // encodeURIComponent on a slash-bearing branch (draft/alice/SUMIF ->
    // draft%2Falice%2FSUMIF) is the canonical way to pass it.
    return jsonFetch<ListDraftFilesResponse>(
      `/api/edit/drafts/${encodeURIComponent(branch)}/files`,
    )
  },

  async submitDraft(req: SubmitDraftRequest): Promise<SubmitDraftResult> {
    // Goes around jsonFetch because the 409 conflict response is a
    // discriminated success path (returns existing PR), not an error.
    const res = await fetch("/api/edit/pr", {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(req),
    })
    const requestId = res.headers.get("X-Request-Id") ?? undefined
    if (res.status === 401) throw new AuthRequiredError()
    if (res.status === 409) {
      const body = (await res.json()) as { pr_url: string; pr_number: number; message: string }
      return {
        ok: false,
        kind: "conflict",
        prUrl: body.pr_url,
        prNumber: body.pr_number,
        message: body.message,
      }
    }
    if (res.ok) {
      const body = (await res.json()) as { number: number; url: string; mergeable: boolean | null }
      return { ok: true, number: body.number, url: body.url, mergeable: body.mergeable }
    }
    let message = `${res.status} ${res.statusText}`
    try {
      const errBody = (await res.json()) as { error?: string }
      if (errBody.error) message = `${res.status} ${errBody.error}`
    } catch {
      // body wasn't JSON
    }
    return { ok: false, kind: "error", status: res.status, message, requestId }
  },

  async getAssayContracts(): Promise<AssayContractsResponse> {
    return jsonFetch<AssayContractsResponse>("/api/edit/assay/contracts")
  },

  async getAssayRunnerStatus(): Promise<AssayRunnerStatusResponse> {
    return jsonFetch<AssayRunnerStatusResponse>("/api/edit/assay/runner-status")
  },

  async listSubmittedCases(status?: AssaySubmittedCaseStatus): Promise<ListSubmittedCasesResponse> {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    return jsonFetch<ListSubmittedCasesResponse>(`/api/edit/assay/submitted-cases${query}`)
  },

  async createSubmittedCase(req: CreateSubmittedCaseRequest): Promise<SubmittedCaseResponse> {
    return jsonFetch<SubmittedCaseResponse>("/api/edit/assay/submitted-cases", {
      method: "POST",
      body: JSON.stringify(req),
    })
  },

  async getSubmittedCase(id: string): Promise<SubmittedCaseDetailResponse> {
    return jsonFetch<SubmittedCaseDetailResponse>(
      `/api/edit/assay/submitted-cases/${encodeURIComponent(id)}`,
    )
  },

  async getSubmittedCaseLatestRun(id: string): Promise<AssayPreviewRunResponse> {
    return jsonFetch<AssayPreviewRunResponse>(
      `/api/edit/assay/submitted-cases/${encodeURIComponent(id)}/runs/latest`,
    )
  },

  async getDraftCaseLatestRun(caseId: string, draftId: string): Promise<AssayPreviewRunResponse> {
    return jsonFetch<AssayPreviewRunResponse>(
      `/api/edit/assay/cases/${encodeURIComponent(caseId)}/runs/latest?draftId=${encodeURIComponent(draftId)}`,
    )
  },

  async submitSubmittedCase(id: string): Promise<SubmittedCaseResponse> {
    return jsonFetch<SubmittedCaseResponse>(
      `/api/edit/assay/submitted-cases/${encodeURIComponent(id)}/submit`,
      { method: "POST", body: "{}" },
    )
  },

  async previewSubmittedCase(
    id: string,
    req: { priority?: number } = {},
  ): Promise<PreviewSubmittedCaseResponse> {
    return jsonFetch<PreviewSubmittedCaseResponse>(
      `/api/edit/assay/submitted-cases/${encodeURIComponent(id)}/preview-jobs`,
      { method: "POST", body: JSON.stringify(req) },
    )
  },

  async acceptSubmittedCase(
    id: string,
    req: { canonicalCaseId: string },
  ): Promise<SubmittedCaseResponse> {
    return jsonFetch<SubmittedCaseResponse>(
      `/api/edit/assay/submitted-cases/${encodeURIComponent(id)}/accept`,
      { method: "POST", body: JSON.stringify(req) },
    )
  },

  async rejectSubmittedCase(
    id: string,
    req: { errorCode: string; errorMessage: string },
  ): Promise<SubmittedCaseResponse> {
    return jsonFetch<SubmittedCaseResponse>(
      `/api/edit/assay/submitted-cases/${encodeURIComponent(id)}/reject`,
      { method: "POST", body: JSON.stringify(req) },
    )
  },

  async getAssayPrProposal(id: string): Promise<AssayPrProposalResponse> {
    return jsonFetch<AssayPrProposalResponse>(
      `/api/edit/assay/submitted-cases/${encodeURIComponent(id)}/pr-proposal`,
    )
  },

  async logout(): Promise<void> {
    await fetch("/api/edit/auth/logout", {
      method: "POST",
      credentials: "include",
    })
  },
}
