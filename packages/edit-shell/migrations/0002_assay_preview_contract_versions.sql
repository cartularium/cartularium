ALTER TABLE assay_preview_jobs
  ADD COLUMN input_contract_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE assay_preview_jobs
  ADD COLUMN result_contract_version INTEGER;

CREATE INDEX IF NOT EXISTS assay_preview_jobs_queue_contract_idx
  ON assay_preview_jobs (state, input_contract_version, priority DESC, created_at ASC);
