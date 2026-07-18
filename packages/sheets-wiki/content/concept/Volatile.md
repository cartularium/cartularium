---
tags:
  - concept
  - terminology
---

A **volatile function** recalculates every time any cell in the spreadsheet changes, regardless of whether its own inputs have changed. This is distinct from normal functions, which only recalculate when their direct dependencies change.

### Volatile Functions in Google Sheets

| Function | Description |
|----------|-------------|
| [[NOW]] | Current date and time |
| [[TODAY]] | Current date |
| [[RAND]] | Random number between 0 and 1 |
| [[RANDBETWEEN]] | Random integer in a range |
| [[RANDARRAY]] | Array of random numbers |
| [[OFFSET]] | Range offset from a reference |
| [[INDIRECT]] | Range from a text string |

### Performance Impact

Volatile functions force recalculation of themselves and all their dependents on every sheet edit. In small spreadsheets this is imperceptible, but in large sheets with many dependents it can cause noticeable lag.

Avoid placing volatile functions in ranges that are referenced by many other formulas.

### Instability vs. Volatility

Volatility (recalculating on every change) is distinct from [[Unstable|instability]] (losing stored state). A function can be volatile without being unstable (e.g., `TODAY()` is volatile but its output is always reproducible). Unstable techniques involve state that can become permanently lost.

### Comparison with Excel

The volatile function list is largely the same in Excel and Google Sheets. Both treat `NOW`, `TODAY`, `RAND`, `RANDBETWEEN`, `OFFSET`, and `INDIRECT` as volatile. Excel additionally treats `CELL` and `INFO` as volatile depending on their arguments — Google Sheets has no equivalent to these.

Excel documentation explicitly advises using volatile functions "sparingly." The same advice applies in Google Sheets.

### See Also

- [[Unstable]] — a related but distinct concept about state storage.
- [[Dependency]] — how Sheets tracks which cells to recalculate.
- [[NOW]], [[TODAY]], [[RAND]] — commonly used volatile functions.
