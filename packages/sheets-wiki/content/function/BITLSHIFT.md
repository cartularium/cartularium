---
name: BITLSHIFT
category: engineering
syntax: BITLSHIFT(value,shift_amount)
status: imported
description: The BITLSHIFT function shifts the bits of the input a certain number of places to the left.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9061443?hl=en).

The BITLSHIFT function shifts the bits of the input a certain number of places to the left. Bits on the right are filled with zeroes (0s).

### Syntax
```gse
BITLSHIFT(value,shift_amount)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The number to be shifted. | Must be a non-negative number. |
| `shift_amount` | The number of places to shift. | Must be a value between -53 and 53, inclusive. Supplying a negative value will effectively be a BITRSHIFT. |

### Sample formulas

`BITLSHIFT(9, 2)  
BITLSHIFT(A2, 4)`

### Notes

- Values don't necessarily have to be numbers.
- Values may be coerced. For example, a string value of “3” can be coerced to be simply 3 and a boolean value of TRUE can be coerced to 1.

### Examples

In this example, we use BITLSHIFT with values inlined into the function. The value 2 (represented as 10 in base 2) has its bits shifted left by the shift\_amount of 2, resulting in 8 (represented as 1000 in base 2).

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=BITLSHIFT(2,2)` | 8 |

Similar to the last example, a value of 2 being shifted by 2 results in a BITLSHIFT of 8. However, in this example, we use cell references to grab our values.

| A | B | C |
| --- | --- | --- |
| **1** | **Formula** | **Result** | **Reference cells** |
| **2** | `=BITLSHIFT(C2,C3)` | 8 | 2 |

### Related functions

BITRSHIFT: The BITRSHIFT function shifts the bits of the input a certain number of places to the right. Bits on the left are filled with zeroes (0s).