---
name: DDB
category: financial
syntax: DDB(cost, salvage, life, period, [factor])
status: imported
description: The DDB function calculates the depreciation of an asset for a specified period using the double-declining balance method.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093163?hl=en).

The DDB function calculates the depreciation of an asset for a specified period using the double-declining balance method.

### Sample Usage

```gse
DDB(100,50,10,2)
DDB(A2,A3,A4,A5,2.25)
```

### Syntax

```gse
DDB(cost, salvage, life, period, [factor])
```

- `cost` - The initial cost of the asset.
- `salvage` - The value of the asset at the end of depreciation.
- `life` - The number of periods over which the asset is depreciated.
- `period` - The single period within `life` for which to calculate depreciation.
- `factor` - **[** OPTIONAL - `2` by default **]** - The factor by which depreciation decreases.

### Notes

- `life` and `period` must be measured in the same units.
- While `DDB` calculates double-declining depreciation by default, use of `factor` allows specification of other methods.

### See Also

[[SYD]]: The SYD function calculates the depreciation of an asset for a specified period using the sum of years digits method.

[[SLN]]: The SLN function calculates the depreciation of an asset for one period using the straight-line method.

[[DB]]: The DB function calculates the depreciation of an asset for a specified period using the arithmetic declining balance method.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHN3eklpdkR1S0xZbnQyTEYwOHdJTlE&amp;output=html" width="500"></iframe>