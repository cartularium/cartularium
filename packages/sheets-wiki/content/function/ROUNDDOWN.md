---
name: ROUNDDOWN
category: math
syntax: ROUNDDOWN(value,[places])
status: imported
description: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093442?hl=en).

The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

### Sample Usage

```gse
ROUNDDOWN(99.44,1)
ROUNDDOWN(A2)
```

### Syntax

```gse
ROUNDDOWN(value,[places])
```

- `value` - The value to round to `places` number of places, always rounding down.
- `places` - **[** OPTIONAL - `0` by default **]** - The number of decimal places to which to round.

  + `places` may be negative, in which case `value` is rounded at the specified number of digits to the left of the decimal point.

### Notes

- `ROUNDDOWN` operates like `ROUND` except that it always rounds down.

### See Also

[[TRUNC]]: Truncates a number to a certain number of significant digits by omitting less significant digits.

[[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

[[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.

[[MROUND]]: Rounds one number to the nearest integer multiple of another.

[[INT]]: Rounds a number down to the nearest integer that is less than or equal to it.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEc2QjRWNTk3enFtbHhNVWtxWnpUTVE&amp;output=html" width="500"></iframe>