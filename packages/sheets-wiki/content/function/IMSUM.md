---
name: IMSUM
category: engineering
syntax: IMSUM(value1, [value2, ...])
status: imported
description: Returns the sum of a series of complex numbers or cells or both.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7408295?hl=en).

Returns the sum of a series of complex numbers or cells or both.

### Sample Usage

```gse
IMSUM(A2:A100)
IMSUM("1+2i",3,"4i")
IMSUM("1+2i","3+5i",A2:A50)
```

### Syntax

```gse
IMSUM(value1, [value2, ...])
```

- `value1` - The first complex number or range to add together.
- `value2`, ... - [ OPTIONAL ] - More complex numbers or ranges to add to `value1`.

### Notes

- The sum of two complex numbers is defined as follows:
  + (a+bi) + (c+di) = (a+c) + (b+d)i
- You can sum complex numbers only if they have the same suffix (i or j). For example, you can't do `IMSUM("4+3i", "1+2j")`.

### See also

- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
- [[IMREAL]]: Returns the real coefficient of a complex number.
- [[IMAGINARY]]: Returns the imaginary coefficient of a complex number.
- [[IMSUB]]: Returns the difference between two complex numbers.
- [[IMPRODUCT]]: Returns the result of multiplying a series of complex numbers together.

### Examples

| 2 | Formula | Result |
| --- | --- | --- |
| **3** | `=IMSUM("1+2i", "3+4i")` | 4+6i |
| **4** | `=IMSUM("20+5j", 4, "j")` | 24+6j |
| **5** | `=IMSUM(COMPLEX(2, 5), COMPLEX(4, 2))` | 6+7i |