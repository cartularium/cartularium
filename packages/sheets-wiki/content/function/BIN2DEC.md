---
name: BIN2DEC
category: engineering
syntax: BIN2DEC(signed_binary_number)
status: imported
description: The BIN2DEC function converts a signed binary number to decimal format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3092991?hl=en).

The BIN2DEC function converts a signed binary number to decimal format.

### Sample Usage

```gse
BIN2DEC(101)
BIN2DEC(A2)
```

### Syntax

```gse
BIN2DEC(signed_binary_number)
```

- `signed_binary_number` - The signed 10-bit binary value to be converted to decimal, provided as a string.

  + The most significant bit of `signed_binary_number` is the sign bit; that is, negative numbers are represented in two's complement format.
  + For this function, the input value has a maximum of 0111111111 if positive, and a minimum of 1000000000 if negative.
  + If `signed_binary_number` is provided as a valid binary number, it will automatically be converted to the appropriate string input. For example, `BIN2DEC(100)` and `BIN2DEC("100")` yield the same result: 4.

### Notes

- As with any binary value, only the digits `0` and `1` are valid. Digits other than these will cause `BIN2DEC` to return a `#NUM!` error.

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

[[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

### Examples

Converts a binary number to its decimal value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEc4NXpZNm5SeFA2RVZMMlNZNlBjWFE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>