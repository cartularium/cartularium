---
name: BITXOR
category: engineering
syntax: BITXOR(value1, value2)
status: imported
description: The BITXOR function is a bitwise XOR (exclusive or) of 2 numbers that returns a bit of “1” if 2 bits are different, and a bit of “0” otherwise.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9083935?hl=en).

The BITXOR function is a bitwise XOR (exclusive or) of 2 numbers that returns a bit of “1” if 2 bits are different, and a bit of “0” otherwise. This function returns a number that's the result of performing an XOR function at each bit of the 2 given numbers.

### Syntax
```gse
BITXOR(value1, value2)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value1` | The first numeric value. |  |
| `value2` | The second numeric value. |  |

### Sample formulas

```gse
BITXOR(9, 5)
BITXOR(A1, A2)
```

### Notes

- Order doesn't matter for values. The result is the same regardless.
- Values don't necessarily have to be numbers. Instead, they may be coerced. For example, a string value of "3" can be coerced to be simply 3, and a Boolean value of TRUE can be coerced to 1.

### Examples

In the following example, we use BITXOR with values inlined into the function. The values 2 (represented as 10 in base 2) and 4 (represented as 100 in base 2) result in 6 (represented as 110 in base 2):

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =BITXOR(2, 4) | 6 |

In this example, values of 2 and 4 result in a BITXOR of 6. However, this time we use cell references to use as our values:

| A | B | C |
| --- | --- | --- |
| **1** | **Formula** | **Result** | **Reference cells** |
| **2** | =BITXOR(2, 4) | 6 | 2 |
| **3** |  |  | 4 |

### Related functions

- [[BITOR]]: The BITOR function returns the bitwise Boolean OR of 2 numbers.
- XOR: The XOR function returns TRUE if an odd number of the provided arguments are logically true, and FALSE otherwise.