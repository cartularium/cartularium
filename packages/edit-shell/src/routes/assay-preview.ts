import { Hono } from "hono"
import { coerceStimulusGrid, stimulusPayload } from "@cartularium/contracts"
import type { Env } from "../env"
import {
  ASSAY_API_VERSION,
  ASSAY_CASE_SCHEMA_VERSION,
  ASSAY_CATEGORIES,
  ASSAY_PLATFORMS,
  CURRENT_PREVIEW_INPUT_CONTRACT,
  CURRENT_PREVIEW_RESULT_CONTRACT,
  CURRENT_SUBMITTED_CASE_CONTRACT,
  DEFAULT_REVIEW_PREVIEW_PLATFORMS,
  IMPLEMENTED_PREVIEW_PLATFORMS,
  MAX_PREVIEW_INPUT_BYTES,
  SUPPORTED_PREVIEW_INPUT_CONTRACTS,
  SUPPORTED_PREVIEW_INPUT_CONTRACT_LIST,
  SUPPORTED_PREVIEW_RESULT_CONTRACT_LIST,
  SUPPORTED_SUBMITTED_CASE_CONTRACTS,
} from "../assay-preview/config"
import { assayRunnerStatus } from "../assay-preview/status"
import type {
  AssayPreviewJobRow,
  AssayPreviewResultRow,
  AssaySubmittedCaseRow,
  AssaySubmittedCaseStatus,
} from "../assay-preview/types"
import { writeFileToBranch } from "../github/commit"
import { openPullRequest } from "../github/pr"
import { squashDraftBranch } from "../github/squash"
import { readFile } from "../github/tree"

const app = new Hono<{ Bindings: Env }>()
const SUBMITTED_CASE_STATUSES: AssaySubmittedCaseStatus[] = ["draft", "submitted", "accepted", "rejected", "expired"]
const PUBLIC_REF_SUBJECT_RE = /^[A-Za-z0-9_.:-]+$/
const PUBLIC_REF_NAME_RE = /^[a-z0-9][a-z0-9-]*$/
const RESERVED_PUBLIC_REF_PREFIXES = ["preview:"]

interface ReviewReferences {
  submittedCase: {
    d1Id: string
    r2Key: string
  }
  previewJob: {
    d1Id: string
    inputR2Key: string
  } | null
  acceptedResult: {
    d1Id: string
    r2Key: string
  } | null
  caseHash: string
}

interface AcceptedAssayProposal {
  submittedCaseId: string
  acceptedResultId: string
  canonicalCaseId: string
  caseHash: string
  stimulusHash: string
  reviewReferences: ReviewReferences
  suggestedPath: string
  yaml: string
  prTitle: string
  prBody: string
  files: [{
    path: string
    mode: "add-or-append-test"
    content: string
  }]
  omitted: string[]
  maintainerChecklist: string[]
}

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

function submittedCaseRequestedPlatforms(body: Record<string, unknown>): string[] | null {
  if (body.requestedPlatforms === undefined) return [...DEFAULT_REVIEW_PREVIEW_PLATFORMS]
  return platformList(body.requestedPlatforms)
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const strings = value.filter((item): item is string => typeof item === "string")
  return strings.length === value.length ? strings : null
}

function sameStringSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const left = [...a].sort()
  const right = [...b].sort()
  return left.every((value, index) => value === right[index])
}

function isCanonicalCaseId(value: string): boolean {
  const parts = value.split("/")
  if (parts.length !== 2) return false
  const [subjectRef, name] = parts
  return !!subjectRef &&
    !!name &&
    PUBLIC_REF_SUBJECT_RE.test(subjectRef) &&
    !RESERVED_PUBLIC_REF_PREFIXES.some((prefix) => subjectRef.startsWith(prefix)) &&
    PUBLIC_REF_NAME_RE.test(name)
}

function assayMaintainers(env: Env): Set<string> {
  return new Set(
    (env.ASSAY_MAINTAINERS ?? "")
      .split(",")
      .map((login) => login.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAssayMaintainer(env: Env, login: string): boolean {
  return assayMaintainers(env).has(login.toLowerCase())
}

function publicJob(row: AssayPreviewJobRow) {
  return {
    id: row.id,
    submittedCaseId: row.submitted_case_id,
    draftId: row.draft_id,
    caseId: row.case_id,
    ownerId: row.owner_id,
    source: row.source,
    candidateHash: row.candidate_hash,
    inputContractVersion: row.input_contract_version,
    resultContractVersion: row.result_contract_version,
    requestedPlatforms: JSON.parse(row.platforms_json) as string[],
    state: row.state,
    priority: row.priority,
    claimedBy: row.claimed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
  }
}

function publicSubmittedCase(row: AssaySubmittedCaseRow) {
  return {
    id: row.id,
    draftId: row.draft_id,
    localCaseId: row.local_case_id,
    ownerId: row.owner_id,
    status: row.status,
    caseHash: row.case_hash,
    inputContractVersion: row.input_contract_version,
    caseSchemaVersion: row.case_schema_version,
    requestedPlatforms: JSON.parse(row.requested_platforms_json) as string[],
    source: row.source,
    canonicalCaseId: row.canonical_case_id,
    acceptedResultId: row.accepted_result_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
  }
}

function publicResult(row: AssayPreviewResultRow) {
  return {
    id: row.id,
    jobId: row.job_id,
    submittedCaseId: row.submitted_case_id,
    draftId: row.draft_id,
    caseId: row.case_id,
    ownerId: row.owner_id,
    source: row.source,
    candidateHash: row.candidate_hash,
    resultContractVersion: row.result_contract_version,
    requestedPlatforms: JSON.parse(row.platforms_json) as string[],
    resultR2Key: row.result_r2_key,
    state: row.state,
    runnerId: row.runner_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
  }
}

function errorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: Array<{ field: string; message: string }>,
) {
  return {
    error: {
      code,
      message,
      requestId,
      ...(details && details.length > 0 ? { details } : {}),
    },
  }
}

async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null)
  return isRecord(body) ? body : null
}

