---
name: TIME
category: date
syntax: TIME(hour, minute, second)
status: imported
description: Converts an hour, minute, and second into a time.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093056?hl=en).

Converts an hour, minute, and second into a time.

### Sample Usage

```gse
TIME(11,40,59)
TIME(A2,B2,C2)
```

### Syntax

```gse
TIME(hour, minute, second)
```

- `hour` - The hour component of the time.
- `minute` - The minute component of the time.
- `second` - The second component of the time.

### Notes

- Inputs to `TIME` must be numbers - if a string or a reference to a cell containing a string is provided, the `#VALUE!` error will be returned.
- `TIME` will silently recalculate numeric time values which fall outside of valid ranges. For example, `TIME(25,0,0)`, which specifies the illegal hour 25, will create a time of 1:00 AM. Similarly, `TIME(12,0,60)`, which specifies the illegal 61st second of a minute (:00 being the first second), will create a time of 12:01:00.
- `TIME` will silently truncate decimal values input into the function, e.g. an hour of 12.75 will be interpreted as 12.

### Engine compatibility

The hour-overflow reduction described above — an `hour` argument ≥ 24 is divided by 24 and the remainder used, so `TIME(25,0,0)` yields 1:00 AM (0.041666…) — holds in Excel, Google Sheets, HyperFormula, IronCalc, and `formulas`. **Lattice does not reduce the hours field modulo 24**: `TIME(25,0,0)` returns 1.0416666666666667 there (1 day + 1 hour, carried into the integer part). If you rely on hour wrapping, do not assume it on Lattice. Minute and second overflow (`TIME(0,90,0)` = 0.0625) carries consistently everywhere. pycel does not implement TIME (`#NAME?`) (assay: TIME/time-overflow-rolls; live probe, 2026-07-11).

| Engine | Behavior |
| --- | --- |
| Google Sheets | Reduces hours mod 24; `TIME(25,0,0)` = 0.041666…. |
| Excel | Reduces hours mod 24; `TIME(25,0,0)` = 0.041666…. |
| HyperFormula | Reduces hours mod 24 (live probe, 2026-07-11). |
| IronCalc | Reduces hours mod 24 (live probe, 2026-07-11). |
| formulas | Reduces hours mod 24 (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Does **not** reduce hours mod 24; `TIME(25,0,0)` = 1.0416666666666667. |

### See Also

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the time value from specified hours, minutes and seconds.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGN3N2pjWC1sTFd3c09BRVJUTEgtTFE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>