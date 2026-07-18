---
name: BYROW
category: array
syntax: BYROW(array_or_range,LAMBDA)
status: imported
description: This function groups an array by rows by application of a `LAMBDA` function to each row.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/12570930?hl=en).

This function groups an array by rows by application of a `LAMBDA` function to each row.

### Sample Usage

```gse
BYROW(A1:C3,LAMBDA(row,MAX(row)))
BYROW(A1:C3,LAMBDA(row,SUM(row)))
```

### Syntax

```gse
BYROW(array_or_range,LAMBDA)
```

- `array_or_range`: The array or range to group by rows.
- `LAMBDA`: A `LAMBDA` that’s applied to each row in the given array or range to obtain its grouped value.
  + **Syntax:** `LAMBDA(name,formula_expression)`
  + **Requirements:**
    - The `LAMBDA` must have exactly 1 `name` argument along with a `formula_expression` which uses that `name`. The `name` resolves to the current row being grouped when the `LAMBDA` is applied.

### Notes

- The passed `LAMBDA` should accept exactly 1 `name` argument, otherwise an `#N/A` error is returned. This argument corresponds to a row in the input array.
- Every row should be grouped to a single value. Array results for grouped values aren’t supported.

- A `named function` can be passed for the `LAMBDA` parameter and behaves like a `LAMBDA` in this case. [Learn more about named functions](https://support.google.com/docs/answer/12504534).
  + There should be exactly 1 argument placeholder defined for it.
  + Parenthesis shouldn't follow the `named function`.

### Examples

### Sum row-wise

**Example Data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | 3 | 5 | 7 |
| **2** | 4 | 3 | 5 |
| **3** | 1 | 2 | 4 |

**Example:** `=BYROW(A1:C3,LAMBDA(row,SUM(row)))`

**Result:**

|  |
| --- |
| 15 |
| 12 |
| 7 |

### Filters years where any quarterly sales exceeded 1300

**Example data:**

| 1 | Q1 | Q2 | Q3 | Q4 |
| --- | --- | --- | --- | --- |
| **2** | **2019** | 1060 | 295 | 1425 | 280 |
| **3** | **2020** | 270 | 585 | 675 | 170 |
| **4** | **2021** | 285 | 1200 | 780 | 1235 |
| **5** | **2022** | 1440 | 1390 | 45 | 650 |

**Example:**`=FILTER(A2:A5,BYROW(B2:E5,LAMBDA(row,MAX(row)>1300)))`

**Result:**

|  |
| --- |
| 2019 |
| 2022 |

### Returns a 3x1 array with the difference between max and min value of each row using a named function as LAMBDA

[Make a Copy](https://docs.google.com/spreadsheets/d/1i77E0hI748plXvMUpB-Z2huwPrzvIzt3f-EepDXcVAM/copy#gid=0)

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | 3 | 5 | 7 |
| **2** | 4 | 3 | 5 |
| **3** | 1 | 2 | 4 |

**Example:** `=BYROW(A1:C3,MAX_MIN_DIFF)`

**Named function:** `MAX_MIN_DIFF` is a `named function` which outputs the difference between the maximum value and the minimum value.

**Formula definition:** `=MAX(row)-MIN(row)`, where `row` is an argument placeholder defined for `MAX_MIN_DIFF`.

**Result:**

|  |
| --- |
| 4 |
| 2 |
| 3 |

### Common Errors

The passed LAMBDA doesn’t have exactly 1 name argument

If the passed `LAMBDA` doesn’t have exactly 1 `name` argument, and 1 `formula expression` as an argument, this error occurs:

“Wrong number of arguments to LAMBDA. Expected 1 argument, but got 2 arguments.”

**Example:** `=BYROW(C1:C4,LAMBDA(a,b,a+b))`

For this example, `LAMBDA` was given 2 `name` arguments when it only needs 1.

The last parameter of BYROW wasn’t a LAMBDA

If the last parameter of `BYROW` wasn’t a `LAMBDA`, this error occurs:

“Argument must be a LAMBDA.”

**Example:** `=BYROW(C1:C4,4)`

The LAMBDA passed to BYROW was incorrect

If 1 or more `name` arguments weren’t valid, this error occurs:

“Argument 1 of function LAMBDA is not a valid name.”

**Example:** `=BYROW(C1:C4,LAMBDA(C1, C1+1))`

For this example, `C1` is an invalid `name` since it clashes with a range.

The application of LAMBDA on the input array doesn’t group each row to a single value

If the application of `LAMBDA` on the input array doesn’t group each row to a single value, this error occurs:

“Single value expected. Nested array results are not supported.”

**Example:** `=BYROW(C1:E1,LAMBDA(row,row))`

### Related functions

- [[LAMBDA]]: This function lets you create and return a custom function with a set of `names` and a `formula_expression` that uses them.
- [[MAP]]: This function maps each value in the given arrays to a new value.
- [[REDUCE]]: This function reduces an array to an accumulated result.
- [[BYCOL]]: This function groups an array by columns.
- [[SCAN]]: This function scans an array and produces intermediate values.
- [[MAKEARRAY]]: This function creates a calculated array of specified dimensions.
- [Create & use named functions](https://support.google.com/docs/answer/12504534): This function lets you create and store custom functions, similar to `LAMBDA`.