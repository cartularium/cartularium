---
name: MDETERM
category: array
syntax: MDETERM(square_matrix)
status: imported
description: Returns the matrix determinant of a square matrix specified as an array or range.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094290?hl=en).

Returns the matrix determinant of a square matrix specified as an array or range.

### Sample Usage

```gse
MDETERM(A1:D4)
MDETERM({1,2,3,4;5,6,7,8;9,10,11,12;13,14,15,16})
```

### Syntax

```gse
MDETERM(square_matrix)
```

- `square_matrix` - An array or range with an equal number of rows and columns representing a matrix whose determinant will be calculated.

### See Also

[[TRANSPOSE]]: Transposes the rows and columns of an array or range of cells.

[[MMULT]]: Calculates the matrix product of two matrices specified as arrays or ranges.

[[MINVERSE]]: Returns the multiplicative inverse of a square matrix specified as an array or range.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFo1NGs0d3dyZUdBS1VOWWphb0RPMkE&amp;output=html" width="500"></iframe>