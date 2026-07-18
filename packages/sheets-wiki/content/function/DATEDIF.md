---
name: DATEDIF
category: date
syntax: DATEDIF(start_date, end_date, unit)
status: imported
description: Calculates the number of days, months, or years between two dates.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/6055612?hl=en).

Calculates the number of days, months, or years between two dates.

### Sample Usage

```gse
DATEDIF(DATE(1969, 7, 16), DATE(1969, 7, 24), "D")
DATEDIF(A1, A2, "YM")
DATEDIF("7/16/1969", "7/24/1969", "Y")
```

### Syntax

```gse
DATEDIF(start_date, end_date, unit)
```

- `start_date` - The start date to consider in the calculation. Must be a reference to a cell containing a `DATE`, a function returning a `DATE` type, or a number.
- `end_date` - The end date to consider in the calculation. Must be a reference to a cell containing a `DATE`, a function returning a `DATE` type, or a number.
- `unit` - A text abbreviation for unit of time. For example,`"M"`  for month. Accepted values are `"Y"`,`"M"`,`"D"` ,`"MD"`,`"YM"`,`"YD"`.

  + `"Y"`: the number of whole years between  `start_date` and `end_date`.
  + `"M"`: the number of whole months between  `start_date` and `end_date`.
  + `"D"`: the number of days between `start_date`  and `end_date`.
  + `"MD"`: the number of days between `start_date`  and `end_date` after subtracting whole months.
  + `"YM"`: the number of whole months between  `start_date` and `end_date` after subtracting whole years.
  + `"YD"`: the number of days between `start_date`  and `end_date`, assuming `start_date` and `end_date` were no more than one year apart.

### Notes

- Months and years are only counted if they are equal to or go past the "day." For example, the function returns "4 months" between the dates 9/30/15 and 2/28/16 (even though the 28th is the last day of the month).
- If `DATEDIF` produces a result in an unexpected format, ensure that no pre-existing format has been applied to the cell. For example, if `DATEDIF(DATE(1969,7,16),DATE(1969,7,24),"D")` returns `1/4/1900`, the `Date` format has been applied to the cell. Change the format of the cell to `Number` in order to view the expected result of `8`.
- Use `unit` `"MD"` to answer questions such as, "After subtracting whole years and whole months from my age, how many days old am I?"
- Use `unit` `"YM"` to answer questions such as, "After subtracting whole years from my age, how many whole months old am I?"
- Use `unit` `"YD"` to answer questions such as, "How many days has it been since my last birthday, given my birthdate and today's date?"

### See Also

[[DATE]]: Converts a year, month, and day into a date.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1i4vQowRi81dDHUvS_dUsHY_OmT82QDmxXQDAKN06eC4/copy)

**Note**: Each example is in its own tab.

### Number of days

In this example, `DATEDIF` returns the number of days in the Apollo 11 mission.

<iframe height="300" src="https://docs.google.com/spreadsheets/d/1i4vQowRi81dDHUvS_dUsHY_OmT82QDmxXQDAKN06eC4/pubhtml?widget=true&amp;headers=false&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

### Months

In this example, `DATEDIF` returns the number of months in one year.

<iframe height="300" src="https://docs.google.com/spreadsheets/d/1i4vQowRi81dDHUvS_dUsHY_OmT82QDmxXQDAKN06eC4/pubhtml?widget=true&amp;headers=false&amp;gid=1465438921&amp;output=html&amp;widget=true" width="500"></iframe>