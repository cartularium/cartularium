---
name: CONCAT
category: operator
syntax: CONCAT(value1, value2)
status: imported
description: Returns the concatenation of two values.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093592?hl=en).

Returns the concatenation of two values. Equivalent to the `&` operator.

### Sample Usage

```gse
CONCAT("de","mystify")
CONCAT(17,76)
```

### Syntax

```gse
CONCAT(value1, value2)
```

- `value1` - The value to which `value2` will be appended.
- `value2` - The value to append to `value1`.

### Notes

- `value1` and `value2` can be any scalar value or reference to a scalar value, including numeric and text types.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHB6bkRhaXlMUXBRMXBnRTQ4MlliQkE&amp;output=html" width="500"></iframe>