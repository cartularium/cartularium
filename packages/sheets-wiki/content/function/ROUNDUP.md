---
name: ROUNDUP
category: math
syntax: ROUNDUP(value,[places])
status: imported
description: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093443?hl=en).

Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

### Sample Usage

```gse
ROUNDUP(99.44,1)
ROUNDUP(A2)
```

### Syntax

```gse
ROUNDUP(value,[places])
```

- `value` - The value to round to `places` number of places, always rounding up.
- `places` - **[** OPTIONAL - `0` by default **]** - The number of decimal places to which to round.

  + `places` may be negative, in which case `value` is rounded at the specified number of digits to the left of the decimal point.

### Notes

- `ROUNDUP` operates like `ROUND` except that it always rounds up.

### See Also

[[TRUNC]]: Truncates a number to a certain number of significant digits by omitting less significant digits.

[[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

[[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.

[[MROUND]]: Rounds one number to the nearest integer multiple of another.

[[INT]]: Rounds a number down to the nearest integer that is less than or equal to it.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFFidXZmS192STZVTDZtdmxfZUp2WGc&amp;output=html" width="500"></iframe>