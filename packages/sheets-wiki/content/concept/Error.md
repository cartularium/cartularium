---
tags:
  - datatype
  - error
---

**Error** is a [[Data type|data type]] representing failed formula evaluation. When a formula cannot compute a valid result, it returns an error value that propagates through dependent calculations.

### Error Types

Google Sheets recognizes the following error types:

| Error | Name | Typical Cause |
|-------|------|---------------|
| `#ERROR!` | ERROR | Generic error or circular dependency detected |
| `#NULL!` | NULL_VALUE | Invalid range intersection (using space operator incorrectly) |
| `#DIV/0!` | DIVIDE_BY_ZERO | Division by zero or empty cell |
| `#VALUE!` | VALUE | Wrong type of argument or incompatible operation |
| `#REF!` | REF | Invalid cell reference (deleted cells, out of bounds) |
| `#NAME?` | NAME | Unrecognized function or range name |
| `#NUM!` | NUM | Invalid numeric value in formula |
| `#N/A` | N_A | Value not available (lookup functions, explicit NA()) |
| `Loading...` | LOADING | Formula is currently being calculated |

### Error Propagation

Errors propagate through formulas. If a cell contains an error, any formula referencing that cell also returns an error (typically the same error type). This cascading behavior helps identify the source of calculation problems.

Exceptions:
- [[IFERROR]] can intercept and replace errors
- [[IFNA]] specifically handles `#N/A` errors
- [[ISERROR]], [[ISERR]], [[ISNA]] can test for errors without propagating them
- Certain functions like [[SUBTOTAL]] can ignore error values

#### Propagation through aggregation

The math aggregates return the first error they encounter rather than skipping it: `=SUM(1, NA(), 3)` returns `#N/A`, `=SUM(1, 1/0, 3)` returns `#DIV/0!`, and [[AVERAGE]], [[MAX]], and [[MIN]] behave the same way. The counting functions split on whether they count errors: [[COUNT]] ignores them (`=COUNT(1, NA(), 3, 1/0)` is `2`), while [[COUNTA]] counts every non-empty argument including errors (`=COUNTA(1, NA(), 3, 1/0)` is `4`). This propagate-through-SUM, ignore-in-COUNT, count-in-COUNTA behavior is portable across every engine that implements these functions (assay: SUM/sum-with-one-n-a, SUM/sum-with-one-div-0, AVERAGE/average-with-one-error, MAX/max-with-error, COUNT/count-ignores-errors, COUNTA/counta-counts-errors; live probe, 2026-07-11).

Whether an error inside a *range* propagates depends on the cell holding a live error, not text that merely looks like one: a cell containing the literal string `=1/0` is inert and is skipped by [[SUM]], so `=SUM(A1:A3)` over `1`, `"=1/0"`, `3` is `4`, not `#DIV/0!`. A genuinely error-valued cell does propagate.

### Common Causes

#### `#ERROR!`
- Circular references in formulas
- Parsing errors in expressions
- Array formula size mismatches

#### `#NULL!`
- Incorrect use of space as intersection operator
- Example: `=SUM(A1:A10 B1:B10)` when ranges don't intersect

#### `#DIV/0!`
- Dividing by zero: `=1/0`
- Dividing by empty cell: `=A1/B1` where B1 is blank
- Mathematical operations resulting in division by zero

#### `#VALUE!`
- Type mismatch: `=A1+B1` where one contains text
- Function expects number but receives text
- Incompatible array dimensions in array operations

#### `#REF!`
- Referencing deleted rows/columns
- Formula references cells outside sheet bounds
- [[INDIRECT]] creates invalid reference

#### `#NAME?`
- Misspelled function name: `=SUMM(A1:A10)`
- Unquoted text treated as named range
- Reference to non-existent named range

#### `#NUM!`
- Numeric calculation out of range
- Invalid argument to mathematical function
- Iteration limit exceeded in iterative calculations

#### `#N/A`
- [[VLOOKUP]], [[HLOOKUP]], [[MATCH]] find no match
- Explicit `=NA()` function call
- Missing value in data set

#### `Loading...`
- Temporary state while formula calculates
- Common with complex recursive formulas or external data sources
- Usually resolves automatically

### Error as Values

In the Google Sheets API, errors are represented as `ErrorValue` objects containing:
- `type` — the error type enum (see table above)
- `message` — localized descriptive message

### Cross-engine error codes

The error codes above are Google Sheets' vocabulary. Other spreadsheet engines recognize the same families but do not always assign the same code to the same failure. The same divide-by-zero condition inside a function can surface as `#DIV/0!` in Google Sheets and `#NUM!` in Excel; an out-of-bounds [[INDEX]] is `#NUM!` in Google Sheets and `#REF!` in Excel. Because the codes diverge but the failures do not, error handling that keys on the *presence* of an error ([[IFERROR]], [[ISERROR]]) is portable, while dispatch that keys on the *specific* code is not. See [[Error code portability]] for the catalogue of these splits and the portability guidance.

### See Also
- [[IFERROR]] — handle errors with fallback values
- [[IFNA]] — handle `#N/A` specifically
- [[ISERROR]], [[ISERR]], [[ISNA]] — test for errors
- [[Error code portability]] — how error codes differ across engines
- [[Data type]] — core data types in Google Sheets
