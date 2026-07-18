---
tags:
  - concept
  - structure
---

**Cell references** are the addresses used to identify specific cells or ranges in a spreadsheet (e.g., `A1`, `B10:C20`). They allow formulas to perform calculations on data located elsewhere.

### Relative vs. Absolute References

The primary distinction in cell referencing is whether the reference changes when a formula is copied or filled across other cells.

#### Relative References (`A1`)
References are **relative** by default. They are defined by their distance from the cell containing the formula. When you copy a relative reference, Google Sheets adjusts it based on the displacement.

- **Example**: If `D2` contains `=B2+C2`, copying it to `D3` automatically changes the formula to `=B3+C3` (shifted one row down).
- **Behavior**: Provides freedom for formulas to adapt to the structure of surrounding data.

#### Absolute References (`$A$1`)
An **absolute reference** is "locked" and does not change when copied or filled. The dollar sign (`$`) is the command that tells Google Sheets to keep that specific row or column fixed.

- **Example**: If `D2` contains `=$B$1*C2`, copying it to `D3` changes the formula to `=$B$1*C3`. The reference to `$B$1` remains static.
- **Use Case**: Fixed constants like tax rates, unit prices, or specific configuration cells.

### Mixed References

You can choose to lock only the row or only the column by placing the `$` sign before the respective part of the address.

| Reference | $ Position | Behavior |
|-----------|------------|----------|
| `A1` | None | Entirely relative (both change). |
| `$A1` | Before Letter | Column A is locked; row number changes. |
| `A$1` | Before Number | Row 1 is locked; column letter changes. |
| `$A$1` | Both | Entirely absolute (neither changes). |

### Shortcuts & Efficiency

- **Toggle Shortcut (`F4`)**: While editing a formula, place the cursor on a reference and press `F4` to cycle through the four reference modes (`A1` → `$A$1` → `A$1` → `$A1` → `A1`).
- **Visual Feedback**: Google Sheets highlights ranges in your formulas and on the sheet with matching colors.
- **Fill Behavior**: Double-clicking the blue corner of a cell (the "fill handle") quickly copies the formula down a column while applying reference rules.

### Advanced Referencing

#### Circular References
Occur when a formula refers to its own cell, either directly or through a chain of references. Google Sheets will flag these with an `#REF!` or `#ERROR!` unless **Iterative Calculation** is enabled in settings.

#### Range Referencing
Ranges use two cell references separated by a colon: `TopLeft:BottomRight`.
- `A1:B10`: A 2x10 grid.
- `A:A`: The entire column A.
- `1:1`: The entire row 1.

### API Reference
In the Google Sheets API, cell references are often converted to `GridRange` or `GridCoordinate` objects. See [GridRange structure](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets#gridrange).

### See Also
- [[Conditional Formatting Rules]] — how anchoring affects formatting behavior.
- [[Array#Range]] — structural range behavior.
- [[Data type]] — types of data stored in referenced cells.
