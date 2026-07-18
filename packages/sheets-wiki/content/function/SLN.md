---
name: SLN
category: financial
syntax: SLN(cost, salvage, life)
status: imported
description: The SLN function calculates the depreciation of an asset for one period using the straight-line method.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093245?hl=en).

The SLN function calculates the depreciation of an asset for one period using the straight-line method.

### Sample Usage

```gse
SLN(100,50,10)
SLN(A2,A3,A4)
```

### Syntax

```gse
SLN(cost, salvage, life)
```

- `cost` - The initial cost of the asset.
- `salvage` - The value of the asset at the end of depreciation.
- `life` - The number of periods over which the asset is depreciated.

### See Also

[[SYD]]: The SYD function calculates the depreciation of an asset for a specified period using the sum of years digits method.

[[DDB]]: The DDB function calculates the depreciation of an asset for a specified period using the double-declining balance method.

[[DB]]: The DB function calculates the depreciation of an asset for a specified period using the arithmetic declining balance method.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdG1OR0ZWbDdyaEdhelV5SmpBdm5yd1E&amp;output=html" width="500"></iframe>