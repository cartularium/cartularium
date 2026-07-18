---
name: DEC2BIN
category: engineering
syntax: DEC2BIN(decimal_number, [significant_digits])
status: imported
description: The DEC2BIN function converts a decimal number to signed binary format.
tags:
  - modified
  - undocumented
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

### Engine compatibility

The signed two's-complement convention is portable across every tracked engine: the operand is a fixed 10-digit binary field, the most significant bit is the sign bit, and the domain is `-512` to `511`. `DEC2BIN("1010")` = 10 and `DEC2BIN(-2)` = "1111111110" agree across Excel, Google Sheets, HyperFormula, IronCalc, `formulas`, and Lattice (assay: BASE-CONVERSIONS deep dive, 2026-07-11). The only fork is pycel, which implements only the non-negative domain and returns `#NAME?` for a negative first argument — the reverse conversion [[BIN2DEC]] on a two's-complement string works there. The `significant_digits` padding argument is portable for non-negative results.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Full two's-complement support, `-512` to `511`. |
| Excel | Same values and range. |
| HyperFormula | Supported, including negative two's-complement results (live probe, 2026-07-11). |
| IronCalc | Supported, including negatives (live probe, 2026-07-11). |
| formulas | Supported, including negatives (live probe, 2026-07-11). |
| pycel | Non-negative arguments only; a negative `decimal_number` returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported, including negatives. |

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