# history/ — the Assay run ledger

This directory is the evidence ledger of the stability substrate (design
approved 2026-07-18: `internal/research/assay/stability-substrate-design-2026-07-18.md`,
per `internal/decisions/2026-07-18-assay-stability-substrate-approval.md`).
It opens with the identity baseline; run #1 — the sanctioned regeneration —
will be its first run record and the epoch boundary of the trustworthy
corpus.

Files here are append-only JSONL (interim storage; the row semantics, not
the format, are the contract). Rows are never edited; corrections are rows.

## archive-pre-refounding/

**Re-founded 2026-07-18.** The pre-refounding ledger (3 runs, 59k
fixture-change rows, 761 DV events, capability snapshots) is preserved
there as fossil and is never merged into this ledger: its `test_id` key
scheme is irreconcilable with the declared case identity, and its corpus
is held suspect in its entirety (refounding record, walkthrough stop 1).
It includes 94 fixture keys that resolve to no current case — the fossil
is their record. Read-only; the old `assay history` machinery that wrote
it is retired and refuses to run against this directory.
