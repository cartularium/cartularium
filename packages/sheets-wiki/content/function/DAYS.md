---
name: DAYS
category: date
syntax: DAYS(end_date,start_date)
status: imported
description: "The DAYS function\_returns the number of days between two dates."
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9061296?hl=en).

The DAYS function returns the number of days between two dates.

### Syntax
```gse
DAYS(end_date,start_date)
```

| Part | Description | Notes |
| --- | --- | --- |
| `end_date` | The end of the date range. |  |
| `start_date` | The start of the date range. |  |

### Sample formulas

`DAYS("7/24/1969", "7/16/1969")  
DAYS(“2/28/2016”, “2/28/2017”)`

### Notes

The DAYS function factors in leap days.

### Examples

The below example shows the difference between two days in the same month.

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=DAYS("7/24/1969", "7/16/1969")` | 8 |

The below example shows the difference between two dates factoring in a leap day:

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=DAYS(“2/28/2016”, “2/28/2017”)` | 366 |

### Related functions

- [[DAY]]: Returns the day of the month that a specific date falls on, in numeric format.
- [[DAYS360]]: Returns the difference between two days based on the 360-day year used in some financial interest calculations.
- [[NETWORKDAYS]]: Returns the number of net working days between two provided days.