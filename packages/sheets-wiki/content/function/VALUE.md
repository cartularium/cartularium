---
name: VALUE
category: text
syntax: VALUE(text)
status: imported
description: Converts a string in any of the date, time or number formats that Google Sheets understands into a number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094220?hl=en).

Converts a string in any of the date, time or number formats that Google Sheets understands into a number.

### Sample Usage

```gse
VALUE("123")
VALUE("7/20/1969")
VALUE("12:00:00")
```

### Syntax

```gse
VALUE(text)
```

- `text` - The string containing the value to be converted.

### Notes

- `VALUE` returns a pure number even if the argument to the function was interpreted as a date. For example, `=VALUE("01/01/2012")` by default will be displayed as 40909.

### See Also

[[TEXT]]: Converts a number into text according to a specified format.

[[N]]: Returns the argument provided as a number.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFl4UnpBdXNhRXZ1X0ZKanZ5QmZGbmc&amp;output=html" width="500"></iframe>