---
name: PHI
category: statistical
syntax: PHI(x)
status: imported
description: The PHI function returns the value of the density function for a normal distribution with mean 0 and standard deviation 1, calculated with the formula ![](//screenshot.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116365?hl=en).

The PHI function returns the value of the density function for a normal distribution with mean 0 and standard deviation 1, calculated with the formula ![](https://screenshot.googleplex.com/ic8chm1AB8s.png).

### Syntax
```gse
PHI(x)
```

| Parts | Description |
| --- | --- |
| `x` | The input to the standard normal distribution function. |

### Sample formula

```gse
PHI(0.25)
```

### Notes

This is a special case of the NORMDIST function, where mean is 0, standard deviation is 1, and 'cumulative' is false.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =PHI(0.5) | 0.3520653268 |
| **3** | =PHI(1) | 0.2419707245 |
| **4** | =PHI(1.5) | 0.1295175957 |

### Related functions

- [[STDEV]]: The STDEV function calculates the standard deviation based on a sample.
- [[NORMDIST]]: The NORMDIST function returns the value of the normal distribution function (or normal cumulative distribution function) for a specified value, mean, and standard deviation.