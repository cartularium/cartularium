ALTER TABLE assay_preview_jobs
  ADD COLUMN submitted_case_id TEXT;

CREATE INDEX IF NOT EXISTS assay_preview_jobs_submitted_case_idx
  ON assay_preview_jobs (owner_id, submitted_case_id, created_at DESC);
