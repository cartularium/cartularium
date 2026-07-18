---
name: OCT2DEC
category: engineering
syntax: OCT2DEC(signed_octal_number)
status: imported
description: The OCT2DEC function converts a signed octal number to decimal format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093146?hl=en).

The OCT2DEC function converts a signed octal number to decimal format.

### Sample Usage

```gse
OCT2DEC(37)
OCT2DEC(A2)
```

### Syntax

```gse
OCT2DEC(signed_octal_number)
```

- `signed_octal_number` - The signed 30-bit octal value to be converted to decimal, provided as a string.

  + The most significant bit of `signed_octal_number` is the sign bit; that is, negative numbers are represented in two's complement format.
  + For this function, this value has a maximum of 3777777777 if positive, and a minimum of 4000000000 if negative.
  + If `signed_octal_number` is provided as a valid octal number, it will automatically be converted to the appropriate string input. For example, `OCT2DEC(177)` and `OCT2DEC("177")` yield the same result: `127`.

### Notes

- As with any octal value, only the digits 0-7 are valid. Digits outside of this will cause `OCT2DEC` to return a `#NUM!` error.

### See Also

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

Converts an octal number to its decimal value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHpwUi1nbzVFNmlLaGRVUzQ1cTJEQUE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>