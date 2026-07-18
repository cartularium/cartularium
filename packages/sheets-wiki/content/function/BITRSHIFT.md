---
name: BITRSHIFT
category: engineering
syntax: BITRSHIFT(value, shift_amount)
status: imported
description: The BITRSHIFT function shifts the bits of the input a certain number of places to the right.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9084100?hl=en).

The BITRSHIFT function shifts the bits of the input a certain number of places to the right. Bits on the left are filled with zeroes.

### Syntax
```gse
BITRSHIFT(value, shift_amount)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The number to be shifted. | * The given value must be a non-negative number. |
| `shift_amount` | The number of places to shift the given value. | * The given number must be a number from -52 to 53. * Entering a negative value is effectively a BITLSHIFT function. |

### Sample formulas

```gse
BITRSHIFT(18, 2)
BITRSHIFT(A2, 4)
```

### Notes

Values don't necessarily have to be numbers. Instead, they may be coerced. For example, a string value of "3" can be coerced to be simply 3, and a Boolean value of TRUE can be coerced to 1.

### Examples

In the following example, we use BITRSHIFT with values inlined into the function. The value 8 (represented as 1000 in base 2) has its bits shifted right by the shift amount of 2, resulting in 2 (represented as 10 in base 2):

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =BITRSHIFT(8, 2) | 2 |

In the next example, a value of 8 being shifted by 2 results in a BITRSHIFT of 2. However, this time we use cell references to use as our values:

| A | B | C |
| --- | --- | --- |
| **1** | **Formula** | **Result** | **Reference cells** |
| **2** | =BITRSHIFT(C2, C3) | 2 | 8 |
| **3** |  |  | 2 |

### Related function

[[BITLSHIFT]]: The BITLSHIFT function shifts the bits of the input a certain number of places to the left. Bits on the right are filled with zeroes (0s).