export type AssayPreviewJobState = "queued" | "claimed" | "running" | "completed" | "failed" | "canceled"
export type AssaySubmittedCaseStatus = "draft" | "submitted" | "accepted" | "rejected" | "expired"
export type AssayPreviewResultState = "completed" | "failed"

export interface AssayPreviewJobRow {
  id: string
  submitted_case_id: string | null
  draft_id: string
  case_id: string
  owner_id: string
  source: string
  candidate_hash: string
  input_contract_version: number
  result_contract_version: number | null
  platforms_json: string
  input_r2_key: string
  result_r2_key: string | null
  state: AssayPreviewJobState
  priority: number
  claimed_by: string | null
  claim_nonce: string | null
  claimed_at: string | null
  heartbeat_at: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  error_code: string | null
  error_message: string | null
}

export interface AssaySubmittedCaseRow {
  id: string
  owner_id: string
  draft_id: string
  local_case_id: string
  status: AssaySubmittedCaseStatus
  case_hash: string
  input_contract_version: number
  case_schema_version: number
  requested_platforms_json: string
  case_r2_key: string
  source: string
  canonical_case_id: string | null
  accepted_result_id: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  accepted_at: string | null
  rejected_at: string | null
  error_code: string | null
  error_message: string | null
}

export interface AssayPreviewResultRow {
  id: string
  job_id: string
  submitted_case_id: string | null
  draft_id: string
  case_id: string
  owner_id: string
  source: string
  candidate_hash: string
  result_contract_version: number
  platforms_json: string
  result_r2_key: string
  state: AssayPreviewResultState
  runner_id: string
  created_at: string
  completed_at: string
  error_code: string | null
  error_message: string | null
}
