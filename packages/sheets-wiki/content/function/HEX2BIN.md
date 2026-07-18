---
name: HEX2BIN
category: engineering
syntax: HEX2BIN(signed_hexadecimal_number, [significant_digits])
status: imported
description: The HEX2BIN function converts a signed hexadecimal number to signed binary format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093139?hl=en).

The HEX2BIN function converts a signed hexadecimal number to signed binary format.

### Sample Usage

```gse
HEX2BIN("f3",8)
HEX2BIN(A2)
```

### Syntax

```gse
HEX2BIN(signed_hexadecimal_number, [significant_digits])
```

- `signed_hexadecimal_number` - The signed 40-bit hexadecimal value to be converted to signed binary, provided as a string.

  + The most significant bit of `signed_hexadecimal_number` is the sign bit; that is, negative numbers are represented in two's complement format.
  + For this function, this value has a maximum of 1FF if positive, and a minimum of FFFFFFFE00 if negative.
  + If `signed_hexadecimal_number` is provided as a valid hexadecimal number, it will automatically be converted to the appropriate string input. For example, `HEX2BIN(199)` and `HEX2BIN("199")` yield the same result: `110011001`.
- `significant_digits` - **[** OPTIONAL **]** The number of significant digits to ensure in the result.

  + If this is greater than the number of significant digits in the result, the result is left-padded with zeros until the total number of digits reaches `significant_digits`.
  + This value is ignored if the most significant bit of `signed_hexadecimal_number` is `1`; that is, if the expressed `signed_hexadecimal_number` is greater than or equal to 8000000000.

### Notes

- As with any hexadecimal value, only the digits `0-9` and the letters `A-F` are valid. Digits other than these will cause `HEX2BIN` to return a `#NUM!` error.

  + Hexadecimal digits are not case-sensitive; `a-f` and `A-F` are equivalent.
- If the number of digits required is greater than the specified `significant_digits`, the `#NUM!` error is returned.
- Ensure that any calculations using the result of HEX2BIN take into account that it is in binary. Results will be silently converted by Google Sheets; thus if cell `A2` contains `11111`, the binary equivalent of hexadecimal `1F`, and `B2` contains a formula such as `=A2+9`, the result will be `11120`, which is incorrect in binary calculation.

### See Also

[[OCT2HEX]]: The OCT2HEX function converts a signed octal number to signed hexadecimal format.

[[OCT2DEC]]: The OCT2DEC function converts a signed octal number to decimal format.

[[OCT2BIN]]: The OCT2BIN function converts a signed octal number to signed binary format.

[[HEX2OCT]]: The HEX2OCT function converts a signed hexadecimal number to signed octal format.

[[HEX2DEC]]: The HEX2DEC function converts a signed hexadecimal number to decimal format.

[[DEC2OCT]]: The DEC2OCT function converts a decimal number to signed octal format.

[[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.

[[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.

[[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

[[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.

### Examples

Converts a hexadecimal number to its binary value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdC1HWXFMZkk1b1M0VVY2YVVqZ29RcUE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>