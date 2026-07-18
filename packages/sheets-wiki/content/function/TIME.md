---
name: TIME
category: date
syntax: TIME(hour, minute, second)
status: imported
description: Converts an hour, minute, and second into a time.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093056?hl=en).

Converts an hour, minute, and second into a time.

### Sample Usage

```gse
TIME(11,40,59)
TIME(A2,B2,C2)
```

### Syntax

```gse
TIME(hour, minute, second)
```

- `hour` - The hour component of the time.
- `minute` - The minute component of the time.
- `second` - The second component of the time.

### Notes

- Inputs to `TIME` must be numbers - if a string or a reference to a cell containing a string is provided, the `#VALUE!` error will be returned.
- `TIME` will silently recalculate numeric time values which fall outside of valid ranges. For example, `TIME(25,0,0)`, which specifies the illegal hour 25, will create a time of 1:00 AM. Similarly, `TIME(12,0,60)`, which specifies the illegal 61st second of a minute (:00 being the first second), will create a time of 12:01:00.
- `TIME` will silently truncate decimal values input into the function, e.g. an hour of 12.75 will be interpreted as 12.

### See Also

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the time value from specified hours, minutes and seconds.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGN3N2pjWC1sTFd3c09BRVJUTEgtTFE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>