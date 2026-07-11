# New forks discovered in the 2026-07-11 sweep

Definitive registry of cross-engine divergences observed via live probing during the deep-dive
that are **not already expressed by an existing corpus case**. Every candidate was checked against
`packages/assay/tests/<suite>.yaml` before being admitted here.

## Headline: the sweep overwhelmingly _confirmed_ existing coverage

The dominant result of the fan-out is that the corpus already anticipated nearly every edge the
analysts and lanes probed. Candidate after candidate turned out to have a precise, already-present
corpus case, e.g.:

- UNIQUE case-folding (`Apple`/`apple`/`APPLE`) → `operator.yaml` `unique-mixed-types-case`
- `=ISBLANK(A1)` with `A1=""` → `info.yaml` `isblank-of-empty-string-cell`
- gsheets row+row collapse `={1,2,3}+{10,20}` → `broadcasting.yaml:161`
- gsheets `=IFERROR(10/{1,0,2},-1)` no auto-map → `error-handling.yaml:251`
- single-arg `=INDEX({1,2,3}+{10;20;30})` entry rejection → `broadcasting.yaml:928`
- `STDEVA(1,2,TRUE)` inline-boolean coercion → `statistical-descriptive.yaml:2914` (+ VARA/STDEVPA/VARPA/AVERAGEA)
- `DEC2BIN(-2)` / `DEC2HEX(-1)` / `DEC2OCT(-1)` two's-complement + pycel gap → `engineering.yaml`
- IMDIV `/0` `#NUM!`, `MUNIT(0)`, `CHAR(0)` error-code splits → `engineering.yaml` / `math-longtail.yaml` / `text-longtail.yaml`
- CHISQ.TEST/CHITEST df divergence (lattice `r·c−1`) → `statistical-distributions.yaml:296`
- `DOLLAR(-1234.5,2)` accounting parens → `text-longtail.yaml:455`
- `GT(TRUE,0)` boolean-vs-number ordering → `operator.yaml:2408`
- COUNTA/COUNTBLANK over an `""` cell → `statistical.yaml:42/53` (seed `B3:""`, `A2:""`)
- CONVERT 15-sig-fig precision → `parser.yaml:29`; `TYPE(1/0)=16` → `info.yaml:871`
- `T.DIST` plain vs `.RT`/`.2T` spellings → `statistical-distributions.yaml:1273`
- REGEXREPLACE `$N` backreference → `regex.yaml:451/458/465`
- ACOT negative-branch fork → `math-longtail.yaml:572` `acot-negative` (`=ACOT(-1)` already forks HyperFormula)

So the corpus's value-correction debt (ACOT value, PERCENTRANK truncation, IMEXP real part,
CONVERT last digit — all in SYNTHESIS.md) is real, but **new forks are few**. Five survive below,
and only the first is of more than marginal consequence.

---

## Theme: argument-signature / type-coercion asymmetries

### xnpv-rejects-text-date-while-xirr-coerces

- **Formula (pair, same seed shape):** `=XNPV(0.1, A1:A2, B1:B2)` vs `=XIRR(A1:A2, B1:B2)`
- **Seed (the load-bearing detail):** the date column is seeded as **text strings**, not date serials —
  `B1:"2020-01-01"`, `B2:"2021-01-01"` (with `A1:-100`, `A2:110`).
