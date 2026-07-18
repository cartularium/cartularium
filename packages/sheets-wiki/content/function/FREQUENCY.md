---
name: FREQUENCY
category: array
syntax: FREQUENCY(data, classes)
status: imported
description: Calculates the frequency distribution of a one-column array into specified classes.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094286?hl=en).

Calculates the frequency distribution of a one-column array into specified classes.

### Sample Usage

```gse
FREQUENCY(A2:A40,B2:B5)
```

### Syntax

```gse
FREQUENCY(data, classes)
```

- `data` - The array or range containing the values to be counted.
- `classes` - The array or range containing the set of classes.

  + `classes` should be sorted for clarity, but `FREQUENCY` will sort the values specified internally if they are not and return correct results.

### Notes

- The output of `FREQUENCY` will be a vertical range of size one greater than `classes` as the final value is the number of elements in `data` greater than any of the class boundaries.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDVnRXNXOTFRS016X01mdEV1cFhLWkE&amp;output=html" width="500"></iframe>