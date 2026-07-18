---
name: RANDBETWEEN
category: math
syntax: RANDBETWEEN(low, high)
status: imported
description: Returns a uniformly random integer between two values, inclusive.
tags:
  - volatile
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093507?hl=en).

Returns a uniformly random integer between two values, inclusive. `RANDBETWEEN` is [[Volatile]]

### Sample Usage

```gse
RANDBETWEEN(1,10)
RANDBETWEEN(A2,A3)
```

### Syntax

```gse
RANDBETWEEN(low, high)
```

* `low` - The low end of the random range.
* `high` - The high end of the random range.

### Notes

* Values with decimal parts may be used for `low` and/or `high`; this will cause the least and greatest possible values to be the next integer greater than `low` and/or the next integer less than `high`, respectively.

### See Also

[[RAND]]: Returns a random number between 0 inclusive and 1 exclusive.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGMyYVo1MWZ5bHd4b3hBZjFOc0ZuWVE&amp;output=html" width="500"></iframe>