---
name: XOR
category: logical
syntax: XOR(logical_expression1, [logical_expression2, ...])
status: imported
description: The XOR function returns TRUE if an odd number of the provided arguments are logically true, and FALSE otherwise.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116491?hl=en).

The XOR function returns TRUE if an odd number of the provided arguments are logically true, and FALSE otherwise.

### Syntax
```gse
XOR(logical_expression1, [logical_expression2, ...])
```

| Part | Description | Notes |
| --- | --- | --- |
| `logical_expression1` | An expression or reference to a cell containing an expression that represents some logical value, e.g. "TRUE" or "FALSE," or an expression that can be coerced to a logical value. |  |
| `logical_expression2` | More expressions or cell references that represent logical values. | A second logical expression, and any additional expressions are optional. |

### Sample formulas

```gse
XOR(TRUE, FALSE, TRUE)
XOR(A2=TRUE, A3=FALSE)
XOR(A1:A10, B1:B10)
XOR(0, 1, 2, 3)
```

### Notes

- The number 0 is logically false. All other numbers (including negative numbers) are logically true.
- The XOR function accepts both logical value and range parameters.
- Returns TRUE if an odd number of arguments are TRUE.

### Examples

| A | B |
| --- | --- |
| **1** | **Result** | **Formula** |
| **2** | TRUE | =XOR(TRUE()) |
| **3** | FALSE | =XOR(FALSE()) |
| **4** | FALSE | =XOR(0) |
| **5** | TRUE | =XOR(1) |
| **6** | TRUE | =XOR(-3) |

| A | B | C | D |
| --- | --- | --- | --- |
| **9** | **logical\_expression1** | **logical\_expression2** | **Result** | **Formula** |
| **10** | TRUE | FALSE | TRUE | =XOR(A10,B10) |
| **11** | FALSE | FALSE | FALSE | =XOR(A11,B11) |
| **12** | TRUE | TRUE | FALSE | =XOR(A12,B12) |
| **13** | 0 | 1 | TRUE | =XOR(A13,B13) |
| **14** | 1 | 5 | FALSE | =XOR(A14,B14) |

| A | B |
| --- | --- |
| **17** | **Result** | **Formula** |
| **18** | FALSE | =XOR(A12,B13) |
| **19** | FALSE | =XOR(B11,B12,B13) |
| **20** | TRUE | =XOR(B11,B14) |

### Related functions

- [[OR]]: The OR function returns true if any of the provided arguments are logically true, and false if all of the provided arguments are logically false.
- [[AND]]: The AND function returns true if all of the provided arguments are logically true, and false if any of the provided arguments are logically false.