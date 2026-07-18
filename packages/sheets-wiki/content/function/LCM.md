---
name: LCM
category: math
syntax: LCM(value1, [value2, ...])
status: imported
description: Returns the least common multiple of one or more integers.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093421?hl=en).

Returns the least common multiple of one or more integers.

### Sample Usage

```gse
LCM(A2:A5)
LCM(2,3,A4)
```

### Syntax

```gse
LCM(value1, [value2, ...])
```

- `value1` - The first value or range whose factors to consider in a calculation to find the least common multiple.
- `value2, ...` - **[** OPTIONAL **]** - Additional values or ranges whose factors to consider to find the least common multiple.

### Notes

- Any input with a decimal part provided to `LCM` will be silently truncated.

### See Also

[[GCD]]: Returns the greatest common divisor of one or more integers.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHBtM01rQ1JpejFVekxBaWtNMDRxOWc&amp;output=html" width="500"></iframe>