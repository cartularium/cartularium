# IMCOS / IMCOSH / IMSIN / IMSINH / IMTAN / IMSEC / IMSECH / IMCSC / IMCSCH / IMCOT / IMEXP / IMLOG10 / IMLOG2 — cross-engine deep dive

**Batch:** engineering · **Refs:** the complex-string forks for these functions (imcos-complex, imcos-zero, imsin-complex, imsin-zero, imexp-real/imaginary/zero, imlog2-complex/of-8, imlog10-complex/of-10, imsec-_, imsech-_, imcsc-_, imcsch-_, imcot-_, imcosh-_, imsinh-_, imtan-_) · **Confidence:** high

## Behavior summary

These functions take a complex number (as a real number, a `COMPLEX()` result, or a string `"x+yi"`) and return a complex result **as a formatted string**. Every engine that implements them computes the same complex value to about 15 significant digits. Because the result is a _string_, assay's divergence matcher compares by exact string equality rather than numeric tolerance — so any difference in float-to-string rendering, down to the last ULP, becomes a distinct agreement class. That is the root of almost every fork in this family.

## Divergences

### 1. The 15-digit vs full-precision rendering split (the dominant story)

Two rendering families, confirmed live on the pure engines:

- **15-significant-digit family: Excel, Google Sheets, IronCalc.** They format each component to 15 sig figs (Excel's classic display precision).
- **Full-precision family: formulas, HyperFormula, Lattice.** They serialize the raw IEEE-754 double at full round-trip precision (16–17 sig figs).

| formula          | excel / gsheets / ironcalc (15-digit)  | formulas / hyperformula / lattice (full) |
| ---------------- | -------------------------------------- | ---------------------------------------- |
| `=IMCOS("1+1i")` | `0.833730025131149-0.988897705762865i` | `0.8337300251311491-0.9888977057628651i` |
| `=IMSIN("1+1i")` | `1.29845758141598+0.634963914784736i`  | `1.2984575814159773+0.6349639147847361i` |
| `=IMEXP("1")`    | `2.71828182845905`                     | `2.718281828459045`                      |
| `=IMSEC("1+1i")` | `0.498337030555187+0.591083841721045i` | `0.4983370305551868+0.591083841721045i`  |

(Live IronCalc and HyperFormula/formulas outputs reproduced exactly from `scratch/engineering-probe1.mts`.)

### 2. ULP-level sub-splits inside the full-precision family

For some inputs the "full-precision" engines do not even agree with each other, because the libraries decompose the complex arithmetic differently (e.g. computing `IMCOT` as `cos/sin` vs `1/tan`, or different sinh/cosh identities) and accumulate rounding in the last one or two units-in-the-last-place. This yields three or four distinct strings for a single formula:

- `=IMCOT("1+1i")`: excel/gsheets/ironcalc `0.217621561854403-0.868014142895925i`; formulas `0.2176215618544028-0.8680141428959252i`; hyperformula/lattice `0.21762156185440265-0.8680141428959249i` — **three** classes.
- `=IMCSC("1+1i")`: **four** classes (excel alone; formulas alone; gsheets+ironcalc; hyperformula+lattice) all differing only in trailing digits.

### 3. IMLOG2("8") — the clean float artifact

`=IMLOG2("8")` is mathematically exactly 3. Most engines print `"3"`, but **formulas** prints `"2.9999999999999996"` (live-confirmed) because it computes `ln(8)/ln(2)` in double precision and the division lands one ULP low, then round-trips that raw double to string. This is the same rendering mechanism made vivid: a value everyone agrees is 3 becomes a distinct class purely through string formatting of an inexact intermediate.

### 4. pycel: entire family absent (#NAME?)

pycel returns `#NAME?` for **all** of these functions, even trivial inputs — live: `IMCOS("0")`=#NAME?, `IMEXP("0")`=#NAME?, `IMSIN("0")`=#NAME?. pycel simply does not implement the transcendental complex family. `DV-0001` already records pycel's missing-function `#NAME?` for the algebraic IM functions (IMABS, IMSUM, IMDIV-basic, IMREAL, …) but not this transcendental set, which these annotations add.

### 5. LibreOffice blank (fixture artifact)

Same systemic all-null 2026-05-11 fixture as the rest of the engineering suite. Not a real result.

### 6. The trivial-input cases only fork on pycel + LibreOffice

For `IMCOS("0")`="1", `IMSIN("0")`="0", `IMEXP("0")`="1", `IMLOG10("10")`="1", `IMSEC("0")`="1", `IMSINH("0")`="0", `IMTAN("0")`="0", etc., every computing engine returns the identical short string (no rendering divergence because the answer is a small exact integer), so the _only_ fork is pycel (#NAME?) plus the LibreOffice blank.

## Edges explored beyond the corpus

From the live probe:

- IronCalc consistently sits in the 15-digit family (`IMTAN("1+1i")`=`0.271752585319512+1.08392332733869i`) — grouping it with Excel/gsheets, not with the Rust-adjacent full-precision engines. So the split is about the **string formatter**, not the implementation language.
- `IMEXP("1")` reproduces the split at a pure-real input (`2.71828182845905` vs `2.718281828459045`), confirming the divergence is in rendering, not in complex-vs-real code paths.

## Wiki-facing notes

- **Portability advice:** results of these complex functions are numerically equivalent everywhere to ~15 digits, but the returned _string_ is not byte-identical across engines. Any consumer that string-compares complex results (or hashes them) will see spurious mismatches. Compare by parsing to numbers with a tolerance, not by string equality.
- Excel / Google Sheets / IronCalc cap complex-string components at 15 significant digits; formulas / HyperFormula / Lattice emit full double precision. State this on IMCOS/IMSIN/IMEXP/etc. pages as a rendering caveat.
- `IMLOG2` of an exact power of two can print `2.9999999999999996` on the `formulas` engine — a display artifact, not a wrong answer.
- pycel does not implement the transcendental complex functions at all (returns `#NAME?`).

## Open questions

- `engineering-003`: confirm Excel/gsheets keep the 15-digit cap at larger operand magnitudes (`IMEXP("10+3i")`).
