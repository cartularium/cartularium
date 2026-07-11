---
name: DEC2OCT
category: engineering
syntax: DEC2OCT(decimal_number, [significant_digits])
status: imported
description: The DEC2OCT function converts a decimal number to signed octal format.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093138?hl=en).

The DEC2OCT function converts a decimal number to signed octal format.

### Sample Usage

```gse
DEC2OCT("100",8)
DEC2OCT(A2)
```

### Syntax

```gse
DEC2OCT(decimal_number, [significant_digits])
```

- `decimal_number` - The decimal value to be converted to signed octal, provided as a string.

  + For this function, this value has a maximum of 536870911 if positive, and a minimum of -53687092 if negative.
  + If `decimal_number` is provided as a valid decimal number, it will automatically be converted to the appropriate string input. For example, `DEC2OCT(199)` and `DEC2OCT("199")` yield the same result: `307`.
- `significant_digits` - **[** OPTIONAL **]** The number of significant digits to ensure in the result.

  + If this is greater than the number of significant digits in the result, the result is left-padded with zeros until the total number of digits reaches `significant_digits`.
  + This value is ignored if `decimal_number` is negative.

### Notes

- If the number of digits required is greater than the specified `significant_digits`, the `#NUM!` error is returned.
- Ensure that any calculations using the result of DEC2OCT take into account that it is in octal. Results will be silently converted by Google Sheets; thus if cell `A2` contains `111`, the octal equivalent of the decimal value `73`, and `B2` contains a formula such as `=A2+9`, the result will be `120`, which is incorrect in octal calculation.

### Engine compatibility

The signed two's-complement convention is portable across every tracked engine: the operand is a fixed 10-digit octal field, the most significant bit is the sign bit, and the domain runs to `2^39 - 1` positive and `-2^39` negative. `DEC2OCT(8)` = "10" and `DEC2OCT(-1)` = "7777777777" agree across Excel, Google Sheets, HyperFormula, IronCalc, `formulas`, and Lattice (assay: BASE-CONVERSIONS deep dive, 2026-07-11). The only fork is pycel, which implements only the non-negative domain and returns `#NAME?` for a negative first argument — the reverse conversion [[OCT2DEC]] on a two's-complement string works there.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Full two's-complement support. |
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

[[DEC2HEX]]: The DEC2HEX function converts a decimal number to signed hexadecimal format.

[[DEC2BIN]]: The DEC2BIN function converts a decimal number to signed binary format.

[[BIN2OCT]]: The BIN2OCT function converts a signed binary number to signed octal format.

[[BIN2HEX]]: The BIN2HEX function converts a signed binary number to signed hexadecimal format.

[[BIN2DEC]]: The BIN2DEC function converts a signed binary number to decimal format.

### Examples

Converts a decimal number to its octal value.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDlsbzNPNE91SGlvbFd3QU10QkRUOWc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>