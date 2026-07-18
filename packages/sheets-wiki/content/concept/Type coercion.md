---
tags:
  - datatype
  - coercion
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

Google Sheets reconciles ordinarily incompatible [[Data type|data types]] through a process known as [type coercion](https://developer.mozilla.org/en-US/docs/Glossary/Type_coercion). These rules are not applied uniformly. Whether a value is coerced depends on two things: the operation, and the value's *shape*, meaning whether it reaches the operation as a scalar or as an element of a [[Array#Range|range]] or [[Array#Array literals|array literal]]. A scalar and a one-element array are distinct here, not interchangeable.

### Reference table

Below is a non-exhaustive list of values and how Google Sheets coerces each in common **scalar** contexts. Each column applies one operation directly to the value:

```gse
=IF([value],TRUE,FALSE)
=JOIN([value],"foo","bar")
=[value]+1
```

| **Value** | **Boolean** | **String** | **Number** |
| --------- | ----------- | ---------- | ---------- |
| `TRUE`    | \-          | `"TRUE"`   | `1`        |
| `FALSE`   | \-          | `"FALSE"`  | `0`        |
| `"TRUE"`  | `TRUE`      | \-         | `#VALUE!`  |
| `"FALSE"` | `FALSE`     | \-         | `#VALUE!`  |
| `"foo"`   | `#VALUE!`   | \-         | `#VALUE!`  |
| `""`      | `FALSE`     | \-         | `0`        |
| `1`       | `TRUE`      | `"1"`      | \-         |
| `0`       | `FALSE`     | `"0"`      | \-         |
|           | `FALSE`     | `""`       | `0`        |

Every value above is passed directly to the operation, and coercion applies. The sections below cover the contexts where it does not — and where other engines disagree.

### Scalars and arrays

The same value can be coerced or ignored depending on its shape. Aggregation functions draw the sharpest line: `SUM`, `PRODUCT`, and `COUNT` coerce a number-looking string or a [[Boolean]] when it is a **scalar argument**, but ignore that same value when it sits inside a range or an array literal.

```gse
=SUM(TRUE,"2")        → 3    (coerced: TRUE→1, "2"→2)
=SUM({1,"2",TRUE})    → 1    (only the bare number 1 counts)
=SUM(A1:A3)           → 0    (A1:A3 hold the text "1","2","3")
```

The rule keys on shape, not on the value: the identical `"2"` is worth `2` as a scalar and worth nothing as an array element (assay: SUM/mixed-array-in-sum, SUM/sum-of-string-range; gsheets probe, 2026-07-11).

The line runs between a scalar and an array, not between "one value" and "many values". A one-element array is still an array. `=SUM("2")` coerces the scalar string and returns `2`, while `=SUM({"2"})` wraps the same string in a 1×1 array and returns `0`, even though both look like a single value (maintainer-reported from Lattice work, to verify with an assay case). [[PRODUCT]] follows the same rule — `=PRODUCT({"2","3","4"})` is `0`, not `24`, because none of the elements is a bare number, and `PRODUCT` over no numeric factors is `0` (assay: PRODUCT/string-array-in-product). [[COUNT]] likewise tallies only bare numbers, skipping text and booleans held in a range or literal; use [[COUNTA]] to count non-empty cells regardless of type.

To coerce a range or array literal on purpose, force it element-wise — see [Explicit coercion](#explicit-coercion) below.

### Operators

Coercion also depends on which operator you use, not just where the value sits.

Arithmetic operators (`+`, `-`, `*`, `/`) coerce operands to [[Number|numbers]]: `="2"+1` is `3`, `=TRUE*3` is `3`. A non-numeric string errors: `="foo"+1` is `#VALUE!`.

Comparison operators (`<`, `>`, `=`) do **not** coerce across types. When operands are the same type, they compare by value; when the types differ, Google Sheets ranks them by type — number, then text, then boolean — rather than converting one to the other (gsheets probe, 2026-07-11). So `=TRUE>0` is `TRUE` (any boolean outranks any number) and `=2>TRUE` is `FALSE`, even though `TRUE` coerces to `1` in an arithmetic context. This type-rank ordering is a common source of surprising comparison results.

### Text and numbers

Three functions convert types explicitly, and all three are portable across engines:

- [[VALUE]] parses a numeric string to a number. It errors on non-numeric strings **and on boolean-looking strings**: `=VALUE("TRUE")` is `#VALUE!` (it does not parse `"TRUE"` to a boolean or to `1`), while `=VALUE("123.45")` is `123.45` (assay: VALUE/value-of-boolean-string, VALUE/value-of-numeric-string; live probe, 2026-07-11).
- [[N]] converts a value to a number: numbers pass through, non-numeric text maps to `0`, and errors propagate (`=N(#VALUE!)` is `#VALUE!`) (assay: N/n-of-string; live probe, 2026-07-11).
- [[T]] returns its argument if it is text and empty text otherwise. The *value* is portable, but its **representation** splits: `=T(TRUE)` is a genuinely blank cell in Excel but a zero-length string `""` in Google Sheets, IronCalc, and Lattice (assay: T/t-of-boolean; live probe, 2026-07-11). This matters only if you chain [[ISBLANK]] or [[LEN]] on the result.

### Date strings

Date functions accept a date as a serial number or, usually, as a text string like `"2023-01-01"`. Whether the text form is coerced is **per engine and even per function**.

Google Sheets, Excel, IronCalc, Lattice, and the `formulas` library coerce ISO-8601 date strings to serials. HyperFormula does **not** — `=WEEKNUM("2023-01-01",21)` and `=YEARFRAC("2025-01-01","2026-01-01",2)` both return `#VALUE!` there, though the same formulas compute correctly the moment the argument is wrapped in `DATE(2023,1,1)` or passed a real date serial. pycel has the same restriction for [[YEARFRAC]] (assay: WEEKNUM/weeknum-iso-system, YEARFRAC/yearfrac-actual-360; live probe, 2026-07-11).

The gap is not global even within one engine. In Google Sheets, [[XIRR]] coerces text dates but [[XNPV]] rejects them — the same text-date argument computes a rate in `XIRR` and returns `#VALUE!` in `XNPV` (gsheets probe, 2026-07-11). Wrap date literals in [[DATE]] for portable, unambiguous formulas.

### Cross-engine coercion

The scalar-versus-array rule above is Google Sheets and Excel behavior. Open engines disagree, so a sum over text-typed cells can produce a genuinely different number — not just a different error code.

`=SUM(A1:A3)` with `A1:A3` holding the text `"1"`, `"2"`, `"3"`:

| Engine        | Result | Behavior         |
| ------------- | ------ | ---------------- |
| Google Sheets | `0`    | text ignored     |
| Excel         | `0`    | text ignored     |
| pycel         | `0`    | text ignored     |
| HyperFormula  | `6`    | text coerced     |
| IronCalc      | `6`    | text coerced     |
| formulas      | `6`    | text coerced     |
| Lattice       | `6`    | text coerced     |

`=SUM({1,"2",TRUE})` shows the array-literal case has even more spread:

| Engine                                 | Result   | Behavior                            |
| -------------------------------------- | -------- | ----------------------------------- |
| Google Sheets, Excel, IronCalc, pycel  | `1`      | only the bare number counts         |
| formulas                               | `3`      | text coerced, boolean skipped       |
| Lattice                                | `4`      | text and boolean coerced            |
| HyperFormula                           | `#NAME?` | rejects boolean literals inside `{}` |

No engine's coercion policy is uniform across scalar and array shapes: IronCalc skips text in an array literal but coerces it in a range; HyperFormula coerces text in a range but rejects boolean literals in `{}` (assay: SUM/sum-of-string-range, SUM/mixed-array-in-sum, SUM/boolean-array-in-sum; live probe, 2026-07-11).

### Explicit coercion

Because the auto-coercion rules differ across contexts and engines, the portable approach is to coerce explicitly rather than rely on a range or array to auto-skip or auto-coerce. Double unary negation (`--`), multiplication by `1` (`*1`), addition of `0` (`+0`), [[N]], and [[VALUE]] all force a value to a number before it reaches an aggregate:

```gse
=SUM(--A1:A3)     → 6    (text "1","2","3" forced to numbers)
=SUMPRODUCT(A1:A3*1)
```

Forcing coercion element-wise makes the intent explicit and gives the same result on every engine, sidestepping the scalar-versus-array divergences above.

### See Also

- [[Data type]] — the type system these rules operate over.
- [[Number]], [[String]], [[Boolean]], [[Null]], [[Error]] — the scalar types involved.
- [[VALUE]], [[N]], [[T]] — explicit type-conversion functions.
- [[SUM]], [[PRODUCT]], [[COUNT]] — aggregation and the scalar-versus-array rule.