- **Observed split:**
  - Excel: `XNPV` → `#VALUE!` (refuses to coerce the string dates); `XIRR` → computes a rate
    (`≈0.0638` on the deep-dive seed). _Source: `probes/excel-lane-notes.md` — "XNPV does NOT coerce
    (→ #VALUE!, financial-001)… a real intra-Excel asymmetry"; also the WEEKNUM/YEARFRAC/XIRR-coerce line._
  - gsheets: same asymmetry live — `XIRR` coerces (`financial-002` → `0.0638`), `XNPV` → `#VALUE!`
    (`financial-001`). _Source: `probes/gsheets-lane-notes.md` — "XIRR coerces text dates but XNPV
    rejects them."_ Also `batches/financial/notes/XNPV-XIRR.md`.
- **Confidence:** Excel live-observed; gsheets live-observed. High on the asymmetry itself; the exact
  computed XIRR value is seed-specific.
- **Why the corpus misses it:** every corpus XIRR/XNPV case seeds the date column as YAML dates
  (`B1: 2008-01-01` → date serials), which never exercises the string-coercion path. The fork only
  appears when the date argument is _text_.
- **Proposed corpus cases (suite `financial-timevalue`):**
  - subject `XNPV`, name `xnpv-text-date-rejected`, formula `=XNPV(0.1, A1:A2, B1:B2)`,
    grid `A1:-100, A2:110, B1:"2020-01-01", B2:"2021-01-01"` → expect `#VALUE!` (Excel + gsheets).
  - subject `XIRR`, name `xirr-text-date-coerced`, formula `=XIRR(A1:A2, B1:B2)`, same grid →
    expect a computed rate — the divergence is _within-engine_ against its own XNPV sibling, and the
    per-engine value should be recorded observed (not `expect`).
- **Why it matters:** two sibling date-driven financials on the same engine take opposite stances on
  text-date coercion — a portability trap for anyone feeding string dates.

### address-quotes-sheet-names-with-spaces

- **Formula:** `=ADDRESS(1,1,1,TRUE,"My Sheet")` (vs the corpus's `"Sheet2"` no-space form).
- **Observed split:**
  - Excel: `'My Sheet'!$A$1` — quotes only because the name contains a space; plain `"Sheet2"` stays
    unquoted (`Sheet2!$A$1`). _Source: `probes/excel-lane-notes.md`, lookup-001._
  - `formulas` (pure engine): quotes **unconditionally** — returns `'Sheet2'!$A$1` for the no-space
    name too. _Source: `batches/lookup/notes/ADDRESS.md`._
  - hyperformula / ironcalc / pycel: `#NAME?` on the 5-argument form.
- **Confidence:** Excel + pure engines live-observed; gsheets/lattice inferred (quote-only-when-needed,
  same as Excel).
- **Why the corpus misses it:** `lookup-longtail.yaml:332` covers `"Sheet2"` (no quoting needed). The
  space-requiring-quote case — the one that separates conditional from unconditional quoting — is absent.
- **Proposed corpus case (suite `lookup-longtail`):** subject `ADDRESS`, name `address-sheet-name-with-space`,
  formula `=ADDRESS(1,1,1,TRUE,"My Sheet")` → expected divergence: Excel/gsheets/lattice `'My Sheet'!$A$1`,
  `formulas` `'My Sheet'!$A$1` (agrees here but diverges on the no-space case already recorded), others `#NAME?`.
- **Why it matters:** distinguishes "quote only when required" (Excel family) from `formulas`'
  always-quote — a rendering fork that only surfaces once a space is in play.

### index-negative-row-num-is-value-error

- **Formula:** `=INDEX(A1:A2, -1)` (grid `A1:1, A2:2`).
- **Observed split:** Excel → `#VALUE!` for a **negative** index, distinct from the already-recorded
  out-of-high case `=INDEX(A1:A2, 5)` → `#REF!` (`lookup.yaml:26`), and from `=INDEX(A1:A2, 0)` →
  whole-column spill. _Source: `probes/excel-lane-notes.md` — "INDEX index-out-of-range progression",
  lookup-005._
- **Confidence:** Excel live-observed; other engines inferred.
- **Why the corpus misses it:** the corpus records the `,5` (`#REF!`) and `,0` branches but not the
  negative-index (`#VALUE!`) branch — a different error class for a different malformed index.
- **Proposed corpus case (suite `lookup`):** subject `INDEX`, name `index-negative-row-num`,
  formula `=INDEX(A1:A2, -1)`, grid `A1:1, A2:2` → expect `#VALUE!` (Excel), with gsheets/pure-engine
  branches recorded observed.
- **Why it matters:** completes the INDEX index-domain error map (`-1`→`#VALUE!`, `0`→spill,
  `>len`→`#REF!`); the three branches use three different sentinels.

## Theme: array orientation / result-axis selection

### lookup-array-form-square-orientation

- **Formula:** `=LOOKUP(2, {1,2;3,4})` (a **square** array), plus the vertical sibling
  `=LOOKUP(2, {1,"a";2,"b";3,"c"})`.
- **Observed split:**
  - Excel: square → `2` — orients **vertically** (searches first column `[1;3]`, approx-matches at
    row 1, returns last column row 1 = `2`). _Source: `probes/excel-lane-notes.md`, lookup-006._
  - pycel: returns the result-axis value `"b"` on the non-square shapes but **flips to the search key
    `2`** on the square array (orientation ambiguous). _Source: `batches/lookup/notes/LOOKUP.md`._
  - `formulas`: returns the search key `2` for **every** orientation (never reads the result axis).
  - hyperformula: `#NAME?`; ironcalc: `#N/A`.
- **Confidence:** Excel live-observed for the square case; pure engines live-observed; gsheets/lattice
  inferred.
- **Why the corpus misses it:** `lookup-longtail.yaml:674` covers only the **horizontal**
  `=LOOKUP(2, {1,2,3;"a","b","c"})`. The square array (where row/column orientation is genuinely
  ambiguous and engines disagree about which axis wins) has no case.
- **Proposed corpus case (suite `lookup-longtail`):** subject `LOOKUP`, name `lookup-square-array-orientation`,
  formula `=LOOKUP(2, {1,2;3,4})` → expected divergence: Excel `2` (vertical), pycel `2` (key-flip),
  `formulas` `2` (always-key), hyperformula `#NAME?`, ironcalc `#N/A`. (A companion vertical-shape case
  `=LOOKUP(2, {1,"a";2,"b";3,"c"})` isolates pycel's `"b"`-vs-key behaviour.)
- **Why it matters:** array-form LOOKUP's orientation rule is under-specified on a square array; the
  engines split three ways (vertical-orient / key-flip / always-key), a real trap for square lookup tables.

## Theme: within-engine argument-mode behaviour (Excel-internal)

### regexextract-return-mode-2-spills-capture-groups

- **Formula:** `=REGEXEXTRACT("2025-03-01", "(\d+)-(\d+)-(\d+)", 2)` (return_mode = 2).
- **Observed split:** Excel spills the capture groups `["2025","03","01"]` as a **row array**;
  the default / return*mode=1 form returns the first full match string. \_Source:
  `probes/excel-lane-notes.md`, text-regex-001.*
- **Confidence:** Excel live-observed. This is an Excel-internal argument-mode behaviour more than a
  cross-engine fork — REGEXEXTRACT is Excel-2024-only, and gsheets' REGEXEXTRACT has no `return_mode`
  argument (a signature difference in its own right).
- **Why the corpus misses it:** `regex.yaml:370` covers `return_mode=1` (`=REGEXEXTRACT("a1 b2 c3","\d+",1)`);
  the `return_mode=2` capture-group-spill form is absent.
- **Proposed corpus case (suite `regex`):** subject `REGEXEXTRACT`, name `regexextract-return-mode-2-captures`,
  formula `=REGEXEXTRACT("2025-03-01", "(\d+)-(\d+)-(\d+)", 2)` → expected: Excel spills
  `[["2025","03","01"]]`; gsheets `#N/A`/`#ERROR!` (no 3rd arg); pure engines `#NAME?`.
- **Why it matters:** documents Excel's spill-shaped return_mode, and flags the REGEXEXTRACT signature
  mismatch between Excel and gsheets before a wiki reader assumes portability.

---

## Summary table

| slug                                               | engines split                                                                    | suite proposal        |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------- |
| `xnpv-rejects-text-date-while-xirr-coerces`        | Excel + gsheets: XNPV `#VALUE!` vs XIRR coerces (within-engine)                  | `financial-timevalue` |
| `lookup-array-form-square-orientation`             | Excel `2` / pycel key-flip / formulas always-key / HF `#NAME?` / ironcalc `#N/A` | `lookup-longtail`     |
| `index-negative-row-num-is-value-error`            | Excel `#VALUE!` (neg) vs `#REF!` (over-high, recorded)                           | `lookup`              |
| `address-quotes-sheet-names-with-spaces`           | Excel conditional-quote vs formulas unconditional; HF/ironcalc/pycel `#NAME?`    | `lookup-longtail`     |
| `regexextract-return-mode-2-spills-capture-groups` | Excel spills captures vs gsheets no-arg vs pure `#NAME?`                         | `regex`               |

---

## Artifacts (not forks)

These recurred across the sweep and read like divergences but are driver/recording/harness artifacts.
Listed so nobody re-mistakes them for engine behaviour.

- **LibreOffice blank-capture.** LibreOffice fixtures for info, arrays, array-longtail, lookup, and
  date/volatile suites are uniformly `[[null]]` even for trivially-supported formulas
  (`=ISNUMBER(42)`, `=INDEX(...)`). Dozens of apparent forks (39 in info alone) exist only because of
  this. *Source: SYNTHESIS.md finding #1; per-batch `notes/*libreoffice-blank-artifact.md`.\* Action:
  LibreOffice re-record + regen coverage.
- **pycel `#NAME?` cascade.** pycel emits `#NAME?` for bare error-raising operator sub-expressions
  (`=1/0`, `=NA()+1`), cascading through wrappers. _Source:
  `batches/date-volatile-errors/notes/pycel-driver-artifacts.md`._
- **pycel operator-in-argument tokenization.** `=SUM(1/2)`, `=ABS(1-2)`, `=IF(A1>2,1,2)`, `=10+3`,
  `=SQRT(-1)` all → `#NAME?`; the trigger is an operator token in the source, not the value or
  function. `=ABS(A1)` with a negative A1 is fine. So pycel's negative-domain "gaps" for ABS/ROUND/ERF
  and IFERROR(SQRT(-1),…) are front-end parse artifacts, not semantics. _Source:
  `batches/math-core/notes/pycel-arithmetic-operator-artifact.md`,
  `batches/lambda-logical-coercion/notes/engine-artifacts.md`._
- **String grid seeds are RAW/literal-text in gsheets, inert in Excel.** A seeded `"=1/0"` is stored as
  literal text, never a live `#DIV/0!` cell, so `=SUM(A1:A3)` over it returns `4` not an error
  (dve-001). This is a seed-ingestion-fidelity property of the harness, not an error-propagation
  divergence; genuinely error-valued cells _do_ propagate. Probes needing a live formula cell must use
  a `{formula: ...}` seed object. _Source: `probes/excel-lane-notes.md`, `probes/gsheets-lane-notes.md`._
  (This also leaves `lookup-002` FORMULATEXT-of-a-live-formula unresolved — a probe gap, not a fork.)
- **`formulas` MODE.MULT array string-serialization.** `formulas` serializes multi-cell array results as
  strings, while its scalar-returning stats (MEDIAN, MODE.SNGL) return proper numbers. An array-spill
  representation quirk of the driver/engine, not a value divergence. _Source:
  `batches/stat-core/notes/MODE-MULT.md`._
- **Single-sheet harness count.** `SHEET()`/`SHEETS()` return `1` on the pure-engine harness (one sheet)
  vs `4` on the many-sheet gsheets recording. A function of harness workbook size, not engine behaviour.
  _Source: `batches/lookup/notes/SHEET.md`, `batches/info/notes/SHEETS.md`._
- **DSTDEV `#VALUE!`-vs-`#NAME?` on a malformed grid** is a probe _technique_ for distinguishing
  "function absent" (ironcalc reaches arg-evaluation → `#VALUE!`) from "function present but args
  invalid" — not itself a corpus-worthy fork. _Source: `batches/stat-analytics/notes/DSTDEV.md`._
  </content>
  </invoke>
