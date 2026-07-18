---
name: YEAR
category: date
syntax: YEAR(date)
status: imported
description: Returns the year specified by a given date.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093061?hl=en).

Returns the year specified by a given date.

### Sample Usage

```gse
YEAR(DATE(1969,7,20))
YEAR(A2)
YEAR(40909)
```

### Syntax

```gse
YEAR(date)
```

- `date` - The date from which to calculate the year. Must be a cell reference to a cell containing a date, a function returning a date type, or a number.

### Notes

- Ensure that the input to the function is either a reference to a cell containing a date, a function which returns a date object such as [[DATE]], [[DATEVALUE]] or [[TO_DATE]], or a date serial number of the type returned by the [[N]] function. Google Sheets represents dates and times as numbers; while conversion is automatic when a human-readable date is entered into a cell, functions only accept literal dates in numeric format.
- `YEAR` does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `YEAR(10/10/2000)` is interpreted as `YEAR(0.005)`, the quotient of 10 divided by 10 divided by 2000.

### See Also

[[WEEKDAY]]: Returns a number representing the day of the week of the date provided.

[[TO_DATE]]: Converts a provided number to a date.

[[N]]: Returns the argument provided as a number.

[[MONTH]]: Returns the month of the year a specific date falls in, in numeric format.

[[DAY]]: Returns the day of the month that a specific date falls on, in numeric format.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the year specified by a given date.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFNvVF9KSE5ENmtvanczdmFZSzZTVmc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>