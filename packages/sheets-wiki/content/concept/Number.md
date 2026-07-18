---
tags:
  - datatype
---

**Number** is the core numeric [[Data type|data type]] in Google Sheets. All numbers are stored internally as [double-precision 64-bit floating point](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) values (IEEE 754).

### Characteristics

- **Precision**: Numbers have approximately 15 decimal digits of precision.
- **Range**: Supports values from approximately $4.9 \times 10^{-324}$ to $1.8 \times 10^{308}$.
- **Storage**: Internally, numbers are stored as raw numeric values. Their appearance in the spreadsheet is controlled by [[Number Format Patterns]].

### Special Cases

#### Dates and Times
Google Sheets does not have a separate data type for dates or times. Instead, they are stored as **serial numbers**:
- The **integer portion** is the number of days since the epoch (December 30, 1899).
- The **fractional portion** is the time of day as a fraction of 24 hours.

See [[Datetime]] and [[Data type#Date and time storage]] for more details.

#### Booleans and Errors
While [[Boolean|Booleans]] and [[Error|Errors]] often behave like distinct types, they can sometimes be coerced into numbers (e.g., `TRUE` → `1`, `FALSE` → `0`).

### Limits
- Huge numbers may be displayed in scientific notation.
- Calculations that exceed the maximum limit will result in a [[Error|#NUM!]] error.

### See Also
- [[Data type]] — Overview of the Sheets type system.
- [[Number Format Patterns]] — How numbers are displayed.
- [[Datetime]] — Internal storage of date/time as numbers.
- [[VALUE]] — Function to convert strings to numbers.
