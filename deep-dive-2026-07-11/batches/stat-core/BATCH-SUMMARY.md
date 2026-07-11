# stat-core — batch summary

**Suites:** statistical (16 forks) + statistical-descriptive (46 forks) = **62 uncovered forks, all covered, 0 skipped.**
**Method:** recorded fixtures first, then live pure-engine probes (hyperformula, ironcalc, formulas, pycel) to reproduce/extend. Excel/gsheets/lattice/libreoffice from recorded fixtures only.

## Headline findings

1. **libreoffice is a stale all-null fixture, not a divergence.** All 62 forks carry a `{libreoffice: blank}` class. Both suites' libreoffice fixtures are 100% null (0 numeric results, generatedAt 2026-05-11 vs excel 2026-06-17) — it records blank even for `=AVERAGE(1,2,3,4)`. In **35 of 62** cases this is the _only_ divergence (other 7 engines agree); those are one annotation, cause `TODO` = needs re-recording. The artifact is noted in every other annotation too so it isn't read as behavior.

2. **hyperformula treats the bare keyword `TRUE` as an undefined name, not a boolean literal.** Live-confirmed: `=SUM(1,2,TRUE)`, `=AVERAGE(1,2,TRUE)`, `=AVERAGEA(1,2,TRUE)`, `=STDEVA(1,2,TRUE)` all → `#NAME?`, while the same functions compute fine over ranges, over inline-numeric args, and with a boolean _in a cell_. A cross-cutting parser trait explaining most hyperformula `#NAME?` in this batch. Workaround: `TRUE()`/`FALSE()` or a cell ref.

3. **IronCalc's `*A` variance/stdev functions ignore an inline literal boolean.** `=STDEVA(1,2,TRUE)`→0.707, `=VARA(1,2,TRUE)`→0.5 (computes over `{1,2}` only) vs Excel/Sheets coercing TRUE→1 (0.577/0.333). But IronCalc coerces booleans in range cells and coerces inline TRUE in `AVERAGEA`/`AVERAGE` (→1.333) — an internal inconsistency confined to the variance/stdev `*A` subset.

4. **pycel parser bug on inline negative literals.** `=MAX(-3,-1,-7)` / `=MIN(-3,-1,-7)` → `#NAME?` on pycel, though positive inline literals and cell ranges (incl. negative cell values) work. Narrow unary-minus-in-argument-list failure, live-isolated.

5. **The `""` empty-string cell splits COUNTA/COUNTBLANK.** Excel/formulas/lattice treat a `""` cell as blank (COUNTA excludes → 2, COUNTBLANK counts → 3); gsheets/hyperformula/ironcalc treat it as a value (COUNTA → 3); hyperformula excludes it from COUNTBLANK (→2), ironcalc/gsheets count it in both. Live-confirmed on pure engines.

6. **MODE.MULT array handling:** excel/gsheets/lattice spill a real array; the `formulas` engine serializes it as a **string** (`"[2]"`, `"[2, 3]"`); hyperformula/ironcalc/pycel don't implement it.

7. **STDEV/STDEVP legacy aliases** missing in ironcalc (has STDEV.S/STDEV.P) and pycel (has neither). **PERCENTRANK.EXC** splits 0.166 (excel/formulas truncate) vs 0.167 (gsheets/lattice round) on true 1/6; unimplemented in hyperformula/ironcalc/pycel. **GEOMEAN/HARMEAN** portable everywhere except pycel.

## Counts

- **Annotations:** 9 — libreoffice-artifact (35 refs, `TODO`); pycel-missing (10, `missing-function`); STDEV/STDEVP legacy-alias (3, `missing-function`); empty-string COUNTA/COUNTBLANK (3, `null-vs-zero`); `*A` inline-boolean (4, `arg-semantics`); AVERAGEA inline-boolean (1, `arg-semantics`); MODE.MULT (3, `array-handling`); PERCENTRANK.EXC precision (1, `precision`); pycel inline-negative (2, `unimplemented-edge`). Validated: all 62 refs in exactly one scope, 0 dupes/missing/extra.
- **Work-list refs:** 62/62 covered, 0 skipped (`skipped.json` empty).
- **Notes files:** 9 in `notes/` — 8 subject deep-dives (COUNTA-COUNTBLANK, STDEVA-STDEVPA-VARA-VARPA, MODE-MULT, MAX-MIN, PERCENTRANK-EXC, STDEV-STDEVP-legacy-aliases, GEOMEAN-HARMEAN, AVERAGEA) + 1 methodology note (libreoffice-blank-artifact).
- **Probe requests:** 2 (stat-core-001, stat-core-002).
- **Live probe scripts:** `packages/assay/scratch/stat-core-probe{1,2,3}.mts`.

## What needs excel/gsheets confirmation

- **stat-core-001** — `COUNTA(A1:A3)&"|"&COUNTBLANK(A1:A3)` with `A2=""` on excel + gsheets. Confirms whether the 2-vs-3 COUNTA split is genuine `""`-classification or an artifact of how each harness materializes an empty-string seed (real Excel COUNTA counts a `""`-valued cell, so recorded excel=2 may be seeding-fidelity). Consumed by the empty-string annotation + COUNTA-COUNTBLANK note.
- **stat-core-002** — `PERCENTRANK.EXC(A1:A5,1)` at default vs significance 6 on excel. Confirms the 0.166-vs-0.167 split is a truncate-vs-round convention on the 3-sig-digit default, not a computation difference. Keeps PERCENTRANK.EXC annotation at confidence medium until confirmed.

## Confidence

High on all annotations except PERCENTRANK.EXC (medium — pending stat-core-002). Every pure-engine claim reproduced live; excel/gsheets/lattice claims rest on recorded fixtures, internally consistent with stated mechanisms. None of the 62 refs appeared in existing `DV-*.yaml` records (checked) — these extend, not duplicate.
