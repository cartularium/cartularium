# Trig & hyperbolic functions — coverage and precision overview

**Batch:** math-longtail · **Subjects:** ACOS ACOSH ASIN ASINH ATAN ATAN2 ATANH COS COSH COT COTH CSC CSCH SEC SECH SIN SINH TAN TANH DEGREES RADIANS ERFC ERFC.PRECISE GAMMALN GAMMALN.PRECISE SQRTPI · **Confidence:** high

## Behavior summary

Across the trig/hyperbolic corpus the **values are portable**: excel, gsheets, hyperformula,
ironcalc, lattice and formulas agree on every result (up to display precision) for the entire
family. The forks in this batch are driven by two non-value factors — LibreOffice's suite-wide
blank recording artifact and pycel's `#NAME?` (three roots) — plus two small genuine coverage gaps.
Documented in detail in `libreoffice-blank-artifact.md` and `pycel-name-error-artifact.md`.

## Function coverage (the real cross-engine facts)

| Function(s)                                                                                 | excel | gsheets | hyperformula | ironcalc | lattice | formulas | pycel                 |
| ------------------------------------------------------------------------------------------- | ----- | ------- | ------------ | -------- | ------- | -------- | --------------------- |
| SIN COS TAN, SINH COSH TANH, ASIN ACOS ATAN ATAN2, ASINH ACOSH ATANH, DEGREES RADIANS, ERFC | ✓     | ✓       | ✓            | ✓        | ✓       | ✓        | ✓ (literal args only) |
| COT COTH CSC CSCH SEC SECH, ACOT ACOTH, SQRTPI, GAMMALN                                     | ✓     | ✓       | ✓            | ✓        | ✓       | ✓        | ✗ `#NAME?`            |
| ERFC.PRECISE                                                                                | ✓     | ✓       | ✗ `#NAME?`   | ✓        | ✓       | ✓        | ✗ `#NAME?`            |
| GAMMALN.PRECISE                                                                             | ✓     | ✓       | ✓            | ✓        | ✓       | ✓        | ✗ `#NAME?`            |

Notable coverage gaps beyond pycel:

- **HyperFormula lacks `ERFC.PRECISE`** (returns `#NAME?`) although it implements plain `ERFC` and
  `GAMMALN.PRECISE`. ERFC and ERFC.PRECISE are mathematically identical for one argument, so this
  is purely a registered-name gap.

## Error behaviour (uniform where present)

The singularity cases are uniform across all six implementing engines:
`=COT(0)`, `=COTH(0)`, `=CSC(0)`, `=CSCH(0)` → **`#DIV/0!`** everywhere.
Out-of-domain `=ACOS(2)`, `=ASIN(2)` → **`#NUM!`** everywhere (except pycel, which mis-attributes
to `#NAME?` — see the pycel note). No error-code divergence among the real engines in this family.

## Precision (background — matched as equal, not a fork)

Every numeric agreement class in the worklist internally holds several renderings of the same value
because engines record at different precision. This is within-class (the tolerance matcher treats
them as equal), so it is **not** a fork, but it is the portability texture worth knowing:

| Value     | excel / formulas / lattice        | hyperformula           | ironcalc            |
| --------- | --------------------------------- | ---------------------- | ------------------- |
| `=SIN(1)` | 0.8414709848078965 (full float64) | 0.84147098481 (~11 sf) | 0.841470985 (~9 sf) |
| `=COT(1)` | 0.6420926159343308                | 0.64209261593          | 0.642092616         |

Near-zero results expose the largest _relative_ spread (still matched as ≈0):

- `=COS(PI()/2)` → excel/formulas/lattice 6.123e-17, ironcalc 6.12323e-17, **hyperformula
  1.6155e-15** (~26× larger, because HyperFormula's `PI()/2` rounds slightly differently).
- `=SIN(PI())` → 1.2246e-16 (most) vs **hyperformula 3.231e-15**.

Takeaway: hyperformula and ironcalc report **fewer significant digits** than excel/formulas/lattice,
and hyperformula's intermediate rounding makes near-zero trig results differ from true value by up
to ~1e-15. Fine for display, but exact-equality comparisons on raw trig output are not portable.

## Wiki-facing notes

- The reciprocal trig functions (COT, COTH, CSC, CSCH, SEC, SECH), ACOT, ACOTH, SQRTPI and GAMMALN
  are **not available in pycel**; `ERFC.PRECISE` is **not available in HyperFormula**. Prefer
  `ERFC` over `ERFC.PRECISE` for portability (identical result, broader support).
- Singularities (`COT(0)` etc.) and domain violations (`ACOS(2)` etc.) are portably signalled as
  `#DIV/0!` and `#NUM!` across the mainstream engines.
- Raw trig output should be rounded before exact comparison; engines differ in the last few digits
  and near-zero values can differ by ~1e-15.

## Open questions

- None requiring live Excel/gsheets — values and error codes for this family are grounded by
  recorded fixtures and reproduced on the pure engines. (ACOT is the exception; see its own note.)
