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
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  submitted_at TEXT,
  accepted_at TEXT,
  rejected_at TEXT,
  error_code TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS assay_submitted_cases_owner_draft_local_idx
  ON assay_submitted_cases (owner_id, draft_id, local_case_id);

CREATE INDEX IF NOT EXISTS assay_submitted_cases_hash_idx
  ON assay_submitted_cases (case_hash, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS assay_submitted_cases_status_idx
  ON assay_submitted_cases (status, updated_at DESC);
