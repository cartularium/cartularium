---
name: CONVERT
category: parser
syntax: CONVERT(value, start_unit, end_unit)
status: imported
description: Converts a numeric value to a different unit of measure.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/6055540?hl=en).

Converts a numeric value to a different unit of measure.

### Sample Usage

```gse
CONVERT(5.1, "g", "kg")
CONVERT(32, "C", "F")
CONVERT(35.7, "in^2", "m^2")
CONVERT(A1, A2, A3)
```

### Syntax

```gse
CONVERT(value, start_unit, end_unit)
```

- `value` - the numeric value in `start_unit` to convert to `end_unit`
- `start_unit` - The starting unit, the unit currently assigned to `value` .
- `end_unit` - The unit of measure into which to convert `value`.

### Notes

- The following list outlines the available unit conversions by category:

  + Weight - u, grain, g, ozm, lbm, stone, sg, cwt, uk\_cwt, ton, uk\_ton
  + Distance - ang, Picapt, pica, in, ft, yd, m, ell, mi, survey\_mi Nmi, ly, parsec
  + Time - sec, min, hr, day, yr
  + Pressure - Pa, mmHg, Torr, psi, atm
  + Force - dyn, pond, N, lbf
  + Energy - eV, e, J, flb, c, cal, BTU, Wh, HPh
  + Power - W, PS, HP
  + Magnetism - ga, T
  + Temperature - C, F, K, Rank, Reau
  + Volume - ang^3, Picapt^3, tsp, tspm, tbs, in^3, oz, cup, pt, uk\_pt, qt, l, uk\_qt, gal, uk\_gal, ft^3, bushel, barrel, yd^3, m^3, MTON, GRT, mi^3, Nmi^3, ly^3
  + Area - ang^2, Picapt^2, in^2, ft^2, yd^2, m^2,ar, Morgen,uk\_acre, us\_acre, ha, mi^2, Nmi^2, ly^2
  + Information - bit, byte
  + Speed - m/hr, mph, kn, admkn, m/s
- The use of `CONVERT` between two different categories of `start_unit` and  `end_unit` will result in an error. For example, `CONVERT(13.2,"ft","C")` would result in an error as a result of an attempted conversion from distance units to temperature units.

### Engine compatibility

CONVERT is implemented by Excel, Google Sheets, IronCalc, `formulas`, and Lattice, but **not by HyperFormula or pycel**, which return `#NAME?` (assay: CONVERT deep dive; live probe, 2026-07-11). The conversion factor is identical everywhere; the only cross-engine difference is a last-digit one. Google Sheets stores about 15 significant digits, so `CONVERT(1,"m","ft")` returns `3.28083989501312` on Google Sheets versus `3.2808398950131235` on Excel — the two diverge only at the ~15th digit, not by a decimal-place rounding (live probe, 2026-07-11). A `3.280839895` display is a formatting read-back, not the stored value. Downstream exact-equality comparisons across engines can still fail on that trailing digit.

Error handling is portable among the implementers but should not be confused with absence: an incompatible or unknown unit yields `#N/A` in Excel, Google Sheets, IronCalc, `formulas`, and Lattice (the function rejecting its argument), whereas HyperFormula and pycel emit `#NAME?` regardless of the units (the function being absent). Treat a `#NAME?` from CONVERT as "this engine lacks the function," not "bad units."

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; ~15 significant digits; bad units → `#N/A`. |
| Excel | Supported; full IEEE-754 double; bad units → `#N/A`. |
| HyperFormula | Not implemented; returns `#NAME?` for any arguments (live probe, 2026-07-11). |
| IronCalc | Supported; ~9-digit read-back; bad units → `#N/A` (live probe, 2026-07-11). |
| formulas | Supported; full double (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` for any arguments (live probe, 2026-07-11). |
| Lattice | Supported. |

### See Also

[[DATE]]: Converts a year, month, and day into a date.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[TIME]]: Converts an hour, minute, and second into a time.

[[TIMEVALUE]]: Returns the fraction of a 24-hour day the time represents.

### Examples

The following example shows `CONVERT` between different sample `start_unit` and `end_unit` arguments.

<iframe height="275" src="https://docs.google.com/spreadsheets/d/1OmgrK3QrJAOttk9-3tx7LJxm47hxb9tssgUqY2-YbzU/pubhtml?widget=true&amp;headers=false" width="480"></iframe>