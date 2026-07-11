# libreoffice all-null fixture — methodology note (NOT a semantic divergence)

**Batch:** stat-core · **Scope:** all 62 refs in this batch (libreoffice is a divergence class in every one) · **Confidence:** high

## What this is

In **every** fork in the statistical and statistical-descriptive work-lists, one of the agreement classes is `{ libreoffice: blank }`. This is not LibreOffice behavior — it is a **stale/empty recording**. The libreoffice fixtures for these two suites contain a `null` result for every case:

```
fixtures/statistical/libreoffice.json          -> 0 numeric results, all null,  generatedAt 2026-05-11
fixtures/statistical-descriptive/libreoffice.json -> 0 numeric results, 180 nulls, generatedAt 2026-05-11
```

By contrast the sibling fixtures were regenerated much later (e.g. `excel.json` generatedAt 2026-06-17). LibreOffice returns `blank` even for `=AVERAGE(1,2,3,4)` (recorded blank, where every other engine records 2.5), which is impossible as a real result — LibreOffice computes AVERAGE correctly. The fixture is a placeholder from a run that produced no values.

## Why it matters for this batch

Because libreoffice-blank appears in all 62 cases, it is the _only_ divergence in 35 of them (otherwise-unanimous cases like `AVERAGE`, `COUNT`, `MAX`, `MIN`, `LARGE`, `SMALL`, `SUMIF`, `AVERAGEIF`). Those 35 refs are annotated as a single cluster whose mechanism is "stale libreoffice recording," cause `TODO` (there is no dedicated "harness-artifact" cause in the vocabulary; `TODO` flags it as needing re-recording rather than asserting a false semantic split).

For the remaining 27 cases the libreoffice blank rides _alongside_ a genuine cross-engine divergence (pycel/hyperformula/ironcalc missing functions, the empty-string COUNTA/COUNTBLANK split, the `*A` inline-boolean behavior, MODE.MULT array handling, PERCENTRANK.EXC precision, the pycel inline-negative bug). Each of those annotations describes the real mechanism _and_ notes the libreoffice artifact so the reconciler does not mistake the blank for behavior.

## Recommendation

- **Re-record the libreoffice fixtures for `statistical` and `statistical-descriptive`** (and check other suites for the same 2026-05-11 all-null signature). Until then, libreoffice blanks in these suites carry no evidentiary weight and should be excluded from any "which engines agree" rollup.
- Do **not** write per-function wiki caveats claiming LibreOffice returns blank for these functions — that would be wrong.

## Open questions

- Is the all-null signature limited to these two suites or repo-wide for the 2026-05-11 libreoffice run? A quick scan of `fixtures/*/libreoffice.json` for `generatedAt: 2026-05-11` + zero numeric results would answer it. This is a harness/re-recording task for a human, not an engine-semantics question.
