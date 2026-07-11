---
tags:
  - datatype
---

**String** is the [[Data type|data type]] used for text in Google Sheets. Any sequence of characters that is not interpreted as a number, boolean, or error is treated as a string.

### Characteristics

- **Encoding**: Google Sheets uses [UTF-8](https://en.wikipedia.org/wiki/UTF-8) encoding, allowing for a wide range of international characters and symbols.
- **Literals**: In formulas, strings must be enclosed in double quotes (e.g., `"Hello"`). Literal text entered directly into a cell does not require quotes.
- **Maximum Length**: A single cell can contain up to 50,000 characters.

### String Operators

- **Concatenation (`&`)**: Joins two values into a single string.
  - `="Hello " & "World"` → `"Hello World"`
  - `="Area: " & 51` → `"Area: 51"` (The number 51 is coerced to a string)

### Text vs. Numbers
A common point of confusion is "numeric strings"—text that looks like a number.
- `'123` (leading apostrophe) is a string.
- `="123"` is a string.
- `123` is a number.

Strings cannot be used in mathematical operations without [[Type coercion|coercion]]. In an aggregate, whether a numeric string is coerced depends on **how it arrives**: passed as a direct scalar argument it coerces, but a numeric string sitting inside a range or an array literal is **skipped**, not coerced. `=SUM(A1:A3)` over text cells `"1"`, `"2"`, `"3"` returns `0` in Excel and Google Sheets, because text in a range does not participate (assay: SUM/sum-of-string-range). To sum numbers-stored-as-text, coerce explicitly with `VALUE()`, `--`, or `*1`.

### The empty string

The empty (zero-length) string `""` is a text value, but a *cell* holding `""` sits on a cross-engine fault line — the [[Blank#The empty-string boundary|empty-string boundary]]. Google Sheets, HyperFormula, and IronCalc treat such a cell as a text value; Excel and the LibreOffice family treat it as [[Blank|blank]]. This changes what `ISBLANK`, `COUNTA`, and `COUNTBLANK` report over columns that can contain `""` (very common in `=IF(cond, x, "")` helper columns and CSV imports). See [[Blank]].

### Cross-type comparison

In a comparison that mixes types, text ranks **between** numbers and [[Boolean|booleans]]: number < text < boolean. Any string outranks any number, and any boolean outranks any string.

```gse
"a" > 1      → TRUE    (text outranks every number)
"a" > TRUE   → FALSE   (but boolean outranks text)
```

Text-versus-text comparison is lexicographic (`"apple" < "banana"` → `TRUE`). This ordering holds on Excel, Google Sheets, IronCalc, and the `formulas` engine (live probe, 2026-07-11).

### See Also
- [[Data type]] — Overview of the Sheets type system.
- [[Blank]] — the empty-string-versus-blank boundary.
- [[Type coercion]] — How strings convert to other types.
- [[Number]], [[Boolean]] — the other operands in cross-type comparison ordering.
- [[TEXT]] — Function to format numbers into strings.
- [[T]] — Function to verify if a value is a string.
