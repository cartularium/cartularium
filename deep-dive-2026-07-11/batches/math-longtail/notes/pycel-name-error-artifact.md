# pycel `#NAME?` — three distinct roots (method finding)

**Batch:** math-longtail · **Refs:** all pycel-diverging refs in the batch (pycel-operator-artifact ×19, pycel-missing-function ×23, pycel-domain-error ×2, plus IM-family/MUNIT/RAND/GAMMALN.PRECISE) · **Confidence:** high

## Why this note exists

pycel is the single largest source of forks in math-longtail after LibreOffice, and every one of
them surfaces as the same sentinel: `#NAME?`. That single code is misleading — a live probe shows
it collapses **three completely different failure modes** into one error. This matters for anyone
reading assay's pycel column: `#NAME?` from pycel does **not** reliably mean "function not
implemented."

## The three roots (all confirmed by live pycel probe in this batch)

### 1. Genuine missing function

Single function call, plain-literal argument, **no operator**, still `#NAME?`. The function is
absent from the assay pycel build.

| Probe         | pycel    |
| ------------- | -------- |
| `=ACOT(0)`    | `#NAME?` |
| `=CSC(1)`     | `#NAME?` |
| `=SEC(1)`     | `#NAME?` |
| `=SQRTPI(1)`  | `#NAME?` |
| `=GAMMALN(5)` | `#NAME?` |

Affected families: ACOT, ACOTH, COT, COTH, CSC, CSCH, SEC, SECH, SQRTPI, GAMMALN,
GAMMALN.PRECISE, ERFC.PRECISE, the IM-family (IMLN/IMPOWER/IMSQRT), MUNIT, RAND, RANDBETWEEN.
DV-0001 already records pycel as missing SQRTPI and GAMMALN, corroborating this root.

### 2. Domain error mis-attributed

pycel implements the function, but the argument is outside the math domain. Other engines return
`#NUM!`; pycel raises the underlying Python exception and the driver reports `#NAME?`.

| Probe      | pycel    | other engines      |
| ---------- | -------- | ------------------ |
| `=ACOS(2)` | `#NAME?` | `#NUM!`            |
| `=ASIN(2)` | `#NAME?` | `#NUM!`            |
| `=LN(0)`   | `#NAME?` | (domain / `#NUM!`) |
| `=LOG(0)`  | `#NAME?` | (domain / `#NUM!`) |

Control: `=ACOS(0.9)` → 0.451, `=ACOS(1)` → 0 (in-domain works). So this is **error-attribution**,
not a missing function.

### 3. Arithmetic-operator parse artifact (the surprising one)

The assay pycel driver returns `#NAME?` for **any formula containing an arithmetic operator**,
including trivially-valid ones. This is a driver-level parse/compile limitation, not a statement
about function coverage.

| Probe           | pycel        | Note                                       |
| --------------- | ------------ | ------------------------------------------ |
| `=1+1`          | `#NAME?`     | no spreadsheet computes `#NAME?` for `1+1` |
| `=-1`           | `#NAME?`     | bare unary minus                           |
| `=0-1`          | `#NAME?`     | binary minus                               |
| `=SUM(-1,2)`    | `#NAME?`     | unary minus inside an implemented function |
| `=SQRT(1+1)`    | `#NAME?`     | binary op inside SQRT                      |
| `=SIN(ABS(-1))` | `#NAME?`     | unary minus nested two calls deep          |
| `=SIN(1)`       | 0.8414709848 | pure call over a literal — works           |
| `=SIN(PI())`    | 1.2246e-16   | pure call tree, no operator — works        |
| `=SQRT(2)`      | 1.4142135624 | works                                      |

So a formula like `=ACOS(-1)` (value π, perfectly in-domain) fails **only** because of the unary
minus, while `=ACOS(1)` succeeds. In this batch the operator artifact accounts for 19 refs:
every `-literal`, `-PI()`, `PI()/2`-style argument to an implemented trig/rounding/parity function
(ACOS(-1), SIN(PI()/2), COS(-PI()), DEGREES(PI()/2), ODD(-1.5), ISEVEN(-2), ERFC(-1), …).

## Implications

- **For assay/consumers:** treat a pycel `#NAME?` as "pycel could not produce a value," not as
  evidence that the function is unsupported. Where the corpus needs a real pycel capability signal,
  test the function with a **single positive-integer/decimal literal argument and no operator**
  (e.g. `=GAMMALN(5)`, `=CSC(1)`), which isolates root 1 from roots 2 and 3.
- **For the wiki:** pycel is an evidence source, not a user-facing engine, so this belongs in
  assay method notes rather than function pages. But it explains why pycel's column looks far more
  "unsupported" than it really is.

## Open questions

- Is the operator artifact specific to how the assay driver seeds a bare formula into a single
  cell (pycel expecting cell-reference-led expressions), or a pycel-library tokenizer limit? Worth
  a driver-level look; either way it is not a function-coverage fact.
