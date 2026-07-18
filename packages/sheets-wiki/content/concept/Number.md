---
tags:
  - datatype
---

**Number** is the core numeric [[Data type|data type]] in Google Sheets. All numbers are stored internally as [double-precision 64-bit floating point](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) values (IEEE 754).

### Characteristics

- **Precision**: Google Sheets stores and renders numbers to roughly 15 significant figures, even though the underlying IEEE 754 double can represent about 17. Excel applies the same ~15-figure cap. This is why, for example, `CONVERT(1, "m", "ft")` reads back as `3.28083989501312` in Google Sheets rather than the full double `3.2808398950131235` — the two agree until the ~15th significant digit (gsheets-lane-notes.md, 2026-07-11).
- **Range**: Supports values from approximately $4.9 \times 10^{-324}$ to $1.8 \times 10^{308}$.
- **Storage**: Internally, numbers are stored as raw numeric values. Their appearance in the spreadsheet is controlled by [[Number Format Patterns]].

### Special Cases

#### Dates and Times
Google Sheets does not have a separate data type for dates or times. Instead, they are stored as **serial numbers**:
- The **integer portion** is the number of days since the epoch (December 30, 1899).
- The **fractional portion** is the time of day as a fraction of 24 hours.

See [[Datetime]] and [[Data type#Date and time storage]] for more details.

#### Booleans and Errors
While [[Boolean|Booleans]] and [[Error|Errors]] often behave like distinct types, they can sometimes be coerced into numbers (e.g., `TRUE` → `1`, `FALSE` → `0`).

### Limits
- Huge numbers may be displayed in scientific notation.
- Calculations that exceed the maximum limit will result in a [[Error|#NUM!]] error.

### Cross-type comparison

In a comparison that mixes types, a number is the **lowest-ranked** operand: the ordering is number < text < [[Boolean|boolean]]. So `"a" > 1` is `TRUE` (any text outranks any number) and `TRUE > 0` is `TRUE` (any boolean outranks any number). Numbers are not coerced up to text or booleans; the whole types are ranked. See [[Boolean#Cross-type comparison]].

### Engine compatibility

Arithmetic on numbers is portable — every engine treats numbers as IEEE 754 doubles. The visible divergence is in **how many digits are exposed**:

| Engine | Behavior |
| --- | --- |
| Google Sheets | Stores and renders to ~15 significant figures |
| Excel | Stores and renders to ~15 significant figures |
| formulas | Exposes the full IEEE 754 double (`=1/3` → `0.3333333333333333`) |
| pycel | Exposes the full double |
| HyperFormula | Applies its own display rounding (`=1/3` → `0.33333333333`) |
| IronCalc | Applies its own display rounding (`=1/3` → `0.333333333`) |

Digits beyond the ~15th are where Google Sheets and Excel results diverge from the pure JavaScript/Python engines; the arithmetic itself agrees (live probe, 2026-07-11).

### See Also
- [[Data type]] — Overview of the Sheets type system.
- [[Number Format Patterns]] — How numbers are displayed.
- [[Datetime]] — Internal storage of date/time as numbers.
- [[Boolean]], [[String]] — the other operands in cross-type comparison ordering.
- [[VALUE]] — Function to convert strings to numbers.
