---
tags:
  - datatype
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

A **blank** cell is a cell that holds no content. [[ISBLANK]] returns `TRUE` for it, [[COUNTBLANK]] counts it, and [[COUNTA]] does not. Blankness is a property of a cell rather than a stored [[Data type|value]]: a blank cell has never been given a number, string, boolean, or formula result.

Blank is distinct from two things it is easily confused with — the [[Null|null]] value produced by an empty argument slot inside a formula, and the empty [[String|string]] `""`. The three are the same to the eye (all display as nothing) but behave differently, and the boundary between blank and empty string is one of the sharpest cross-engine divergences in the spreadsheet type system.

### Blank, null, and empty string

| Concept | What it is | Example |
| --- | --- | --- |
| Blank | A cell with no content | An untouched cell `A1` |
| [[Null]] | The absence of a value in a formula expression | The empty 4th argument in `VLOOKUP("x", A1:B5, 2, )` |
| Empty string | A [[String|string]] of zero length | `=""`, or a cell holding `""` |

A genuinely empty cell is blank on every engine. A cell holding `""` is where engines part ways.

### The empty-string boundary

A cell can come to hold a zero-length string `""` in ordinary use — a helper formula like `=IF(cond, x, "")`, or a CSV import with an empty quoted field. Whether such a cell counts as *blank* or as *a text value* is not portable.

```gse
ISBLANK(A1)   → TRUE on Excel-family, FALSE on Google Sheets   (A1 holds "")
```

- **Excel, the `formulas` engine, pycel, and Lattice** treat a `""` cell as blank: `ISBLANK` returns `TRUE`, `COUNTA` does not count it, `COUNTBLANK` counts it (assay: ISBLANK/isblank-of-empty-string-cell; COUNTA/counta-empty-string-cell).
- **Google Sheets, HyperFormula, and IronCalc** treat a `""` cell as a text value: `ISBLANK` returns `FALSE`, and `COUNTA` counts it (assay: ISBLANK/isblank-of-empty-string-cell; live probe, 2026-07-11).

`COUNTA` and `COUNTBLANK` make the same split visible from the counting side. HyperFormula is the one engine where the two are strict complements over a `""` cell — it counts the cell in `COUNTA` and excludes it from `COUNTBLANK`. Google Sheets and IronCalc count the same `""` cell in *both*, treating it as "a written-but-empty cell" (assay: COUNTA/counta-empty-string-cell, COUNTBLANK/countblank).

> [!INFO]
> A literal empty string `""` written directly in a formula is *not* blank on any engine: `=ISBLANK("")` is `FALSE` everywhere (assay: ISBLANK/isblank-of-literal-empty-string; live probe, 2026-07-11). The divergence is specific to a *cell* that stores `""`, not to the empty-string value itself.

### Testing for blankness portably

Because `ISBLANK` alone disagrees across engines on `""` cells, a portable "is this cell empty or empty-string?" test combines both checks:

```gse
=OR(ISBLANK(A1), A1="")
```

This returns `TRUE` for a genuinely blank cell and for a `""` cell on every engine, sidestepping the boundary entirely.

### Functions that produce empty results

Some functions return "empty text" for degenerate inputs — `REPT("ha", 0)`, `ASC("")`, `ROMAN(0)`, `T(TRUE)`. Engines represent that empty result two ways: as a **blank cell** (Excel, the `formulas` engine) or as an **explicit empty string `""`** (Google Sheets, IronCalc, Lattice) (assay: REPT/rept-zero, T/t-of-boolean). A downstream `=IF(REPT(...)="", …)` behaves the same either way, but `=ISBLANK(REPT(...))` does not — it inherits the same blank-versus-empty-string split described above.

### See Also

- [[Null]] — the absence of a value in a formula expression, distinct from a blank cell.
- [[String]] — the empty string `""` and how it differs from blank.
- [[Data type]] — overview of the type system.
- [[ISBLANK]], [[COUNTA]], [[COUNTBLANK]] — the functions that expose the blank boundary.
- [[Type coercion]] — how blank cells coerce to `0` and `""`.
