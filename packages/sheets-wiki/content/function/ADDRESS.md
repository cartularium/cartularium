---
name: ADDRESS
category: lookup
syntax: ADDRESS(row, column, [absolute_relative_mode], [use_a1_notation], [sheet])
status: imported
description: Returns a cell reference as a string.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093308?hl=en).

Returns a cell reference as a string.

### Sample Usage

```gse
ADDRESS(1,2)
ADDRESS(1,2,4,FALSE)
ADDRESS(1,2,,,"Sheet2")
```

### Syntax

```gse
ADDRESS(row, column, [absolute_relative_mode], [use_a1_notation], [sheet])
```

- `row` - The row number of the cell reference
- `column` - The column number (not name) of the cell reference. `A` is column number `1`.
- `absolute_relative_mode` - **[** OPTIONAL - `1` by default **]** - An indicator of whether the reference is row/column absolute. `1` is row and column absolute (e.g. \$A\$1), `2` is row absolute and column relative (e.g. A\$1), `3` is row relative and column absolute (e.g. \$A1), and `4` is row and column relative (e.g. A1).
- `use_a1_notation` - **[** OPTIONAL - `TRUE` by default **]** - A boolean indicating whether to use `A1` style notation (TRUE) or `R1C1` style notation (FALSE).
- `sheet` - **[** OPTIONAL - absent by default **]** - A string indicating the name of the sheet into which the address points.

### Notes

- When using optional parameters such as `sheet`, ensure that commas are inserted to indicate which parameter is being set.

### Engine compatibility

The four-argument forms (`ADDRESS(row, col)`, `ADDRESS(row, col, abs_num)`) are portable across Excel, Google Sheets, Lattice, HyperFormula, and formulas. The fifth `sheet` argument narrows portability, and the *quoting* of the sheet name is where behavior splits. Testing `=ADDRESS(1,1,1,TRUE,"Sheet2")`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | `Sheet2!$A$1` — quotes the sheet name only when it needs quoting. |
| Excel | `Sheet2!$A$1` — conditional quoting. A space-containing name is quoted: `=ADDRESS(1,1,1,TRUE,"My Sheet")` gives `'My Sheet'!$A$1` (live Excel probe, 2026-07-11). |
| Lattice | `Sheet2!$A$1` — conditional quoting. |
| formulas | `'Sheet2'!$A$1` — *always* wraps the sheet name in single quotes, even when no quoting is needed (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — implements the base `ADDRESS` (`ADDRESS(1,1)` → `$A$1`) but rejects the 5-argument `sheet` form specifically (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — `ADDRESS` not implemented at all (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> Round-tripping `ADDRESS` output back into a reference is safe either way (a quoted simple name is still valid), but a string comparison of `ADDRESS` output across engines will mismatch, because `formulas` quotes unconditionally where Excel/Sheets/Lattice do not.

### See Also

[[OFFSET]]: Returns a range reference shifted a specified number of rows and columns from a starting cell reference.

[[MATCH]]: Returns the relative position of an item in a range that matches a specified value.

[[INDEX]]: Returns the content of a cell, specified by row and column offset.

### Examples

Returns the cell address (reference) as text, according to the specified row and column numbers, using different types of reference.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHNuV2VTZ2ViSGd1Y2l3TFU1ODRQR0E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>