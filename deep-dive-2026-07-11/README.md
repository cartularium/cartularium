# Deep-dive 2026-07-11 — sheets.wiki evidence sweep

A spray-and-pray fan-out (14 parallel analyst agents + 1 Excel lane + 1 gsheets lane, all on
Fable) over assay's ~877 unannotated forks, producing wiki-grade cross-engine research for
sheets.wiki. **This directory is raw material for a later reconciliation pass** — nothing here
was auto-applied to the store, the corpus, or the wiki.

## Layout

```
SYNTHESIS.md                  START HERE — executive join: totals, cross-cutting findings,
                              the corrections the reconciler must apply
BRIEF.md                      the shared instructions every analyst followed (schemas live here)
batches/<batch>/
  annotations.json            draft fork annotations, AssayForkAnnotationInput-shaped + _meta
  skipped.json                work-list refs the analyst could not cover, with reasons (optional)
  notes/<SUBJECT>.md          wiki-grade deep-dive notes (the human-readable material)
  probe-requests.json         claims wanting live Excel / Google Sheets confirmation
  SUMMARY.md / BATCH-SUMMARY.md   one-page batch summary (two names — a hook blocked the first)
probes/
  excel-results.json          Excel lane: 73 results {id, formula_used, outcome, verdict, note}
  excel-lane-notes.md         Excel lane prose findings + hypothesis corrections
  gsheets-results.json        gsheets lane: 78 results, same shape
  gsheets-lane-notes.md       gsheets lane prose findings + contradictions
  _excel-requests.json / _excel-raw.json / gsheets-raw-results.json   lane intermediates
```

Work-lists the batches were cut from: `packages/assay/scratch/worklist/<suite>.json`
(uncovered = manifest forks minus DV-seeded annotation coverage, computed at
`packages/assay/scratch/worklist.mts`; totals in `scratch/worklist/_summary.json`).

## Batch → suites map

| batch                   | suites                                      | uncovered forks |
| ----------------------- | ------------------------------------------- | --------------- |
| math-longtail           | math-longtail                               | 116             |
| stat-distributions      | statistical-distributions                   | 106             |
| engineering             | engineering                                 | 79              |
| info                    | info                                        | 63              |
| financial               | financial-securities, financial-timevalue   | 63              |
| stat-core               | statistical, statistical-descriptive        | 62              |
| math-core               | math, operator, parser                      | 60              |
| text-regex              | text, text-longtail, regex                  | 60              |
| spill-broadcast         | broadcasting, spill, spill-edge             | 57              |
| date-volatile-errors    | date, volatile, error-handling, divergences | 53              |
| lambda-logical-coercion | lambda, logical, type-coercion              | 46              |
| stat-analytics          | statistical-analytics, database, external   | 41              |
| arrays                  | arrays, array-longtail                      | 40              |
| lookup                  | lookup, lookup-longtail                     | 31              |

## How to reconcile

1. **Annotations → store.** Each `annotations.json` entry is `{content, cause, scope}` plus a
   `_meta` block (batch, confidence, evidence, wants_probe). Strip `_meta` before POSTing to
   `/api/edit/assay/fork-annotations`. Treat `confidence: low` and any entry whose
   `wants_probe` ids came back CONTRADICTED by `probes/*-results.json` as needs-human-review;
   everything else is store-ready scaffolding (unverified — `verified_by` stays null).
2. **Probe results → annotations.** Join `probes/excel-results.json` / `gsheets-results.json`
   to annotations via `_meta.wants_probe` ↔ probe-request `id`. A result that contradicts the
   request's `hypothesis` means the consuming annotation's content needs revision before use.
3. **Notes → wiki.** `notes/*.md` are drafts of "cross-engine behavior" material for
   `packages/sheets-wiki/content/function/<NAME>.md`. They may editorialize (the wiki is a
   consumer lens); annotations may not. Check each note's Confidence line and its Open
   questions section before promoting content.
4. **Coverage check.** Every work-list ref should appear in exactly one annotation scope or in
   `skipped.json`. `packages/assay/scratch/worklist/_summary.json` has the per-suite totals to
   audit against.

## Trust model

- Grounded in: recorded fixtures (8 engines), live pure-engine probes (hyperformula, ironcalc,
  formulas, pycel — run during the sweep), and live Excel/gsheets confirmation probes (the two
  serialized lanes).
- NOT re-verified: lattice / libreoffice claims (recorded fixtures only — neither runs on this
  machine); any claim marked `confidence: low` or citing literature/training knowledge.
- The annotation store's live state may have drifted from the DV-seed approximation used to cut
  the work-lists; re-run `assay annotation-coverage` against a fresh store export before bulk
  insert to drop any newly-covered refs.
