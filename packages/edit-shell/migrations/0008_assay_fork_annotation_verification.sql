-- Verification provenance for fork annotations (CP3 increment #3, provenance reclassify — 2026-06-27).
-- The THIRD provenance axis, independent of author_id (authorship) and status (hygiene moderation):
-- a named human has CHECKED an annotation's claim against the live evidence and signed. Agent-seeded
-- annotations are unverified (NULL) scaffolding; a human-verified lens is the asset. Set by the
-- verification act (POST /:id/verify, maintainer-gated); cleared whenever the authored content is
-- edited (an attestation is to a content snapshot). NEVER correctness-vouching by assay — it is the
-- verifier's attributed claim, joined out of band like the rest of the annotation.

ALTER TABLE assay_fork_annotations ADD COLUMN verified_by TEXT;
ALTER TABLE assay_fork_annotations ADD COLUMN verified_at TEXT;

-- The human-verification backlog query: published rows still awaiting verification
-- (verified_at IS NULL), most-recently-touched first.
CREATE INDEX IF NOT EXISTS assay_fork_annotations_verified_idx
  ON assay_fork_annotations (verified_at, updated_at DESC);
