# CONVERT — cross-engine deep dive

**Batch:** math-core · **Refs:** CONVERT/convert-meters-to-feet, convert-kilograms-to-pounds, convert-kilometers-to-miles, convert-invalid-unit-pair, convert-unknown-unit · **Confidence:** high

## Behavior summary

CONVERT performs unit conversion (`=CONVERT(number, from_unit, to_unit)`). Support splits: **excel, formulas, gsheets, ironcalc, lattice** implement it; **hyperformula, pycel** do not and return `#NAME?` (confirmed live). This matches DV-0016 (hyperformula/pycel missing CONVERT); the work-list adds the meters/kilograms/kilometers conversions and the two invalid-unit error cases. Among the supporting engines the conversions are numerically identical; they differ only in **recorded precision**, and they agree on **error handling** for bad units.

## Divergences

### Valid conversions — precision-of-record variance

`=CONVERT(1, "m", "ft")`:

| engine              | recorded/observed value | precision                 |
| ------------------- | ----------------------- | ------------------------- |
| excel               | `3.2808398950131235`    | full IEEE-754 double      |
| formulas            | `3.280839895013123`     | full double (live probe)  |
| gsheets             | `3.280839895`           | ~9 dp                     |
| ironcalc            | `3.280839895`           | ~9 dp (live probe)        |
| lattice             | (in supporter class)    | full/rounded per fixtures |
| hyperformula, pycel | `#NAME?`                | function absent (live)    |
| libreoffice         | blank                   | recording gap             |

The same pattern holds for `kg→lbm` (2.2046226218487757 full vs 2.204622622 rounded) and `km→mi` (0.621371192237334 full vs 0.621371192 rounded). The conversion factor is the same everywhere; only the number of significant digits recorded differs. This is why the "supporter" agreement class carries several recorded value variants. Cause bucket: `missing-function` (dominant split) with a `precision` sub-story (extends DV-0206, which recorded the formulas-precision difference for celsius→fahrenheit).

### Invalid units — `#N/A` vs `#NAME?` (different mechanisms, same surface)

| formula                                             | excel/formulas/gsheets/ironcalc/lattice | hyperformula/pycel | libreoffice |
| --------------------------------------------------- | --------------------------------------- | ------------------ | ----------- |
| `=CONVERT(1, "ft", "kg")` (incompatible dimensions) | `#N/A`                                  | `#NAME?`           | blank       |
| `=CONVERT(1, "xyz", "in")` (unknown unit)           | `#N/A`                                  | `#NAME?`           | blank       |

Live probe: ironcalc `=CONVERT(1,"ft","kg")` → `#N/A`; hyperformula, pycel → `#NAME?`. The distinction matters: `#N/A` is the **function rejecting its argument** (units incompatible or unknown — the function exists), whereas `#NAME?` is the **function being absent entirely**. Same visible error family, different cause. Cause bucket: `error-attribution`.

## Edges explored beyond the corpus

- Confirmed ironcalc is a genuine CONVERT supporter (valid conversion computes; invalid pair → `#N/A`), placing it firmly in the supporter class alongside formulas.
- Confirmed hyperformula and pycel emit `#NAME?` for both valid and invalid unit arguments — the error is unit-argument-independent, consistent with a missing function rather than argument validation.

## Wiki-facing notes

- **Portability caveat:** CONVERT is unavailable in HyperFormula and pycel (`#NAME?`). It is available in Excel, Google Sheets, IronCalc, LibreOffice(\*), formulas, and lattice.
- **Precision caveat:** the numeric result is the same conversion, but Excel/formulas expose full double precision while Google Sheets and IronCalc round to ~9 decimals. Downstream exact-equality comparisons across engines can fail on the trailing digits even though the conversion is "the same."
- **Error caveat:** incompatible or unknown units yield `#N/A` in engines that implement CONVERT; treat a `#NAME?` from CONVERT as "engine lacks the function," not "bad units."

## Open questions

- Excel/gsheets live confirmation of the full-double vs 9-dp precision split for `m→ft` — probe **math-core-004**.
- (\*) LibreOffice support is asserted from general knowledge; its recording here is blank due to the suite-wide gap, so assay has no positive evidence for it in these suites.
