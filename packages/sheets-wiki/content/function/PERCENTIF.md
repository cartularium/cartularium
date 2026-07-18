---
name: PERCENTIF
category: math
engines:
  gsheets:
    status: available
coverage: pending-assay
syntax: PERCENTIF(range, criterion)
status: imported
description: Returns the percentage of a range that meets a condition.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9983035?hl=en).

Returns the percentage of a range that meets a condition.

### Syntax
PERCENTIF(range, criterion)

| Part | Description |
| --- | --- |
| range | The range that is tested against `criterion`. |
| criterion | The pattern or test to apply to `range`. |

### Sample Usage

PERCENTIF(A1:A10, ">20")

PERCENTIF(A1:A10, "Paid")

### Notes

- If `range` contains text to check against, `criterion` must be a string. `criterion` can contain wildcards including ? to match any single character or \* to match zero or more contiguous characters. To match an actual question mark or asterisk, prefix the character with the tilde (~) character (i.e. ~? and ~\*). A string criterion must be enclosed in quotation marks. Each cell in `range` is then checked against `criterion` for equality (or match, if wildcards are used).
- If `range` contains numbers to check against, `criterion` may be either a string or a number. If a number is provided, each cell in `range` is checked for equality with `criterion`. Otherwise, `criterion` may be a string containing a number (which also checks for equality), or a number prefixed with any of the following operators:  `=, >, >=, <, or <=,` which check whether the range cell is equal to, greater than, greater than or equal to, less than, or less than or equal to the criterion value, respectively.
- PERCENTIF supports only evaluating a single criterion.

### Examples

| Expense | Today |
| --- | --- |
| Coffee | \$4.00 |  |  |
| Newspaper | \$1.00 |  |  |
| Taxi | \$10.00 |  |  |
| Golf | \$26.00 |  |  |
| Taxi | \$8.00 |  |  |
| Coffee | \$3.50 |  |  |
| Gas | \$46.00 |  |  |
| Restaurant | \$31.00 |  |  |
| **...** | **...** |  |  |
|  |  |  |  |
|  |  |  |  |
| **range** | **criteria** | **Result** | **Formula** |
| A2:A9 | "Taxi" | 0.25 | =PERCENTIF(A2:A9, "Taxi") |
|  |  |  |  |
|  |  |  |  |
| **range** | **criteria** | **Result** | **Formula** |
| B2:B9 | >=10 | 0.5 | =PERCENTIF(B2:B9, ">=10") |
|  |  |  |  |
|  |  |  |  |
| **range** | **criteria** | **Result** | **Formula** |
| B2:B9 | 10 | 0.5 | =PERCENTIF(B2:B9, ">="&B22) |
|  |  |  |  |
|  |  |  |  |
| **range** | **criteria** | **Result** | **Formula** |
| A2:A9 | "G\*" | 0.25 | =PERCENTIF(A2:A9, "G\*") |
|  |  |  |  |

### Related functions

- COUNTIF
- COUNTIFS