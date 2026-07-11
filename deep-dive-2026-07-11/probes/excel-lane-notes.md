# Excel lane — probe notes (2026-07-11)

Ran all **73** excel-targeted probe requests via `createDriver("excel")` (live Excel through the
python/uv toolchain), plus **13** disambiguation follow-ups explicitly requested inside hypotheses.
Every one of the 73 returned a `value` outcome — **no crashes, no rejected/infra/skipped outcomes**.
Every excel-specific claim was **confirmed**. Full data in `excel-results.json`; the follow-up raw is
in `packages/assay/scratch/lane-excel-followups-out.json`.

## Corrections the reconciler MUST apply (hypothesis prose was wrong)

1. **`math-longtail-acot-branch` — ACOT(-0.5): predicted value 2.6779 is WRONG.**
   The true Excel value is **2.0344439357957027** (= π + ATAN(1/(-0.5)) = π + ATAN(-2)). The
   _mechanism_ the annotation grounds (Excel uses the principal branch in (0,π); gsheets uses the
   ATAN(1/x) branch) is confirmed and unaffected, but the wiki/annotation must use 2.0344439357957027,
   not 2.6779. The hypothesis's gsheets prediction (-0.4636 = ATAN(-0.5)) is also internally
   inconsistent — if gsheets uses ATAN(1/x) it would be ATAN(-2)=-1.1071, not -0.4636. **gsheets ACOT
   still needs live confirmation** (not my lane).

2. **`stat-core-002` — PERCENTRANK.EXC 6-digit call is TRUNCATED, not rounded.**
   Excel returned `"0.166|0.166666"`. The default (3-sig) `0.166` confirms the truncate convention.
   But the 6-significant-digit call returns **0.166666** (truncated), NOT the **0.166667** (rounded)
   the hypothesis predicted. So PERCENTRANK truncates at both precisions. True value is 1/6=0.16666…

3. **`engineering-003` — IMEXP("10+3i") real part is -21806, not ~-21801.**
   Actual: `"-21806.035863485+3108.37503049351i"`. The hypothesis's "-21801" was a rough estimate;
   the 15-significant-digit rendering claim it grounds is confirmed.

## Load-bearing findings from the disambiguation follow-ups

- **Single-argument INDEX is an ENTRY REJECTION in Excel → an EMPTY cell** (not a spill, not an
  error). Verified with controls: `=INDEX(A1:A3)`, `=INDEX({1;2;3})`, and `=INDEX(A1:A3*10)` all
  return an empty/blank cell (no value, no sentinel). By contrast `=INDEX(A1:A2,0)` **spills the
  whole column** `[[1],[2]]`. So the rule is "`row_num` omitted ⇒ Excel rejects at entry ⇒ blank".
  This is the mechanism behind **`spill-broadcast-001`** and **`spill-broadcast-002`** (gsheets
  spills the array; Excel yields nothing). Reconciler: the recorded Excel "blank" for these is a
  formula-entry rejection, **not** a computed value or an error code.

- **`=AND()`, `=SUM()` (zero-arg) likewise return an EMPTY cell** — Excel refuses to store the
  formula (too few arguments). Same class as single-arg INDEX. `lambda-logical-coercion-003`,
  `math-core-003`. Do not treat these blanks as `0` or as an error sentinel.

- **INDEX index-out-of-range progression:** `INDEX(A1:A2, 0)` → whole-column spill;
  `INDEX(A1:A2, -1)` → `#VALUE!`; `INDEX(A1:A2, 5)` → `#REF!` (`lookup-005`).

- **LOOKUP over a SQUARE array orients VERTICALLY.** `=LOOKUP(2, {1,2;3,4})` → **2** in Excel
  (search first column `[1;3]`, approx-match `1` at row 1, return last column row 1 = `2`). This
  MATCHES pycel's "returns the key 2" observation (`lookup-006`). The wider-than-tall case
  `{1,2,3;"a","b","c"}` → `"b"` (horizontal, as expected).

- **ADDRESS quotes sheet names with spaces:** `=ADDRESS(1,1,1,TRUE,"My Sheet")` → `'My Sheet'!$A$1`
  (simple `"Sheet2"` stays unquoted) (`lookup-001`).

