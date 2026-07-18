---
name: BIN2OCT
category: engineering
syntax: BIN2OCT(signed_binary_number, [significant_digits])
status: imported
description: The BIN2OCT function converts a signed binary number to signed octal format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3092993?hl=en).

The BIN2OCT function converts a signed binary number to signed octal format.

### Sample Usage

```gse
BIN2OCT(101,8)
BIN2OCT(A2)
```

### Syntax

```gse
BIN2OCT(signed_binary_number, [significant_digits])
```

- `signed_binary_number` - The signed 10-bit binary value to be converted to signed octal, provided as a string.

  + The most significant bit of `signed_binary_number` is the sign bit; that is, negative numbers are represented in two's complement format.
  + For this function, this value has a maximum of 0111111111 if positive, and a minimum of 1000000000 if negative.
  + If `signed_binary_number` is provided as a valid binary number, it will automatically be converted to the appropriate string input. For example, `BIN2OCT(11111)` and `BIN2OCT("11111")` yield the same result: `37`.
- `significant_digits` - **[** OPTIONAL **]** - The number of significant digits to ensure in the result.

  + If this is greater than the number of significant digits in the result, the result is left-padded with zeros until the total number of digits reaches `significant_digits`. For example, `BIN2OCT("11111")` yields the value `00000037`.
  + This value is ignored if the most significant bit of `signed_binary_number` is `1`; that is, if the expressed `signed_binary_number` is greater than or equal to 1000000000.

### Notes

- As with any binary value, only the digits `0` and `1` are valid. Digits other than these will cause `BIN2OCT` to return a `#NUM!` error.
- If the number of digits required is greater than the specified `significant_digits`, the `#NUM!` error is returned.
- Ensure that any calculations using the result of BIN2OCT take into account that it is in octal. Results will be silently converted by Google Sheets; thus if cell `A2` contains `111`, the octal equivalent of binary `1001001`, and `B2` contains a formula such as `=A2+9`, the result will be `120`, which is incorrect in octal calculation.

### See Also

[[OCT2HEX]]: The OCT2HEX function converts a signed octal number to signed hexadecimal format.

[[OCT2DEC]]: The OCT2DEC function converts a signed octal number to decimal format.

[[OCT2BIN]]: The OCT2BIN function converts a signed octal number to signed binary format.

[[HEX2OCT]]: The HEX2OCT function converts a signed hexadecimal number to signed octal format.

[[HEX2DEC]]: The HEX2DEC function converts a signed hexadecimal number to decimal format.

[[HEX2BIN]]: The HEX2BIN function converts a signed hexadecimal number to signed binary format.

[[DEC2OCT]]: The DEC2OCT function converts a decimal number to signed octal format.

[[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.

[[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

[[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.

### Examples

Converts a binary number to its octal value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEFVbWlFOHVqWFg0SWQzYWtRUVBrU1E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>