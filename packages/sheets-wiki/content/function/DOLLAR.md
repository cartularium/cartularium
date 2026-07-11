---
name: DOLLAR
category: text
syntax: DOLLAR(number, [number_of_places])
status: imported
description: Formats a number into the locale-specific currency format.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094071?hl=en).

Formats a number into the locale-specific currency format.

### Sample Usage

```gse
DOLLAR(1.2351,4)
DOLLAR(2.35)
```

### Syntax

```gse
DOLLAR(number, [number_of_places])
```

- `number` - The value to be formatted.
- `number_of_places` - **[** OPTIONAL - `2` by default **]** - The number of decimal places to display.

### Notes

- The currency format used by `DOLLAR` is specific to your spreadsheet locale.
- `DOLLAR` differs from the related function `TO_DOLLARS` in that `DOLLAR` outputs text rather than applying a cell format to a number.

### Engine compatibility

`DOLLAR` produces a **text string**, and while the magnitude and currency symbol agree across implementers, the negative-value convention does not. Testing `=DOLLAR(-1234.5, 2)`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | `"-$1,234.50"` — leading minus. |
| Excel | `"($1,234.50)"` — accounting parentheses (live Excel probe, 2026-07-11). |
| Lattice | `"$-1,234.50"` — minus after the currency symbol (assay: DOLLAR/dollar-negative). |
| formulas | `#NAME?` — `DOLLAR` not implemented (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> Any workbook that string-matches or parses `DOLLAR` output breaks when moved between Excel and Google Sheets, because negatives render differently. The accounting-parentheses style may itself be locale- or currency-format-dependent. For a portable negative-currency string, build the format explicitly with `TEXT(...)`.

### See Also

[[TO_DOLLARS]]: Converts a provided number to a dollar value.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDJqU25UeTZ3aHpvNW5yYVFNVUpkc3c&amp;output=html" width="500"></iframe>