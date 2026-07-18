---
tags:
  - datatype
---

Arrays represent any *m* by *n* grid of contiguous values, where *m* is the number of rows and *n* is the number of columns. Each cell in an array can contain any data type, including mixed types. Conceptually, an array is a rectangular collection of cells.

All rows of an array must share the same number of columns, and all columns must share the same number of rows.

### Array subtypes

#### Range

Arrays fall into two primary categories: **ranges** and **virtual arrays**.  

A **range** refers directly to cells in a spreadsheet and retains contextual information such as the row or column from which it originates. Certain functions, such as `SUMIF` or `OFFSET`, require range data to function correctly.

#### Virtual array

A **virtual array** is any array that does not retain reference metadata — it carries no information about which cells it originated from. Virtual arrays exist only in memory and are not directly tied to spreadsheet cells. They are typically produced by constructing an array literal, or as the output of most spreadsheet functions, which accept a range (itself a type of array) and return it stripped of its reference metadata.

#### Array literals

**Array literals** are constructed arrays defined using curly braces `{}` to produce a virtual array.

```xls
{<item>,<item>;<item>,<item>}
```

The comma (`,`) separator delimits values within a row and the semicolon (`;`) separator delimits different rows. Elements are processed horizontally first, then vertically.

All rows within an array literal must contain the same number of elements. To create [[Array#Jagged Arrays|jagged arrays]], use the [[VSTACK]] and [[HSTACK]] functions instead.

Array literal syntax is locale-dependent: the separators used within `{}` vary by spreadsheet locale. In North American locales, `,` separates values within a row and `;` separates rows. Other locales use different separators. The functional equivalents [[ARRAY_LITERAL]] and [[ARRAY_ROW]] are unaffected by locale, as are [[VSTACK]] and [[HSTACK]].

#### Vectors

Vectors are one-dimensional arrays with dimensions of either $1 \times n$ (row vector) or $m \times 1$ (column vector). Many functions specifically operate on vectors, often referring to "a single row or column." Vectors are conceptually distinct from two-dimensional arrays, even though they share structural similarities.

#### Jagged arrays

Jagged arrays consist of rows or columns of varying lengths padded with null values to align dimensions.

In Google Sheets, jagged arrays behave similarly to regular arrays and are especially useful when combined with [[LAMBDA Helper Functions]].
In Excel, however, they are generally considered [[Bad Practice|bad practice]] due to inconsistent behavior across functions.

### Notes

Non-vector arrays containing over **2,147,483,647** (2^31 - 1) elements will crash the sheet. Any array containing over **10,000,000** elements will output `#VALUE!`.
