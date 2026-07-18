---
name: DAYS360
category: date
syntax: DAYS360(start_date, end_date, [method])
status: imported
description: Returns the difference between two days based on the 360-day year used in some financial interest calculations.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093042?hl=en).

Returns the difference between two days based on the 360-day year used in some financial interest calculations.

### Sample Usage

```gse
DAYS360(DATE(1969,7,16),DATE(1969,7,24),1)
DAYS360(A2,A3)
DAYS360(1,270,1)
```

### Syntax

```gse
DAYS360(start_date, end_date, [method])
```

- `start_date` - The start date to consider in the calculation. Must be a reference to a cell containing a date, a function returning a date type, or a number.
- `end_date` - The end date to consider in the calculation. Must be a reference to a cell containing a date, a function returning a date type, or a number.
- `method` - **[** OPTIONAL - `0` by default **]** - An indicator of what day count method to use.

  + 0 indicates the US method - Under the US method, if `start_date` is the last day of a month, the day of month of `start_date` is changed to 30 for the purposes of the calculation. Furthermore, if `end_date` is the 31st day of a month and the day of the month of `start_date` is earlier than the 30th, `end_date` is changed to the first day of the month following `end_date`. Otherwise, the day of month of `end_date` is changed to 30.
  + Any other value indicates the European method - Under the European method, any `start_date` or `end_date` that falls on the 31st of a month has its day of month changed to `30`.

### Notes

- This function is mostly used in a financial setting, for calculation involving fixed-income securities. Other usage is likely incorrect.
- Ensure that the inputs to the function are either references to cells containing dates, functions which return date objects such as [[DATE]], [[DATEVALUE]] or [[TO_DATE]], or date serial numbers of the type returned by the [[N]] function. Google Sheets represents dates and times as numbers; while conversion is automatic when a human-readable date is entered into a cell, functions only accept literal dates in numeric format.
- `DAYS360` does not auto-convert number formats in the same way that Google Sheets does upon direct entry into cells. Therefore, `DAYS360(10/10/2000,10/10/2001)` is interpreted as `DAYS360(0.005,0.00499750124938)`, the quotients of 10 divided by 10 divided by 2000 and 2001, respectively.

### See Also

[[YEARFRAC]]: Returns the number of years, including fractional years, between two dates using a specified day count convention.

[[TO_DATE]]: Converts a provided number to a date.

[[N]]: Returns the argument provided as a number.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the difference between two dates using different method.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHRFQlR4MzdaWWI3V2RQWGd6Y1NFcWc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>