-- The fork-annotation store (CP3 increment #3, 3a — ratified 2026-06-26).
-- One authored, attributed, scoped claim about one or more observed forks, joined to assay's
-- manifest out of band by case-ref. `scope_json` holds the AnnotationScope clause array (a list
-- can mix kinds, so there is no scope_kind column). `status` is the §9 review gate (OPTION B):
-- new contributions land `pending`; a maintainer publishes/rejects; migrated DVs import `published`.
-- `cause`/`engines`/`category` are NOT observed facts stored here — `engines`/`category` are
-- derived from the manifest join at read time; only the optional coarse `cause` facet is kept.

CREATE TABLE IF NOT EXISTS assay_fork_annotations (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  cause TEXT,
  scope_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'published', 'rejected')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS assay_fork_annotations_status_idx
  ON assay_fork_annotations (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS assay_fork_annotations_author_idx
  ON assay_fork_annotations (author_id, updated_at DESC);
