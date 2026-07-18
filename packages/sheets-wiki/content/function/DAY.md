---
name: DAY
category: date
syntax: DAY(date)
status: imported
description: Returns the day of the month that a specific date falls on, in numeric format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093040?hl=en).

Returns the day of the month that a specific date falls on, in numeric format.

### Sample Usage

```gse
DAY(DATE(1969,7,20))
DAY(A2)
DAY(40909)
DAY("7/20/1969")
```

### Syntax

```gse
DAY(date)
```

- `date` - The date from which to extract the day. Must be a reference to a cell containing a date, a function returning a date type, or a number.

### Notes

- Ensure that the input to the function is either a reference to a cell containing a date, a function which returns a date object such as [[DATE]], [[DATEVALUE]] or [[TO_DATE]], or a date serial number of the type returned by the [[N]] function. Google Sheets represents dates and times as numbers; while conversion is automatic when a human-readable date is entered into a cell, functions only accept literal dates in numeric format.
- `DAY` does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `DAY(10/10/2000)` is interpreted as `DAY(0.005)`, the quotient of 10 divided by 10 divided by 2000.
- `DAY` returns the intuitive understanding of the day of the month, and is useful primarily in other calculations rather than to extract the day of month from a known date, as that value is easily known from reading the entire date.

### See Also

[[YEAR]]: Returns the year specified by a given date.

[[WEEKDAY]]: Returns a number representing the day of the week of the date provided.

[[TO_DATE]]: Converts a provided number to a date.

[[SECOND]]: Returns the second component of a specific time, in numeric format.

[[N]]: Returns the argument provided as a number.

[[MONTH]]: Returns the month of the year a specific date falls in, in numeric format.

[[MINUTE]]: Returns the minute component of a specific time, in numeric format.

[[HOUR]]: Returns the hour component of a specific time, in numeric format.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

### Examples

`DAY` accepts different input parameter type.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEU4LVl2V2FpMnFidWZUb2VRU1RDSXc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>