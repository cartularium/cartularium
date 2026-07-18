---
name: GCD
category: math
syntax: GCD(value1, [value2, ...])
status: imported
description: Returns the greatest common divisor of one or more integers.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093489?hl=en).

Returns the greatest common divisor of one or more integers.

### Sample Usage

```gse
GCD(A2:A5)
GCD(24,96,A4)
```

### Syntax

```gse
GCD(value1, [value2, ...])
```

- `value1` - The first value or range whose factors to consider in a calculation to find the greatest common divisor.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges whose factors to consider to find the greatest common divisor.

### Notes

- Any input with a decimal part provided to `GCD` will be silently truncated.

### See Also

[[LCM]]: Returns the least common multiple of one or more integers.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGtTWTdGUEtaNVZvUGZvWTdLazkwS2c&amp;output=html" width="500"></iframe>