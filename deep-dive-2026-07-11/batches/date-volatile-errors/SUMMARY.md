# Batch date-volatile-errors — summary

**Suites:** date (14) + volatile (14) + error-handling (24) + divergences (1) = **53 uncovered forks**, all annotated.

## What I covered

All 53 work-list refs are scoped into exactly one of 13 annotation clusters (verified: no duplicates,
no gaps, none skipped). `skipped.json` is empty. Deliverables: `annotations.json` (13 clusters),
8 deep-dive notes, `probe-requests.json` (7 requests), this summary.

## Headline findings

1. **The libreoffice branch is an empty recording, not a behavior.** The libreoffice fixture is 100%
   `[[null]]` across all four suites (0 of 89 date + 22 volatile + 45 error-handling entries carry a
   value). ~21 of my forks have _no_ real divergence — the only split is "every functional engine
   agrees vs libreoffice blank." (`libreoffice-empty-recording.md`)

2. **pycel `#NAME?` conflates four causes — most are artifacts.** The assay pycel driver returns
   `#NAME?` for **any formula containing an operator** (`+ - * / ^ & > >= < = <>`, unary minus):
   `=1+1`, `=2*3`, `=5>3`, `=ABS(-5)` are all `#NAME?`, while `=SUM(1,2,3)`, `=ISNUMBER(5)`, `=NOW()`,
   `=TODAY()` evaluate. So `=NOW()>=TODAY()`, `=SQRT(-1)`, `=IFERROR(1/0,…)`, `=SUM(1,1/0,3)` fail on
   the operator, not on coverage. Genuinely missing: RAND, RANDBETWEEN, RANDARRAY, TIME, WEEKNUM,
   COUNTA. And IFERROR/IFNA are **version-skew** — the recorded corpus has `#NAME?` but the current
   pycel evaluates them. All reproduced live. (`pycel-driver-artifacts.md`)

3. **lattice does not reduce TIME() hours modulo 24.** `=TIME(25,0,0)` = 0.041667 on
   excel/gsheets/hyperformula/ironcalc/formulas (25 mod 24 = 1h) but **1.041667 on lattice** (25/24,
   carrying the extra day). Minute/second overflow rolls the same everywhere. Live-confirmed on the
   pure engines. (`TIME-TIMEVALUE.md`)

4. **HyperFormula (and pycel for YEARFRAC) reject text date arguments.** `=WEEKNUM("2023-01-01",21)`
   and `=YEARFRAC("2025-01-01","2026-01-01",2)` → `#VALUE!` on HyperFormula, but the correct 52 /
   1.013889 with `DATE()`/serial args. It is coercion, not the type/basis (live-confirmed across all
   bases and both functions). pycel matches for YEARFRAC. (`WEEKNUM-YEARFRAC.md`)

5. **Array-form IFERROR is the real error-handling split.** `=IFERROR({1,#N/A,3},0)` broadcasts to
   `{1,0,3}` on excel/gsheets/hyperformula/formulas/lattice; **ironcalc returns `#N/IMPL!`** (no array
   support); pycel collapses to scalar `0` / `#NAME?`. Scalar IFERROR/IFNA semantics (incl. IFNA's
   `#N/A`-only selectivity) are fully portable. (`IFERROR-IFNA.md`)

6. **One genuine unresolved fork needs live excel/gsheets:** `=SUM(A1:A3)` with seed `A2==1/0` →
   excel/gsheets `4` vs pure engines `#DIV/0!`. Likely a grid-seeding fidelity issue (the seed never
   became a live error in the excel/gsheets lane); the inline `=SUM(1,1/0,3)` is `#DIV/0!` everywhere.
   Medium confidence, probe `dve-001`. (`error-aggregation-SUM-ISERR.md`)

7. **Excel-only / non-portable features flagged:** RANDARRAY (Excel spills; gsheets `#N/A`; pure
   engines `#NAME?`) and LAMBDA immediate invocation (excel/gsheets/lattice = 6; formulas `#VALUE!`;
   hyperformula `#ERROR!`; ironcalc/pycel `#NAME?`). NOW()/RANDBETWEEN volatility + timezone noted as
   non-divergences. (`volatile-NOW-RAND-RANDARRAY.md`, `LAMBDA.md`)

## Counts

- **Annotations written:** 13 clusters covering **53/53** refs (causes: TODO 3, missing-function 3,
  arg-semantics 2, recalc-semantics 2, unimplemented-edge 1, version-skew 1, array-handling 1).
- **Work-list refs covered:** 53 · **skipped:** 0.
- **Notes files:** 8 (2 cross-cutting concept notes + 6 function/family notes).
- **Probe requests emitted:** 7 (`dve-001`..`dve-007`), all excel/gsheets confirmation-grade; `dve-001`
  is the only one gating a fork's mechanism, the rest ground already-recorded claims.

## Live probes run (pure engines only)

`date-volatile-errors-probe1..5.mts` in `packages/assay/scratch/`: hyperformula, ironcalc, formulas,
pycel across TIME overflow, WEEKNUM/ISOWEEKNUM/YEARFRAC string-vs-serial coercion, DATEVALUE, the pycel
operator hypothesis, IFERROR/IFNA version-skew, array IFERROR, RANDARRAY, and the SUM error-cell seed.

## Caveats for the reconciler

- `cause: TODO` is used for three _artifact_ buckets that have no semantic mechanism and no better
  vocabulary fit: the libreoffice empty recording, the COLUMN() harness placement, and the SUM
  formula-seed fidelity case. Each annotation's content says so explicitly.
- The pycel operator artifact is filed as `unimplemented-edge`; it is a driver-integration limitation,
  not a claim about the pycel library. Do not turn any operator-bearing pycel `#NAME?` into a
  "pycel lacks `<function>`" wiki statement.
- lattice, excel, gsheets, libreoffice were not runnable in this batch; their values are from recorded
  fixtures. All pure-engine claims are live-confirmed.
