---
name: SYD
category: financial
syntax: SYD(cost, salvage, life, period)
status: imported
description: The SYD function calculates the depreciation of an asset for a specified period using the sum of years digits method.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093261?hl=en).

The SYD function calculates the depreciation of an asset for a specified period using the sum of years digits method.

### Sample Usage

```gse
SYD(100,50,10,2)
SYD(A2,A3,A4,A5)
```

### Syntax

```gse
SYD(cost, salvage, life, period)
```

- `cost` - The initial cost of the asset.
- `salvage` - The value of the asset at the end of depreciation.
- `life` - The number of periods over which the asset is depreciated.
- `period` - The single period within `life` for which to calculate depreciation.

### Notes

- `life` and `period` must be measured in the same units.

### See Also

[[SLN]]: The SLN function calculates the depreciation of an asset for one period using the straight-line method.

[[DDB]]: The DDB function calculates the depreciation of an asset for a specified period using the double-declining balance method.

[[DB]]: The DB function calculates the depreciation of an asset for a specified period using the arithmetic declining balance method.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDViaFQ2V3pwWXlpdWlkYXV6LVBVMWc&amp;output=html" width="500"></iframe>