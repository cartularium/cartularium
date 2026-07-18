---
name: DEC2HEX
category: engineering
syntax: DEC2HEX(decimal_number, [significant_digits])
status: imported
description: The DEC2HEX function converts a decimal number to signed hexadecimal format.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093137?hl=en).

The DEC2HEX function converts a decimal number to signed hexadecimal format.

### Sample Usage

```gse
DEC2HEX(100,8)
DEC2HEX(A2)
```

### Syntax

```gse
DEC2HEX(decimal_number, [significant_digits])
```

- `decimal_number` - The decimal value to be converted to signed hexadecimal, provided as a string.

  + For this function, this value has a maximum of 549755813887 if positive, and a minimum of -549755813888 if negative.
  + If `decimal_number` is provided as a valid decimal number, it will automatically be converted to the appropriate string input. For example, `DEC2HEX(100)` and `DEC2HEX("100")` yield the same result: `64`.
- `significant_digits` - **[** OPTIONAL **]** - The number of significant digits to ensure in the result.

  + If this is greater than the number of significant digits in the result, the result is left-padded with zeros until the total number of digits reaches `significant_digits`.
  + This value is ignored if `decimal_number` is negative.

### Notes

- If the number of digits required is greater than the specified `significant_digits`, the `#NUM!` error is returned.

- Ensure that any calculations using the result of `DEC2HEX` take into account that it is in hexadecimal. Results will be silently converted by Google Sheets; thus if cell `A2` contains `100`, the hexadecimal equivalent of the decimal value `256`, and `B2` contains a formula such as `=A2+20`, the result will be `120`, which is incorrect in hexadecimal calculation.

### Engine compatibility

The signed two's-complement convention is portable across every tracked engine: the operand is a fixed 10-digit hexadecimal field, the most significant bit is the sign bit, and the domain is `-2^39` to `2^39 - 1` (`-549755813888` to `549755813887`). `DEC2HEX(255)` = "FF" and `DEC2HEX(-1)` = "FFFFFFFFFF" agree across Excel, Google Sheets, HyperFormula, IronCalc, `formulas`, and Lattice (assay: BASE-CONVERSIONS deep dive, 2026-07-11). The only fork is pycel, which implements only the non-negative domain and returns `#NAME?` for a negative first argument — the reverse conversion [[HEX2DEC]] on a two's-complement string works there.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Full two's-complement support, `-2^39` to `2^39 - 1`. |
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

[[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.

[[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

[[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.

### Examples

Converts a decimal number to its hexadecimal value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdENkdXpwbDFkaVZhcXBhVzVNZU5EeHc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>