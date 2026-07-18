---
name: EPOCHTODATE
category: date
syntax: EPOCHTODATE(timestamp, [unit])
status: imported
description: Converts a Unix epoch timestamp in seconds, milliseconds, or microseconds to a datetime in Universal Time Coordinated(UTC).
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/13193461?hl=en).

Converts a Unix epoch timestamp in seconds, milliseconds, or microseconds to a datetime in Universal Time Coordinated(UTC).

### Sample Usage

```gse
EPOCHTODATE(A1,1)
EPOCHTODATE(1655908429662,2)
EPOCHTODATE(1655906710)
```

### Syntax

```gse
EPOCHTODATE(timestamp, [unit])
```

- `Timestamp`: A Unix epoch timestamp, in seconds, milliseconds, or microseconds.
- `Unit` [OPTIONAL `– 1` by default]: The unit of time in which the timestamp is expressed.

- `1` indicates the time unit is seconds.
- `2` indicates the time unit is milliseconds.
- `3` indicates the time unit is microseconds.

### Notes

- Seconds is the default unit of time.
- Fractional amounts of milliseconds are shortened.
- The result will be in UTC, not the local time zone of your spreadsheet.
- Negative timestamps aren’t accepted.
- The result is computed by dividing the timestamp (converted to milliseconds) by the number of milliseconds in a day and adding 25,568. [Learn more about dates in Sheets](https://support.google.com/docs/answer/3092969).

### Examples

`EPOCHTODATE` general usage.

| 1 | Timestamp | Result | Formula |
| --- | --- | --- | --- |
| **2** | 1655906568893 | 6/22/2022 14:02:49 | `=EPOCHTODATE(A2,2)` |
| **3** | 1655906710 | 6/22/2022 14:05:10 | `=EPOCHTODATE(A3,1)` |
| **4** | 0 | 1/1/1970 0:00:00 | `=EPOCHTODATE(A4,2)` |
| **5** | 1584033897 | 3/12/2020 17:24:57 | `=EPOCHTODATE(A5)` |
| **6** | 1656356678000410 | 6/27/2022 19:04:38 | `=EPOCHTODATE(A6,3)` |

### Related functions

- [[DATE]]: Converts a year, month, and day into a date.
- [[TIME]]: Converts an hour, minute, and second into a time.