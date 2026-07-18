---
name: UNARY_PERCENT
category: operator
syntax: UNARY_PERCENT(percentage)
status: imported
description: Returns a value interpreted as a percentage; that is, `UNARY\_PERCENT(100)` equals `1`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093982?hl=en).

Returns a value interpreted as a percentage; that is, `UNARY\_PERCENT(100)` equals `1`.

### Sample Usage

```gse
UNARY_PERCENT(A2)
UNARY_PERCENT(93)
```

### Syntax

```gse
UNARY_PERCENT(percentage)
```

- `percentage` - The value to interpret as a percentage.

### Notes

- `UNARY_PERCENT` is roughly equivalent to the inverse of `TO_PERCENT`.

### See Also

[[TO_PERCENT]]: Converts a provided number to a percentage.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEtPZm5vSWlHcWRMcG5XVWxtZWFOZ3c&amp;output=html" width="500"></iframe>