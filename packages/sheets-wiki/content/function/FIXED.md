---
name: FIXED
category: text
syntax: FIXED(number, [number_of_places], [suppress_separator])
status: imported
description: Formats a number with a fixed number of decimal places.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094075?hl=en).

Formats a number with a fixed number of decimal places.

### Sample Usage

```gse
FIXED(3.141592653,2)
FIXED(966364281,4,1)
```

### Syntax

```gse
FIXED(number, [number_of_places], [suppress_separator])
```

- `number` - The number to format.
- `number_of_places` - **[** OPTIONAL **]**- The number of decimal places to display in the result.

  + If `number` has fewer than `number_of_places` significant digits, zeros will be appended. If it has greater than `number_of_places` significant digits, `number` will be rounded to the correct `number_of_places` rather than truncated.
- `suppress_separator` - **[** OPTIONAL - `0` by default **]** - Whether or not to suppress the thousands separator used in some locales (e.g. `1,000` becomes `1000`). Separators will be present if this value is 0 or omitted, and absent otherwise.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDFDOWpRenlGRFlyS2owZjZOQ3hvNlE&amp;output=html" width="500"></iframe>