async function loadResultPayload(bucket: R2Bucket, resultR2Key: string | null): Promise<unknown | null> {
  if (!resultR2Key) return null
  const object = await bucket.get(resultR2Key)
  if (!object) return null
  return object.json()
}

async function loadSubmittedCase(
  db: D1Database,
  ownerId: string,
  submittedCaseId: string,
): Promise<AssaySubmittedCaseRow | null> {
  return db.prepare(
    `SELECT * FROM assay_submitted_cases WHERE id = ? AND owner_id = ?`,
  )
    .bind(submittedCaseId, ownerId)
    .first<AssaySubmittedCaseRow>()
}

async function loadReviewableSubmittedCase(
  db: D1Database,
  env: Env,
  actorLogin: string,
  submittedCaseId: string,
): Promise<AssaySubmittedCaseRow | null> {
  if (!isAssayMaintainer(env, actorLogin)) return loadSubmittedCase(db, actorLogin, submittedCaseId)
  return db.prepare(
    `SELECT * FROM assay_submitted_cases WHERE id = ?`,
  )
    .bind(submittedCaseId)
    .first<AssaySubmittedCaseRow>()
}

async function loadSubmittedCasePayload(bucket: R2Bucket, row: AssaySubmittedCaseRow): Promise<Record<string, unknown> | null> {
  const object = await bucket.get(row.case_r2_key)
  if (!object) return null
  const payload = await object.json().catch(() => null)
  return isRecord(payload) ? payload : null
}

async function loadLatestJobForSubmittedCase(
  db: D1Database,
  ownerId: string,
  submittedCaseId: string,
): Promise<AssayPreviewJobRow | null> {
  return db.prepare(
    `SELECT * FROM assay_preview_jobs
      WHERE owner_id = ? AND submitted_case_id = ?
      ORDER BY created_at DESC
      LIMIT 1`,
  )
    .bind(ownerId, submittedCaseId)
    .first<AssayPreviewJobRow>()
}

async function loadLatestResultForSubmittedCase(
  db: D1Database,
  ownerId: string,
  submittedCaseId: string,
): Promise<AssayPreviewResultRow | null> {
  return db.prepare(
    `SELECT * FROM assay_preview_results
      WHERE owner_id = ? AND submitted_case_id = ?
      ORDER BY completed_at DESC
      LIMIT 1`,
  )
    .bind(ownerId, submittedCaseId)
    .first<AssayPreviewResultRow>()
}

async function loadResultRowForJob(
  db: D1Database,
  ownerId: string,
  jobId: string,
): Promise<AssayPreviewResultRow | null> {
  return db.prepare(
    `SELECT * FROM assay_preview_results
      WHERE owner_id = ? AND job_id = ?
      ORDER BY completed_at DESC
      LIMIT 1`,
  )
    .bind(ownerId, jobId)
    .first<AssayPreviewResultRow>()
}

async function loadResultRow(
  db: D1Database,
  ownerId: string,
  resultId: string,
): Promise<AssayPreviewResultRow | null> {
  return db.prepare(
    `SELECT * FROM assay_preview_results
      WHERE owner_id = ? AND id = ?
      LIMIT 1`,
  )
    .bind(ownerId, resultId)
    .first<AssayPreviewResultRow>()
}

async function loadJobRow(
  db: D1Database,
  ownerId: string,
  jobId: string,
): Promise<AssayPreviewJobRow | null> {
  return db.prepare(
    `SELECT * FROM assay_preview_jobs
      WHERE owner_id = ? AND id = ?
      LIMIT 1`,
  )
    .bind(ownerId, jobId)
    .first<AssayPreviewJobRow>()
}

function reviewReferences(
  submittedCase: AssaySubmittedCaseRow,
  previewJob: AssayPreviewJobRow | null,
  acceptedResult: AssayPreviewResultRow | null,
): ReviewReferences {
  return {
    submittedCase: {
      d1Id: submittedCase.id,
      r2Key: submittedCase.case_r2_key,
    },
    previewJob: previewJob
      ? {
          d1Id: previewJob.id,
          inputR2Key: previewJob.input_r2_key,
        }
      : null,
    acceptedResult: acceptedResult
      ? {
          d1Id: acceptedResult.id,
          r2Key: acceptedResult.result_r2_key,
        }
      : null,
    caseHash: submittedCase.case_hash,
  }
}

async function latestRunResponse(
  db: D1Database,
  bucket: R2Bucket,
  job: AssayPreviewJobRow | null,
) {
  if (!job) return { job: null, resultSummary: null, result: null }

  const resultRow = await loadResultRowForJob(db, job.owner_id, job.id)
  const result = await loadResultPayload(
    bucket,
    resultRow?.result_r2_key ?? job.result_r2_key,
  )
  return {
    job: publicJob(job),
    resultSummary: resultRow ? publicResult(resultRow) : null,
    result,
  }
}

async function reviewSummary(db: D1Database, submittedCase: AssaySubmittedCaseRow) {
  const [latestJob, latestResult] = await Promise.all([
    loadLatestJobForSubmittedCase(db, submittedCase.owner_id, submittedCase.id),
    loadLatestResultForSubmittedCase(db, submittedCase.owner_id, submittedCase.id),
  ])
  const acceptedResult = submittedCase.accepted_result_id
    ? await loadResultRow(db, submittedCase.owner_id, submittedCase.accepted_result_id)
    : null
  const referenceJob = acceptedResult
    ? await loadJobRow(db, submittedCase.owner_id, acceptedResult.job_id)
    : latestJob

  return {
    ...publicSubmittedCase(submittedCase),
    latestJob: latestJob ? publicJob(latestJob) : null,
    latestResult: latestResult ? publicResult(latestResult) : null,
    reviewReferences: reviewReferences(submittedCase, referenceJob, acceptedResult),
  }
}

async function reloadSubmittedCase(db: D1Database, id: string): Promise<AssaySubmittedCaseRow> {
  const row = await db.prepare(
    `SELECT * FROM assay_submitted_cases WHERE id = ?`,
  )
    .bind(id)
    .first<AssaySubmittedCaseRow>()
  if (!row) throw new Error(`submitted case disappeared after update: ${id}`)
  return row
}

