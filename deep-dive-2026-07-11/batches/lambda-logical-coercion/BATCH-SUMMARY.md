# Batch summary — lambda-logical-coercion

**Suites:** lambda (23) + logical (11) + type-coercion (12) = **46 uncovered forks.** All 46 assigned to exactly one annotation; **0 skipped** (verified: 46/46 covered, no dups, no extras).

## Counts

- **Annotations written:** 14 (biggest folds 15 refs).
- **Work-list refs covered:** 46 / 46. **Skipped:** 0.
- **Notes files:** 5 — `LAMBDA-family.md`, `SUM-PRODUCT-coercion.md`, `T-N-VALUE.md`, `AND-OR-CHOOSE-IF-IFERROR.md`, `engine-artifacts.md`.
- **Probe requests emitted:** 8 (all excel/gsheets confirmations I could not run locally).
- **Live probe scripts:** 3 (`scratch/lambda-logical-coercion-probe{1,2,3}.mts`) across hyperformula/ironcalc/formulas/pycel — reproduced every pure-engine fixture branch exactly.

## Headline findings

1. **libreoffice is a corpus-wide recording gap, not an engine.** All 46 forks show libreoffice=blank; across all 32 suites its fixtures hold 0 non-null of ~2000 cases (even `=IF(TRUE,1,2)`→null). In 11 of my refs the libreoffice blank is the _only_ divergence — effectively non-forks. This manufactures ~800 phantom forks corpus-wide and needs a human decision (re-run driver or surface a "no data" state).
2. **pycel `#NAME?` has two unrelated causes.** (a) Genuine missing functions: `T`, `PRODUCT`, the whole lambda/dynamic-array family. (b) A front-end limitation — pycel returns `#NAME?` for **any operator expression used as a function argument** (`1>2`, `1/0`, `1+1`, `1-2`, `A1>2` all reproduce it; literal-arg forms succeed). This turns unanimously-agreed IF/IFERROR cases into pycel-only `#NAME?` artifacts. Isolated by live probe.
3. **Modern-vs-legacy dynamic-array split.** excel/gsheets/lattice/`formulas` implement the surface and agree; hyperformula/ironcalc/pycel mostly `#NAME?`. Uneven edges: hyperformula has FILTER but not MAP/REDUCE/SORT/UNIQUE/LET; ironcalc has a MAKEARRAY `#ERROR!` stub; `formulas` breaks on sequential LET bindings and chained-LAMBDA currying (returns no clean value).
4. **SORT third-arg signature trap.** `SORT(x,1,-1)` sorts **descending in Excel** (`sort_order`) but **ascending in Google Sheets** (`is_ascending`, -1 is truthy). The imported sheets.wiki `SORT.md` documents only the gsheets signature — actively misleading for Excel authors.
5. **Coercion policy is non-uniform across arrival paths.** Text/booleans are skipped inside array literals and ranges in Excel/Sheets, but `formulas` coerces text, lattice coerces text+booleans, hyperformula rejects boolean literals in `{...}` (`#NAME?`), and empty-PRODUCT splits 0 (Excel/Sheets/ironcalc) vs 1 (hyperformula).
6. **Value-model splits:** `T` of non-text → blank cell (excel/formulas) vs empty string `""` (gsheets/ironcalc/lattice); `IF(2>3,TRUE)` → boolean FALSE (most) vs blank (lattice).

## Cause distribution

missing-function ×4 · arg-semantics ×3 · unimplemented-edge ×2 · null-vs-zero ×2 · argument-arity ×1 · error-code ×1 · TODO (libreoffice gap) ×1.

## What needs excel/gsheets confirmation (→ 8 probe requests)

All excel/gsheets ground truth I lack: SORT descending vs ascending (001), SORTBY excel vs gsheets #NAME? (002), AND() entry-rejection interpretation (003), CHOOSE out-of-range code #VALUE! vs #NUM! (004), T(TRUE) blank vs "" (005), PRODUCT/SUM array-literal skip-text (006/008), SUM(text-range) skip — needs cells seeded as text (007). All four-pure-engine claims are high-confidence (reproduced live); the only medium-confidence claim is that Excel's `=AND()` blank is an entry rejection rather than a computed value.
