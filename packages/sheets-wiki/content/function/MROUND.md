---
name: MROUND
category: math
syntax: MROUND(value,factor)
status: imported
description: Rounds one number to the nearest integer multiple of another.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093426?hl=en).

Rounds one number to the nearest integer multiple of another.

### Sample Usage

```gse
MROUND(21,14)
MROUND(A2,3)
```

### Syntax

```gse
MROUND(value,factor)
```

- `value` - The number to round to the nearest integer multiple of another.
- `factor` - The number to whose multiples `value` will be rounded.

### Notes

- Both `value` and `factor` may be non-integral.
- `value` and `factor` must have the same sign; that is, they must both be positive or both negative. If either is zero, `MROUND` will return `0`.
- If `value` is equally close to two multiples of `factor`, the multiple with the greater absolute value will be returned.

### See Also

[[TRUNC]]: Truncates a number to a certain number of significant digits by omitting less significant digits.

[[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

[[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

[[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.

[[INT]]: Rounds a number down to the nearest integer that is less than or equal to it.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEhxb0Y2NG9nZ0duNHhWRVRNeFZnUEE&amp;output=html" width="500"></iframe>