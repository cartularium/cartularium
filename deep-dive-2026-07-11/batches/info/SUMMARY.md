# Batch `info` — summary

**Suite:** info · **Work-list refs:** 63 · **All 63 covered by an annotation; 0 skipped.**

## Counts

- **Annotations written:** 9 (covering all 63 refs, each ref in exactly one scope — validated).
- **Work-list refs covered:** 63 / 63. **Skipped:** 0 (no skipped.json).
- **Notes files:** 7 — TYPE, ISREF, SHEETS, CELL, ISDATE, ISBLANK, IS-predicates-portability (cross-cutting artifact family).
- **Probe requests emitted:** 10 (all excel/gsheets confirmations of genuine uncertainties).
- **Live probes run:** 28 formulas × 4 pure engines (hyperformula, ironcalc, formulas, pycel) — scratch/info-probe1.mts.

## Headline findings

1. Two tooling artifacts account for 49 of 63 forks — not real divergences.
   - LibreOffice info fixture is uniformly [[null]] (all 93 entries blank, incl. =ISNUMBER(42)); 39 cases are fork-only because of it. Cause TODO; needs re-record.
   - pycel emits #NAME? for bare error-raising operator sub-expressions (=1/0, ="a"+1, =NA()+1 all #NAME?), cascading through IS\*/N wrappers. 10 cases, cause error-code.
2. The IS type/error predicates (ISERR, ISERROR, ISNA, ISNUMBER, ISTEXT, ISNONTEXT, ISLOGICAL, N, NA) are genuinely portable across excel/formulas/gsheets/hyperformula/ironcalc/lattice.
3. Genuine divergences (14 refs): HyperFormula ISREF always FALSE (3); TYPE codes agree on 5 engines, HyperFormula #NAME?, pycel leaks Python type() reprs, IronCalc #N/IMPL! on arrays, lattice #N/A on empty cell (6); ISBLANK of a cell seeded "" splits excel/formulas/lattice/pycel TRUE vs gsheets/hyperformula/ironcalc FALSE (1); CELL("format") excel "G" / gsheets+ironcalc #VALUE! / rest #NAME? (1); ISDATE gsheets-only, gsheets TRUE vs lattice FALSE (1); SHEETS() harness-dependent counts + partial reference-form support (2).

## Extends (not duplicates)

DV-0033 (CELL) +format info_type/#VALUE! branch; DV-0024/DV-0019 (ISDATE) +gsheets-vs-lattice coercion; consistent with DV-0001 (pycel ISREF), DV-0006 (hyperformula N/TYPE).

## Needs a human / single-owner lane

LibreOffice info-suite re-record (clears 39 artifact forks); 10 excel/gsheets probe requests (info-001..005).
