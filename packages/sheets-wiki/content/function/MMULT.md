---
name: MMULT
category: array
syntax: MMULT(matrix1, matrix2)
status: imported
description: Calculates the matrix product of two matrices specified as arrays or ranges.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094292?hl=en).

Calculates the matrix product of two matrices specified as arrays or ranges.

### Sample Usage

```gse
MMULT(A1:B3,C1:F2)
MMULT({1,2,3;4,5,6},{7;8;9})
```

### Syntax

```gse
MMULT(matrix1, matrix2)
```

- `matrix1` - The first matrix in the matrix multiplication operation, represented as an array or range.
- `matrix2` - The second matrix in the matrix multiplication operation, represented as an array or range.

### Notes

- As standard in matrix multiplication, the number of columns for `matrix1` must equal the number of rows for `matrix2`

### See Also

[[TRANSPOSE]]: Transposes the rows and columns of an array or range of cells.

[[SUMPRODUCT]]: The SUMPRODUCT function calculates the sum of the products of corresponding entries in 2 equally sized arrays or ranges.

[[MINVERSE]]: Returns the multiplicative inverse of a square matrix specified as an array or range.

[[MDETERM]]: Returns the matrix determinant of a square matrix specified as an array or range.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEh2amlqUTBMZ0NyUGI3STh1Q3loYUE&amp;output=html" width="500"></iframe>