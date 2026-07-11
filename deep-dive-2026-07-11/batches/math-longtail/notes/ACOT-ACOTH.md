# ACOT / ACOTH — cross-engine deep dive

**Batch:** math-longtail · **Refs:** ACOT/acot-at-0, ACOT/acot-at-1, ACOT/acot-negative, ACOTH/acoth-greater-than-1, ACOTH/acoth-less-than-1 · **Confidence:** high

## Behavior summary

ACOT(x) is the inverse cotangent; ACOTH(x) the inverse hyperbolic cotangent. For non-negative
arguments every engine agrees: `=ACOT(0)` → π/2 (1.5707963) and `=ACOT(1)` → π/4 (0.7853982)
are uniform across excel, gsheets, hyperformula, ironcalc, lattice and formulas. ACOTH is only
defined for |x| > 1 and the corpus cases `=ACOTH(2)` → 0.5493061 and `=ACOTH(-2)` → -0.5493061
are uniform across those same engines. In this batch pycel returns `#NAME?` for the entire
ACOT/ACOTH family (functions not implemented in the assay pycel build) and LibreOffice records
`BLANK` (a suite-wide recording artifact — see `libreoffice-blank-artifact.md`).

## Divergences

### The ACOT negative-argument branch cut (the real story)

`=ACOT(-1)` is the one genuine cross-engine semantic split in this pair.

| Engine       | `=ACOT(-1)`         | Value | Range convention             |
| ------------ | ------------------- | ----- | ---------------------------- |
| excel        | 2.356194490192345   | 3π/4  | principal range (0, π)       |
| formulas     | 2.356194490192345   | 3π/4  | (0, π)                       |
| ironcalc     | 2.35619449          | 3π/4  | (0, π)                       |
| lattice      | 2.356194490192345   | 3π/4  | (0, π)                       |
| gsheets      | -0.7853981633974483 | -π/4  | ATAN(1/x), range (-π/2, π/2) |
| hyperformula | -0.7853981633974483 | -π/4  | ATAN(1/x), range (-π/2, π/2) |
| pycel        | `#NAME?`            | —     | unary-minus parse artifact   |
| libreoffice  | `BLANK`             | —     | recording artifact           |

Mechanism (**arg-semantics**): two standard-but-incompatible definitions of arccot.

- excel/formulas/ironcalc/lattice place ACOT on the **principal range (0, π)**, so ACOT is a
  single continuous, monotonically decreasing curve over all reals. This is the convention
  Microsoft documents for Excel's ACOT.
- gsheets/hyperformula compute **ACOT(x) = ATAN(1/x)**, giving the range **(-π/2, π/2)** with a
  discontinuity at x = 0. For x = -1 this yields -π/4.
- The two conventions agree for x ≥ 0 and differ by exactly **π** for x < 0.

Live pure-engine probe (this batch): ironcalc and formulas returned 2.356 (3π/4); hyperformula
returned -0.785 (-π/4) — reproducing the recorded split.

### pycel absence

`=ACOT(0)`, `=ACOT(1)`, `=ACOTH(2)`, `=ACOTH(-2)` all return `#NAME?` in pycel with no operator
in the formula → the functions are genuinely unimplemented (missing-function), distinct from the
operator-parse artifact that also happens to hit `=ACOT(-1)`.

## Edges explored beyond the corpus

Pure engines only (excel/gsheets need a probe — see probe-requests). Confirmed on the pure engines
that the ACOT convention is stable across the negative domain: hyperformula stays on the ATAN(1/x)
branch, ironcalc/formulas stay on (0, π). Requested excel/gsheets probes: `=ACOT(-0.5)`,
`=ACOT(-100)` (limiting behaviour), `=ACOTH(0.5)` (|x|<1 domain error).

## Wiki-facing notes

The current `ACOT.md` page has a **self-contradiction** worth fixing:

- Its Notes section states: _"ACOT returns results that are between 0 and π (pi)."_ — the **Excel**
  convention.
- But its own sample table (imported from Google Sheets docs) shows `=ACOT(-4) → -0.2449786631`
  and `=DEGREES(ACOT(A3)) → -14.03624347` for A3 = -4 — **negative** results, i.e. the **Google
  Sheets** ATAN(1/x) branch, which is outside (0, π).

Recommended wiki text: ACOT agrees across engines for non-negative inputs, but for **negative**
arguments Excel/IronCalc/lattice return a value in (0, π) (e.g. `ACOT(-1)` = 3π/4 ≈ 2.356) while
**Google Sheets and HyperFormula** compute `ATAN(1/x)` and return a value in (-π/2, 0) (e.g.
`ACOT(-1)` = -π/4 ≈ -0.785). Portability note: any sheet relying on the sign/range of ACOT for
negative inputs is **not portable** between Excel and Google Sheets. ACOTH is uniform.

## Open questions

- excel/gsheets live confirmation of `=ACOT(-0.5)`, `=ACOT(-100)`, `=ACOTH(0.5)` — probe ids
  `math-longtail-acot-branch`, `math-longtail-acot-branch-large`, `math-longtail-acoth-domain`.
- Whether lattice's ACOT convention (recorded 3π/4) is intentional Excel-alignment or incidental.
