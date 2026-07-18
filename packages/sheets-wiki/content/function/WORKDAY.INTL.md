---
name: WORKDAY.INTL
category: date
syntax: WORKDAY.INTL(start_date, num_days, [weekend], [holidays])
status: imported
description: Calculates the date after a specified number of workdays excluding specified weekend days and holidays.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3294972?hl=en).

Calculates the date after a specified number of workdays excluding specified weekend days and holidays.

### Sample Usage

```gse
WORKDAY.INTL(DATE(1969, 7, 21), 4, 1, A1:A10)
WORKDAY.INTL(DATE(1995, 8, 13), -2, 2, B1:B10)
WORKDAY.INTL(DATE(1969, 7, 21), 0)
```

### Syntax

```gse
WORKDAY.INTL(start_date, num_days, [weekend], [holidays])
```

- `start_date` - The date from which to begin counting.
- `num_days` - The number of working days to advance from start\_date. If negative, counts backwards.
- `weekend` - **[** OPTIONAL - `1` by default **]** - A number or string representing which days of the week are considered weekends.
  + **String method**: weekends can be specified using seven 0’s and 1’s, where the first number in the set represents Monday and the last number is for Sunday. A zero means that the day is a work day, a 1 means that the day is a weekend. For example, “0000011” would mean Saturday and Sunday are weekends.
  + **Number method**: instead of using the string method above, a single number can be used. 1 = Saturday/Sunday are weekends, 2 = Sunday/Monday, and this pattern repeats until 7 = Friday/Saturday. 11 = Sunday is the only weekend, 12 = Monday is the only weekend, and this pattern repeats until 17 = Saturday is the only weekend.
- `holidays` - **[** OPTIONAL **]** - A range or array constant containing the dates to consider holidays.

### Notes

- `WORKDAY.INTL` does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `WORKDAY.INTL(10/10/2000,4)` is interpreted as `WORKDAY.INTL(0.005,4)`, where the provided date is the quotient of 10 divided by 10 divided by 2000.
- `WORKDAY.INTL` calculates a number of working days after a given date. To calculate the number of working days between two dates, use [[NETWORKDAYS.INTL]].
- `WORKDAY.INTL` works similarly to `WORKDAY` but also allows weekend days to be specified (for areas where Saturday and Sunday are not considered the weekend).

### See Also

[[WORKDAY]]: Calculates the end date after a specified number of working days.

[[NETWORKDAYS.INTL]]: Returns the number of net working days between two provided days excluding specified weekend days and holidays.

[[EDATE]]: Returns a date a specified number of months before or after another date.

[[EOMONTH]]: Returns a date representing the last day of a month which falls a specified number of months before or after another date.

[[NOW]]: Returns the current date and time as a date value.