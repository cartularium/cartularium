---
name: DOLLAR
category: text
syntax: DOLLAR(number, [number_of_places])
status: imported
description: Formats a number into the locale-specific currency format.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094071?hl=en).

Formats a number into the locale-specific currency format.

### Sample Usage

```gse
DOLLAR(1.2351,4)
DOLLAR(2.35)
```

### Syntax

```gse
DOLLAR(number, [number_of_places])
```

- `number` - The value to be formatted.
- `number_of_places` - **[** OPTIONAL - `2` by default **]** - The number of decimal places to display.

### Notes

- The currency format used by `DOLLAR` is specific to your spreadsheet locale.
- `DOLLAR` differs from the related function `TO_DOLLARS` in that `DOLLAR` outputs text rather than applying a cell format to a number.

### See Also

[[TO_DOLLARS]]: Converts a provided number to a dollar value.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDJqU25UeTZ3aHpvNW5yYVFNVUpkc3c&amp;output=html" width="500"></iframe>