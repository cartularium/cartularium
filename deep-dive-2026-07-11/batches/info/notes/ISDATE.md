# ISDATE — cross-engine deep dive

**Batch:** info · **Refs:** ISDATE/isdate-of-date-string · **Confidence:** medium · **Related:** DV-0024 (ISDATE unimplemented in formulas/hyperformula/ironcalc/libreoffice/pycel), DV-0019 (excel #N/A for other ISDATE tests)

## Behavior summary

ISDATE is a **Google Sheets-native** function with no Excel equivalent. It reports whether a value is a date. Only two engines in the corpus implement it — Google Sheets and lattice (which carries it for gsheets compatibility) — and they disagree on the one case tested here.

## Divergences

`=ISDATE("2024-01-15")`:

| engine       | result | mechanism                                                                                        |
| ------------ | ------ | ------------------------------------------------------------------------------------------------ |
| gsheets      | TRUE   | parses the date-shaped string as a date                                                          |
| lattice      | FALSE  | implements ISDATE but does not coerce a raw text argument to a date, so a string is "not a date" |
| excel        | #NAME? | no ISDATE function                                                                               |
| formulas     | #NAME? | no ISDATE function                                                                               |
| hyperformula | #NAME? | no ISDATE function                                                                               |
| ironcalc     | #NAME? | no ISDATE function                                                                               |
| pycel        | #NAME? | no ISDATE function                                                                               |

(libreoffice records the suite-wide `blank` artifact.)

The genuine cross-engine split is **gsheets TRUE vs lattice FALSE** — the only two ISDATE implementers disagree on whether a date-shaped _string literal_ counts as a date. Google Sheets parses the string; lattice keys on the argument's type/value and a bare string is not a date. **Cause: arg-semantics (string→date coercion).** The #NAME? branch (excel/formulas/hyperformula/ironcalc/pycel) is the missing-function backdrop; live-probe confirmed #NAME? on all four pure engines and on the HyperFormula/IronCalc/formulas/pycel set.

## Edges explored beyond the corpus

- Confirmed #NAME? on `=ISDATE(TODAY())` for hyperformula/ironcalc/formulas/pycel as well — ISDATE is simply absent, independent of argument type.
- The interesting coercion question (does gsheets ISDATE key on the string parse, on an underlying date serial, or on cell format?) can only be answered on live gsheets — see probe requests.

## Wiki-facing notes

- ISDATE is **Google Sheets only** among the tested engines. Excel and the Excel-compatible engines (formulas, HyperFormula, IronCalc, pycel) return #NAME?.
- Even the gsheets-compatible lattice engine disagrees with Google Sheets on `ISDATE("2024-01-15")`: **gsheets returns TRUE, lattice returns FALSE**. Do not assume ISDATE of a date-shaped string is TRUE outside Google Sheets itself.
- Portability advice: ISDATE is not portable; use a coercion-based test (e.g. `ISNUMBER(DATEVALUE(x))`) if a portable "is this a date?" predicate is needed.

## Open questions

- Map the gsheets ISDATE coercion surface: string date vs `DATE(2024,1,15)` serial vs a bare number vs boolean (probes info-003, info-003b, info-003c). This determines whether gsheets ISDATE keys on the string parse or the underlying value — needed to explain the gsheets-vs-lattice disagreement precisely.
