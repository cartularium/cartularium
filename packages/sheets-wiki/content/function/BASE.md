---
name: BASE
category: math
syntax: BASE(value, base, [min_length])
status: imported
description: The BASE function converts a decimal number into a text representation in another base.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9084167?hl=en).

The BASE function converts a decimal number into a text representation in another base. For example, base 2 for binary.

### Syntax
```gse
BASE(value, base, [min_length])
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The number to convert into base. | * The value should be an integer greater than or equal to zero. |
| `base` | The base (or radix) to convert the value number into. | * The base should be an integer from 2 to 36. |
| `min_length` | **(Optional)** The minimum length of the text returned. | * If the minimum length value is greater than the number of significant digits in the result, the result is left-padded with zeroes until the total number of digits reaches significant\_digits. |

### Sample formulas

```gse
BASE(255, 16)
BASE(A2, 2)
BASE(4095, 16, 6)
```

### Notes

- Non-integer numeric argument values are truncated to an integer.
- Make sure that any calculations using the result of the BASE function take into account that it may be in a non-decimal base. Results are silently converted by Google Sheets. For example, if cell A2 contains 1111 (the binary equivalent of the decimal value 31), and B2 contains a formula such as "=A2+9," the result will be 11120, which is incorrect in binary calculation.

### Examples

This example converts the decimal number 255 to base 16 (hexadecimal):

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =BASE(255, 16) | FF |

This example converts the number in cell A2 (decimal value 21) to the base given in cell B2 (binary):

| A | B | C | D |
| --- | --- | --- | --- |
| **1** | **Number** | **Base** | **Formula** | **Result** |
| **2** | 21 | 2 | =BASE(A2, B2) | 10101 |

This example converts the decimal number 4095 to base 16 (hexadecimal) with a minimum length of 6 characters:

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =BASE(4095, 16, 6) | 000FFF |

### Related functions

- DECIMAL: The DECIMAL function converts the text representation of a number in another base, to base 10 (decimal).
- [[BIN2DEC]]:  The BIN2DEC function converts a signed binary number to decimal format.
- [[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.
- [[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.
- [[OCT2BIN]]: The OCT2BIN function converts a signed octal number to signed binary format.
- [[OCT2DEC]]: The OCT2DEC function converts a signed octal number to decimal format.
- [[OCT2HEX]]: The OCT2HEX function converts a signed octal number to signed hexadecimal format.
- [[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.
- [[DEC2OCT]]: The DEC2OCT function converts a decimal number to signed octal format.
- [[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.
- [[HEX2BIN]]: The HEX2BIN function converts a signed hexadecimal number to signed binary format.
- [[HEX2DEC]]: The HEX2DEC function converts a signed hexadecimal number to decimal format.
- [[HEX2OCT]]: The HEX2OCT function converts a signed hexadecimal number to signed octal format.