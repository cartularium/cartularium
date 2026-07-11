---
name: INDEX
category: lookup
syntax: INDEX(reference, [row], [column])
status: imported
description: Returns the content of a cell, specified by row and column offset.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3098242?hl=en).

Returns the content of a cell, specified by row and column offset.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1h7HWc7dn2hRFr6cUpSIBBXGfcgUcEIlmX9RLcEmj8QQ/copy)

| Guest Name | Dietary Restriction | Sent Invitation | Table Number |
| --- | --- | --- | --- |
| David | Vegetarian | No | 3 |
| Bob | None | No | 5 |
| david | None | Yes | 1 |
| Nancy | None | No | 4 |
| Mary | Vegetarian | Yes | 2 |

| Formula | Formula Output |
| --- | --- |
| =INDEX(A2:D6, 2, 1) | Bob |
| =INDEX(A2:D6, 4, 4) | 4 |
| =INDEX(A2:D6,1,1) | David |
| =INDEX(A1:D6, 6, 2) | Vegetarian |

| Formula | Formula Output | | | |
| --- | --- | --- | --- | --- |
| =INDEX(A2:D6, 2, 0) | Bob | None | No | 5 |

| Formula | Formula Output |
| --- | --- |
| =INDEX(A2:D6, 0, 4) | 3 |
| 5 |
| 1 |
| 4 |
| 2 |

Returns the cell(s) found by index value into the referenced range.

### Sample Usage

```gse
INDEX(A1:C20, 5, 1)
```

### Syntax

```gse
INDEX(reference, [row], [column])
```

- `reference` - The range of cells from which the values are returned.
- `row` - **[**OPTIONAL - 0 by default**]** - The index of the row to be returned from within the reference range of cells.
- `column` - **[**OPTIONAL - `0` by default**]** - The index of the column to be returned from within the reference range of cells.

### Using INDEX and Match

INDEX and MATCH can be used together to perform more advanced and dynamic lookups.

- **Tip:** [[VLOOKUP]] can be used when the lookup value is to the left of the desired attribute to return. [[INDEX]] and [[MATCH]] can be used regardless of where the lookup value is located in the dataset.

| Guest Name | Dietary Restriction | Sent Invitation | Table Number |
| --- | --- | --- | --- |
| David | Vegetarian | No | 3 |
| Bob | None | No | 5 |
| david | None | Yes | 1 |
| Nancy | None | No | 4 |
| Mary | Vegetarian | Yes | 2 |

| Goal | Formula | Formula Output | Comment |
| --- | --- | --- | --- |
| Find Mary's Dietary Restriction | =VLOOKUP("Mary", A1:D6, 2, false) | Vegetarian | **Both** search key and index are **hardcoded** |
| Find Mary's Dietary Restriction | =INDEX(A1:D6, MATCH("Mary", A1:A6, 0), 2) | Vegetarian | Row number is **dynamic** & column number is **hardcoded** |
| Find Mary's Dietary Restriction | =INDEX(A1:D6, MATCH("Mary", A1:A6, 0), MATCH("Dietary Restriction", A1:D1, 0)) | Vegetarian | **Both** row number & column number are **dynamic** |
| Find Who is at Table Number 2 | Using VLOOKUP, this would not be possible | N/A | VLOOKUP can only be used when the lookup value is to the **left of the desired attribute to return** |
| Find Who is at Table Number 2 | =INDEX(A1:D6, MATCH(2, D1:D6, 0), MATCH("Guest Name", A1:D1, 0)) | Mary | INDEX and MATCH can be used regardless of where the lookup value is located relative to the desired attribute to return |

### See Also

[[MATCH]]: Returns the relative position of an item in a range that matches a specified value.

[[OFFSET]]: Returns a range reference shifted a specified number of rows and columns from a starting cell reference.

### Notes

- If you set row or column to 0, `INDEX` returns the array of values for the entire column or row, respectively.

### Engine compatibility

Ordinary `INDEX(range, row, [column])` is among the most portable lookup forms: `=INDEX(A1:B2, 2, 1)` and `=INDEX(A1:A3, 2)` agree across every evaluating engine (assay: INDEX/index-row-and-column, INDEX/index-single-column; live probe, 2026-07-11). The edges diverge in three ways.

**Out-of-bounds index — error code split.** Requesting a row past the end of the range errors everywhere, but on a different sentinel:

| Engine | Behavior |
| --- | --- |
| Google Sheets | `#NUM!` — out-of-range index treated as an invalid numeric argument (assay: INDEX/index-out-of-bounds). |
| Excel | `#REF!` — out-of-array index is a reference error. Excel's index progression: `INDEX(A1:A2, 0)` spills the whole column, `INDEX(A1:A2, -1)` is `#VALUE!`, `INDEX(A1:A2, 5)` is `#REF!` (live Excel probe, 2026-07-11). |
| HyperFormula | `#NUM!` — same as Google Sheets (live probe, 2026-07-11). |
| IronCalc | `#REF!` (live probe, 2026-07-11). |
| formulas | `#REF!` (live probe, 2026-07-11). |
| pycel | `#REF!` (live probe, 2026-07-11). |
| Lattice | `#REF!`. |

**Single-argument `INDEX` — Excel entry rejection.** `=INDEX(A1:A3)` with `row` omitted is *rejected at formula entry* in Excel, leaving an empty cell — not a value, not an error (live Excel probe, 2026-07-11). Google Sheets instead treats a bare single-array argument as the array-wrapper idiom below.

**`INDEX(array_expression)` — the Google Sheets array-wrapper idiom.** `=INDEX(A1:A3*10)` (row and column both omitted) is a Google Sheets trick for forcing an array to materialize: Sheets returns the whole array. No other engine follows it — HyperFormula and Lattice return `#N/A`, formulas returns `#VALUE!`, IronCalc `#ERROR!`, pycel `#NAME?`, and Excel rejects it as a single-argument entry (assay: INDEX/index-wraps-multiplication-over-range; live probe, 2026-07-11). Use the array expression directly, or `ARRAYFORMULA` in Sheets.

> [!INFO]
> Code that branches on the *specific* out-of-bounds error (for example via `ERROR.TYPE`) is not portable — `IFERROR`, which catches any error, is fine. A `MATCH` miss, by contrast, is uniformly `#N/A` on every engine.