---
name: EVEN
category: math
syntax: EVEN(value)
status: imported
description: Rounds a number up to the nearest even integer.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093409?hl=en).

Rounds a number up to the nearest even integer.

### Sample Usage

```gse
EVEN(3)
EVEN(-0.6)
EVEN(A2)
```

### Syntax

```gse
EVEN(value)
```

- `value` - The value to round to the next greatest even number.

  + If `value` is negative, it will be rounded down to the next negative even number with greater absolute value.

### See Also

[[TRUNC]]: Truncates a number to a certain number of significant digits by omitting less significant digits.

[[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

[[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

[[ROUND]]: The ROUND function rounds a number to a certain number of decimal places according to standard rules.

[[ODD]]: Rounds a number up to the nearest odd integer.

[[MROUND]]: Rounds one number to the nearest integer multiple of another.

[[INT]]: Rounds a number down to the nearest integer that is less than or equal to it.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEplaHJLY2VzQTc1QWxFTWtMN1c2MkE&amp;output=html" width="500"></iframe>