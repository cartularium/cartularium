---
name: DOLLARFR
category: financial
syntax: DOLLARFR(decimal_price, unit)
status: imported
description: Converts a price quotation given as a decimal value into a decimal fraction.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093217?hl=en).

Converts a price quotation given as a decimal value into a decimal fraction.

### Sample Usage

```gse
DOLLARFR(100.125,32)
DOLLARFR(A2,8)
```

### Syntax

```gse
DOLLARFR(decimal_price, unit)
```

- `decimal_price` - The price quotation given as a decimal value..
- `unit` - The units of the desired fraction, e.g. `8` for 1/8ths or `32` for 1/32nds.

### Notes

- `DOLLARFR` is used to convert from decimal format to prices specified on certain securities exchanges with minimal increments (e.g. 1/8 or 1/32). These prices may be transmitted on electronic exchanges as 100.01 for 100 1/8 or 100 1/32 depending on the system and minimal increment. `DOLLARFR(100.125,8)` results in `100.01` whereas `DOLLARDE(100.03125,32)` also results in `100.01`.

### See Also

[[DOLLARDE]]: Converts a price quotation given as a decimal fraction into a decimal value.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFVPVmYxWmEyZy1BNVpnU0d1VGY0VlE&amp;output=html" width="500"></iframe>