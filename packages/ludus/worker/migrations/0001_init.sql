CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL,
  sheet_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  status TEXT NOT NULL,          -- running | done
  verdict TEXT,                  -- accepted | wrong-answer | lint-reject | sheet-inaccessible | template-damaged | judge-error
  detail TEXT,                   -- JSON: {lintErrors, cases} (hidden cases pre-redacted)
  scratch_id TEXT,               -- kept only when the run failed (debugging quarantine)
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_submissions_ip ON submissions (ip_hash, created_at);
