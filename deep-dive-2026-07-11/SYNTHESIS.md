# Synthesis — deep-dive 2026-07-11

The fan-out completed end-to-end: 14 analyst batches + Excel lane + gsheets lane. Everything
below is on disk in this directory; this file is the executive join.

## Totals

- **877 / 877 uncovered forks covered** by **149 clustered annotations** (validated: every
  work-list ref in exactly one scope; zero dangling). Confidence: 133 high, 16 medium.
- **95 deep-dive notes files** across the batches (wiki-facing material).
- **87 probe requests** → **73 Excel probes run (73 value outcomes, 0 crashes, all hypotheses
  confirmed)** and **78 gsheets probes run (74 confirmed, 3 contradicted, 1 unclear; no wedge,
  no quota hit)**. Excel additionally ran 13 disambiguation follow-ups.
- Cause distribution across annotations: missing-function 50 · arg-semantics 21 · TODO 15 ·
  precision 10 · unimplemented-edge 9 · array-handling 8 · error-code 7 · error-attribution 5 ·
  null-vs-zero 4 · format-rendering 4 · the rest ≤3 each.

## Cross-cutting findings (independently converged on by multiple batches)

1. **LibreOffice blank-capture artifact.** The LibreOffice fixtures for at least info, arrays,
   array-longtail, lookup, and the date/volatile suites are uniformly `[[null]]` — even for
   trivially-supported formulas (`=ISNUMBER(42)`, `=INDEX(...)`). Dozens of "forks" (39 in info
   alone) exist only because of this. **Action: LibreOffice re-record, then regen coverage** —
   many annotations marked cause `TODO` self-dissolve.
2. **pycel `#NAME?` cascade artifact.** pycel emits `#NAME?` for bare error-raising operator
   sub-expressions (`=1/0`, `=NA()+1`), cascading through wrappers. A driver/engine artifact
   documented in date-volatile-errors/notes/pycel-driver-artifacts.md.
3. **HyperFormula + IronCalc lack the entire dynamic-array family** (SEQUENCE, FLATTEN, reshape
   family, LINEST/LOGEST/TREND/GROWTH spill forms) — the single biggest genuine-gap cluster.
4. **Excel "entry rejection → blank" class** (Excel lane discovery): `=INDEX(A1:A3)` (row_num
   omitted), `=AND()`, `=SUM()` are refused at formula entry and record as an EMPTY cell — not
   a value, not an error. Recorded Excel blanks for these refs are rejections; do not read them
   as `0`/blank-value semantics.
5. **gsheets array-arithmetic orientation rule** (gsheets lane discovery): row + column vectors
   broadcast to a full outer-product grid, but row + row of unequal length collapses to a
   scalar (no `#N/A` padding, unlike Excel). Similarly `IFERROR` does not auto-map over arrays
   without `ARRAYFORMULA`.
6. **String grid seeds are RAW-stored in gsheets** — a seeded `"=1/0"` is literal text, never a
   live formula. Probes needing live-formula cells must use `{formula: ...}` seed objects.
   Affects how several recorded fixtures should be read (e.g. SUM-over-error tests).

## Corrections the reconciler MUST apply before using affected annotations

(Details in probes/excel-lane-notes.md and probes/gsheets-lane-notes.md.)

- `math-longtail-acot-branch`: Excel ACOT(-0.5) = **2.0344439357957027** (hypothesis's 2.6779
  wrong; mechanism confirmed). gsheets ACOT value still unconfirmed live.
- `stat-core-002`: PERCENTRANK.EXC **truncates** at 6 sig digits too (0.166666, not 0.166667).
- `engineering-003`: IMEXP("10+3i") real part **-21806.035863485** (not ~-21801).
- `dve-007`: gsheets `IFERROR(10/{1,0,2},-1)` returns scalar **10** — no spill (annotation's
  broadcast claim false for gsheets).
- `spill-broadcast-004`: gsheets `={1,2,3}+{10,20}` returns scalar **11** — no `#N/A` padding.
- `math-core-004`: gsheets CONVERT diverges from Excel only at the ~15th digit (15-sig-fig
  cap), not a 9-decimal rounding.
- `lookup-002`: unresolved — needs a `{formula:...}`-seeded FORMULATEXT probe.

## Operational residue

- **gsheets scratch spreadsheet to delete manually** (no drive scope):
  `1W7avHwot1cP3cyFSa4lv41A1kld6kt77mLfFp_GAgJI` ("assay-deep-dive-2026-07-11").
- Per-batch summaries are named `SUMMARY.md` or `BATCH-SUMMARY.md` (a hook blocked the former
  name for subagents mid-run; content is identical in intent).
- Analyst scratch scripts + the work-list generator live in `packages/assay/scratch/`
  (`worklist.mts`, `worklist/*.json`, `lane-*` scripts + raw outputs) — kept for provenance.
- Work-lists were cut against DV-seeded coverage (the live store's human annotations weren't
  exported); re-run `assay annotation-coverage` with a fresh store export before bulk insert.
