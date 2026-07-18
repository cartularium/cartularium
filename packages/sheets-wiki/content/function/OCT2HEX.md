---
name: OCT2HEX
category: engineering
syntax: OCT2HEX(signed_octal_number, [significant_digits])
status: imported
description: The OCT2HEX function converts a signed octal number to signed hexadecimal format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093147?hl=en).

The OCT2HEX function converts a signed octal number to signed hexadecimal format.

### Sample Usage

```gse
OCT2HEX(37,8)
OCT2HEX(A2)
```

### Syntax

```gse
OCT2HEX(signed_octal_number, [significant_digits])
```

- `signed_octal_number` - The signed 30-bit octal value to be converted to signed hexadecimal, provided as a string.

  + The most significant bit of `signed_octal_number` is the sign bit; that is, negative numbers are represented in two's complement format.
  + For this function, this value has a maximum of 3777777777 if positive, and a minimum of 4000000000 if negative.
  + If `signed_octal_number` is provided as a valid octal number, it will automatically be converted to the appropriate string input. For example, `OCT2HEX(177)` and `OCT2HEX("177")` yield the same result: `7F`.
- `significant_digits` - **[** OPTIONAL **]** - The number of significant digits to ensure in the result.

  + If this is greater than the number of significant digits in the result, the result is left-padded with zeros until the total number of digits reaches `significant_digits`.
  + This value is ignored if the most significant bit of `signed_octal_number` is `1`; that is, if the expressed `signed_octal_number` is greater than or equal to 4000000000.

### Notes

- As with any octal value, only the digits 0-7 are valid. Digits outside of this will cause `OCT2HEX` to return a `#NUM!` error.
- If the number of digits required is greater than the specified `significant_digits`, the `#NUM!` error is returned.

### See Also

[[OCT2DEC]]: The OCT2DEC function converts a signed octal number to decimal format.

[[OCT2BIN]]: The OCT2BIN function converts a signed octal number to signed binary format.

[[HEX2OCT]]: The HEX2OCT function converts a signed hexadecimal number to signed octal format.

[[HEX2DEC]]: The HEX2DEC function converts a signed hexadecimal number to decimal format.

[[HEX2BIN]]: The HEX2BIN function converts a signed hexadecimal number to signed binary format.

[[DEC2OCT]]: The DEC2OCT function converts a decimal number to signed octal format.

[[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.

[[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.

[[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

[[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.

### Examples

Converts an octal number to its hexadecimal value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdExkd2lMSTlsdDYxbTQzVHF1ZlFMNmc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>