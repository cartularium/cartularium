# Batch lookup — summary

**Suites:** lookup (9 forks) + lookup-longtail (22 forks) = **31 uncovered forks, all annotated, 0 skipped.**

## Coverage counts

- **annotations.json:** 11 clusters covering all 31 refs — each ref in exactly one scope; verified programmatically (31/31, no dupes, no gaps).
- **Work-list refs:** 31 covered / 0 skipped.
- **notes/:** 9 files — ADDRESS, CHOOSECOLS-CHOOSEROWS-XMATCH, FORMULATEXT, GETPIVOTDATA, INDEX-MATCH, LOOKUP, ROW-COLUMN, SHEET, plus the cross-cutting RECORDING-ARTIFACT-libreoffice-blank note.
- **probe-requests.json:** 7 requests for excel/gsheets confirmation.
- **Live probes run:** 2 batched pure-engine scripts (`scratch/lookup-probe1.mts`, `scratch/lookup-probe2.mts`) across hyperformula, ironcalc, formulas, pycel; every recorded fork partition reproduced.

## Headline findings

1. **A suite-wide libreoffice recording artifact drives most of these "forks."** The libreoffice fixtures for both suites (`generatedAt` 2026-05-11) return `[[null]]` for _every_ case — all 17 lookup and 55 lookup-longtail entries — including trivially-correct ones like `=INDEX(A1:B2,2,1)` (should be 3) and `=ROW(A1)` (should be 1). LibreOffice implements all these functions, so the blank is a capture failure, not behavior. **12 refs are forks only because of this blank branch** and are not semantic divergences (annotation cause TODO). Recommendation: re-record libreoffice for these two suites. See `notes/RECORDING-ARTIFACT-libreoffice-blank.md`.

2. **Genuine divergences fall into clean mechanisms**, all reproduced live on pure engines:
   - **Newer-Excel functions missing** in hyperformula/ironcalc/pycel → `#NAME?`: CHOOSECOLS, CHOOSEROWS, XMATCH. The `formulas` engine implements all three and matches excel/gsheets/lattice.
   - **INDEX out-of-bounds error-code split**: `#REF!` (excel/formulas/ironcalc/lattice/pycel) vs `#NUM!` (gsheets/hyperformula).
   - **ROW/COLUMN over a range = shape/spill split**: excel/formulas/lattice spill the full vector; gsheets/hyperformula/ironcalc/pycel collapse to the first scalar (extends DV-0249).
   - **ADDRESS 5-arg sheet form**: `formulas` always quotes the sheet name (`'Sheet2'!$A$1`) vs bare `Sheet2!$A$1` elsewhere (format-rendering); hyperformula supports 2/4-arg ADDRESS but not the sheet form (missing arg-form, confirmed by probe); ironcalc/pycel lack ADDRESS entirely.
   - **LOOKUP array form** is a real portability trap: excel/gsheets/lattice/pycel → `"b"`; `formulas` returns the wrong axis (`2`); hyperformula lacks LOOKUP (`#NAME?`); ironcalc → `#N/A`. pycel additionally mishandles square arrays (returns the key).
   - **external-io introspection functions** (FORMULATEXT, SHEET, GETPIVOTDATA) diverge on both availability and workbook context; several splits are partly harness-seeding artifacts (gsheets FORMULATEXT `#N/A` from value-seeding; gsheets SHEET indices 4/35 from the many-sheet harness).

## What needs excel/gsheets confirmation (probe-requests.json)

- **lookup-001** — ADDRESS quoting: confirm excel/gsheets emit bare `Sheet2!$A$1` and quote only when the name has a space (`'My Sheet'!$A$1`), unlike `formulas` which always quotes.
- **lookup-002 / lookup-003** — FORMULATEXT over a _live_ formula cell (gsheets, excel): the corpus gsheets `#N/A` looks like a value-seeding artifact; confirm gsheets returns the formula text when the cell truly holds a formula.
- **lookup-004** — GETPIVOTDATA with no pivot on excel: expect `#REF!` (matching gsheets), confirming Excel recognizes the function.
- **lookup-005** — INDEX out-of-bounds boundary on excel/gsheets: does the `#REF!` vs `#NUM!` split also hold at index 0 and negative indices?
- **lookup-006** — LOOKUP array form on excel: confirm the `"b"` reference and the square-array edge (does Excel return the result-axis value or the key?).
- **lookup-007** — SHEET on gsheets single-sheet workbook: pin the true baseline index and `#REF!`-for-unknown-name behavior, disentangling the harness's many-sheet context (which produced 4 and 35).

**Confidence:** high on 9 clusters; medium on FORMULATEXT and SHEET (external-io behavior depends on live workbook state the pure/single-sheet harness cannot fully reproduce).
