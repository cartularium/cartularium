# IFERROR / IFNA — cross-engine deep dive

**Batch:** date-volatile-errors · **Refs:** IFERROR/{iferror-catches-div-0, iferror-catches-n-a, iferror-passes-clean-value, iferror-over-array-with-errors, iferror-over-division-with-zero}, IFNA/{ifna-catches-n-a-only, ifna-does-not-catch-div-0, ifna-passes-clean-value} · **Confidence:** high

## Behavior summary

`IFERROR(value, fallback)` returns `fallback` if `value` is any error, else `value`.
`IFNA(value, fallback)` catches **only** `#N/A`, passing every other error through. The scalar
semantics are uniform across excel, gsheets, hyperformula, ironcalc, formulas and lattice:

| formula                      | all six functional engines         |
| ---------------------------- | ---------------------------------- |
| `=IFERROR(1/0, "err")`       | `"err"`                            |
| `=IFERROR(#N/A, "fallback")` | `"fallback"`                       |
| `=IFERROR(42, "err")`        | `42`                               |
| `=IFNA(#N/A, "caught")`      | `"caught"`                         |
| `=IFNA(1/0, "caught")`       | `#DIV/0!` (IFNA does not catch it) |
| `=IFNA(42, "caught")`        | `42`                               |

The `IFNA(1/0)` → `#DIV/0!` case is the clean illustration that IFNA is `#N/A`-selective — a genuinely
portable behavior, and only a "fork" in the corpus because of the libreoffice/pycel artifacts below.

## Divergences

All divergences here are engine-coverage / artifact, not scalar semantics:

### Array-form IFERROR — the real engine split

| formula                     | excel/gsheets/hyperformula/formulas/lattice | ironcalc   | pycel                 |
| --------------------------- | ------------------------------------------- | ---------- | --------------------- |
| `=IFERROR({1, #N/A, 3}, 0)` | `{1, 0, 3}` (element-wise)                  | `#N/IMPL!` | `0` (scalar collapse) |
| `=IFERROR(10/{1,0,2}, -1)`  | `{10, -1, 3→5}` i.e. `{10,-1,5}`            | `#N/IMPL!` | `#NAME?`              |

- **ironcalc** does not implement IFERROR over an array argument and emits its explicit
  unimplemented sentinel `#N/IMPL!` (confirmed live, `date-volatile-errors-probe1.mts`). This is the
  `array-handling` bucket.
- **pycel** does not broadcast: for `{1,#N/A,3}` it returns the scalar fallback `0`; for
  `10/{1,0,2}` it returns `#NAME?` (the `/` operator trips the pycel driver's operator limitation —
  see `pycel-driver-artifacts.md`).
- The array-capable engines replace only the error positions, leaving clean elements intact.

### pycel artifacts (not semantics)

- `=IFERROR(1/0,"err")`, `=IFNA(1/0,"caught")` → pycel `#NAME?` because of the `1/0` operator, not
  because IFERROR/IFNA are missing.
- `=IFERROR(#N/A,"fallback")`, `=IFERROR(42,"err")`, `=IFNA(#N/A,"caught")`, `=IFNA(42,"caught")` →
  recorded pycel `#NAME?` is **version-skew**: the current pycel build returns the correct value
  (confirmed live, `date-volatile-errors-probe3.mts`). IFERROR/IFNA were added to pycel after the
  2026-06-17 recording.

### libreoffice

Blank in every case (empty recording).

## Edges explored beyond the corpus

| formula                 | hyperformula | ironcalc | formulas | pycel                           |
| ----------------------- | ------------ | -------- | -------- | ------------------------------- |
| `=IFERROR(SQRT(-1), 9)` | 9            | 9        | 9        | `#NAME?` (unary-minus operator) |
| `=IFNA("x", "caught")`  | —            | —        | —        | `"x"` (pycel, live)             |

IFERROR catches the `#NUM!` from `SQRT(-1)` on the functional engines; pycel never computes it (the
`-1` gates the whole formula to `#NAME?`).

## Wiki-facing notes

- IFERROR/IFNA scalar semantics are fully portable across the six functional engines, including
  IFNA's `#N/A`-only selectivity (`IFNA(1/0,…)` passes `#DIV/0!` through).
- **Array form is not portable to IronCalc** — `IFERROR({…},…)` returns `#N/IMPL!` there. Excel,
  Google Sheets, HyperFormula, `formulas` and lattice broadcast element-wise.
- pycel: IFERROR/IFNA now supported for scalar clean/`#N/A` arguments (newer than the corpus); still
  cannot be measured on any argument that contains an operator.

## Open questions

- Confirm excel/gsheets spill `{10,-1,5}` for `=IFERROR(10/{1,0,2},-1)` (probe `dve-007`).
