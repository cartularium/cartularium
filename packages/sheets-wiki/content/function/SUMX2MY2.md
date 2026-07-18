---
name: SUMX2MY2
category: array
syntax: SUMX2MY2(array_x, array_y)
status: imported
description: Calculates the sum of the differences of the squares of values in two arrays.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094257?hl=en).

Calculates the sum of the differences of the squares of values in two arrays.

### Sample Usage

```gse
SUMX2MY2({1,2,3},{4,5,6})
SUMX2MY2(A2:A9,B2:B9)
```

### Syntax

```gse
SUMX2MY2(array_x, array_y)
```

- `array_x` - The array or range of values whose squares will be reduced by the squares of corresponding entries in `array_y` and added together.
- `array_y` - The array or range of values whose squares will be subtracted from the squares of corresponding entries in `array_x` and added together.

### See Also

[[SUMXMY2]]: Calculates the sum of the squares of differences of values in two arrays.

[[SUMX2PY2]]: Calculates the sum of the sums of the squares of values in two arrays.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDd3a1hXcnAxN3lqQXFWMnQxdzNGR2c&amp;output=html" width="500"></iframe>