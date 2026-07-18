---
name: DEC2BIN
category: engineering
syntax: DEC2BIN(decimal_number, [significant_digits])
status: imported
description: The DEC2BIN function converts a decimal number to signed binary format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3092997?hl=en).

The DEC2BIN function converts a decimal number to signed binary format.

### Sample Usage

```gse
DEC2BIN("100",8)
DEC2BIN(A2)
```

### Syntax

```gse
DEC2BIN(decimal_number, [significant_digits])
```

- `decimal_number` - The decimal value to be converted to signed binary, provided as a string.

  + For this function, this value has a maximum of 511 if positive, and a minimum of -512 if negative.
  + If `decimal_number` is provided as a valid decimal number, it will automatically be converted to the appropriate string input. For example, `DEC2BIN(199)` and `DEC2BIN("199")` yield the same result: `11000111`.
- `significant_digits` - **[** OPTIONAL **]** The number of significant digits to ensure in the result.

  + If this is greater than the number of significant digits in the result, the result is left-padded with zeros until the total number of digits reaches `significant_digits`.
  + This value is ignored if `decimal_number` is negative.

### Notes

- If the number of digits required is greater than the specified `significant_digits`, the `#NUM!` error is returned.
- Ensure that any calculations using the result of DEC2BIN take into account that it is in binary. Results will be silently converted by Google Sheets; thus if cell `A2` contains `11111`, the binary equivalent of the decimal value `31`, and `B2` contains a formula such as `=A2+9`, the result will be `11120`, which is incorrect in binary calculation.

### See Also

[[OCT2HEX]]: The OCT2HEX function converts a signed octal number to signed hexadecimal format.

[[OCT2DEC]]: The OCT2DEC function converts a signed octal number to decimal format.

[[OCT2BIN]]: The OCT2BIN function converts a signed octal number to signed binary format.

[[HEX2OCT]]: The HEX2OCT function converts a signed hexadecimal number to signed octal format.

[[HEX2DEC]]: The HEX2DEC function converts a signed hexadecimal number to decimal format.

[[HEX2BIN]]: The HEX2BIN function converts a signed hexadecimal number to signed binary format.

[[DEC2OCT]]: The DEC2OCT function converts a decimal number to signed octal format.

[[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.

[[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

[[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.

### Examples

Converts a decimal number to its binary value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEZlR1Z5eVF6aDVCNlVubHQ0Y1lEc3c&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>