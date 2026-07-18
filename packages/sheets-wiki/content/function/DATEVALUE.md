---
name: DATEVALUE
category: date
syntax: DATEVALUE(date_string)
status: imported
description: Converts a provided date string in a known format to a date value.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093039?hl=en).

Converts a provided date string in a known format to a date value.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1zcO_S7GZeu5h3Nasu6hBxYA_lYcw7BgoKP90_gjEiCI/copy)

`DATEVALUE` accepts different input string format.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEhEQjNSeWZkdHF6TnJTRHk4VXdsd1E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

### Sample Usage

```gse
DATEVALUE("1969-7-20")
DATEVALUE("7/20/1969")
DATEVALUE(A2)
```

### Syntax

```gse
DATEVALUE(date_string)
```

- `date_string` - The string representing the date.

  + Understood formats include any date format which is normally autoconverted when entered, without quotation marks, directly into a cell. Understood formats may depend on region and language settings.

### Notes

- The input to `DATEVALUE` must be a string - if a number or cell reference to a cell containing a number is provided, the `#VALUE!` error will be returned.
- `DATEVALUE` returns integers that can be used in formulas. To get dates, [change the cell format to Date](https://support.google.com/docs/answer/56470).
- If providing an explicit string input to `DATEVALUE` rather than a cell reference, surrounding quotation marks are required.
- Some date formats are not understood by Google Sheets. To quickly ensure that the desired date format is understood, type an example of it into an empty cell, without quotation marks.

### See Also

[[TO_DATE]]: Converts a provided number to a date.

[[N]]: Returns the argument provided as a number.

[[DATE]]: Converts a year, month, and day into a date.