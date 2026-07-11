# IMDIV / IMARGUMENT — error-code and error-attribution divergences — cross-engine deep dive

**Batch:** engineering · **Refs:** IMDIV/imdiv-by-zero, IMARGUMENT/imargument-basic, IMARGUMENT/imargument-pure-imaginary · **Confidence:** high

## Behavior summary

`IMDIV(a, b)` divides two complex numbers; `IMARGUMENT(z)` returns the argument (phase angle) of a complex number in radians. Both are broadly portable in the ordinary case, but two edge cases produce interesting divergences: dividing by zero (IMDIV) and taking the argument of a pure-imaginary number (IMARGUMENT).

## Divergences

### 1. IMDIV by zero — #NUM! vs #DIV/0! (error-code split)

| formula               | excel / formulas / hyperformula / ironcalc | gsheets / lattice | pycel  | libreoffice |
| --------------------- | ------------------------------------------ | ----------------- | ------ | ----------- |
| `=IMDIV("1+2i", "0")` | **#NUM!**                                  | **#DIV/0!**       | #NAME? | _(blank)_   |

Live probe confirms HyperFormula, IronCalc, and formulas all return `#NUM!`. The `#NUM!` branch treats division by a zero-modulus complex number as a **numeric-domain failure of the IMDIV algorithm** (the algorithm computes `1/|b|^2` and rejects the zero denominator as out of domain), while the `#DIV/0!` branch (Google Sheets, Lattice) **surfaces the underlying division-by-zero** directly. pycel returns `#NAME?` because it does not implement IMDIV at all (see `DV-0001`). **Cause bucket: error-code.**

This is distinct from `DV-0045`, which records the `formulas` engine returning `#NUM!` for the _non-error_ `IMDIV/imdiv-by-real` case — a different test and a different story.

### 2. IMARGUMENT of a pure imaginary — formulas emits a spurious #DIV/0!

| formula            | excel / gsheets / hyperformula / ironcalc / lattice                                                   | formulas    | pycel  | libreoffice |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ----------- | ------ | ----------- |
| `=IMARGUMENT("i")` | pi/2 = 1.5707963267948966 (grouped within tolerance; ironcalc 1.570796327, hyperformula 1.5707963268) | **#DIV/0!** | #NAME? | _(blank)_   |

Live probe confirms `formulas` returns `#DIV/0!` for `IMARGUMENT("i")`, whereas HyperFormula returns 1.5707963268 and IronCalc 1.570796327. The mechanism: `formulas` computes the argument via an arctangent of `imaginary/real` and does **not** special-case a zero real part, so a pure-imaginary operand divides by zero. The correct engines special-case the imaginary axis to `+pi/2`. **Cause bucket: error-attribution** (formulas raises where the others produce a finite value). This is a genuine `formulas`-library bug, not a spec difference — the mathematically correct answer for `arg(i)` is `pi/2`.

### 3. IMARGUMENT basic — only pycel + LibreOffice diverge

`=IMARGUMENT("3+4i")` = `atan2(4,3)` = 0.9272952180016122 is agreed within tolerance by all six computing engines (they differ only in displayed precision: formulas 0.9272952180016122, hyperformula 0.927295218, ironcalc 0.927295218 — all one class under numeric tolerance). The only fork is pycel (`#NAME?`, no IMARGUMENT for complex strings; `DV-0001` records pycel-missing for `IMARGUMENT/imargument-real-positive`) plus the LibreOffice blank fixture.

## Edges explored beyond the corpus

- Live: HyperFormula, IronCalc, and formulas all return `#NUM!` for `IMDIV("1+2i","0")`, and `formulas` returns `#DIV/0!` for `IMARGUMENT("i")` while the others compute pi/2 — the two branches are reproducible and stable.

## Wiki-facing notes

- **IMDIV divide-by-zero is not portable in error code:** Excel/HyperFormula/IronCalc/formulas give `#NUM!`, Google Sheets/Lattice give `#DIV/0!`. Any formula that tests `ISERR`/`IFERROR` will catch both, but a formula that branches on the _specific_ error type (e.g. `ERROR.TYPE`) will behave differently across engines.
- **IMARGUMENT("i") is a known `formulas`-library defect:** it returns `#DIV/0!` instead of `pi/2`. All spreadsheet products (Excel, Google Sheets) and the other engines return `pi/2` correctly. If the wiki documents IMARGUMENT edge cases, note this as a formulas-engine bug for pure-imaginary (zero real part) inputs.
- pycel does not implement IMDIV or IMARGUMENT-of-complex-string (`#NAME?`).

## Open questions

- `engineering-002`: confirm `IMDIV("1+2i", "0+0i")` reproduces the same `#NUM!` (Excel) vs `#DIV/0!` (gsheets) split as the `"0"` divisor, i.e. the error code is a property of zero-divisor handling, not of how zero is spelled.
