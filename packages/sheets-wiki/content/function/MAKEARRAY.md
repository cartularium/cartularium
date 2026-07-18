---
name: MAKEARRAY
category: array
syntax: MAKEARRAY(rows, columns, LAMBDA)
status: imported
description: This function returns an array of specified dimensions with values calculated by application of a LAMBDA function.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/12569202?hl=en).

This function returns an array of specified dimensions with values calculated by application of a LAMBDA function.

### Sample Usage

```gse
MAKEARRAY(2, 3, LAMBDA(row_index, column_index, row_index+column_index))
MAKEARRAY(2, 3, LAMBDA(row_index, column_index, row_index*column_index))
```

### Syntax

```gse
MAKEARRAY(rows, columns, LAMBDA)
```

- `rows`: The number of rows to return.
- `columns`: The number of columns to return.
- `LAMBDA`: A `LAMBDA` that’s applied to create the array.
  + **Syntax:** `LAMBDA(name1, name2, formula_expression)`
    - [Learn more about LAMBDA functions](https://support.google.com/docs/answer/12508718).
  + **Requirements:**
    - The `LAMBDA` must have exactly 2 `name` arguments along with a `formula_expression` which uses those `names`. When applying the `LAMBDA`, `name1` resolves to the current `row_index` and `name2` resolves to the current `column_index`.

### Notes

- The passed `LAMBDA` function should accept exactly 2 `name` arguments, otherwise an `#N/A`error is returned. These correspond to `row_index` and `column_index`, in order. These are explained as:

  + `name1`:Resolves to the current `row_index` for which value is created.
  + `name2`:Resolves to the current `column_index` for which value is created.
- Every value created by the `LAMBDA` function applied on indices should be a single value. Array results for created values aren’t supported.
- `row_index` and `column_index` start from 1.
- A `named function` can be passed for the `LAMBDA` parameter and behaves like a `LAMBDA` function in this case. [Learn more about named functions](http://support.google.com/docs/answer/12504534).
  + The `named function` must follow the `LAMBDA` syntax for `MAKEARRAY` with exactly 2 argument placeholders defined for it.
  + The `named function` shouldn't be followed by parenthesis.

### Examples

### Return a 2 by 3 array with row index\*column index as cell value

**Example:** `=MAKEARRAY(2, 3, LAMBDA(row_index, column_index, row_index*column_index))`

**Result:**

|  |  |  |
| --- | --- | --- |
| 1 | 2 | 3 |
| 2 | 4 | 6 |

### Return a 2 by 3 array with random numbers between 1 and 100

**Example:** `=MAKEARRAY(2, 3, LAMBDA(row_index, column_index, RANDBETWEEN(1,100)))`

**Result:**

|  |  |  |
| --- | --- | --- |
| 53 | 70 | 38 |
| 6 | 47 | 78 |

In this example, the function makes a randomized 2 by 3 array, with a number between 1 and 100 for each cell.

### Use a named function as LAMBDA to return a 4 by 4 array

Use a `named function` as `LAMBDA` to return a 4 by 4 array with data in waterfall format. Where the value of an additional row equals the value of the previous row +1, given that the starting value is 100 in row 1.

**[Make a Copy](https://docs.google.com/spreadsheets/d/1sUIdCjKPbwURbbxtiSoot7qd93MDPO69Eq3kSE_VByk/copy#gid=0)**

**Named function:** `WATERFALL` is a `named function` which outputs a value of 100 + `row_index` - 1 if the cell’s `row_index` is lower than or equals to `column_index`, else it leaves the cell blank.

**Formula definition:** `=if(row_index<=column_index, 100+row_index-1, "")` where `row_index` and `column_index` are argument placeholders defined for `WATERFALL`.

**Example:** `=MAKEARRAY(4,4,WATERFALL)`

**Result:**

|  |  |  |  |
| --- | --- | --- | --- |
| 100 | 100 | 100 | 100 |
|  | 101 | 101 | 101 |
|  |  | 102 | 102 |
|  |  |  | 103 |

### Use a named function as LAMBDA to find the count of employees

Use a `named function` as a `LAMBDA` function to find the count of employees that joined in a particular quarter in a particular year.

**[Make a Copy](https://docs.google.com/spreadsheets/d/1n20dl7rrSvzew6WquCr2VGXcOz1tsqVQW12rssbNj2g/copy#gid=1016033164)**

**Example data:**

|  | **A** | **B** | **C** | **D** | **E** | **F** | **G** | **H** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | **2020** | John,Adam,Stacy,Michael,Peter,Kimberly,Maurice,Steven |  |  | **Q1** | **Q2** | **Q3** | **Q4** |
| **2** | **2021** | Nancy,Mark,Alice,Lily,Zack,Christina,Charles |  | **2020** |  |  |  |  |
| **3** |  |  |  | **2021** |  |  |  |  |
| **4** |  |  |  |  |  |  |  |  |
| **5** | **Q1** | John,Adam,Nancy,Mark |  |  |  |  |  |  |
| **6** | **Q2** | Stacy,Michael,Peter,Alice |  |  |  |  |  |  |
| **7** | **Q3** | Kimberly,Lily,Zack,Christina |  |  |  |  |  |  |
| **8** | **Q4** | Maurice,Steven,Charles |  |  |  |  |  |  |

In array `A1:B2`, you’ll find the employees who joined in a particular year. In array `A5:B8`, you’ll find the employees who joined in a particular quarter. We need to populate array `E2:H3` with the count of employees who joined in a particular year and quarter.

**Named function:** `FIND_COMMON_EMPLOYEES_COUNT` is a `named function` which returns the count of common employees given a quarter number and year index.

**Formula definition:** `=COUNT(ARRAYFORMULA(MATCH(SPLIT(INDEX(Sheet1!$B$5:$B$8, quarter_no),","), SPLIT(INDEX(Sheet1!$B$1:$B$2, year_index), ","), 0)))`, where `year_index` and `quarter_no` are argument placeholders defined for `FIND_COMMON_EMPLOYEES_COUNT`, in that order.

**Example:** Input this formula in `E2`: `=MAKEARRAY(2, 4, FIND_COMMON_EMPLOYEES_COUNT)`

**Result:**

|  | **A** | **B** | **C** | **D** | **E** | **F** | **G** | **H** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **1** | **2020** | John,Adam,Stacy,Michael,Peter,Kimberly,Maurice,Steven |  |  | **Q1** | **Q2** | **Q3** | **Q4** |
| **2** | **2021** | Nancy,Mark,Alice,Lily,Zack,Christina,Charles |  | **2020** | 2 | 3 | 1 | 2 |
| **3** |  |  |  | **2021** | 2 | 1 | 3 | 1 |
| **4** |  |  |  |  |  |  |  |  |
| **5** | **Q1** | John,Adam,Nancy,Mark |  |  |  |  |  |  |
| **6** | **Q2** | Stacy,Michael,Peter,Alice |  |  |  |  |  |  |
| **7** | **Q3** | Kimberly,Lily,Zack,Christina |  |  |  |  |  |  |
| **8** | **Q4** | Maurice,Steven,Charles |  |  |  |  |  |  |

### Common Errors

The passed LAMBDA doesn't have exactly 2 name arguments

If the `LAMBDA` function doesn’t have 2 `name` arguments, this error occurs:

“Wrong number of arguments to LAMBDA. Expected 3 arguments, but got 2 arguments."

**Example:** `=MAKEARRAY(2, 3, LAMBDA(current_value, current_value+1))`

In this example, `LAMBDA` was given only 1 `name` argument when it needed 2.

The last parameter of MAKEARRAY wasn’t a LAMBDA

If the last parameter of `MAKEARRAY` wasn’t a `LAMBDA`, this error occurs:

“Argument must be a LAMBDA.”

**Example:** `=MAKEARRAY(2, 3, 3)`

The LAMBDA passed to MAKEARRAY was incorrect

If the `LAMBDA` passed to `MAKEARRAY` was incorrect as to its `name` arguments, this error occurs:

“Argument 1 of function LAMBDA is not a valid name.”

**Example:** `=MAKEARRAY(2,3, LAMBDA(C1, v, C1*v))`

In this example, `C1` is an invalid `name` since it clashes with a range.

The application of LAMBDA on a row and column index creates multiple values

If the applied `LAMBDA` on the row and column creates multiple values, this error occurs:

“Single value expected. Nested array results are not supported.”

**Example:** `=MAKEARRAY(2,3, LAMBDA(i, j, {i, j} ))`

Every application of `LAMBDA` on the `row_index` and `column_index` must create a value which is a single value only and can't be another array.

### Related functions

- [[LAMBDA]]: This function lets you create and return a custom function with a set of `names` and a `formula_expression` that uses them.
- [[MAP]]: This function maps each value in the given arrays to a new value.
- [[REDUCE]]: This function reduces an array to an accumulated result.
- [[BYROW]]: This function groups an array by rows.
- [[BYCOL]]: This function groups an array by columns.
- [[SCAN]]: This function scans an array and produces intermediate values.
- [Create & use named functions](https://support.google.com/docs/answer/12504534): This function lets you create and store custom functions, similar to `LAMBDA`.