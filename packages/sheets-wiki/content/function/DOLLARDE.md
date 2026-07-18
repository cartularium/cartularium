---
name: DOLLARDE
category: financial
syntax: DOLLARDE(fractional_price, unit)
status: imported
description: Converts a price quotation given as a decimal fraction into a decimal value.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093167?hl=en).

Converts a price quotation given as a decimal fraction into a decimal value.

### Sample Usage

```gse
DOLLARDE(100.10,32)
DOLLARDE(A2,8)
```

### Syntax

```gse
DOLLARDE(fractional_price, unit)
```

- `fractional_price` - The price quotation given using fractional decimal conventions.
- `unit` - The units of the fraction, e.g. `8` for 1/8ths or `32` for 1/32nds.

### Notes

- `DOLLARDE` is used to convert from prices specified on certain securities exchanges with minimal increments (e.g. 1/8 or 1/32) into decimal format. These prices may be transmitted on electronic exchanges as 100.01 for 100 1/8 or 100 1/32 depending on the system and minimal increment. `DOLLARDE(100.01,8)` results in `100.125` whereas `DOLLARDE(100.01,32)` results in `100.03125`.

### See Also

[[DOLLARFR]]: Converts a price quotation given as a decimal value into a decimal fraction.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEtLemhvYlZYSkF5QTVueHRWQ05NWHc&amp;output=html" width="500"></iframe>