---
name: STDEVPA
category: statistical
syntax: STDEVPA(value1, [value2, ...])
status: imported
description: Calculates the standard deviation based on an entire population, setting text to the value `0`.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094058?hl=en).

Calculates the standard deviation based on an entire population, setting text to the value `0`.

### Sample Usage

```gse
STDEVPA(1,2,3,4,5,6,7,8,9,10)
STDEVPA(A2:A100)
```

### Syntax

```gse
STDEVPA(value1, [value2, ...])
```

- `value1` - The first value or range of the population.
- `value2, ...` - Additional values or ranges to include in the population.

### Notes

- Although `STDEVPA` is specified as taking a maximum of 30 arguments, Google Sheets supports an arbitrary number of arguments for this function.
- If the total number of values supplied as `value` arguments is not at least two, `STDEVPA` will return the `#DIV/0!` error.
- `STDEVPA` sets each text value encountered to `0` for the purpose of calculation. To return an error upon encountering text, use `STDEVP`.
- `STDEVPA` calculates standard deviation for an entire population. To calculate standard deviation across a sample, use `STDEV`.
- `STDEVPA` is equivalent to the square root of the variance, or `SQRT(VARPA(...))` using the same dataset.

### See Also

[[VARPA]]: Calculates the variance based on an entire population, setting text to the value `0`.

[[VARP]]: Calculates the variance based on an entire population.

[[VARA]]: Calculates the variance based on a sample, setting text to the value `0`.

[[VAR]]: Calculates the variance based on a sample.

[[STDEVP]]: Calculates the standard deviation based on an entire population.

[[STDEVA]]: Calculates the standard deviation based on a sample, setting text to the value `0`.

[[STDEV]]: The STDEV function calculates the standard deviation based on a sample.

[[DVARP]]: Returns the variance of an entire population selected from a database table-like array or range using a SQL-like query.

[[DVAR]]: Returns the variance of a population sample selected from a database table-like array or range using a SQL-like query.

[[DSTDEVP]]: Returns the standard deviation of an entire population selected from a database table-like array or range using a SQL-like query.

[[DSTDEV]]: Returns the standard deviation of a population sample selected from a database table-like array or range using a SQL-like query.

[[DEVSQ]]: Calculates the sum of squares of deviations based on a sample.

[[AVEDEV]]: Calculates the average of the magnitudes of deviations of data from a dataset's mean.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGZGajdBcV9lQVZtdEFULWNmcFZsYnc&amp;output=html" width="500"></iframe>