---
name: COUNTUNIQUEIFS
category: math
engines:
  gsheets:
    status: available
coverage: pending-assay
syntax: COUNTUNIQUEIFS(column, criteria_column1, criterion1, creteria_column2, criterion2)
status: imported
description: Returns the unique count of a range depending on multiple criteria.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9584429?hl=en).

Returns the unique count of a range depending on multiple criteria.

COUNTUNIQUEIFS for BigQuery

Counts the number of unique values in a data column, filtered by a set of criteria applied to additional columns.

### Sample Usage

```gse
COUNTUNIQUEIFS(table_name!fruits, table_name!inventory, ”<30”, table_name!price, ”>5”)
```

### Syntax

```gse
COUNTUNIQUEIFS(column, criteria_column1, criterion1, creteria_column2, criterion2)
```

- `column`: The data column from which the number of unique values will be counted.
- `criteria_column1`: The data column over which to evaluate `criterion1`.
- `criterion1`: The pattern or test to apply to `criteria\_column1`, such that each cell that evaluates to `TRUE` will be included in the filtered set.
- `creteria_column2`: Additional data columns over which to evaluate the additional criteria. The filtered set will be the intersection of the sets produced by each criterion-column pair.
- `criterion2`: The pattern or test to apply to `criteria\_column2`.

### Sample Usage

```gse
COUNTUNIQUEIFS(A2:A10, B2:B10, ">20")
COUNTUNIQUEIFS(A2:A10, B2:B10, ">20", C2:C10, "<30")
COUNTUNIQUEIFS(A2:A10, D2:D10, "Yes")
```

### Syntax
```gse
COUNTUNIQUEIFS(count_unique_range, criteria_range1, criterion1, [criteria_range2, criterion2, ...])
```

| Part | Description |
| --- | --- |
| count\_unique\_range | The range from which the unique values will be counted. |
| criteria\_range1 | The range to check against criterion1. |
| criterion1 | The pattern or test to apply to criteria\_range1. |
| Criteria\_range2, criterion2, … | [OPTIONAL] - Additional ranges and criteria to check. |

### Notes

- COUNTUNIQUEIFS will return 0 if none of the criterion are satisfied.
- count\_unique\_range and all the criterion ranges must contain the same number of rows and columns.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheets/d/e/2PACX-1vRwaM-cs14xUCUIW0SzW7wPUPOVAFziECFz-EqPhDef9VtAGMhfDqEBzAG9ncPmlmmitUDyu32hBunC/pubhtml?gid=0&amp;single=true&amp;widget=true&amp;headers=false" width="500"></iframe>

### Related functions

- COUNTUNIQUE
- COUNTIFS
- IF
- AVERAGEIFS
- MAXIFS
- SUMIFS