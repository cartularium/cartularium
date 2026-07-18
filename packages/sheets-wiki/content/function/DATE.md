---
name: DATE
category: date
syntax: DATE(year, month, day)
status: imported
description: Converts a year, month, and day into a date.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3092969?hl=en).

Converts a year, month, and day into a date.

### Sample Usage

```gse
DATE(1969,7,20)
DATE(A2,B2,C2)
```

### Syntax

```gse
DATE(year, month, day)
```

- `year` - The year component of the date.
- `month` - The month component of the date.
- `day` - The day component of the date.

### Notes

- Inputs to `DATE` must be numbers - if a string or a reference to a cell containing a string is provided, the `#VALUE!` error will be returned.
- `DATE` will silently recalculate numeric dates which fall outside of valid month or day ranges. For example, `DATE(1969,13,1)`, which specifies the illegal month 13, will create a date of 1/1/1970. Similarly, `DATE(1969,1,32)`, which specifies the non-existent 32nd day of January, will create a date of 2/1/1969.
- `DATE` will silently truncate decimal values input into the function, e.g. a month of 12.75 will be interpreted as 12.

- Google Sheets uses the 1900 date system. It counts the days since December 30, 1899 (not including December 30, 1899).
- Between 0 and 1899, Google Sheets adds that value to 1900 to calculate the year. For example, DATE(119,2,1) will create a date of 2/1/2019.
- For years 1900 to 9999, Google Sheets will use that value as the year. For example, DATE(2019,1,2) will create a date of 1/2/2019.
- For years less than 0 or greater than 10,000, Google Sheets will return the `#NUM!` error value.

### See Also

[[TO_DATE]]: Converts a provided number to a date.

[[TIME]]: Converts an hour, minute, and second into a time.

[[N]]: Returns the argument provided as a number.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGRJaTVuN1BwTWtjQ2xYcy1MaEozVnc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/16wfy8PD81aE5Z24yR-8_bdNz9A7hzmTGy82zRZ6TnUQ/copy)