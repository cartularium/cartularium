---
name: TRUNC
category: math
syntax: TRUNC(value, [places])
status: imported
description: Truncates a number to a certain number of significant digits by omitting less significant digits.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093588?hl=en).

Truncates a number to a certain number of significant digits by omitting less significant digits.

### Sample Usage

```gse
TRUNC(3.141592654,2)
TRUNC(A2,0)
TRUNC(1.23)
```

### Syntax

```gse
TRUNC(value, [places])
```

- `value` - The value to be truncated.
- `places` - **[** OPTIONAL - `0` by default **]** - The number of significant digits to the right of the decimal point to retain.

  + If `places` is greater than the number of significant digits in `value`, value is returned without modification.
  + `places` may be negative, in which case the specified number of digits to the left of the decimal place are changed to zero. All digits to the right of the decimal place are discarded. If all digits of `value` are changed to zero, `TRUNC` simply returns `0`.

### Notes

- `TRUNC` performs no rounding, simply discarding unwanted digits.

### See Also

[[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

[[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

[[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.

[[MROUND]]: Rounds one number to the nearest integer multiple of another.

[[INT]]: Rounds a number down to the nearest integer that is less than or equal to it.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFYtSlp2MnBfNmZoMkljTTBSLWlPTGc&amp;output=html" width="500"></iframe>