---
name: WORKDAY
category: date
syntax: WORKDAY(start_date, num_days, [holidays])
status: imported
description: Calculates the end date after a specified number of working days.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093059?hl=en).

Calculates the end date after a specified number of working days.

### Sample Usage

```gse
WORKDAY(DATE(1969,7,20), 4, A1:A10)
WORKDAY(A2, 10)
WORKDAY(40909, 4, B2:B17)
WORKDAY(40909, 30, {40909,40924})
```

### Syntax

```gse
WORKDAY(start_date, num_days, [holidays])
```

- `start_date` - The date from which to begin counting.
- `num_days` - The number of working days to advance from `start_date`. If negative, counts backwards.

  + If `num_days` is not an integer, the decimal part is truncated. That is, `WORKDAY(A2,1.9)` is equivalent to `WORKDAY(A2,1)`.
- `holidays` - **[** OPTIONAL **]** - A range or array constant containing the dates to consider holidays.
  + The values provided within an array for `holidays` must be date serial number values, as returned by [[N]] or date values, as returned by [[DATE]], [[DATEVALUE]] or [[TO_DATE]]. Values specified by a range should be standard date values or date serial numbers.

### Notes

- `WORKDAY` does not autoconvert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `WORKDAY(10/10/2000,4)` is interpreted as `WORKDAY(0.005,4)`, where the provided date is the quotient of 10 divided by 10 divided by 2000.
- `WORKDAY` calculates the end date after a specified number of working days. To calculate the number of working days between two dates, use [[NETWORKDAYS]].
- `WORKDAY` works similarly to `WORKDAY.INTL` but only treats Saturday and Sunday as the weekend. Use `WORKDAY.INTL` to use other days of the week as the weekend.

### See Also

[[WORKDAY.INTL]]: Calculates the date after a specified number of workdays excluding specified weekend days and holidays.

[[TO_DATE]]: Converts a provided number to a date.

[[NETWORKDAYS]]: Returns the number of net working days between two provided days.

[[N]]: Returns the argument provided as a number.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the end date after a specified number of working days.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdG9WNUhXOWQ4cE1rOGVsdHBCeE1QUVE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>