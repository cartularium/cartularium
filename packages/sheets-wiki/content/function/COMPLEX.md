---
name: COMPLEX
category: engineering
syntax: COMPLEX(real_part, imaginary_part, [suffix])
status: imported
description: The COMPLEX function creates a complex number, given real and imaginary coefficients.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7407888?hl=en).

The COMPLEX function creates a complex number, given real and imaginary coefficients.

### Sample Usage

```gse
COMPLEX(3, 4)
COMPLEX(3, -1, "j")
COMPLEX(3, 0)
```

### Syntax

```gse
COMPLEX(real_part, imaginary_part, [suffix])
```

- `real_part` - The real coefficient.
- `imaginary_part` - The imaginary coefficient.
- `suffix` - [ OPTIONAL "`i`" by default] The suffix for the imaginary coefficient.

### See Also

- [[IMREAL]]: Returns the real coefficient of a complex number.
- [[IMAGINARY]]: Returns the imaginary coefficient of a complex number.

### ​Examples

| 2 | Formula | Result |
| --- | --- | --- |
| **3** | `=COMPLEX(1, 2.5)` | 1+2.5i |
| **4** | `=COMPLEX(0, 4, "j")` | 4j |
| **5** | `=COMPLEX(3, -1)` | 3-i |