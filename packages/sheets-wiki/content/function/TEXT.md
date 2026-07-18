---
name: TEXT
category: text
syntax: TEXT(number, format)
status: imported
description: Converts a number into text according to a specified format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094139?hl=en).

Converts a number into text according to a specified format.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1xdMTiW2HtTxp59QTXKWaY_5P3M98uwRtrGwIo_8Lffo/copy)

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDc2ZDZvVzFIbEJPZlhnYzNLbXZqRnc&amp;output=html" width="500"></iframe>

### Sample Usage

```gse
TEXT(1.23,"$0.00")
TEXT(A2,"#.###")
TEXT(24,"#.0?")
TEXT(DATE(1969,7,20),"yyyy-MM")
```

### Syntax

```gse
TEXT(number, format)
```

- `number` - The number, date, or time to format.
- `format` - The pattern by which to format the number, enclosed in quotation marks.

  + `0` forces display of zeros if a number has fewer digits than the format specifies. For example, `TEXT(12.3,"000.00")` produces `012.30`. Numbers which have more digits to the right of the decimal point than the pattern are rounded to the indicated number of places. For example, `TEXT(12.305,"00.00")` results in `12.31`.
  + `#` is similar to `0` but does not force the display of zeros on either side of the decimal point. For example, `TEXT(12.3,"###.##")` produces `12.3`.

### Notes

- The `format` argument to `TEXT` cannot contain an asterisk (`*`).
- `TEXT` does not support the `?` pattern in Google Sheets.
- `TEXT` does not support fractional format patterns.
- `TEXT` supports the following date and time patterns:

  + `d` for the day of the month as one or two digits.
  + `dd` for the day of the month as two digits.
  + `ddd` for the short name of the day of the week.
  + `dddd` for the full name of the day of the week.
  + `m` for the month of the year as one or two digits or the number of minutes in a time. Month will be used unless this code is provided with hours or seconds as part of a time.
  + `mm` for the month of the year as two digits or the number of minutes in a time. Month will be used unless this code is provided with hours or seconds as part of a time.
  + `mmm` for the short name of the month of the year.
  + `mmmm` for the full name of the month of the year.
  + `mmmmm` for the first letter in the month of the year.
  + `yy` for the year as two digits.
  + `yyyy` for the year as four digits.
  + `HH` for the hour on a 24-hour clock.
  + `hh` for the hour on a 12-hour clock.
  + `ss` for the seconds in a time.
  + `ss.000` for milliseconds in a time.
  + `AM/PM` for displaying hours based on a 12-hour clock and showing AM or PM depending on the time of day.
- Note that the date/time patterns and `#` or `0` cannot be mixed.

### See Also

[[T]]: Returns string arguments as text.

[[FIXED]]: Formats a number with a fixed number of decimal places.

[[DOLLAR]]: Formats a number into the locale-specific currency format.