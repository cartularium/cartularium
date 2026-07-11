# Batch math-core — summary

**Suites:** math (45) + operator (10) + parser (5) = **60 uncovered forks.** All 60 covered by an annotation; 0 skipped.

## Headline findings

1. **The pycel arithmetic-operator artifact (highest value).** pycel returns `#NAME?` for _any_ formula whose source contains an arithmetic operator (`+ - * / ^`), including the unary minus of a negative literal. Operator-free function calls evaluate correctly, and a negative value passed via a cell reference works (`=ABS(A1)`, A1=-3.4 → 3.4). Reproduced live _and_ corroborated by `fixtures/arithmetic/pycel.json` (`=1+1`, `=10/3`, `=2+3*4` all `#NAME?`). This is a formula-compilation artifact in assay's pycel integration, not a per-function semantics limitation — it accounts for all 8 negative-literal math forks and should be filtered out of any pycel compatibility rows.

2. **libreoffice recording gap.** The libreoffice fixtures for math/operator/parser are **100% blank** (`[[null]]`: 65/65, 115/115, 34/34). Every fork in this batch has a spurious `libreoffice = blank` branch. It is a harness gap, not LibreOffice behavior (libreoffice has real data in other suites, e.g. DV-0007). 36 math forks exist _only_ because of this blank.

3. **UNIQUE case-sensitivity (genuine, wiki-worthy).** Excel's UNIQUE dedups text case-insensitively (returns 1 value "Apple" from Apple/apple/APPLE, keep-first), while formulas/gsheets/lattice are case-sensitive (return all 3). Excel-vs-Sheets difference that changes spill height.

4. **Operator-named functions are Google-Sheets-only.** ADD/GT/GTE/LTE → `#NAME?` in excel/formulas/hyperformula/ironcalc/pycel (live-confirmed); only gsheets+lattice implement them. In the comparison ones, gsheets ranks booleans **above** numbers (Excel ordering) while lattice ranks them **below** — a real cross-type ordering divergence, not a coercion difference (a coercion would make `GTE(TRUE,1)` true in both).

5. **CONVERT support + precision + error attribution.** Implemented in excel/formulas/gsheets/ironcalc/lattice; `#NAME?` in hyperformula/pycel (live-confirmed). Supporters agree on the conversion but differ in recorded precision (excel/formulas full double vs gsheets/ironcalc ~9 dp). Invalid units → `#N/A` (function present, rejects arg) vs `#NAME?` (function absent) — same surface, different cause.

6. **`=SUM()` five-way arity split:** lattice/pycel → `0`; gsheets/hyperformula → `#N/A`; formulas → `#VALUE!`; ironcalc → `#ERROR!`; excel/libreoffice → blank (excel likely rejects the zero-arg formula at entry). Array-literal and range SUM cases are unanimous.

## Deliverable counts

- **annotations.json:** 9 annotation clusters covering all **60/60** refs, each ref in exactly one scope (validated: 0 dupes, 0 uncovered). Causes used: `TODO`, `unimplemented-edge`, `argument-arity`, `missing-function` (×2), `arg-semantics` (×2), `error-attribution`.
- **notes/:** 7 files — `pycel-arithmetic-operator-artifact.md`, `SUM.md`, `UNIQUE.md`, `ADD-GT-GTE-LTE.md`, `CONVERT.md`, `libreoffice-recording-gap.md`, `rounding-family.md`.
- **probe-requests.json:** 5 requests (math-core-001, -001b, -002, -003, -004).
- **skipped.json:** empty (nothing skipped).

## What needs Excel / gsheets confirmation

- **math-core-001 / -001b (gsheets):** confirm gsheets ranks booleans above numbers — `=GT(TRUE,0)`→TRUE, `=GTE(TRUE,1)`→TRUE, `=LTE(FALSE,0)`→FALSE, and reversed-order `=GT(2,TRUE)`→FALSE. (lattice's below-numbers ranking is single-owner, recorded-only.)
- **math-core-002 (excel, gsheets):** confirm Excel UNIQUE collapses Apple/apple/APPLE to one "Apple" (case-insensitive, keep-first) vs gsheets keeping all three (case-sensitive).
- **math-core-003 (excel):** confirm whether `=SUM()` yields blank, an error, or is rejected at entry — decides whether excel's blank is semantic or an entry-rejection artifact.
- **math-core-004 (excel, gsheets):** confirm the CONVERT precision split for `=CONVERT(1,"m","ft")` — excel full-double `3.2808398950131235` vs gsheets ~9 dp `3.280839895`.

## What grounds the work

Recorded fixtures for all engines + two live pure-engine probe files (`packages/assay/scratch/math-core-probe1.mts`, `math-core-probe2.mts`) exercising pycel, hyperformula, ironcalc, formulas. Extends existing DV-0002 (ADD/GT/GTE/LTE missing), DV-0016 (CONVERT missing), DV-0206 (CONVERT precision) without duplicating them.

## Coverage note

Work-list refs covered: **60 / 60.** Skipped: **0.** The two systematic artifacts (pycel operators, libreoffice blank) mean many of these forks are not genuine portability divergences — flagged as such so the reconciler does not manufacture false compatibility claims. The genuine, wiki-bound stories are UNIQUE case-sensitivity, the operator-named-function boolean ordering, CONVERT precision/support/error-attribution, and the `=SUM()` arity split.
