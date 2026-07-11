# Bond & securities analytics family — cross-engine deep dive

**Batch:** financial · **Subjects:** ACCRINTM, DISC, DURATION, MDURATION, INTRATE, PRICE, PRICEDISC, PRICEMAT, RECEIVED, YIELD, YIELDDISC, YIELDMAT, VDB
**Refs:** the 29 refs in the missing-function annotation cluster · **Confidence:** high

## Behavior summary

This is the fixed-income analytics library — accrued interest at maturity (ACCRINTM), discount
rate and price of discounted securities (DISC, PRICEDISC, YIELDDISC), full coupon-bond pricing and
yield (PRICE, YIELD, PRICEMAT, YIELDMAT), Macaulay/modified duration (DURATION, MDURATION),
interest rate of a fully-invested security (INTRATE, RECEIVED), plus variable declining-balance
depreciation (VDB). They all share one cross-engine story: **implemented by four engines, absent
from three, blank in one.**

| tier        | engines                           | behavior                                  |
| ----------- | --------------------------------- | ----------------------------------------- |
| implement   | excel, formulas, gsheets, lattice | compute; agree (see precision note below) |
| absent      | hyperformula, ironcalc, pycel     | `#NAME?`                                  |
| harness gap | libreoffice                       | blank (entire suite)                      |

Confirmed live: HyperFormula returns `#NAME?` for ACCRINT, PRICE, YIELD, DISC, and VDB. The pycel
gap is catalogued broadly in DV-0001. **Cause bucket: missing-function.**

## Divergences — precision among the four implementing engines

The four implementers agree, but they land in one, two, or more agreement classes depending on
whether the function is closed-form or iterative:

**Closed-form (agree to ~1e-13, last-ULP noise):** DISC, DURATION, MDURATION, PRICE, PRICEDISC,
PRICEMAT, RECEIVED, INTRATE, ACCRINTM, VDB. Example — `DURATION` standard-bond: 7.955459717110216
vs 7.955459717110217 (a single ULP). Example — `PRICE` quarterly: 94.23084861434363 /
94.23084861434373 / 94.23084861434371 (three classes, all within 1e-13).

**Iterative root-finders (agree to ~1e-9, solver tolerance):** YIELD, YIELDDISC, YIELDMAT. Example
— `YIELD` annual-basis-1: 0.0639747059300048 / 0.06397470593024172 / 0.06397470593459739 /
0.0639747059300137 — four classes differing around the 10th–11th digit because each engine solves
the price-to-yield inversion with its own Newton/bisection tolerance.

None of this is a correctness difference; it is the ordinary consequence of double-precision
arithmetic (closed-form) and solver stopping criteria (root-finders).

## Wiki-facing notes

- The whole fixed-income analytics library is **Excel / Google Sheets / Lattice / `formulas` only**
  within this corpus. If a workbook targets HyperFormula (common in JS spreadsheet UIs), IronCalc
  (Rust), or pycel (Python), these functions are simply unavailable and evaluate to `#NAME?`.
  Consumers should surface this as a capability gap, not a runtime bug.
- Where the functions do exist, Excel and Google Sheets agree to well within a cent for prices and
  to ~1e-9 for yields; treat yield results as tolerance-equal across engines.
- VDB (variable declining balance) sits in the same absent-from-HyperFormula/IronCalc/pycel tier as
  the bond functions even though it is a depreciation function — do not assume "depreciation
  functions are widely supported"; SLN/SYD/DB/DDB are more widely supported than VDB.

## Open questions

- Whether IronCalc's absence here is permanent or version-skew — IronCalc implements many other
  financial functions (PMT, IRR, TBILL\*) but not the bond-pricing family in this recording. Worth a
  re-check against a newer IronCalc.
- Per-engine day-count basis fidelity for the closed-form functions (they agree on these inputs but
  may split on 30/360 month-end edges the way ACCRINT does — see `ACCRINT.md`).