function contractsPayload() {
  return {
    apiVersion: ASSAY_API_VERSION,
    contracts: {
      submittedCase: {
        current: CURRENT_SUBMITTED_CASE_CONTRACT,
        supported: [...SUPPORTED_SUBMITTED_CASE_CONTRACTS],
      },
      previewInput: {
        current: CURRENT_PREVIEW_INPUT_CONTRACT,
        supported: [...SUPPORTED_PREVIEW_INPUT_CONTRACT_LIST],
      },
      previewResult: {
        current: CURRENT_PREVIEW_RESULT_CONTRACT,
        supported: [...SUPPORTED_PREVIEW_RESULT_CONTRACT_LIST],
      },
    },
    platforms: {
      known: [...ASSAY_PLATFORMS],
      previewRunnable: [...IMPLEMENTED_PREVIEW_PLATFORMS],
      defaultReview: [...DEFAULT_REVIEW_PREVIEW_PLATFORMS],
    },
    errorEnvelope: {
      shape: "versioned",
      fields: ["error.code", "error.message", "error.requestId", "error.details"],
    },
  }
}

function validateSubmittedCase(body: Record<string, unknown>): Array<{ field: string; message: string }> {
  const details: Array<{ field: string; message: string }> = []
  const contractVersion = numberField(body, "contractVersion")
  if (!contractVersion || !(SUPPORTED_SUBMITTED_CASE_CONTRACTS as readonly number[]).includes(contractVersion)) {
    details.push({ field: "contractVersion", message: "Unsupported submitted case contract version." })
  }

  if (!stringField(body, "draftId")) details.push({ field: "draftId", message: "draftId is required." })

  const requestedPlatforms = submittedCaseRequestedPlatforms(body)
  if (!requestedPlatforms) {
    details.push({ field: "requestedPlatforms", message: "requestedPlatforms must be a non-empty array when provided." })
  } else {
    const knownPlatforms = new Set<string>(ASSAY_PLATFORMS)
    for (const platform of requestedPlatforms) {
      if (!knownPlatforms.has(platform)) {
        details.push({ field: "requestedPlatforms", message: `${platform} is not a known assay platform.` })
      }
    }
  }

  if (!isRecord(body.case)) {
    details.push({ field: "case", message: "case must be an object." })
    return details
  }

  const candidate = body.case
  if (!stringField(candidate, "id")) details.push({ field: "case.id", message: "case.id is required." })
  if (!stringField(candidate, "subject")) details.push({ field: "case.subject", message: "case.subject is required." })

  const category = stringField(candidate, "category")
  if (!category) {
    details.push({ field: "case.category", message: "case.category is required." })
  } else if (!(ASSAY_CATEGORIES as readonly string[]).includes(category)) {
    details.push({ field: "case.category", message: `${category} is not a valid assay category.` })
  }

  const formulas = formulaValues(candidate.formula)
  if (!formulas) {
    details.push({ field: "case.formula", message: "case.formula must be a string or platform-to-formula object." })
  } else if (formulas.length === 0) {
    details.push({ field: "case.formula", message: "At least one formula is required." })
  } else {
    for (const formula of formulas) {
      if (!formula.startsWith("=")) {
        details.push({ field: "case.formula", message: "Formula must start with '='." })
        break
      }
    }
  }

  if (candidate.features !== undefined && !stringList(candidate.features)) {
    details.push({ field: "case.features", message: "case.features must be an array of strings." })
  }
  if (candidate.tags !== undefined && !stringList(candidate.tags)) {
    details.push({ field: "case.tags", message: "case.tags must be an array of strings." })
  }
  if (candidate.grid !== undefined && !isRecord(candidate.grid)) {
    details.push({ field: "case.grid", message: "case.grid must be an object keyed by cell reference." })
  }

  return details
}

function formulaValues(formula: unknown): string[] | null {
  if (typeof formula === "string") return [formula]
  if (!isRecord(formula)) return null
  const knownPlatforms = new Set<string>(ASSAY_PLATFORMS)
  const entries = Object.entries(formula)
  if (entries.length === 0) return []
  if (!entries.every(([platform, value]) => knownPlatforms.has(platform) && typeof value === "string")) return null
  return entries.map(([, value]) => value as string)
}

