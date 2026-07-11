# Volatile functions: NOW / TODAY / RAND / RANDBETWEEN / RANDARRAY — cross-engine deep dive

**Batch:** date-volatile-errors · **Refs:** NOW/now, NOW/now-ge-today, NOW/now-gt-zero, TODAY/today-gt-zero, RAND/{rand-ge-zero, rand-lt-one, rand-returns-number}, RANDBETWEEN/{randbetween-bounds-low, randbetween-negative-range, randbetween-returns-integer}, RANDARRAY/randarray-integer-mode, COLUMN/column-of-target-cell · **Confidence:** high

## Behavior summary

Volatile functions recompute each evaluation, so their raw values cannot match across engines by
construction. The corpus tests them the right way — through invariant predicates (`RAND()>=0`,
`ISNUMBER(RAND())`, `NOW()>=TODAY()`) — which are TRUE on every engine that evaluates them. The forks
in this group are almost entirely (a) the pycel driver artifacts and (b) genuine pycel coverage gaps,
plus one Excel-only dynamic-array function and one harness placement artifact.

## Divergences

### NOW() — clock + timezone, not semantics

`=NOW()` recorded six distinct serials:

| engine       | serial          |                   |
| ------------ | --------------- | ----------------- |
| excel        | 46190.52933     | local cluster     |
| formulas     | 46190.52808     | local cluster     |
| hyperformula | 46190.52777     | local cluster     |
| pycel        | 46190.52780     | local cluster     |
| **gsheets**  | **46190.83352** | ~+0.30 day (~7 h) |
| **ironcalc** | **46190.81944** | ~+0.30 day (~7 h) |

The four "local cluster" engines agree to within seconds (sampling jitter). gsheets and ironcalc sit
~7 hours later, consistent with capturing the timestamp in a different (UTC vs local) timezone. This is
expected volatile/timezone behavior. `=NOW()>=TODAY()` and `=NOW()>0` are TRUE wherever evaluated;
pycel returns `#NAME?` (the comparison operator — NOW itself works, see below).

### pycel: NOW/TODAY work, RAND/RANDBETWEEN/RANDARRAY do not

Confirmed live (`date-volatile-errors-probe4.mts`): `=NOW()` → 46214.066, `=TODAY()` → 46214 on pycel.
So the volatile-suite pycel `#NAME?` results split cleanly:

| ref                        | formula                        | why pycel #NAME?                      |
| -------------------------- | ------------------------------ | ------------------------------------- |
| now-ge-today               | `=NOW()>=TODAY()`              | `>=` operator (NOW/TODAY both work)   |
| now-gt-zero                | `=NOW()>0`                     | `>` operator                          |
| today-gt-zero              | `=TODAY()>0`                   | `>` operator (TODAY works standalone) |
| rand-returns-number        | `=ISNUMBER(RAND())`            | RAND missing (no operator)            |
| rand-ge-zero               | `=RAND()>=0`                   | RAND missing + `>=` operator          |
| rand-lt-one                | `=RAND()<1`                    | RAND missing + `<` operator           |
| randbetween-bounds-low     | `=RANDBETWEEN(5,5)`            | RANDBETWEEN missing (no operator)     |
| randbetween-negative-range | `=AND(RANDBETWEEN(-10,-5)>=…)` | RANDBETWEEN missing + operators       |

See `pycel-driver-artifacts.md` for the operator-limitation detail.

### RANDBETWEEN returns-integer — non-deterministic, not a divergence

`=INT(RANDBETWEEN(1,10))=RANDBETWEEN(1,10)` calls RANDBETWEEN twice. Since RANDBETWEEN is always
integral, this reduces to "did the two independent draws coincide?" — probability ~1/10. Recorded:
excel TRUE; formulas/gsheets/hyperformula/ironcalc FALSE. A live hyperformula run of this exact formula
returned **TRUE**, flipping its recorded FALSE — proving the result is volatility noise. There is no
stable cross-engine relationship here; the test is inherently flaky.

### RANDARRAY(1,3,1,10,TRUE) — Excel-only dynamic array

| engine                                  | result             | mechanism                                         |
| --------------------------------------- | ------------------ | ------------------------------------------------- |
| excel                                   | spills `{3, 9, 2}` | dynamic-array RANDARRAY, integer mode             |
| gsheets                                 | `#N/A`             | does not evaluate this form                       |
| formulas, hyperformula, ironcalc, pycel | `#NAME?`           | RANDARRAY unimplemented (all four confirmed live) |
| libreoffice                             | blank              | empty recording                                   |

RANDARRAY is effectively Excel-only across the catalogue. The excel-spill vs gsheets-`#N/A` distinction
is worth live confirmation (probe `dve-004`).

### COLUMN() — harness cell placement

`=COLUMN()` returns the column of the formula's own cell, so its value depends on where each driver
stages the formula, not on engine semantics: most engines returned 27, lattice returned 26 (staged one
column earlier). The test file documents this explicitly ("each driver picks a target cell … the portable
`COLUMN(<ref>)` tests verify 1-indexing"). `=COLUMN(C1)` → 3 everywhere. Artifact, not a divergence.

## Wiki-facing notes

- Test volatile functions with invariants (`RAND()>=0`, `ISNUMBER(RAND())`), never by value.
- NOW()/TODAY() timestamps carry a timezone: gsheets and (in this recording) ironcalc report ~7 h
  ahead of the local-machine engines. Don't compare absolute NOW() serials across engines.
- RANDARRAY is Excel-only; the `formulas`, HyperFormula, IronCalc and pycel engines have no RANDARRAY.
- pycel has NOW/TODAY but not RAND/RANDBETWEEN/RANDARRAY.
- `COLUMN()`/`ROW()` with no argument are position-dependent; use `COLUMN(ref)`/`ROW(ref)` for portable
  code.

## Open questions

- probe `dve-004`: does gsheets genuinely reject `RANDARRAY(1,3,1,10,TRUE)` with `#N/A`, or is that a
  spill/harness artifact?
