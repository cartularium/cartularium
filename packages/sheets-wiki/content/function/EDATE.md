---
name: EDATE
category: date
syntax: EDATE(start_date, months)
status: imported
description: Returns a date a specified number of months before or after another date.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3092974?hl=en).

Returns a date a specified number of months before or after another date.

### Sample Usage

```gse
EDATE(DATE(1969,7,20), 1)
EDATE(A2, 1)
EDATE(40909, -2)
```

### Syntax

```gse
EDATE(start_date, months)
```

- `start_date` - The date from which to calculate the result.
- `months` - The number of months before (negative) or after (positive) `start_date` to calculate.

### Notes

- Ensure that the `start_date` input to the function is either a reference to a cell containing a date, a function which returns a date object such as [[DATE]], [[DATEVALUE]] or [[TO_DATE]], or a date serial number of the type returned by the [[N]] function. Google Sheets represents dates and times as numbers; while conversion is automatic when a human-readable date is entered into a cell, functions only accept literal dates in numeric format.
- `EDATE` does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `EDATE(10/10/2000,1)` is interpreted as `EDATE(0.005,1)`, the quotient of 10 divided by 10 divided by 2000.
- Non-integer arguments to `months` will have their decimal components truncated. Therefore, `EDATE(A2,2.6)` is equivalent to `EDATE(A2,2)`.

### See Also

[[TO_DATE]]: Converts a provided number to a date.

[[N]]: Returns the argument provided as a number.

[[EOMONTH]]: Returns a date representing the last day of a month which falls a specified number of months before or after another date.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the date of the day which falls `months` away from the given `start_date`.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdExwRElqcWQ1bE9HdHd4cHBuczhlM1E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>