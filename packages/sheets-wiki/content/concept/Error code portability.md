---
tags:
  - error
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

An **error-code split** is a failure that every engine agrees is a failure but that different engines label with different sentinels. `=IMDIV("1+2i", "0")` is an error everywhere, but the error is `#NUM!` in Excel and `#DIV/0!` in Google Sheets. The computation is the same; only the [[Error|error code]] differs. Error-code splits are distinct from coverage gaps — where an engine lacks the function entirely and returns `#NAME?` — and they matter because code that branches on the *specific* error type is not portable, even though the failure condition is identical.

### The #NUM! vs #DIV/0! family

The most common split pits a **numeric-domain** reading of a failure against a **division-by-zero** reading of the same failure. Google Sheets tends to surface the literal division that occurs inside the algorithm; the other engines classify the input as an out-of-domain argument.

| formula | Excel · `formulas` · HyperFormula · IronCalc · Lattice | Google Sheets | pycel |
| --- | --- | --- | --- |
| `=IMDIV("1+2i", "0")` | `#NUM!` | `#DIV/0!` | `#NAME?` |
| `=RRI(0, 1000, 2000)` | `#NUM!` | `#DIV/0!` | `#NAME?` |

(assay: IMDIV/imdiv-by-zero, RRI/rri-invalid-periods; live probe, 2026-07-11. Lattice sits with Excel on `IMDIV`, and with the `#NUM!` group on `RRI`, per recorded fixtures.) In both cases the underlying computation raises the same condition — a zero-modulus divisor for `IMDIV`, a `1/nper` exponent with `nper = 0` for [[RRI]] — and Google Sheets alone maps it to `#DIV/0!` while the others report `#NUM!`. pycel returns `#NAME?` because it implements neither function.

### Out-of-bounds and out-of-range indexing

Indexing past the end of a range splits `#REF!` against `#NUM!`:

| formula | Excel · `formulas` · IronCalc · Lattice · pycel | Google Sheets · HyperFormula |
| --- | --- | --- |
| `=INDEX(A1:A2, 5)` | `#REF!` | `#NUM!` |

(assay: INDEX/index-out-of-bounds; live probe, 2026-07-11.) Excel treats an out-of-array index as a reference error; Google Sheets and HyperFormula treat it as an invalid numeric argument. Within Excel the sentinel even depends on *how* the index is invalid — `=INDEX(A1:A2, 0)` spills the whole column, `=INDEX(A1:A2, -1)` returns `#VALUE!`, and `=INDEX(A1:A2, 5)` returns `#REF!` (live probe, 2026-07-11). So a single "index out of range" intuition maps to three different Excel outcomes and a fourth in Google Sheets.

Google Sheets carries a broader `#NUM!`-for-out-of-range tendency that shows up across unrelated functions:

| formula | Excel | Google Sheets |
| --- | --- | --- |
| `=CHOOSE(5, "a", "b")` (index past the list) | `#VALUE!` | `#NUM!` |
| `=MUNIT(0)` | `#VALUE!` | `#NUM!` |
| `=CHAR(0)` | `#VALUE!` | `#NUM!` |

(live probe, 2026-07-11.) Where Excel reports an invalid *value*, Google Sheets reports an invalid *number*.

### Function absent versus argument rejected

A `#NAME?` and a `#N/A` can look like the same "this failed" surface while meaning opposite things. [[CONVERT]] makes the distinction concrete:

| formula | Excel · `formulas` · Google Sheets · IronCalc · Lattice | HyperFormula · pycel |
| --- | --- | --- |
| `=CONVERT(1, "ft", "kg")` (incompatible units) | `#N/A` | `#NAME?` |
| `=CONVERT(1, "xyz", "in")` (unknown unit) | `#N/A` | `#NAME?` |

(assay: CONVERT/convert-invalid-unit-pair, CONVERT/convert-unknown-unit; live probe, 2026-07-11.) The `#N/A` is the function *rejecting its argument* — the units are incompatible or unknown, but `CONVERT` exists. The `#NAME?` is the function *being absent entirely*. A `#NAME?` from `CONVERT` should be read as "this engine lacks the function," not "bad units."

### Engine-specific error bugs

Some splits are outright defects in one library rather than a defensible difference in classification. The `formulas` Python library returns `#DIV/0!` for `=IMARGUMENT("i")`, where the mathematically correct answer is `atan2(1, 0) = π/2 = 1.5707963267948966` and every spreadsheet product and other engine returns it. The library computes the argument as an arctangent of `imaginary / real` and does not special-case a zero real part, so the pure-imaginary input divides by zero (assay: IMARGUMENT/imargument-pure-imaginary; live probe, 2026-07-11). The same library returns `#NUM!` for `=IPMT(0.05/12, 360, 360, -200000)` — the final period of a 30-year loan — where the other five implementing engines compute the small positive residual interest (assay: IPMT/ipmt-last-period-mortgage). These are `formulas`-specific edges, not spec differences.

### Testing for errors portably

The practical consequence is a single rule: **test for the presence of an error, not its identity.** [[ISERR]], [[ISERROR]], [[ISNA]], and [[IFERROR]] all key on whether a value *is* an error and are unaffected by which sentinel an engine chose, so they carry across engines cleanly. Any dispatch that reads the *specific* code — Excel's `ERROR.TYPE`, or a formula that compares against a hard-coded `#NUM!` versus `#DIV/0!` — will behave differently across engines wherever an error-code split exists.

The three IS-predicates encode the standard `#N/A`-versus-everything-else distinction, and that distinction is itself portable:

| formula | result | point |
| --- | --- | --- |
| `=ISERR(1/0)` | `TRUE` | `ISERR` catches errors… |
| `=ISERR(#N/A)` | `FALSE` | …except `#N/A` |
| `=ISERROR(1/0)` | `TRUE` | `ISERROR` catches everything… |
| `=ISERROR(#N/A)` | `TRUE` | …including `#N/A` |
| `=ISNA(#N/A)` | `TRUE` | `ISNA` catches only `#N/A` |
| `=ISNA(1/0)` | `FALSE` | not `#N/A` |

(assay: ISERR/iserr-on-div-0, ISERR/iserr-excludes-n-a, ISERROR/iserror-on-div-0, ISERROR/iserror-on-n-a, ISNA/isna-on-n-a, ISNA/isna-on-div-0.) All are uniform across every implementing engine.

### See Also

- [[Error]] — the error data type and Google Sheets' error codes.
- [[IFERROR]], [[ISERR]], [[ISERROR]], [[ISNA]] — portable error handling.
- [[Numeric precision]] — the parallel cross-engine story for numbers.
- [[Unsupported functions]] — when `#NAME?` means the function is absent.
