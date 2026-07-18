---
name: TIMEVALUE
category: date
syntax: TIMEVALUE(time_string)
status: imported
description: Returns the fraction of a 24-hour day the time represents.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3267350?hl=en).

Returns the fraction of a 24-hour day the time represents.

### Sample Usage

```gse
TIMEVALUE("2:15 PM")
TIMEVALUE("14:15:30")
TIMEVALUE("11:59:59.50 PM")
```

### Syntax

```gse
TIMEVALUE(time_string)
```

- `time_string` - The string that holds the time representation.

### Notes

- The string of text used in `time_string` should be within quotations and represent time using either the 12-hour or 24-hour time format, for example "2:15 PM" or "14:15".
- Returns a number between 0 (inclusive) and 1 (exclusive). Zero corresponds to 12:00:00 AM and 0.9999884259 corresponds to 11:59:59 PM. To get closer to 1.0, use fractions of seconds after 11:59:59 PM (e.g., 11:59:59.50 PM).
- Dates, for example the day of the week, are ignored in `time_string`.

### See Also

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[MINUTE]]: Returns the minute component of a specific time, in numeric format.

[[HOUR]]: Returns the hour component of a specific time, in numeric format.

[[TIME]]: Converts an hour, minute, and second into a time.

[[NOW]]: Returns the current date and time as a date value.