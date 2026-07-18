---
name: SUMXMY2
category: array
syntax: SUMXMY2(array_x, array_y)
status: imported
description: Calculates the sum of the squares of differences of values in two arrays.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094298?hl=en).

Calculates the sum of the squares of differences of values in two arrays.

### Sample Usage

```gse
SUMXMY2({1,2,3},{4,5,6})
SUMXMY2(A2:A9,B2:B9)
```

### Syntax

```gse
SUMXMY2(array_x, array_y)
```

- `array_x` - The array or range of values that will be reduced by corresponding entries in `array_y`, squared, and added together.
- `array_y` - The array or range of values that will be subtracted from corresponding entries in `array_x`, the result squared, and all such results added together.

### See Also

[[SUMX2PY2]]: Calculates the sum of the sums of the squares of values in two arrays.

[[SUMX2MY2]]: Calculates the sum of the differences of the squares of values in two arrays.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEtCTkZnRnBmaDNhdUhEc2dWbkZGSFE&amp;output=html" width="500"></iframe>