function normalizeSubmittedCaseForHash(
  submittedCase: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...submittedCase,
    features: Array.isArray(submittedCase.features) ? [...submittedCase.features].sort() : undefined,
    tags: Array.isArray(submittedCase.tags) ? [...submittedCase.tags].sort() : undefined,
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

function testSuiteStem(canonicalCaseId: string): string {
  const [stem] = canonicalCaseId.split("/")
  return stem && stem.trim() ? stem.trim() : "submitted"
}

function publicNameFromCanonicalCaseId(canonicalCaseId: string): string {
  const parts = canonicalCaseId.split("/").filter((part) => part.trim() !== "")
  return parts[parts.length - 1] ?? canonicalCaseId
}

function assayPrBranch(login: string, canonicalCaseId: string, submittedCaseId: string): string {
  const slug = canonicalCaseId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "case"
  return `draft/${login}/assay-${slug}-${submittedCaseId.slice(0, 8)}`
}

function yamlQuoted(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function yamlScalar(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "string") {
    if (/^[A-Za-z][A-Za-z0-9_.:/-]*$/.test(value)) return value
    return JSON.stringify(value)
  }
  return JSON.stringify(value)
}

function renderYamlField(lines: string[], indent: string, key: string, value: unknown): void {
  if (value === undefined) return
  if (key === "formula" && typeof value === "string") {
    lines.push(`${indent}${key}: ${yamlQuoted(value)}`)
    return
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${indent}${key}: []`)
      return
    }
    lines.push(`${indent}${key}:`)
    for (const item of value) {
      lines.push(`${indent}  - ${yamlScalar(item)}`)
    }
    return
  }
  if (isRecord(value)) {
    lines.push(`${indent}${key}:`)
    for (const [entryKey, entryValue] of Object.entries(value)) {
      renderYamlField(lines, `${indent}  `, entryKey, entryValue)
    }
    return
  }
  lines.push(`${indent}${key}: ${yamlScalar(value)}`)
}

function renderAssayTestYaml(candidate: Record<string, unknown>, canonicalCaseId: string): string {
  const publicName = stringField(candidate, "name") ?? publicNameFromCanonicalCaseId(canonicalCaseId)
  const lines = ["  -"]
  renderYamlField(lines, "    ", "subject", candidate.subject)
  renderYamlField(lines, "    ", "subjectRef", candidate.subjectRef)
  renderYamlField(lines, "    ", "name", publicName)
  for (const key of ["category", "formula", "grid", "expect", "features", "tags"] as const) {
    if ((key === "features" || key === "tags") && Array.isArray(candidate[key]) && candidate[key].length === 0) {
      continue
    }
    renderYamlField(lines, "    ", key, candidate[key])
  }
  return lines.join("\n")
}

function proposalBody(args: {
  submittedCase: AssaySubmittedCaseRow
  resultId: string
  requestedPlatforms: string[]
  fileContent: string
  stimulusHash: string
  reviewReferences: ReviewReferences
}): string {
  const previewJob = args.reviewReferences.previewJob
  const acceptedResult = args.reviewReferences.acceptedResult
  return [
    "## Accepted assay submission",
    "",
    `Submitted assay case: ${args.submittedCase.id}`,
    `Accepted preview result: ${args.resultId}`,
    `Preview input hash: ${args.submittedCase.case_hash}`,
    `Stimulus hash: ${args.stimulusHash}`,
    `Submitter: ${args.submittedCase.owner_id}`,
    `Requested platforms: ${args.requestedPlatforms.join(", ")}`,
    "",
    "## Proposed test YAML",
    "",
    "```yaml",
    args.fileContent,
    "```",
    "",
    "## Maintainer references",
    "",
    `Submitted case D1: ${args.reviewReferences.submittedCase.d1Id}`,
    `Submitted case R2: ${args.reviewReferences.submittedCase.r2Key}`,
    `Preview job D1: ${previewJob?.d1Id ?? "missing"}`,
    `Preview job input R2: ${previewJob?.inputR2Key ?? "missing"}`,
    `Accepted result D1: ${acceptedResult?.d1Id ?? "missing"}`,
    `Accepted result R2: ${acceptedResult?.r2Key ?? "missing"}`,
    "",
    "## Maintainer checklist",
    "",
    "- [ ] Confirm public ref and suite placement.",
    "- [ ] Review tags and divergence links.",
    "- [ ] Run fixture generation during review.",
    "- [ ] Inspect fixture diffs before merge.",
    "",
    "Fixture files are intentionally omitted from this generated proposal.",
  ].join("\n")
}

async function buildAcceptedAssayProposal(args: {
  submittedCase: AssaySubmittedCaseRow
  candidate: Record<string, unknown>
  acceptedResult: AssayPreviewResultRow
  acceptedJob: AssayPreviewJobRow
}): Promise<AcceptedAssayProposal> {
  const row = args.submittedCase
  const canonicalCaseId = row.canonical_case_id!
  const requestedPlatforms = JSON.parse(row.requested_platforms_json) as string[]
  const suiteStem = testSuiteStem(canonicalCaseId)
  const suggestedPath = `packages/assay/tests/${suiteStem}.yaml`
  const yaml = renderAssayTestYaml(args.candidate, canonicalCaseId)
  const stimulusHash = await submittedStimulusHash(args.candidate)
  const content = [
    "schemaVersion: 3",
    `name: ${yamlScalar(`${suiteStem} submissions`)}`,
    "tests:",
    yaml,
    "",
  ].join("\n")
  const references = reviewReferences(row, args.acceptedJob, args.acceptedResult)
  const prBody = proposalBody({
    submittedCase: row,
    resultId: row.accepted_result_id!,
    requestedPlatforms,
    fileContent: content,
    stimulusHash,
    reviewReferences: references,
  })

  return {
    submittedCaseId: row.id,
    acceptedResultId: row.accepted_result_id!,
    canonicalCaseId,
    caseHash: row.case_hash,
    stimulusHash,
    reviewReferences: references,
    suggestedPath,
    yaml,
    prTitle: `Add assay test ${canonicalCaseId}`,
    prBody,
    files: [
      {
        path: suggestedPath,
        mode: "add-or-append-test",
        content,
      },
    ],
    omitted: ["fixtures"],
    maintainerChecklist: [
      "Run fixture generation during review; fixtures are intentionally omitted from this proposal.",
      "Review public ref, suite placement, tags, and divergence links before merge.",
      "Inspect fixture diffs before merging the PR.",
    ],
  }
}

function addOrAppendAssayTest(existingContent: string | null, proposal: AcceptedAssayProposal): string {
  if (!existingContent) return proposal.files[0].content
  const trimmed = existingContent.replace(/\s+$/g, "")
  return `${trimmed}\n${proposal.yaml}\n`
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

async function submittedCaseHash(
  submittedCase: Record<string, unknown>,
  requestedPlatforms: string[],
): Promise<string> {
  return sha256Hex(canonicalJson({
    contractVersion: CURRENT_PREVIEW_INPUT_CONTRACT,
    assaySchemaVersion: ASSAY_CASE_SCHEMA_VERSION,
    candidate: normalizeSubmittedCaseForHash(submittedCase),
    requestedPlatforms: [...requestedPlatforms].sort(),
  }))
}

// The stability substrate's stimulus hash (assay-stimulus-v1), byte-shared
// with assay via the contracts payload builder — never a local copy again.
// A submitted preview case is standalone (no suite definitions/fixtures),
// so its authored formula IS the resolved formula; the grid gets the same
// error-string coercion assay's parser applies.
async function submittedStimulusHash(submittedCase: Record<string, unknown>): Promise<string> {
  const grid = submittedCase.grid
  const hash = await sha256Hex(stimulusPayload({
    formula: submittedCase.formula,
    grid: grid && typeof grid === "object" && !Array.isArray(grid)
      ? coerceStimulusGrid(grid as Record<string, unknown>)
      : undefined,
  }))
  return `sha256:${hash}`
}

app.get("/contracts", (c) => c.json(contractsPayload()))

app.get("/runner-status", async (c) => {
  if (!isAssayMaintainer(c.env, c.var.session.user_login)) {
    return c.json(errorResponse(
      "assay_maintainer_required",
      "Only assay maintainers can view runner status.",
      c.var.requestId,
    ), 403)
  }

  return c.json(await assayRunnerStatus(c.env.ASSAY_PREVIEW_DB))
})

app.get("/submitted-cases", async (c) => {
  const status = c.req.query("status")
  if (status && !(SUBMITTED_CASE_STATUSES as readonly string[]).includes(status)) {
    return c.json(errorResponse(
      "invalid_submitted_case_status",
      "Submitted case status filter is not valid.",
      c.var.requestId,
      [{ field: "status", message: "status must be draft, submitted, accepted, rejected, or expired." }],
    ), 400)
  }

  const binds: string[] = []
  const clauses: string[] = []
  if (!isAssayMaintainer(c.env, c.var.session.user_login)) {
    clauses.push("owner_id = ?")
    binds.push(c.var.session.user_login)
  }
  if (status) {
    clauses.push("status = ?")
    binds.push(status)
  }
  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : ""

  const rows = await c.env.ASSAY_PREVIEW_DB.prepare(
    `SELECT * FROM assay_submitted_cases
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT 50`,
  )
    .bind(...binds)
    .all<AssaySubmittedCaseRow>()
  const submittedCases = await Promise.all((rows.results ?? []).map((row) =>
    reviewSummary(c.env.ASSAY_PREVIEW_DB, row)
  ))

  return c.json({ submittedCases })
})

app.post("/submitted-cases", async (c) => {
  const contentLength = Number(c.req.header("Content-Length") ?? "0")
  if (contentLength > MAX_PREVIEW_INPUT_BYTES) {
    return c.json(errorResponse(
      "submitted_case_too_large",
      "Submitted case payload is too large.",
      c.var.requestId,
    ), 413)
  }

  const body = await readJsonObject(c.req.raw)
  if (!body) return c.json(errorResponse("bad_json", "Request body must be a JSON object.", c.var.requestId), 400)

  const details = validateSubmittedCase(body)
  if (details.length > 0) {
    return c.json(errorResponse(
      "invalid_submitted_case",
      "Submitted case is not valid enough to store.",
      c.var.requestId,
      details,
    ), 400)
  }

  const draftId = stringField(body, "draftId")!
  const requestedPlatforms = submittedCaseRequestedPlatforms(body)!
  const submittedCase = body.case as Record<string, unknown>
  const localCaseId = stringField(submittedCase, "id")!
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const caseHash = await submittedCaseHash(submittedCase, requestedPlatforms)
  const caseKey = `assay/submitted-cases/${id}/case.v${CURRENT_SUBMITTED_CASE_CONTRACT}.json`
  const source = stringField(body, "source") ?? "sheets-wiki"
  const requestedPlatformsJson = JSON.stringify([...requestedPlatforms].sort())
  const casePayload = {
    contractVersion: CURRENT_SUBMITTED_CASE_CONTRACT,
    assaySchemaVersion: ASSAY_CASE_SCHEMA_VERSION,
    id,
    ownerId: c.var.session.user_login,
    draftId,
    caseHash,
    requestedPlatforms: [...requestedPlatforms].sort(),
    case: submittedCase,
    createdAt: now,
  }
  const caseJson = JSON.stringify(casePayload)
  if (new TextEncoder().encode(caseJson).byteLength > MAX_PREVIEW_INPUT_BYTES) {
    return c.json(errorResponse(
      "submitted_case_too_large",
      "Submitted case payload is too large.",
      c.var.requestId,
    ), 413)
  }

  await c.env.ASSAY_PREVIEW.put(caseKey, caseJson, {
    httpMetadata: { contentType: "application/json" },
  })

  await c.env.ASSAY_PREVIEW_DB.prepare(
    `INSERT INTO assay_submitted_cases (
      id, owner_id, draft_id, local_case_id, status, case_hash, input_contract_version,
      case_schema_version, requested_platforms_json, case_r2_key, source, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      c.var.session.user_login,
      draftId,
      localCaseId,
      caseHash,
      CURRENT_SUBMITTED_CASE_CONTRACT,
      ASSAY_CASE_SCHEMA_VERSION,
      requestedPlatformsJson,
      caseKey,
      source,
      now,
      now,
    )
    .run()

  const row: AssaySubmittedCaseRow = {
    id,
    owner_id: c.var.session.user_login,
    draft_id: draftId,
    local_case_id: localCaseId,
    status: "draft",
    case_hash: caseHash,
    input_contract_version: CURRENT_SUBMITTED_CASE_CONTRACT,
    case_schema_version: ASSAY_CASE_SCHEMA_VERSION,
    requested_platforms_json: requestedPlatformsJson,
    case_r2_key: caseKey,
    source,
    canonical_case_id: null,
    accepted_result_id: null,
    created_at: now,
    updated_at: now,
    submitted_at: null,
    accepted_at: null,
    rejected_at: null,
    error_code: null,
    error_message: null,
  }

  return c.json({ submittedCase: publicSubmittedCase(row) }, 201)
})

app.post("/submitted-cases/:submittedCaseId/preview-jobs", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const row = await loadSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    c.var.session.user_login,
    submittedCaseId,
  )
  if (!row) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }

  const body = await readJsonObject(c.req.raw).catch(() => null) ?? {}
  const priority = numberField(body, "priority") ?? 0
  const payload = await loadSubmittedCasePayload(c.env.ASSAY_PREVIEW, row)
  if (!payload || !isRecord(payload.case)) {
    return c.json(errorResponse(
      "submitted_case_payload_missing",
      "Submitted case payload could not be loaded.",
      c.var.requestId,
    ), 409)
  }

  const requestedPlatforms = JSON.parse(row.requested_platforms_json) as string[]
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const requestedPlatformsJson = JSON.stringify([...requestedPlatforms].sort())
  const input = {
    contractVersion: CURRENT_PREVIEW_INPUT_CONTRACT,
    jobId: id,
    draftId: row.draft_id,
    ownerId: row.owner_id,
    candidateHash: row.case_hash,
    requestedPlatforms,
    candidate: payload.case,
    createdAt: now,
  }
  const inputJson = JSON.stringify(input)
  if (new TextEncoder().encode(inputJson).byteLength > MAX_PREVIEW_INPUT_BYTES) {
    return c.json(errorResponse(
      "preview_job_too_large",
      "Preview job payload is too large.",
      c.var.requestId,
    ), 413)
  }

  const inputKey = `assay-preview/inputs/${id}.json`
  await c.env.ASSAY_PREVIEW.put(inputKey, inputJson, {
    httpMetadata: { contentType: "application/json" },
  })

  await c.env.ASSAY_PREVIEW_DB.prepare(
    `INSERT INTO assay_preview_jobs (
      id, submitted_case_id, draft_id, case_id, owner_id, source, candidate_hash,
      input_contract_version, platforms_json, input_r2_key, state, priority, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)`,
  )
    .bind(
      id,
      row.id,
      row.draft_id,
      row.local_case_id,
      row.owner_id,
      row.source,
      row.case_hash,
      CURRENT_PREVIEW_INPUT_CONTRACT,
      requestedPlatformsJson,
      inputKey,
      priority,
      now,
      now,
    )
    .run()

  const job: AssayPreviewJobRow = {
    id,
    submitted_case_id: row.id,
    draft_id: row.draft_id,
    case_id: row.local_case_id,
    owner_id: row.owner_id,
    source: row.source,
    candidate_hash: row.case_hash,
    input_contract_version: CURRENT_PREVIEW_INPUT_CONTRACT,
    result_contract_version: null,
    platforms_json: requestedPlatformsJson,
    input_r2_key: inputKey,
    result_r2_key: null,
    state: "queued",
    priority,
    claimed_by: null,
    claim_nonce: null,
    claimed_at: null,
    heartbeat_at: null,
    created_at: now,
    updated_at: now,
    completed_at: null,
    error_code: null,
    error_message: null,
  }

  return c.json({ job: publicJob(job) }, 202)
})

app.get("/submitted-cases/:submittedCaseId", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const row = await loadReviewableSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    c.env,
    c.var.session.user_login,
    submittedCaseId,
  )
  if (!row) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }

  const summary = await reviewSummary(c.env.ASSAY_PREVIEW_DB, row)
  return c.json({
    submittedCase: publicSubmittedCase(row),
    latestJob: summary.latestJob,
    latestResult: summary.latestResult,
    reviewReferences: summary.reviewReferences,
  })
})

app.post("/submitted-cases/:submittedCaseId/submit", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const row = await loadSubmittedCase(c.env.ASSAY_PREVIEW_DB, c.var.session.user_login, submittedCaseId)
  if (!row) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }
  if (row.status !== "draft" && row.status !== "rejected") {
    return c.json(errorResponse(
      "bad_submitted_case_state",
      "Only draft or rejected cases can be submitted.",
      c.var.requestId,
    ), 409)
  }

  const now = new Date().toISOString()
  await c.env.ASSAY_PREVIEW_DB.prepare(
    `UPDATE assay_submitted_cases
      SET status = 'submitted',
        submitted_at = ?,
        updated_at = ?,
        error_code = NULL,
        error_message = NULL
      WHERE id = ? AND owner_id = ?`,
  )
    .bind(now, now, submittedCaseId, c.var.session.user_login)
    .run()

  return c.json({ submittedCase: publicSubmittedCase(await reloadSubmittedCase(c.env.ASSAY_PREVIEW_DB, submittedCaseId)) })
})

app.post("/submitted-cases/:submittedCaseId/reject", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const row = await loadReviewableSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    c.env,
    c.var.session.user_login,
    submittedCaseId,
  )
  if (!row) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }
  if (!isAssayMaintainer(c.env, c.var.session.user_login)) {
    return c.json(errorResponse(
      "assay_maintainer_required",
      "Only assay maintainers can reject submitted cases.",
      c.var.requestId,
    ), 403)
  }
  if (row.status !== "submitted") {
    return c.json(errorResponse(
      "bad_submitted_case_state",
      "Only submitted cases can be rejected.",
      c.var.requestId,
    ), 409)
  }

  const body = await readJsonObject(c.req.raw).catch(() => null) ?? {}
  const errorCode = stringField(body, "errorCode") ?? "rejected"
  const errorMessage = stringField(body, "errorMessage")
  const now = new Date().toISOString()
  await c.env.ASSAY_PREVIEW_DB.prepare(
    `UPDATE assay_submitted_cases
      SET status = 'rejected',
        rejected_at = ?,
        updated_at = ?,
        error_code = ?,
        error_message = ?
      WHERE id = ? AND owner_id = ?`,
  )
    .bind(now, now, errorCode, errorMessage, submittedCaseId, row.owner_id)
    .run()

  return c.json({ submittedCase: publicSubmittedCase(await reloadSubmittedCase(c.env.ASSAY_PREVIEW_DB, submittedCaseId)) })
})

app.post("/submitted-cases/:submittedCaseId/accept", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const row = await loadReviewableSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    c.env,
    c.var.session.user_login,
    submittedCaseId,
  )
  if (!row) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }
  if (!isAssayMaintainer(c.env, c.var.session.user_login)) {
    return c.json(errorResponse(
      "assay_maintainer_required",
      "Only assay maintainers can accept submitted cases.",
      c.var.requestId,
    ), 403)
  }
  if (row.status !== "submitted") {
    return c.json(errorResponse(
      "bad_submitted_case_state",
      "Only submitted cases can be accepted.",
      c.var.requestId,
    ), 409)
  }

  const compatibleResult = await c.env.ASSAY_PREVIEW_DB.prepare(
    `SELECT id FROM assay_preview_results
      WHERE owner_id = ?
        AND submitted_case_id = ?
        AND state = 'completed'
        AND result_contract_version = ?
      ORDER BY completed_at DESC
      LIMIT 1`,
  )
    .bind(row.owner_id, submittedCaseId, CURRENT_PREVIEW_RESULT_CONTRACT)
    .first<{ id: string }>()
  if (!compatibleResult) {
    return c.json(errorResponse(
      "missing_successful_result",
      "Submitted case needs a completed compatible preview result before acceptance.",
      c.var.requestId,
    ), 409)
  }

  const body = await readJsonObject(c.req.raw).catch(() => null) ?? {}
  const canonicalCaseId = stringField(body, "canonicalCaseId")
  if (!canonicalCaseId || !isCanonicalCaseId(canonicalCaseId)) {
    return c.json(errorResponse(
      "invalid_canonical_case_id",
      "canonicalCaseId must be a public assay ref in subjectRef/name form.",
      c.var.requestId,
      [{ field: "canonicalCaseId", message: "Use a public assay ref like SUM/basic-addition." }],
    ), 400)
  }
  const now = new Date().toISOString()
  await c.env.ASSAY_PREVIEW_DB.prepare(
    `UPDATE assay_submitted_cases
      SET status = 'accepted',
        canonical_case_id = ?,
        accepted_result_id = ?,
        accepted_at = ?,
        updated_at = ?,
        error_code = NULL,
        error_message = NULL
      WHERE id = ? AND owner_id = ?`,
  )
    .bind(canonicalCaseId, compatibleResult.id, now, now, submittedCaseId, row.owner_id)
    .run()

  return c.json({ submittedCase: publicSubmittedCase(await reloadSubmittedCase(c.env.ASSAY_PREVIEW_DB, submittedCaseId)) })
})

app.get("/submitted-cases/:submittedCaseId/pr-proposal", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const row = await loadReviewableSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    c.env,
    c.var.session.user_login,
    submittedCaseId,
  )
  if (!row) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }
  if (!isAssayMaintainer(c.env, c.var.session.user_login)) {
    return c.json(errorResponse(
      "assay_maintainer_required",
      "Only assay maintainers can generate submitted-case PR proposals.",
      c.var.requestId,
    ), 403)
  }
  if (row.status !== "accepted" || !row.canonical_case_id || !row.accepted_result_id) {
    return c.json(errorResponse(
      "submitted_case_not_accepted",
      "Only accepted submitted cases with an accepted result can produce a PR proposal.",
      c.var.requestId,
    ), 409)
  }

  const payload = await loadSubmittedCasePayload(c.env.ASSAY_PREVIEW, row)
  if (!payload || !isRecord(payload.case)) {
    return c.json(errorResponse(
      "submitted_case_payload_missing",
      "Submitted case payload could not be loaded.",
      c.var.requestId,
    ), 409)
  }

  const acceptedResult = await loadResultRow(c.env.ASSAY_PREVIEW_DB, row.owner_id, row.accepted_result_id)
  if (!acceptedResult) {
    return c.json(errorResponse(
      "accepted_result_missing",
      "Accepted preview result could not be loaded.",
      c.var.requestId,
    ), 409)
  }
  const acceptedJob = await loadJobRow(c.env.ASSAY_PREVIEW_DB, row.owner_id, acceptedResult.job_id)
  if (!acceptedJob) {
    return c.json(errorResponse(
      "accepted_preview_job_missing",
      "Accepted preview job could not be loaded.",
      c.var.requestId,
    ), 409)
  }

  const proposal = await buildAcceptedAssayProposal({
    submittedCase: row,
    candidate: payload.case,
    acceptedResult,
    acceptedJob,
  })

  return c.json({ proposal })
})

app.post("/submitted-cases/:submittedCaseId/pr", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const row = await loadReviewableSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    c.env,
    c.var.session.user_login,
    submittedCaseId,
  )
  if (!row) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }
  if (!isAssayMaintainer(c.env, c.var.session.user_login)) {
    return c.json(errorResponse(
      "assay_maintainer_required",
      "Only assay maintainers can materialize submitted cases as pull requests.",
      c.var.requestId,
    ), 403)
  }
  if (row.status !== "accepted" || !row.canonical_case_id || !row.accepted_result_id) {
    return c.json(errorResponse(
      "submitted_case_not_accepted",
      "Only accepted submitted cases with an accepted result can produce a PR.",
      c.var.requestId,
    ), 409)
  }
  const fork = c.var.session.fork_repo
  if (!fork) {
    return c.json(errorResponse(
      "no_fork",
      "A maintainer fork is required before opening an assay PR.",
      c.var.requestId,
    ), 400)
  }
  const [forkOwner, forkRepoName] = fork.split("/")
  if (!forkOwner || !forkRepoName) {
    return c.json(errorResponse(
      "bad_fork_repo",
      "Session fork_repo is malformed.",
      c.var.requestId,
    ), 500)
  }

  const payload = await loadSubmittedCasePayload(c.env.ASSAY_PREVIEW, row)
  if (!payload || !isRecord(payload.case)) {
    return c.json(errorResponse(
      "submitted_case_payload_missing",
      "Submitted case payload could not be loaded.",
      c.var.requestId,
    ), 409)
  }
  const acceptedResult = await loadResultRow(c.env.ASSAY_PREVIEW_DB, row.owner_id, row.accepted_result_id)
  if (!acceptedResult) {
    return c.json(errorResponse(
      "accepted_result_missing",
      "Accepted preview result could not be loaded.",
      c.var.requestId,
    ), 409)
  }
  const acceptedJob = await loadJobRow(c.env.ASSAY_PREVIEW_DB, row.owner_id, acceptedResult.job_id)
  if (!acceptedJob) {
    return c.json(errorResponse(
      "accepted_preview_job_missing",
      "Accepted preview job could not be loaded.",
      c.var.requestId,
    ), 409)
  }

  const proposal = await buildAcceptedAssayProposal({
    submittedCase: row,
    candidate: payload.case,
    acceptedResult,
    acceptedJob,
  })
  const file = proposal.files[0]
  const branch = assayPrBranch(c.var.session.user_login, proposal.canonicalCaseId, row.id)
  const canonicalFile = await readFile({
    token: c.var.session.user_token,
    owner: c.env.CANONICAL_OWNER,
    repo: c.env.CANONICAL_REPO,
    path: file.path,
    ref: "main",
  })
  const content = addOrAppendAssayTest(canonicalFile?.content ?? null, proposal)
  const message = `${proposal.prTitle}\n\n${proposal.prBody}`

  let writeResult
  try {
    writeResult = await writeFileToBranch({
      token: c.var.session.user_token,
      owner: forkOwner,
      repo: forkRepoName,
      branch,
      baseBranch: "main",
      path: file.path,
      content,
      message,
    })
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && (e as { status?: unknown }).status === 422) {
      return c.json(errorResponse(
        "branch_conflict",
        "Assay PR branch already changed concurrently; retry the request.",
        c.var.requestId,
      ), 409)
    }
    throw e
  }

  await squashDraftBranch({
    token: c.var.session.user_token,
    forkOwner,
    forkRepo: forkRepoName,
    branch,
    baseBranch: "main",
    message,
  })

  const pullRequest = await openPullRequest({
    token: c.var.session.user_token,
    forkOwner,
    canonical: { owner: c.env.CANONICAL_OWNER, repo: c.env.CANONICAL_REPO },
    branch,
    baseBranch: "main",
    title: proposal.prTitle,
    body: proposal.prBody,
  })

  if (pullRequest.mergeable === false) {
    return c.json({
      error: "conflict",
      pr_url: pullRequest.url,
      pr_number: pullRequest.number,
      branch,
      path: file.path,
      message: "assay PR branch conflicts with main; resolve via GitHub then retry",
    }, 409)
  }

  return c.json({
    branch,
    file: {
      path: file.path,
      mode: file.mode,
      commitSha: writeResult.commit_sha,
      contentSha: writeResult.content_sha,
    },
    proposal: {
      submittedCaseId: proposal.submittedCaseId,
      acceptedResultId: proposal.acceptedResultId,
      canonicalCaseId: proposal.canonicalCaseId,
      reviewReferences: proposal.reviewReferences,
    },
    pullRequest,
  })
})

app.get("/submitted-cases/:submittedCaseId/runs/latest", async (c) => {
  const submittedCaseId = c.req.param("submittedCaseId")
  const submittedCase = await loadReviewableSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    c.env,
    c.var.session.user_login,
    submittedCaseId,
  )
  if (!submittedCase) {
    return c.json(errorResponse(
      "submitted_case_not_found",
      "Submitted case was not found.",
      c.var.requestId,
    ), 404)
  }

  const row = await loadLatestJobForSubmittedCase(
    c.env.ASSAY_PREVIEW_DB,
    submittedCase.owner_id,
    submittedCaseId,
  )

  return c.json(await latestRunResponse(c.env.ASSAY_PREVIEW_DB, c.env.ASSAY_PREVIEW, row))
})

app.post("/preview-jobs", async (c) => {
  const contentLength = Number(c.req.header("Content-Length") ?? "0")
  if (contentLength > MAX_PREVIEW_INPUT_BYTES) return c.json({ error: "preview_job_too_large" }, 413)

  const body = await readJsonObject(c.req.raw)
  if (!body) return c.json({ error: "bad_json" }, 400)

  const draftId = stringField(body, "draftId")
  const caseId = stringField(body, "caseId")
  const candidateHash = stringField(body, "candidateHash")
  const requestedPlatforms = platformList(body.requestedPlatforms)
  const input = body.input
  if (!draftId || !caseId || !candidateHash || !requestedPlatforms || !isRecord(input)) {
    return c.json({ error: "bad_preview_job" }, 400)
  }
  const inputContractVersion = numberField(input, "contractVersion")
  if (!inputContractVersion || !SUPPORTED_PREVIEW_INPUT_CONTRACTS.has(inputContractVersion)) {
    return c.json({ error: "unsupported_input_contract" }, 400)
  }
  const inputPlatforms = platformList(input.requestedPlatforms)
  if (!inputPlatforms || !sameStringSet(inputPlatforms, requestedPlatforms)) {
    return c.json({ error: "bad_preview_input_platforms" }, 400)
  }
  if (!isRecord(input.candidate)) return c.json({ error: "bad_preview_input_candidate" }, 400)

  const priority = numberField(body, "priority") ?? 0
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const inputKey = `assay-preview/inputs/${id}.json`
  const inputJson = JSON.stringify(input)
  if (new TextEncoder().encode(inputJson).byteLength > MAX_PREVIEW_INPUT_BYTES) {
    return c.json({ error: "preview_job_too_large" }, 413)
  }
  await c.env.ASSAY_PREVIEW.put(inputKey, inputJson, {
    httpMetadata: { contentType: "application/json" },
  })

  await c.env.ASSAY_PREVIEW_DB.prepare(
    `INSERT INTO assay_preview_jobs (
      id, draft_id, case_id, owner_id, source, candidate_hash, input_contract_version, platforms_json,
      input_r2_key, state, priority, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?)`,
  )
    .bind(
      id,
      draftId,
      caseId,
      c.var.session.user_login,
      "sheets-wiki",
      candidateHash,
      inputContractVersion,
      JSON.stringify([...requestedPlatforms].sort()),
      inputKey,
      priority,
      now,
      now,
    )
    .run()

  return c.json({ job: { id, state: "queued", candidateHash } }, 202)
})

app.get("/cases/:caseId/runs/latest", async (c) => {
  const caseId = c.req.param("caseId")
  const draftId = c.req.query("draftId")
  if (!draftId) return c.json({ error: "missing_draft_id" }, 400)

  const row = await c.env.ASSAY_PREVIEW_DB.prepare(
    `SELECT * FROM assay_preview_jobs
      WHERE owner_id = ? AND draft_id = ? AND case_id = ?
      ORDER BY created_at DESC
      LIMIT 1`,
  )
    .bind(c.var.session.user_login, draftId, caseId)
    .first<AssayPreviewJobRow>()

  if (!row) return c.json({ job: null, resultSummary: null, result: null })
  return c.json(await latestRunResponse(c.env.ASSAY_PREVIEW_DB, c.env.ASSAY_PREVIEW, row))
})

export default app
