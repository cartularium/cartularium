# XNPV / XIRR — cross-engine deep dive

**Batch:** financial · **Refs:** XNPV/xnpv-single-future-flow, XNPV/xnpv-standard, XIRR/xirr-simple-project, XIRR/xirr-with-guess · **Confidence:** high

## Behavior summary

`XNPV(rate, values, dates)` and `XIRR(values, dates, [guess])` discount cash flows that occur on
arbitrary (irregular) dates. Both take a **dates** argument. The corpus seeds those date cells as
ISO text strings (e.g. `"2020-01-01"`), and that seed type is the entire XNPV story. XIRR's story
is instead about the iterative solver plus which engines implement it.

## Divergences

### XNPV — strict vs lenient text-date coercion

`=XNPV(0.1, A1:A2, B1:B2)` with B1:B2 = ISO text dates

| engine                       | result            | class              |
| ---------------------------- | ----------------- | ------------------ |
| excel, gsheets, hyperformula | #VALUE!           | reject text dates  |
| formulas, ironcalc, lattice  | 908.8535548268738 | coerce ISO strings |
| pycel                        | #NAME?            | not implemented    |
| libreoffice                  | (blank)           | harness gap        |

`xnpv-standard` (`=XNPV(0.09, A1:A5, B1:B5)`) splits the same way: #VALUE! for
excel/gsheets/hyperformula, 2086.647602031535 for formulas/ironcalc/lattice.

**Live-probe proof that this is a date-_seed_-type effect, not an XNPV-value effect** — I ran
HyperFormula, IronCalc, and `formulas` with the dates seeded two ways:

| engine       | dates as numeric serials | dates as ISO strings |
| ------------ | ------------------------ | -------------------- |
| hyperformula | 908.85355483 (number)    | **#VALUE!**          |
| ironcalc     | 908.853554827            | 908.853554827        |
| formulas     | 908.8535548268738        | 908.8535548268738    |

So HyperFormula's XNPV computes fine on real date serials and errors only on text — exactly
reproducing the recorded `#VALUE!`. IronCalc and `formulas` coerce ISO strings to serials and
compute either way. **Cause bucket: arg-semantics** (text-vs-serial date coercion). The strict
engines (Excel, Google Sheets, HyperFormula) require the `dates` argument to be numeric date
serials; the lenient engines silently parse ISO strings.

### XIRR — Excel's solver root + missing implementations

`=XIRR(A1:A5, B1:B5)` / `=XIRR(A1:A3, B1:B3, 0.1)`

| engine (xirr-simple-project) | result              | class                       |
| ---------------------------- | ------------------- | --------------------------- |
| excel                        | 0.3733625352382659  | Excel solver root           |
| formulas                     | 0.37336253350955556 | other-solver root           |
| gsheets                      | 0.3733625335188316  | other-solver root           |
| lattice                      | 0.3733625335095561  | other-solver root           |
| ironcalc                     | 0.373362534         | reduced-precision read-back |
| hyperformula, pycel          | #NAME?              | not implemented             |
| libreoffice                  | (blank)             | harness gap                 |

Excel converges to a root that differs from the other three implementers at about the 8th
significant digit (0.37336253**52** vs 0.37336253**35**) — an iterative-solver tolerance gap, not
a bug. IronCalc reports the value truncated to display precision. **HyperFormula has no XIRR** and
returns `#NAME?` regardless of seed type (confirmed live for both serial and text dates), which is
notable because HyperFormula _does_ have XNPV. pycel lacks XIRR too. **Cause bucket: precision**
(solver tolerance), with missing-function for HyperFormula/pycel.

## The XIRR-vs-XNPV asymmetry (open, needs Excel/gsheets)

The same corpus date column is seeded as text for both functions, yet in the fixtures Excel and
Google Sheets **compute XIRR** (a value) but **error XNPV** (#VALUE!). That implies Excel/gsheets
coerce text dates for XIRR but reject them for XNPV — an internal inconsistency worth pinning down.
Probe `financial-002` seeds XIRR with text dates on Excel/gsheets to confirm it returns a number.

## Wiki-facing notes

- **XNPV portability rule:** date cells must contain real dates (numeric serials), not text. In
  Excel, Google Sheets, and HyperFormula, text dates make XNPV return `#VALUE!`. The `formulas`
  library, IronCalc, and LibreOffice/Lattice coerce ISO strings, which can mask the problem until a
  model is opened in a strict engine. Wrap text with `DATEVALUE()` for portability.
- **XIRR portability:** HyperFormula and pycel do not implement XIRR at all. Where XIRR is
  implemented, the result is a solver root and will differ from Excel by ~1e-8; compare to a
  tolerance, not exact equality.
- These two functions are a good illustration that "same dates argument" does not mean "same
  coercion rules" even within one vendor (Excel treats XIRR and XNPV dates differently here).

## Open questions

- `financial-001`: confirm Excel/gsheets XNPV returns #VALUE! on text dates and 908.85 on serials.
- `financial-002`: confirm Excel/gsheets XIRR coerces text dates (returns a number), establishing
  the intra-vendor XIRR-vs-XNPV asymmetry.
