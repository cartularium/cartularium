---
name: FORMULATEXT
category: lookup
syntax: FORMULATEXT(cell)
status: imported
description: The FORMULATEXT function returns a formula as a string.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9365792?hl=en).

The FORMULATEXT function returns a formula as a string.

### Syntax
```gse
FORMULATEXT(cell)
```

| Part | Description |
| --- | --- |
| `cell` | The cell to be verified as containing a formula. |

### Notes

- `FORMULATEXT` returns what is displayed in the formula bar when selecting a cell.
- If the cell passed into `FORMULATEXT` references the cell that contains the `FORMULATEXT` formula, then `FORMULATEXT` will properly handle this and avoid a circular reference.
- If a range is passed into `FORMULATEXT`, only the top left most cell is evaluated.

### Examples

| A | B | C |
| --- | --- | --- |
| **1** | **Value** | **Formula** | **Result** |
| **2** | 20 | `=FORMULATEXT($A2)` | =10+10 |
| **3** | 18 | `=FORMULATEXT($A3)` | =MAX(10,12,18) |
| **4** | 10 | `=FORMULATEXT($A4:$A5)` | =MODE.MULT(10,15,10,15) |
| 5 | 15 | `=FORMULATEXT($A4:$A5)` | =MODE.MULT(10,15,10,15) |
| **6** | =FORMULATEXT(\$A6) | `=FORMULATEXT($A6)` | =B6 |