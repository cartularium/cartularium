---
name: BITOR
category: engineering
syntax: BITOR(value1, value2)
status: imported
description: The BITOR function returns the bitwise Boolean OR of 2 numbers.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9083934?hl=en).

The BITOR function returns the bitwise Boolean OR of 2 numbers. The BITOR truth table is below:

|  |  |  |
| --- | --- | --- |
| A | B | BITOR(A, B) |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

### Syntax
```gse
BITOR(value1, value2)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value1` | The first number. | * The given value must be a decimal representation of the number. |
| `value2` | The second number. | * The given value must be a decimal representation of the number. |

### Sample formulas

```gse
BITOR(9, 5)
BITOR(A1, 10)
BITOR(A1, B1)
```

### Notes

It may make sense to use BITOR in conjunction with BIN2DEC as BITOR(BIN2DEC("1011"), BIN2DEC("1001")), which evaluates to "1011" in binary or 11 in decimal.

### Examples

In the following example, 9 in binary is “1001” and 5 in binary is 0101. The bitwise OR of 1001 and 0101 is 1101, which is 13 in decimal.

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =BITOR(9, 5) | 13 |

In this example, the bitwise OR of 1000 and 0001 is 1001, which is 9 in decimal:

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =BITOR(BIN2DEC("1000"), BIN2DEC("0001")) | 9 |

### Related functions

- [[BITAND]]: The BITAND function returns the bitwise boolean AND of two numbers. [Learn more.](https://support.google.com/docs/answer/9061440)
- [[BITXOR]]: The BITXOR function is a bitwise XOR (exclusive or) of 2 numbers that returns a bit of “1” if 2 bits are different, and a bit of “0” otherwise.
- [[BITLSHIFT]]: The BITLSHIFT function shifts the bits of the input a certain number of places to the left. Bits on the right are filled with zeroes (0s).
- [[BITRSHIFT]]: The BITRSHIFT function shifts the bits of the input a certain number of places to the right.
- [[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.
- [[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.