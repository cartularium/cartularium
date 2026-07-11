---
name: UNIQUE
category: operator
syntax: UNIQUE(range, by_column, exactly_once)
status: imported
description: Returns unique rows in the provided source range, discarding duplicates.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/10522653?hl=en).

Returns unique rows in the provided source range, discarding duplicates. Rows are returned in the order in which they first appear in the source range.

### Syntax
```gse
UNIQUE(range, by_column, exactly_once)
```

| **Part** | **Description** |
| --- | --- |
| range | The data to filter by unique entries. |
| by\_column | Whether to filter the data by columns or by rows. By default, this is false. |
| exactly\_once | Whether to return only entries with no duplicates. By default, this is false. |

### Notes

- If rows are returned which appear to be duplicates, ensure that cells including text do not have differing hidden text such as trailing spaces.
- Ensure that numeric values are formatted in the same way - percentages as percentages, currency values as currency values, etc.

### Examples

Running `UNIQUE` on this input:

|       |         |       |
|-------|---------|-------|
| Red   | Yellow  | Red   |
| Blue  | Magenta | Blue  |
| Red   | Yellow  | Red   |
| Green | White   | Green |

Yields:

|       |         |       |
|-------|---------|-------|
| Red   | Yellow  | Red   |
| Blue  | Magenta | Blue  |
| Green | White   | Green |

And running `UNIQUE` with `by_column` set to `true` on that output yields:

|       |         |
|-------|---------|
| Red   | Yellow  |
| Blue  | Magenta |
| Green | White   |


Finally, running `UNIQUE` with `by_column` set to `false` but `exactly_once` set to `true` on the original input yields:

|       |         |       |
|-------|---------|-------|
| Blue  | Magenta | Blue  |
| Green | White   | Green |

### Engine compatibility

`UNIQUE` is a modern dynamic-array function. Two things vary across engines: whether it exists, and — where it does — whether it is case-sensitive.

| Engine | Behavior |
| --- | --- |
| Google Sheets | **Case-sensitive**: `Apple`, `apple`, and `APPLE` are three distinct values and all spill (live gsheets context). |
| Excel | **Case-insensitive**: it collapses `Apple`/`apple`/`APPLE` to one entry, keeping the first casing seen (live Excel probe, 2026-07-11). |
| Lattice | Implemented; follows Google Sheets semantics. |
| formulas | Implemented; computes `UNIQUE` (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> The case-sensitivity difference silently changes results when a workbook moves between Google Sheets and Excel: a column of mixed-case text that yields three unique rows in Sheets can collapse to one in Excel. Normalize casing (`LOWER`/`UPPER`) first if the row count must be stable across products.

### Related functions

- [[GT]]
- [[GTE]]
- [[LT]]
- [[LTE]]
