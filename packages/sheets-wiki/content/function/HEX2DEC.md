---
name: HEX2DEC
category: engineering
syntax: HEX2DEC(signed_hexadecimal_number)
status: imported
description: The HEX2DEC function converts a signed hexadecimal number to decimal format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093192?hl=en).

The HEX2DEC function converts a signed hexadecimal number to decimal format.

### Sample Usage

```gse
HEX2DEC("f3")
HEX2DEC(A2)
```

### Syntax

```gse
HEX2DEC(signed_hexadecimal_number)
```

- `signed_hexadecimal_number` - The signed 40-bit hexadecimal value to be converted to decimal, provided as a string.

  + The most significant bit of `signed_hexadecimal_number` is the sign bit; that is, negative numbers are represented in two's complement format.
  + For this function, this value has a maximum of 7fffffffff if positive, and a minimum of 8000000000 if negative.
  + If `signed_hexadecimal_number` is provided as a valid hexadecimal number, it will automatically be converted to the appropriate string input. For example, `HEX2DEC(199)` and `HEX2DEC("199")` yield the same result: `409`.

### Notes

- As with any hexadecimal value, only the digits `0-9` and the letters `A-F` are valid. Digits other than these will cause `HEX2DEC` to return a `#NUM!` error.

  + Hexadecimal digits are not case-sensitive; `a-f` and `A-F` are equivalent.

### See Also

[[OCT2HEX]]: The OCT2HEX function converts a signed octal number to signed hexadecimal format.

[[OCT2DEC]]: The OCT2DEC function converts a signed octal number to decimal format.

[[OCT2BIN]]: The OCT2BIN function converts a signed octal number to signed binary format.

[[HEX2OCT]]: The HEX2OCT function converts a signed hexadecimal number to signed octal format.

[[HEX2BIN]]: The HEX2BIN function converts a signed hexadecimal number to signed binary format.

[[DEC2OCT]]: The DEC2OCT function converts a decimal number to signed octal format.

[[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.

[[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.

[[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

[[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.

### Examples

Converts a hexadecimal number to its decimal value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFRIaTl3enlLSHY3bzI1ZDBmR0tRQmc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>