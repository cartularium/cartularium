# Engineering batch — SUMMARY

**79 uncovered forks across 24 subjects** (base conversions, ERF/ERF.PRECISE, the IM\* complex family). All 79 refs annotated, 0 skipped. Every claim is grounded in recorded fixtures plus a live pure-engine probe (`packages/assay/scratch/engineering-probe1.mts`, 34 formulas × hyperformula/ironcalc/formulas/pycel).

## Counts

- **Annotations written:** 9 clusters covering **79 / 79** work-list refs (validated: each ref in exactly one scope, no duplicates, no gaps, valid JSON).
- **Work-list refs covered vs skipped:** 79 covered / 0 skipped.
- **Notes files:** 6 — `BASE-CONVERSIONS.md`, `IM-TRANSCENDENTAL.md`, `IMLOG-IMCOTH-IMTANH.md`, `IMDIV-IMARGUMENT.md`, `ERF.md`, `libreoffice-blank-artifact.md`.
- **Probe requests emitted:** 6 (`engineering-001`..`-006`, all excel/gsheets).

## Headline findings

1. **LibreOffice is a systemic recording artifact, not a divergence.** All 147 results in the 2026-05-11 LibreOffice engineering fixture are `null`. LibreOffice Calc supports these functions, and its earlier 2026-04-25 fixtures returned real values/errors (DV-0008 `#VALUE!`, DV-0017 `#NAME?`). It is a lone blank class in essentially every engineering fork — annotated `version-skew`, flagged for a harness re-run. This is the single biggest driver of the fork count.
2. **pycel rejects out-of-supported-domain inputs with `#NAME?`** (live-confirmed, consistent): `ERF(1)`=0.8427 but `ERF(-1)`/`ERF(-0.5)`/`ERF(0,1)`=`#NAME?`; `DEC2BIN(10)`="1010" but `DEC2BIN(-2)`/`DEC2HEX(-1)`/`DEC2OCT(-1)`=`#NAME?`. Non-negative single args work; negative or two-arg forms error.
3. **pycel lacks the entire transcendental complex family** (IMCOS/IMSIN/IMTAN/IMEXP/IMLOG\*/IMSEC/IMCSC…): `#NAME?` even for `IMCOS("0")`. Extends DV-0001 (which covered only algebraic IM functions).
4. **Complex results are strings, so precision leaks into forks.** Excel/Google Sheets/IronCalc render 15 significant digits; formulas/HyperFormula/Lattice render full IEEE-754 (16–17), with ULP-level sub-splits inside the full-precision family (IMCOT/IMCSC give 3–4 classes). `IMLOG2("8")` prints `2.9999999999999996` on formulas. Cause: `precision`.
5. **IMLOG / IMCOTH / IMTANH are Google-Sheets-only** (wiki pages imported from Google docs). Excel/formulas/HyperFormula/IronCalc/pycel all `#NAME?`; only gsheets + Lattice compute (and they then split on precision). Real portability landmine.
6. **Error edges:** `IMDIV` by zero splits `#NUM!` (excel/formulas/HyperFormula/IronCalc) vs `#DIV/0!` (gsheets/lattice). `IMARGUMENT("i")` returns a spurious `#DIV/0!` on the `formulas` engine (genuine bug; correct = π/2). ERF.PRECISE missing in HyperFormula + pycel; ERF two-arg form missing in Lattice (`#N/A`).

## Relationship to existing DV records

None of the 79 refs are already covered. The annotations extend DV-0017 (ERF.PRECISE, different test), DV-0001 (pycel IM — adds transcendental family + negative-domain rejection), DV-0008 (LibreOffice, different domain-error cases), DV-0045 (formulas IMDIV, different non-error case).

## Needs human / live excel-gsheets confirmation

- **Harness:** re-run the LibreOffice engineering suite (all-blank fixture) — not resolvable analyst-side.
- **Probes `engineering-001`..`-006`:** IMLOG two-arg base form; IMDIV `0+0i` divisor; 15-digit cap at large magnitude; DEC2HEX negative + places; ERF.PRECISE/IMTANH Excel-branch confirmation.
