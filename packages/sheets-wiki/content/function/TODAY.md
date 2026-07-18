---
name: TODAY
category: date
syntax: TODAY()
status: imported
description: Returns the current date as a date value.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3092984?hl=en).

Returns the current date as a date value.

### Sample Usage

```gse
TODAY()
```

### Syntax

```gse
TODAY()
```

### Notes

- Note that `TODAY` is a volatile function and can hurt spreadsheet performance.
- `TODAY` provides the current date with no time component. To create a date with the current time, use [[NOW]].
- `TODAY` will always represent the current date the last time the spreadsheet was recalculated, rather than remaining at the date when it was first entered.

### See Also

[[NOW]]: Returns the current date and time as a date value.

[[DATEVALUE]]: Converts a provided date string in a known format to a date value.

[[DATE]]: Converts a year, month, and day into a date.

### Examples

Returns the current computer system date.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdF8xZWQxajRDN3JBSWVLVG16Qm9jcVE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

[Make a copy](https://docs.google.com/spreadsheets/d/13XEIcEkzpb1ktQzZYP0QTMvRbFxvgnRIItpqDuiqs_Y/copy)