ALTER TABLE assay_submitted_cases
  ADD COLUMN accepted_result_id TEXT;

CREATE INDEX IF NOT EXISTS assay_submitted_cases_accepted_result_idx
  ON assay_submitted_cases (accepted_result_id);
