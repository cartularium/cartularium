# IMLN / IMPOWER / IMSQRT — cross-engine deep dive

**Batch:** math-longtail · **Refs:** IMLN/imln-of-complex, IMLN/imln-of-i, IMLN/imln-of-real, IMPOWER/impower-of-i-squared, IMPOWER/impower-squared, IMPOWER/impower-zeroth, IMSQRT/imsqrt-of-complex, IMSQRT/imsqrt-of-i, IMSQRT/imsqrt-of-real · **Confidence:** high

## Behavior summary

The IM-family (Engineering complex-number functions) takes a complex number **as text**
(`"3+4i"`, `"i"`, `"2+3i"`) and returns a complex number **as text**. Every engine that
implements them computes the same underlying complex value; the forks here are almost entirely
about **how the resulting complex number is rendered to a string** — digit count, exponent
notation, and whether a numerically-negligible residue is kept. pycel returns `#NAME?` (the whole
IM-family is unimplemented in the assay pycel build; consistent with DV-0001). LibreOffice records
`BLANK` (suite-wide recording artifact).

## Divergences

### Axis 1 — mantissa precision

| Formula         | excel / gsheets / ironcalc                          | formulas / hyperformula / lattice                       |
| --------------- | --------------------------------------------------- | ------------------------------------------------------- |
| `=IMLN("3+4i")` | `1.6094379124341+0.927295218001612i` (~15 sig figs) | `1.6094379124341003+0.9272952180016122i` (full float64) |
| `=IMLN("i")`    | `1.5707963267949i` (ironcalc/excel/gsheets)         | `1.5707963267948966i`                                   |

The value is identical; the group splits on how many significant digits the complex→string
formatter emits. Excel/Google Sheets/IronCalc round to roughly 15 significant digits;
formulas/HyperFormula/lattice print the raw double.

### Axis 2 — residue + exponent formatting for `=IMPOWER("i", 2)`

The true value is exactly **-1**, but `i²` computed via polar form leaves a tiny imaginary
residue (~1.22e-16). Five engines render it five different ways:

| Engine       | `=IMPOWER("i", 2)`                                                   |
| ------------ | -------------------------------------------------------------------- |
| excel        | `-1+1.22464679914735E-16i` (uppercase-E, ~15 sig figs)               |
| gsheets      | `-1+1.22464679914735E-16i` (uppercase-E, ~15 sig figs)               |
| hyperformula | `-1+1.2246467991473532e-16i` (lowercase-e, full precision)           |
| ironcalc     | `-1+0.000000000000000122464679914735i` (fixed notation, no exponent) |
| formulas     | `-1` (residue dropped — clean result)                                |
| lattice      | `-1` (residue dropped — clean result)                                |
| pycel        | `#NAME?` (unimplemented)                                             |
| libreoffice  | `BLANK` (recording artifact)                                         |

Mechanism (**format-rendering**, with **precision** as the secondary axis): engines that carry the
residue disagree on exponent style (`E` vs `e` vs fixed decimal) and digit count; formulas and
lattice snap near-zero imaginary parts to zero and print the bare real part.

### Where they agree

Real-valued and integer-coefficient results are uniform across all implementing engines:
`=IMLN("1")` → `0`, `=IMSQRT("4")` → `2`, `=IMPOWER("2+3i", 2)` → `-5+12i`,
`=IMPOWER("2+3i", 0)` → `1`, `=IMSQRT("3+4i")` → `2+i`. `=IMSQRT("i")` re-splits on precision
(excel/ironcalc `0.707106781186548+0.707106781186547i`, gsheets
`0.707106781186548+0.707106781186548i` — note last digit, others full float64).

## Edges explored beyond the corpus

Pure engines confirmed the precision/residue axes are stable (hyperformula always full-precision,
ironcalc always fixed-notation for tiny residues, formulas always snaps to clean reals). Excel/
gsheets rendering needs a live probe (`=IMLN("2+3i")`, `=IMPOWER("i",2)` — probe ids
`math-longtail-improper-complex-digits`, `math-longtail-improper-i-residue`).

## Wiki-facing notes

The IMLN/IMPOWER/IMSQRT pages should warn that these functions return **text**, and that the
**string form is not portable**: two engines can return the mathematically-identical complex number
as different strings (digit count, `E` vs `e`, or with/without a ~1e-16 imaginary residue). Advice:
do not string-compare IM-family output across engines or feed it into exact text matches; if you
need the components, use IMREAL/IMAGINARY (which return numbers) rather than parsing the rendered
string. Note specifically that Excel/Google Sheets render `IMPOWER("i",2)` as
`-1+1.22464679914735E-16i` (a visible residue), not a clean `-1`.

## Open questions

- excel/gsheets live confirmation of digit count and residue formatting (probe ids above).
- Whether Excel's rendered precision is exactly 15 significant digits (matches its general
  number-display rule) — worth stating precisely on the wiki if confirmed.
