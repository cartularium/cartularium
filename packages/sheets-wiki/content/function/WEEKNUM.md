---
name: WEEKNUM
category: date
syntax: WEEKNUM(date, [type])
status: imported
description: Returns a number representing the week of the year where the provided date falls.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3294949?hl=en).

Returns a number representing the week of the year where the provided date falls.

### Sample Usage

```gse
WEEKNUM(DATE(1969, 7, 20), 1)
WEEKNUM("12/09/1948", 2)
WEEKNUM("6/14/2002")
```

### Syntax

```gse
WEEKNUM(date, [type])
```

- `date` - The date for which to determine the week number. Must be a reference to a cell containing a date, a function returning a date type, or a number.
- `type` - **[** OPTIONAL - default is `1` **]** - A number representing the day that a week starts on as well as the system used for determining the first week of the year (1=Sunday, 2=Monday).

### Notes

- When inputting the date, it is best to use the [[DATE]] function, as text values may return errors.
- Behind the scenes, there are two week numbering "systems" used for this function:
  + System 1 - The first week of the year is considered to be the week containing January 1, which is numbered week 1.
  + System 2 - The first week of the year is considered to be the week containing the first Thursday of the year, which is numbered as week 1. System 2 is the approach specified in ISO 8601, also known as the European system for numbering weeks.
- For each type, the start day and end day of a week are defined as follows when counting week numbers:| `type` | Day week begins on | Day week ends on | System |
  | --- | --- | --- | --- |
  | 1 or omitted | Sunday | Saturday | 1 |
  | 2 | Monday | Sunday | 1 |
  | 11 | Monday | Sunday | 1 |
  | 12 | Tuesday | Monday | 1 |
  | 13 | Wednesday | Tuesday | 1 |
  | 14 | Thursday | Wednesday | 1 |
  | 15 | Friday | Thursday | 1 |
  | 16 | Saturday | Friday | 1 |
  | 17 | Sunday | Saturday | 1 |
  | 21 | Monday | Sunday | 2 |

### See Also

[[WEEKDAY]]: Returns a number representing the day of the week of the date provided.

[[DAYS360]]: Returns the difference between two days based on the 360-day year used in some financial interest calculations.

[[DATE]]: Converts a year, month, and day into a date.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.