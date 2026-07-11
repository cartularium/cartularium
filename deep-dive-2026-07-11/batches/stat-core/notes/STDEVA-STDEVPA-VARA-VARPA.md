# STDEVA / STDEVPA / VARA / VARPA — cross-engine deep dive

**Batch:** stat-core · **Refs:** STDEVA/stdeva-inline-boolean, STDEVA/stdeva-mixed-types, STDEVA/stdeva-numeric-only, STDEVPA/stdevpa-inline-boolean, STDEVPA/stdevpa-mixed-types, STDEVPA/stdevpa-numeric-only, VARA/vara-inline-boolean, VARA/vara-mixed-types, VARPA/varpa-inline-boolean, VARPA/varpa-mixed-types · **Confidence:** high (live-confirmed on pure engines)

## Behavior summary

The `*A` family (STDEVA, STDEVPA, VARA, VARPA — the "also count text and logicals" variants) is defined to coerce non-numeric operands: TRUE→1, FALSE→0, text→0, where the plain STDEV/VAR family would skip them. All engines that implement these functions agree on the pure-numeric and text-bearing range cases. The interesting fork is narrow and specific: **how IronCalc handles an inline literal boolean argument.**

## Divergences

### 1. Inline literal boolean: `=STDEVA(1, 2, TRUE)` and siblings

| Formula              | excel / formulas / gsheets / lattice | ironcalc        | hyperformula / pycel | libreoffice |
| -------------------- | ------------------------------------ | --------------- | -------------------- | ----------- |
| `=STDEVA(1,2,TRUE)`  | 0.5773502691896258                   | **0.707106781** | `#NAME?`             | blank       |
| `=STDEVPA(1,2,TRUE)` | 0.4714045207910317                   | **0.5**         | `#NAME?`             | blank       |
| `=VARA(1,2,TRUE)`    | 0.3333333333333335                   | **0.5**         | `#NAME?`             | blank       |
| `=VARPA(1,2,TRUE)`   | 0.2222222222222222                   | **0.25**        | `#NAME?`             | blank       |

Two mechanisms, three branches (cause: `arg-semantics`):

- **excel / formulas / gsheets / lattice** coerce inline `TRUE`→1 and compute over the sample `{1, 2, 1}`. STDEVA = sample SD of {1,2,1} = √(0.6667/2) = 0.5774; VARA = 0.3333; the population forms (STDEVPA/VARPA) divide by n=3.
- **ironcalc** implements the functions but **ignores the inline literal boolean**, computing over `{1, 2}` only. SD of {1,2}: sample = √(0.5/1) = 0.7071, population = 0.5; variance sample = 0.5, population = 0.25. Every ironcalc value in the table is exactly the two-element `{1,2}` statistic.
- **hyperformula and pycel** both return `#NAME?`, but for **different reasons.** pycel does not implement the `*A` functions at all. hyperformula _does_ implement them (see tables 2 and 3), but it resolves the **bare keyword `TRUE` as an undefined name** rather than a boolean literal — so any inline `TRUE`/`FALSE` literal breaks the call. This is not specific to the `*A` family: live-confirmed, `=SUM(1,2,TRUE)` and `=AVERAGE(1,2,TRUE)` _also_ return `#NAME?` on hyperformula, while `=STDEVA(1,2,3)` (inline numeric) returns 1 and `=STDEVA(C1:C3)` with a boolean _in a cell_ returns 0.5774. HyperFormula effectively requires `TRUE()`/`FALSE()` (function form) for a boolean literal.

### 2. Boolean/text inside a _range_ — everyone agrees

`=STDEVA(C1:C5)` with `C1=1, C2="text", C3=TRUE, C4=FALSE, C5=2` (refs `*-mixed-types`):

| Engine                                                         | Result                                 |
| -------------------------------------------------------------- | -------------------------------------- |
| excel / formulas / gsheets / hyperformula / ironcalc / lattice | 0.8366600265340756 (SD of {1,0,1,0,2}) |
| pycel                                                          | `#NAME?`                               |
| libreoffice                                                    | blank                                  |

Here **both ironcalc and hyperformula agree** — 0.836660027 — because there is no inline boolean literal, only a boolean stored in a cell (`C3=TRUE`). Both engines coerce cell booleans and text correctly (TRUE→1, FALSE→0, "text"→0). This pins down the two quirks precisely: ironcalc's "ignore the boolean" behavior and hyperformula's `#NAME?` are **only** triggered by an inline `TRUE`/`FALSE` _literal_ — never by a boolean in a range cell. Only pycel (function absent) fails the range case.

### 3. Pure numeric range — trivially agree

`=STDEVA(A1:A5)` of `{1..5}` (refs `*-numeric-only`): all implementers = 1.5811388300841898 (STDEVA/STDEVPA behave as STDEV.S/STDEV.P on all-numeric data); pycel `#NAME?`; libreoffice blank.

## Edges explored beyond the corpus

Live probe (`scratch/stat-core-probe1.mts`) established the split cleanly:

```
                    excel-branch   ironcalc   hyperformula   pycel
STDEVA(1,2,TRUE)    0.5773502692   0.707107   #NAME?         #NAME?
STDEVA(C1:C5)       0.8366600265   0.836660   0.83666002653  #NAME?
```

Two engine rules fall out:

- **ironcalc:** the `*A` variance/stdev functions coerce booleans in cells but drop inline literal booleans. AVERAGEA is the counter-example (see AVERAGEA note): ironcalc _does_ coerce the inline TRUE in `AVERAGEA(1,2,TRUE)`→1.333. The quirk is confined to the variance/stdev subset.
- **hyperformula:** the bare keyword `TRUE` is not a boolean literal — it is resolved as an (undefined) name, so `=SUM(1,2,TRUE)`, `=AVERAGE(1,2,TRUE)`, `=AVERAGEA(1,2,TRUE)` and `=STDEVA(1,2,TRUE)` all return `#NAME?` (all live-confirmed). Booleans in cells, and `TRUE()`/`FALSE()` in function form, are unaffected. This is a general parser trait, not a per-function gap — hyperformula computes `STDEVA`/`STDEVPA`/`VARA`/`VARPA` fine over ranges.

## Wiki-facing notes

- On STDEVA/STDEVPA/VARA/VARPA pages: **pycel does not implement these functions** (name error). **HyperFormula implements them over ranges** but rejects a bare `TRUE`/`FALSE` literal passed as an inline argument (returns `#NAME?`) — use `TRUE()`/`FALSE()` or a cell reference. Prefer STDEV.S/STDEV.P/VAR.S/VAR.P if the data is all-numeric and you need pycel portability.
- **IronCalc caveat:** `STDEVA/STDEVPA/VARA/VARPA` ignore a boolean passed as an _inline literal argument_ (e.g. `=STDEVA(1,2,TRUE)`), computing over the numeric arguments only — giving a different answer from Excel/Google Sheets. Booleans stored _in cells_ are coerced correctly. Practically: avoid `TRUE`/`FALSE` literals directly inside these calls on IronCalc.
- The pure-numeric and in-range mixed-type behaviors are portable across every implementing engine.

## Open questions

- None blocking. All branches were reproduced live on the pure engines; the excel/gsheets/lattice values come from recorded fixtures and are internally consistent with the coercion model. No excel/gsheets probe needed.
