# AVERAGEA — cross-engine deep dive

**Batch:** stat-core · **Refs:** AVERAGEA/averagea-inline-booleans · **Confidence:** high (live-confirmed on pure engines)

## Behavior summary

`AVERAGEA` averages its arguments, coercing logicals and text (TRUE→1, FALSE→0, text→0) where plain `AVERAGE` would skip them. The corpus fork here is the inline-literal-boolean case `=AVERAGEA(1, 2, TRUE)`, whose expected value is `(1+2+1)/3 = 1.3333...`.

## Divergences

### `=AVERAGEA(1, 2, TRUE)`

| Engine                                          | Result             | Reason                                            |
| ----------------------------------------------- | ------------------ | ------------------------------------------------- |
| excel / formulas / gsheets / ironcalc / lattice | 1.3333333333333333 | coerce inline TRUE → 1                            |
| hyperformula                                    | `#NAME?`           | bare keyword `TRUE` resolved as an undefined name |
| pycel                                           | `#NAME?`           | AVERAGEA not implemented                          |
| libreoffice                                     | blank              | stale all-null fixture (artifact)                 |

**Mechanism (cause: `arg-semantics`).** The `#NAME?` class contains two _different_ causes:

- **pycel** — `AVERAGEA` is absent from pycel's function library.
- **hyperformula** — implements `AVERAGEA` (confirmed live: `=AVERAGEA(C1:C5)` over `{1,text,true,false,2}` → 0.8, and `=AVERAGEA(1,2,3)` → 2), but resolves the **bare keyword `TRUE` as a name**, not a boolean literal. The same failure appears in `=SUM(1,2,TRUE)` and `=AVERAGE(1,2,TRUE)` on hyperformula. Use `TRUE()`/`FALSE()` (function form) or a cell reference.

Crucially, **ironcalc agrees here (1.333)** — it coerces the inline TRUE for `AVERAGEA`/`AVERAGE`. This is the counter-example to ironcalc's `*A` variance/stdev quirk (see the STDEVA/STDEVPA/VARA/VARPA note), where ironcalc _ignores_ the same inline TRUE. So within ironcalc, inline-boolean coercion is present for the mean functions but absent for the variance/stdev `*A` functions — an internal inconsistency worth flagging.

## Edges explored beyond the corpus

Live probe (`scratch/stat-core-probe2/3.mts`):

```
hyperformula  AVERAGEA(1,2,TRUE)=#NAME?   AVERAGEA(1,2,3)=2   AVERAGEA(C1:C5)=0.8   AVERAGE(1,2,TRUE)=#NAME?   SUM(1,2,TRUE)=#NAME?
ironcalc      AVERAGEA(1,2,TRUE)=1.333    AVERAGE(1,2,TRUE)=1.333
```

## Wiki-facing notes

- On the AVERAGEA page: **pycel does not implement AVERAGEA.** **HyperFormula implements it** but rejects a bare `TRUE`/`FALSE` literal argument (returns `#NAME?`) — pass `TRUE()`/`FALSE()` or a cell. Booleans stored in cells are coerced correctly by both HyperFormula and IronCalc.
- Note the IronCalc inconsistency for authors targeting IronCalc: `AVERAGEA(1,2,TRUE)` coerces TRUE (→1.333) but `STDEVA(1,2,TRUE)`/`VARA(1,2,TRUE)` ignore it. Same literal, different treatment across the mean vs variance families.

## Open questions

- None blocking. The hyperformula bare-boolean-literal behavior is a general parser trait (also seen on SUM/AVERAGE), consistently reproduced live.
