---
name: ROUND
category: math
syntax: ROUND(value, [places])
status: imported
description: The ROUND function rounds a number to a certain number of decimal places according to standard rules.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093440?hl=en).

The ROUND function rounds a number to a certain number of decimal places according to standard rules.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1HdilksQZ8KEiHdZrQcAxpEKIho6X4ybvxdmNLW9xe5g/copy)

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGg1cWtLYnJ6eTdYeDVhYnhRQ1NHY3c&amp;output=html" width="500"></iframe>

### Sample Usage

```gse
ROUND(99.44,1)
ROUND(A2)
```

### Syntax

```gse
ROUND(value, [places])
```

- `value` - The value to round to `places` number of places.
- `places` - **[** OPTIONAL - `0` by default **]** - The number of decimal places to which to round.

  + `places` may be negative, in which case `value` is rounded at the specified number of digits to the left of the decimal point.

### Notes

- Standard rules indicate that when rounding to a particular place, the next most significant digit (the digit to the right) is considered. If this digit is greater than or equal to 5, the digit is rounded up, otherwise it is rounded down. This occurs irrespective of sign; that is, 'up' and 'down' are in terms of magnitude.

### See Also

[[TRUNC]]: Truncates a number to a certain number of significant digits by omitting less significant digits.

[[ROUNDUP]]: Rounds a number to a certain number of decimal places, always rounding up to the next valid increment.

[[ROUNDDOWN]]: The ROUNDDOWN function rounds a number to a certain number of decimal places, always rounding down to the next valid increment.

[[MROUND]]: Rounds one number to the nearest integer multiple of another.

[[INT]]: Rounds a number down to the nearest integer that is less than or equal to it.

[[FLOOR]]: The FLOOR function rounds a number down to the nearest integer multiple of specified significance.

[[CEILING]]: The CEILING function rounds a number up to the nearest integer multiple of specified significance.