---
tags:
  - datatype
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

Each [[Term|term]] in Google Sheets has a [type](https://en.wikipedia.org/wiki/Type_system) that determines which operations can be performed on it.

### Overview

Google Sheets uses a [dynamic](https://developer.mozilla.org/en-US/docs/Glossary/Dynamic_typing), [weakly](https://en.wikipedia.org/wiki/Type_safety) typed system. Types are not declared by the user; they are inferred at runtime from cell content and context. This allows flexible formulas but can produce inconsistent behavior, as type coercion is handled differently across functions.

Sheets recognizes the following core types:

| Type        | Description                                                                         |
| ----------- | ----------------------------------------------------------------------------------- |
| [[Number]]  | Numeric values such as integers, decimals, and scientific notation.         |
| [[String]]  | Text values enclosed in quotes or inferred from literal input.                      |
| [[Boolean]] | Logical values `TRUE` and `FALSE`.                                                  |
| [[Array]]   | Two-dimensional collections of values that may spill across multiple cells.         |
| [[Lambda]]  | Executable terms created using `LAMBDA` or related constructs.                      |
| [[Error]]   | Runtime signals representing failed evaluation. Propagate through most expressions. |
| [[Null]]    | Conceptual type for **blank cells** or expressions with no value.                   |

Higher-level constructs such as [[LAMBDA data structures]] are derived from these base types.

### Internal representation

Google Sheets internally stores different types of data in specific ways that may differ from their displayed format.

#### Date and time storage

[[Datetime]], [[Date]], and [[Time]] values are stored internally as [[Number|numbers]] using a serial number format based on an epoch date (December 30, 1899). The whole number portion represents days since the epoch, while the fractional portion represents time as a fraction of one day:

- `2.5` = January 1, 1900 at noon (2 days after epoch + 0.5 days for noon)
- `33.625` = February 1, 1900 at 3 PM (33 days after epoch + 0.625 days for 15:00)

This storage method allows date and time arithmetic to work naturally through numeric operations. See [[Datetime]] for more details.

#### Number format types

Numbers can be displayed using various format types. The Google Sheets API defines these standard format types:

- `TEXT` — Displayed as text
- `NUMBER` — Standard numeric format (e.g., `1000.12`)
- `PERCENT` — Percentage display (e.g., `10.12%`)
- `CURRENCY` — Currency format (e.g., `$1,000.12`)
- `DATE` — Date format (e.g., `9/26/2008`)
- `TIME` — Time format (e.g., `3:59:00 PM`)
- `DATE_TIME` — Combined date and time (e.g., `9/26/08 15:59:00`)
- `SCIENTIFIC` — Scientific notation (e.g., `1.01E+03`)

The actual format depends on the spreadsheet's locale. See [[Number Format Patterns]] and [[Date Format Patterns]] for custom formatting.

### Cell value representations

Each cell has three distinct representations:

- **User-entered value** (`userEnteredValue`) — The raw value or formula as entered by the user (e.g., `=NOW()`, `'123`, `1234`)
- **Effective value** (`effectiveValue`) — The computed result after formula evaluation. For literals, this matches the user-entered value. For formulas, this is the calculated result.
- **Formatted value** (`formattedValue`) — The display string shown to the user, incorporating number formatting, date formatting, etc.

For example, entering `=NOW()` creates a user-entered value of `"=NOW()"`, an effective value as a serial number (e.g., `45326.625`), and a formatted value like `"1/15/2024 3:00:00 PM"`.

### Dynamic typing

A term’s type may change depending on how it is used. For example:

```gse
="1"&1       → "11"
=IF("","X","Y") → "Y"
```

Such conversions are governed by [[Type coercion]].

### Scalar types

These are single-cell values that represent indivisible data within a formula. Scalar types form the basic units of computation in Sheets and contrast with compound structures such as arrays or lambdas. They include [[Number]] , [[String]], [[Boolean]], [[Null]], and [[Error]].

Scalar types participate directly in type coercion and function arguments, and they do not produce spill ranges or encapsulate multiple values.

### Structural types

Some expressions encapsulate multiple values or behaviors:
- [[Array]] terms hold multiple values in two dimensions.
- [[Lambda]] terms hold executable expressions.
- [[LAMBDA data structures]] simulate user-defined structures.

These may be considered compound types, though Sheets does not support type introspection.

### Type errors

If a value cannot be coerced into the expected type, evaluation produces an error such as `#VALUE!` or `#N/A`.

### See Also
- [[Type coercion]] — conversion rules between types.
- [[Number]], [[String]], [[Boolean]], [[Null]], [[Array]], [[Lambda]], [[Error]] — type-specific behavior.
- [[Datetime]], [[Date]], [[Time]] — date and time storage as serial numbers.
- [[Number Format Patterns]], [[Date Format Patterns]] — custom formatting patterns.
- [[LAMBDA data structures]] — compound types built from LAMBDA.

