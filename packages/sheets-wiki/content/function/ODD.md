---
name: ODD
category: math
syntax: ODD(value)
status: imported
description: Rounds a number up to the nearest odd integer.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093499?hl=en).

Rounds a number up to the nearest odd integer.

### Sample Usage

```gse
ODD(2)
ODD(-0.6)
ODD(A2)
```

### Syntax

```gse
ODD(value)
```

- `value` - The value to round to the next greatest odd number.

  + If `value` is negative, it will be rounded down to the next negative odd number with greater absolute value.

### See Also

[[TRUNC]]: Truncates a number to a certain number of significant digits by omitting less significant digits.

[[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

[[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

[[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.

[[MROUND]]: Rounds one number to the nearest integer multiple of another.

[[INT]]: Rounds a number down to the nearest integer that is less than or equal to it.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[EVEN]]: Rounds a number up to the nearest even integer.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEJ0OGc4cUxJaWl5TmxUNS1tNVY0WHc&amp;output=html" width="500"></iframe>