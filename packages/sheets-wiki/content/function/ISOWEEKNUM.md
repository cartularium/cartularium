---
name: ISOWEEKNUM
category: date
syntax: ISOWEEKNUM(date)
status: imported
description: Returns the number of the ISO (International Organization for Standardization) week of the year where the provided date falls.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7368793?hl=en).

Returns the number of the ISO (International Organization for Standardization) week of the year where the provided date falls.

### Sample Usage

```gse
ISOWEEKNUM(DATE(1969, 7, 20))
ISOWEEKNUM("6/14/2002")
```

### Syntax

```gse
ISOWEEKNUM(date)
```

- `date` - The date for which to determine the ISO week number. Must refer to a cell containing a date, number, or function returning a date type.

### Notes

- When entering the date, use the [[DATE]] function, as text values might return errors.
- Per the European system for numbering weeks (also known as ISO 8601):
  + Weeks begin on Monday and end on Sunday.
  + Week 1 of the year is the week containing the first Thursday of the year.
    - As a result, if the first Thursday is after January 4, at least one of the following days, January 1-3, will have an `ISOWEEKNUM` of 52 or 53.
    - Similarly, if the first Thursday is before January 4, at least one of the following days, December 29-31, will have an `ISOWEEKNUM` of 1.
    - If the first Thursday is January 4, December 29-31 of the previous year will have `ISOWEEKNUM` of 52 and January 1-7 of the current year will have `ISOWEEKNUM` of 1.

### See Also

- [[WEEKNUM]]: Returns a number representing the week of the year where the provided date falls.
- [[WEEKDAY]]: Returns a number representing the day of the week of the date provided.
- [[DAYS360]]: Returns the difference between two days based on the 360-day year used in some financial interest calculations.
- [[DATE]]: Converts a year, month, and day into a date.
- [`DATEVALUE:`](https://support.google.com/docs/answer/3093039) Converts a provided date string in a known format to a date value.