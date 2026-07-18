---
name: IMREAL
category: engineering
syntax: IMREAL(complex_number)
status: imported
description: Returns the real coefficient of a complex number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7408138?hl=en).

Returns the real coefficient of a complex number.

### Sample Usage

```gse
IMREAL("4+5i")
IMREAL("4j")
```

### Syntax

```gse
IMREAL(complex_number)
```

- `complex_number` - The complex number, in the a+bi or a+bj format.

### See also

- [[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.
- [[IMAGINARY]]: Returns the imaginary coefficient of a complex number.

### Examples

| 2 | Formula | Result |
| --- | --- | --- |
| **3** | `=IMREAL("3+5i")` | 3 |
| **4** | `=IMREAL("4j")` | 0 |