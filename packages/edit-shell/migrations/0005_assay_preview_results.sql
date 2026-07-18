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
);

CREATE INDEX IF NOT EXISTS assay_preview_results_job_idx
  ON assay_preview_results (job_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS assay_preview_results_submitted_case_idx
  ON assay_preview_results (owner_id, submitted_case_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS assay_preview_results_candidate_idx
  ON assay_preview_results (candidate_hash, state, completed_at DESC);
