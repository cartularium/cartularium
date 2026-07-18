---
name: DECIMAL
category: math
syntax: DECIMAL(value, base)
status: imported
description: The DECIMAL function converts the text representation of a number in another base, to base 10 (decimal).
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116090?hl=en).

The DECIMAL function converts the text representation of a number in another base, to base 10 (decimal).

### Syntax
```gse
DECIMAL(value, base)
```

| Part | Description | Notes |
| --- | --- | --- |
| `value` | The unsigned value to be converted to decimal, provided as a string. |  |
| `base` | The base (or radix) to convert the number into. | The base is an integer from 2 to 36. |

### Sample formula

```gse
DECIMAL(101,2)
```

### Notes

- The string representation of the value is used, which should only contain numeric characters (i.e. scientific notation isn't permitted). The text of a string should be no longer than 255 characters.
- The DECIMAL function only converts to positive integers.

### Example

| Description            | Formula            | Result |
|------------------------|--------------------|--------|
| Binary (Base 2)        | =DECIMAL(101,2)    | 5      |
| Binary (Base 2)        | =DECIMAL("1111",2) | 15     |
| Octal (Base 8)         | =DECIMAL(77,8)     | 63     |
| Hexadecimal (Base 16)  | =DECIMAL("FF",16)  | 255    |
| Hexadecimal (Base 16)  | =DECIMAL("1A",16)  | 26     |
| Base 36 (Alphanumeric) | =DECIMAL("Z",36)   | 35     |

### Related functions

- [[BASE]]: The BASE function converts a decimal number into a text representation in another base.
- [[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.
- [[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.
- [[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.
- [[OCT2BIN]]: The OCT2BIN function converts a signed octal number to signed binary format.
- [[OCT2DEC]]: The OCT2DEC function converts a signed octal number to decimal format.
- [[OCT2HEX]]: The OCT2HEX function converts a signed octal number to signed hexadecimal format.
- [[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.
- [[DEC2OCT]]: The DEC2OCT function converts a decimal number to signed octal format.
- [[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.
- [[HEX2DEC]]: The HEX2DEC function converts a signed hexadecimal number to decimal format.
- [[HEX2BIN]]: The HEX2BIN function converts a signed hexadecimal number to signed binary format.
- [[HEX2OCT]]: The HEX2OCT function converts a signed hexadecimal number to signed octal format.
