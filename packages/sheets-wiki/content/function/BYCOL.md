---
name: BYCOL
category: array
syntax: BYCOL(array_or_range,LAMBDA)
status: imported
description: This function groups an array by columns by application of a `LAMBDA` function to each column.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/12571032?hl=en).

This function groups an array by columns by application of a `LAMBDA` function to each column.

### Sample Usage

```gse
BYCOL(A1:C3,LAMBDA(column,MAX(column)))
BYCOL(A1:C3,LAMBDA(column,SUM(column)))
```

### Syntax

```gse
BYCOL(array_or_range,LAMBDA)
```

- `array_or_range`: An array or range to be grouped by columns.
- `LAMBDA`: A `LAMBDA` that’s applied to each column in the given array or range to obtain its grouped value.
  + **Syntax:** `LAMBDA(name,formula_expression)`
  + **Requirements:**
    - The `LAMBDA` must have exactly 1 `name` argument along with a `formula_expression` which uses that `name`. The `name` resolves to the current column being grouped when the `LAMBDA` is applied.

### Notes

- The passed `LAMBDA` should accept exactly 1 `name` argument, otherwise an `#N/A` error is returned. This argument corresponds to a column in the input array.
- Every column should be grouped to a single value. Array results for grouped values aren’t supported.
- A `named function` can be passed for the `LAMBDA` parameter and behaves like a `LAMBDA` in this case. [Learn more about named functions](https://support.google.com/docs/answer/12504534).
  + There should be exactly 1 argument placeholder defined for it.
  + Parenthesis shouldn't follow the `named function`.

### Examples

### Returns a 1x3 row-array with max of each column

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | 3 | 5 | 7 |
| **2** | 4 | 3 | 5 |
| **3** | 1 | 2 | 4 |

**Example:** `=BYCOL(A1:C3,LAMBDA(column,MAX(column)))`

**Result:**

|  |  |  |
| --- | --- | --- |
| 4 | 5 | 7 |

### Returns the name of the sales representative with average sales greater than or equal to 30

**Example data:**

| 1 | Ally | Brian | Lily |
| --- | --- | --- | --- |
| **2** | **2019** | 20 | 10 | 20 |
| **3** | **2020** | 50 | 15 | 30 |
| **4** | **2021** | 30 | 30 | 15 |

**Example:** `=FILTER(B1:D1,BYCOL(B2:D4,LAMBDA(col,AVERAGE(col)>=30)))`

**Result:**

|  |
| --- |
| Ally |

### Returns a 1x3 array with the difference between max and min value of each column using a Named function as LAMBDA

[Make a Copy](https://docs.google.com/spreadsheets/d/11kjSeVlHhXtZOzpI8-JwNxYIEQcbjwS3DVFbwA1RLi8/copy#gid=0)

**Example data:**

|  | **A** | **B** | **C** |
| --- | --- | --- | --- |
| **1** | 3 | 5 | 7 |
| **2** | 4 | 3 | 5 |
| **3** | 1 | 2 | 4 |

**Example:** `=BYCOL(A1:C3,MAX_MIN_DIFF)`

**Named function:** `MAX_MIN_DIFF` is a `named function` which outputs the difference between the maximum value and the minimum value.

**Formula definition:** `=MAX(col)-MIN(col)`, where `col` is an argument placeholder defined for `MAX_MIN_DIFF`.

**Result:**

|  |  |  |
| --- | --- | --- |
| 3 | 3 | 3 |

### Common Errors

The passed LAMBDA doesn’t have exactly 1 name argument

If the passed `LAMBDA` doesn’t have exactly 1 `name` argument, and 1 `formula expression` as an argument, this error occurs:

“Wrong number of arguments to LAMBDA. Expected 1 argument, but got 2 arguments.”

**Example:**`=BYCOL(C1:C4,LAMBDA(a,b,a+b))`

In this example, LAMBDA was given 2 `name` arguments when it only needs 1.

The last parameter of BYCOL wasn’t a LAMBDA

If the last parameter of `BYCOL` wasn’t a `LAMBDA`, this error occurs:

“Argument must be a LAMBDA.”

**Example:** `=BYCOL(C1:C4,4)`

The LAMBDA passed to BYCOL was incorrect

If 1 or more `name` arguments weren’t valid, this error occurs:

“Argument 1 of function LAMBDA is not a valid name.”

**Example:** `=BYCOL(C1:C4,LAMBDA(C1,C1+1))`

In this example, `C1` is an invalid `name` since it clashes with a range.

The application of LAMBDA on the input array doesn’t group each column to a single value

If the application of `LAMBDA` on the input array doesn’t group each column to a single value, this error occurs:

“Single value expected. Nested array results are not supported.”

**Example:** `=BYCOL(C1:C3,LAMBDA(col,col))`

### Related functions

- [[LAMBDA]]: This function lets you create and return a custom function with a set of `names` and a `formula_expression` that uses them.
- [[MAP]]: This function maps each value in the given arrays to a new value.
- [[REDUCE]]: This function reduces an array to an accumulated result.
- [[BYROW]]: This function groups an array by rows.
- [[SCAN]]: This function scans an array and produces intermediate values.
- [[MAKEARRAY]]: This function creates a calculated array of specified dimensions.
- [Create & use named functions](https://support.google.com/docs/answer/12504534): This function lets you create and store custom functions, similar to `LAMBDA`.