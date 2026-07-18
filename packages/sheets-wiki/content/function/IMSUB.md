---
name: IMSUB
category: engineering
syntax: IMSUB(first_number, second_number)
status: imported
description: Returns the difference between two complex numbers.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7408393?hl=en).

Returns the difference between two complex numbers.

### Sample Usage

```gse
IMSUB("6+5i", "2+3i")
```

### Syntax

```gse
IMSUB(first_number, second_number)
```

- `first_number` - The complex number to subtract `second_number` from.
- `second_number` - The complex number to subtract from `first_number`.

### Notes

- The difference between two complex numbers is defined as follows:
  + (a+bi) - (c+di) = (a-c) + (b-d)i
- You can subtract two complex numbers only if they have the same suffix (i or j). For example, you can't do `IMSUB("4+3i", "1+2j")`.

### See also

- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
- [[IMREAL]]: Returns the real coefficient of a complex number.
- [[IMAGINARY]]: Returns the imaginary coefficient of a complex number.
- [[IMSUM]]: Returns the sum of a series of complex numbers or cells or both.

### Examples

| **1** | **A** | **B** |
| --- | --- | --- |
| 2 | **Formula** | **Result** |
| 3 | `=IMSUB("6+5i", "2+3i")` | 4+2i |
| 4 | `=IMSUB("20+5j", "4j")` | 20+j |
| 5 | `=IMSUB("20+5j", "4")` | 16+5j |
| 6 | `=IMSUB("20+5j", 4)` | 16+5j |
| 7 | `=IMSUB(COMPLEX(20, 5), COMPLEX(4, 0))` | 16+5i |