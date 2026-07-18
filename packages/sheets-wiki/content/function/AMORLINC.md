---
name: AMORLINC
category: financial
syntax: AMORLINC(cost, purchase_date, first_period_end, salvage, period, rate, [basis])
status: imported
description: The AMORLINC function returns the depreciation for an accounting period, or the prorated depreciation if the asset was purchased in the middle of a period.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9083932?hl=en).

The AMORLINC function returns the depreciation for an accounting period, or the prorated depreciation if the asset was purchased in the middle of a period.This function is available for users of the French accounting system.

### Syntax
```gse
AMORLINC(cost, purchase_date, first_period_end, salvage, period, rate, [basis])
```

| Part | Description | Notes |
| --- | --- | --- |
| `cost` | The asset's purchase cost |  |
| `purchase_date` | The date the asset was purchased | * The purchase date should be before the first period end date. |
| `first_period_end` | The end date of the first period |  |
| `salvage` | The asset's value at the end of its life (i.e. its salvage value) |  |
| `period` | The period for which to calculate depreciation | * The period should be a non-negative value. Fractional values less than 1 automatically round up to 1, and fractional values greater than 1 round down. |
| `rate` | The annual depreciation rate. | * The depreciation rate may be specified as either a decimal or a percentage. |
| `day_count_convention` | **(Optional)** An indicator of what day count method to use, marked 0 by default | * **0** indicates US (NASD) 30/360. This assumes 30-day months and 360-day years, per the National Association of Securities Dealers (NASD) standard, and performs specific adjustments to entered dates that fall at the ends of months. * **1** indicates Actual/Actual. This calculates based on the actual number of days between the specified dates and the actual number of days in the intervening years. * **2** indicates Actual/360. This calculates based on the actual number of days between the specified dates, but assumes a 360-day year. * **3** indicates Actual/365. This calculates based on the actual number of days between the specified dates, but assumes a 365-day year. * **4** indicates European 30/360. Similar to **0**, this calculates on a 30-day month and a 360-day year, but adjusts end-of-month dates according to European financial conventions. |
| `basis` | **(Optional)**The year basis to use |  |

### Sample formulas

```gse
AMORLINC(1000, "7/20/1969", "8/20/1969", 100, 6, 15%)
AMORLINC(1234.56, DATE(1969, 7, 20), DATE(1969, 8, 20), 123.45, 6.5, 0.15, 1)
AMORLINC(A1, A2, A3, A4, 6, 15%)
```

### Examples

This example shows the sixth period depreciation of an asset with a purchase cost of \$1,000, a purchase date of 7/20/1969, a first period end date of 8/20/1969, a salvage value of \$100, and a depreciation rate of 15% using the default 30-day month and 360-day year counting convention:

|  | **A** | **B** |
| --- | --- | --- |
| **1** | **Cost** | \$1,000 |
| **2** | **Purchase date** | 7/20/1969 |
| **3** | **First period end date** | 8/20/1969 |
| **4** | **Salvage value** | \$100 |
| **5** | **Period** | 6 |
| **6** | **Depreciation rate** | 15% |
| **7** | **Result** | 137.5 |
| **8** | **Formula** | =AMORLINC(B1, B2, B3, B4, B5, B6) |

This example shows the sixth period depreciation of an asset with a purchase cost of \$1,000, a purchase date of 7/20/1969, a first period end date of 8/20/1969, a salvage value of \$100, and a depreciation rate of 15% using the actual days-per-month and actual days-per-year day counting convention:

|  | **A** | **B** |
| --- | --- | --- |
| **1** | **Cost** | \$1,000 |
| **2** | **Purchase date** | 7/20/1969 |
| **3** | **First period end date** | 8/20/1969 |
| **4** | **Salvage value** | \$100 |
| **5** | **Period** | 6 |
| **6** | **Depreciation rate** | 15% |
| **7** | **Day count convention** | 1 |
| **8** | **Formula** | =AMORLINC(B1, B2, B3, B4, B5, B6, B7) |
| **9** | **Result** | 137.26 |

### Related functions

- **[[DDB]]**: The DDB function calculates the depreciation of an asset for a specified period using the double-declining balance method.
- **VDB**: The VDB function returns the depreciation of an asset for a particular period (or partial period).
- **[[DB]]**: The DB function calculates the depreciation of an asset for a specified period using the arithmetic declining balance method.
- **[[SLN]]**: The SLN function calculates the depreciation of an asset for one period using the straight-line method.
- **[[SYD]]**: The SYD function calculates the depreciation of an asset for a specified period using the sum of years digits method.