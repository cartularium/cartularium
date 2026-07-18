CREATE TABLE IF NOT EXISTS assay_preview_jobs (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  source TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
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
);

CREATE INDEX IF NOT EXISTS assay_preview_jobs_queue_idx
  ON assay_preview_jobs (state, priority DESC, created_at ASC);

CREATE INDEX IF NOT EXISTS assay_preview_jobs_owner_case_idx
  ON assay_preview_jobs (owner_id, draft_id, case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS assay_preview_jobs_candidate_idx
  ON assay_preview_jobs (candidate_hash, state, updated_at DESC);
