---
name: IMCOS
category: engineering
syntax: IMCOS(number)
status: imported
description: The IMCOS function returns the cosine of the given complex number.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9116546?hl=en).

The IMCOS function returns the cosine of the given complex number. For example, a given complex number "x+yi" returns "cos(x+yi)."

### Syntax
```gse
IMCOS(number)
```

| Part | Description | Notes |
| --- | --- | --- |
| `number` | The complex number for which you want the cosine. | This can be either the result of the COMPLEX function, a real number (which will be interpreted as a complex number with imaginary part equal to 0), or a string in the format “x+yi” where x and y are numeric. |

### Sample formulas

```gse
IMCOS(COMPLEX(4, 6))
IMCOS(4)
IMCOS("2+3i")
```

### Notes

The IMCOS function returns an error if the given number isn't a valid complex number.

### Examples

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | =IMCOS(COMPLEX(4, 1)) | -1.00862481342516+0.889395195838485i |
| **3** | =IMCOS(3.5) | -0.936456687290796 |
| **4** | =IMCOS("3+2i") | -3.72454550491532-0.511822569987385i |

### Engine compatibility

IMCOS is implemented by every tracked engine except pycel (`#NAME?`). The result is text, so the cross-engine difference is rendering: every engine computes the same complex value, but Excel, Google Sheets, and IronCalc cap each component at ~15 significant digits while `formulas`, HyperFormula, and Lattice emit the full IEEE-754 double. For example `IMCOS("1+1i")` renders `0.833730025131149-0.988897705762865i` (15-digit family) versus `0.8337300251311491-0.9888977057628651i` (full-double family) — the same value (assay: IMCOS forks; IM-TRANSCENDENTAL deep dive, 2026-07-11). Do not string-compare IMCOS output across engines; use [[IMREAL]] and [[IMAGINARY]] for numeric components.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Supported; ~15-significant-digit rendering. |
| Excel | Supported; ~15-significant-digit rendering. |
| HyperFormula | Supported; full-double rendering (live probe, 2026-07-11). |
| IronCalc | Supported; ~15-digit rendering (live probe, 2026-07-11). |
| formulas | Supported; full-double rendering (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Supported; full-double rendering. |

### Related function

[[COMPLEX]]: The COMPLEX function creates a complex number, given real and imaginary coefficients.