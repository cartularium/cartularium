---
name: SUMPRODUCT
category: array
syntax: SUMPRODUCT(array1, [array2, ...])
status: imported
description: The SUMPRODUCT function calculates the sum of the products of corresponding entries in 2 equally sized arrays or ranges.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094294?hl=en).

The SUMPRODUCT function calculates the sum of the products of corresponding entries in 2 equally sized arrays or ranges.

### Sample Usage

```gse
SUMPRODUCT(A2:C5,D2:F5)
SUMPRODUCT({1,2,3,4},{5,6,7,8})
```

### Syntax

```gse
SUMPRODUCT(array1, [array2, ...])
```

- `array1` - The first array or range whose entries will be multiplied with corresponding entries in the second such array or range.
- `array2, ...`  - **[** OPTIONAL - `{1,1,1,...}` with same length as `array1` by default **]** - The second array or range whose entries will be multiplied with corresponding entries in the first such array or range.

### Notes

- Matrix multiplication, `MMULT`, can also be accomplished using a combination of `TRANSPOSE` and `SUMPRODUCT` functions.

### See Also

[[TRANSPOSE]]: Transposes the rows and columns of an array or range of cells.

[[MMULT]]: Calculates the matrix product of two matrices specified as arrays or ranges.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHhnN1RWWEUzeGlkc0RVN2ZfYllzdXc&amp;output=html" width="500"></iframe>