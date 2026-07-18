---
name: MINUTE
category: date
syntax: MINUTE(time)
status: imported
description: Returns the minute component of a specific time, in numeric format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093048?hl=en).

Returns the minute component of a specific time, in numeric format.

### Sample Usage

```gse
MINUTE(TIME(11,40,59))
MINUTE(A2)
MINUTE(40909.0004)
MINUTE("20:49:59")
```

### Syntax

```gse
MINUTE(time)
```

- `time` - The time from which to calculate the minute component. Must be a reference to a cell containing a date/time, a function returning a date/time type, or a number.

### Notes

- Ensure that the input to the function is either a reference to a cell containing a date/time, a function which returns a date/time object such as [[TIME]], or a date serial number of the type returned by the [[N]] function. Google Sheets represents dates and times as numbers; while conversion is automatic when a human-readable date is entered into a cell, functions only accept literal dates in numeric format.
- `MINUTE` does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `MINUTE(12:00:00)` will return an error.
- `MINUTE` returns the intuitive understanding of minutes, and is useful primarily in other calculations rather than to extract the minute component of a known time, as that value is easily known from a plain reading of the entire time.
- Note that date objects that are created with the [[DATE]] function or by entry of a date without a time component will have a time of 0:00:00.

### See Also

[[YEAR]]: Returns the year specified by a given date.

[[WEEKDAY]]: Returns a number representing the day of the week of the date provided.

[[TO_DATE]]: Converts a provided number to a date.

[[TIME]]: Converts an hour, minute, and second into a time.

[[SECOND]]: Returns the second component of a specific time, in numeric format.

[[N]]: Returns the argument provided as a number.

[[MONTH]]: Returns the month of the year a specific date falls in, in numeric format.

[[HOUR]]: Returns the hour component of a specific time, in numeric format.

[[DAY]]: Returns the day of the month that a specific date falls on, in numeric format.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the minute as an integer for the given time value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGhaN3BPbmhBWTZtNm5xRGJKdVF3b2c&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>