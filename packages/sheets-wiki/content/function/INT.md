---
name: INT
category: math
syntax: INT(value)
status: imported
description: Rounds a number down to the nearest integer that is less than or equal to it.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093490?hl=en).

Rounds a number down to the nearest integer that is less than or equal to it.

### Sample Usage

```gse
INT(99.44)
INT(A2)
```

### Syntax

```gse
INT(value)
```

- `value` - The value to round down to the nearest integer..

### Notes

- `INT` is *not* equivalent to `ROUNDDOWN` with `places` set to `0`. `INT` rounds down using value, whereas `ROUNDDOWN` rounds down using absolute value, which causes differences for negative values of `value`.
- `INT` is also *not* equivalent to `FLOOR` with significance `-1` for negative values of `value` for the same reason as above. It is, however, equivalent to `FLOOR` with significance `1` for positive values of `value` and `CEILING` with significance `-1` for negative values of `value`.

### See Also

[[TRUNC]]: Truncates a number to a certain number of significant digits by omitting less significant digits.

[[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

[[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

[[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.

[[MROUND]]: Rounds one number to the nearest integer multiple of another.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFVycVJPMDNIZlFwUjh0cmV5Q2w4MVE&amp;output=html" width="500"></iframe>