- **REGEXEXTRACT return_mode=2** spills capture groups `["2025","03","01"]` as a row; default mode
  returns the full match string (`text-regex-001`). (Excel added REGEXEXTRACT in 2024.)

- **All \*B byte-functions collapse to per-character counting** on this Western-locale (non-DBCS)
  Excel: `LENB("あ")=1`, `MIDB("あいう",3,2)="う"`, `FINDB("い","あいう")=2`, `LEFTB("あいう",2)="あい"`.
  Confirms the recording-environment locale assumption (`text-regex-002`).

## Grid-seed fidelity note (relevant to the reconciler beyond one probe)

- **`dve-001` — formula-valued grid seeds are NOT evaluated live by the Excel harness.**
  `=SUM(A1:A3)` with `A2` seeded as the string `"=1/0"` returned **4** (= 1+3), meaning A2 was
  ingested as an inert cell (text/ignored), NOT as a live `#DIV/0!` error cell. So the fork vs the
  pure engines (which return `#DIV/0!`) is a **seed-ingestion-fidelity** artifact, not an
  error-propagation semantics divergence. Genuinely error-valued cells _would_ propagate in Excel.
  (Cause bucket for the annotation: closer to a harness/seed-fidelity note than `recalc-semantics`.)

## Confirmed as-hypothesized (no surprises) — grouped

- **Excel-absent functions → #NAME?:** FLATTEN (arrays-001), IMLOG (engineering-001), IMTANH
  (engineering-006). SORTBY works in Excel (lambda-002).
- **Error-code splits, Excel side pinned:** IMDIV zero → #NUM! (engineering-002); RRI nper=0 → #NUM!
  (financial-003); CHOOSE out-of-range → #VALUE! (lambda-004); MUNIT(0) → #VALUE! (math-longtail);
  CHAR(0) → #VALUE! (text-regex-004); BETA.DIST out-of-support → #NUM! (stat-dist-003); ACOTH(0.5)
  domain → #NUM!; CHISQ.TEST shape mismatch → #N/A (stat-dist-002).
- **Text-date coercion (Excel coerces):** WEEKNUM (dve-002), YEARFRAC (dve-003), XIRR (financial-002)
  — but **XNPV does NOT** coerce (→ #VALUE!, financial-001): a real intra-Excel asymmetry.
- **Dynamic-array spills confirmed:** SEQUENCE variants, SORT desc (arg3=-1=sort_order), LEN\*1 spill,
  broadcast +#N/A padding, WRAPROWS #N/A pad, TREND column, RANDARRAY integer-mode, IFERROR broadcast.
- **Coercion "skip-text/skip-bool in array literals":** PRODUCT/SUM of quoted strings or booleans in
  `{...}` → 0 (lambda-006/007/008).
- **Precision baselines pinned:** ERF.PRECISE, CONVERT (full double), CONFIDENCE, NORM.S.INV,
  IPMT, ACCRINT (Excel=295.8333…), the 15-sig-fig complex-string rendering (IMEXP, IMLN, IMPOWER).
- **Blank/empty-string representation:** ISBLANK("")=TRUE but ISBLANK(="")=FALSE (info-002/002b);
  T(TRUE)=blank cell (lambda-005); COUNTA counts ""-as-blank (stat-core-001); TYPE(empty)=1;
  CELL("format")="G"; SHEETS(A1)=1; UNIQUE case-insensitive keeps first casing; HYPERLINK → plain
  display-label string (not opaque); DOLLAR(-1234.5,2)="($1,234.50)" accounting parens.

## Not testable in this lane (needs the gsheets lane)

Many hypotheses pair an Excel claim (confirmed here) with a gsheets prediction I cannot verify:
ACOT gsheets branch, gsheets error-code halves (IMDIV #DIV/0!, RRI #DIV/0!, CHOOSE #NUM!, MUNIT
#NUM!, CHAR #NUM!), gsheets precision drift (CONFIDENCE, NORM.S.INV, CONVERT rounding), gsheets
RANDARRAY #N/A, gsheets SORT/SORTBY arg semantics, gsheets UNIQUE case-sensitivity, gsheets
implicit-intersection (LEN), gsheets ISBLANK/COUNTA empty-string handling, gsheets ACCRINT
day-count (295.5556), gsheets IMLOG/IMTANH "3"/"0". These are flagged in each result's `note`.
