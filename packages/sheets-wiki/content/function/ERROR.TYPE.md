---
name: ERROR.TYPE
category: info
syntax: ERROR.TYPE(reference)
status: imported
description: Returns a number corresponding to the error value in a different cell.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3238305?hl=en).

Returns a number corresponding to the error value in a different cell.

### Sample Usage

```gse
ERROR.TYPE(A3)
ERROR.TYPE(NA())
```

### Syntax

ERROR.TYPE(reference)

- `reference` - The cell to find the error number for - you can also provide the error value directly.

### Notes

- `ERROR.TYPE` will return the following numbers for the corresponding error values:
  + `1` for `#NULL!`
  + `2` for `#DIV/0!`
  + `3` for `#VALUE!`
  + `4` for `#REF!`
  + `5` for `#NAME?`
  + `6` for `#NUM!`
  + `7` for `#N/A`
  + `8` for all other errors

### See Also

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEp6UHpsWlVkZl9NaHpCQTAzUjNWWmc&amp;output=html" width="500"></iframe>