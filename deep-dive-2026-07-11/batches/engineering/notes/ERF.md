# ERF / ERF.PRECISE — cross-engine deep dive

**Batch:** engineering · **Refs:** ERF/erf-negative, ERF/erf-one, ERF/erf-zero, ERF/erf-two-arg-lower-upper, ERF.PRECISE/erf-precise-negative, ERF.PRECISE/erf-precise-one · **Confidence:** high

## Behavior summary

`ERF(x)` is the Gauss error function; `ERF(lower, upper)` is the two-argument "error function integrated between two limits" form; `ERF.PRECISE(x)` is the single-argument variant introduced in Excel 2010. The numeric answers are portable within tolerance across every engine that implements them (`ERF(1)`≈0.8427007929497149, `ERF(-1)`≈-0.8427..., `ERF(0)`=0). The forks come entirely from which engines implement which form, plus the systemic LibreOffice blank.

## Divergences

### 1. ERF.PRECISE missing in HyperFormula and pycel (#NAME?)

| formula              | excel / formulas / gsheets / ironcalc / lattice      | hyperformula / pycel | libreoffice |
| -------------------- | ---------------------------------------------------- | -------------------- | ----------- |
| `=ERF.PRECISE(-0.5)` | -0.5204998778130465 (grouped; ironcalc -0.520499878) | **#NAME?**           | _(blank)_   |
| `=ERF.PRECISE(1)`    | 0.8427007929497149 (grouped; ironcalc 0.842700793)   | **#NAME?**           | _(blank)_   |

Live probe: HyperFormula and pycel return `#NAME?` for `ERF.PRECISE(1)`, while IronCalc computes 0.842700793 and formulas 0.8427007929497148. The computing engines agree within numeric tolerance (differing only in displayed precision), so the fork is HyperFormula+pycel (`#NAME?`) vs the rest. **Cause bucket: missing-function.** This extends `DV-0017`, which records the identical HyperFormula/pycel `#NAME?` for `ERF.PRECISE` on a different test (`erf-precise-zero`). Note: `DV-0017` also listed LibreOffice as `#NAME?` for ERF.PRECISE as of 2026-04-25; in the current 2026-05-11 fixture LibreOffice is blank — the same stale-fixture regression seen suite-wide.

### 2. ERF two-argument form: Lattice returns #N/A, pycel #NAME?

| formula      | excel / formulas / gsheets / hyperformula / ironcalc | lattice  | pycel      | libreoffice |
| ------------ | ---------------------------------------------------- | -------- | ---------- | ----------- |
| `=ERF(0, 1)` | 0.8427007929497149 (grouped; = ERF(1) since lower=0) | **#N/A** | **#NAME?** | _(blank)_   |

Live probe: HyperFormula returns 0.84270079295 and IronCalc 0.842700793 for `ERF(0,1)` — the two-argument form works on both. **Lattice** does not implement the `(lower, upper)` form and returns `#N/A` (**cause bucket: missing-arg-form**). pycel returns `#NAME?`, consistent with its refusal of any ERF call outside a single non-negative argument (see below). This one case therefore carries three separate mechanisms: Lattice's missing two-arg form, pycel's arity/domain rejection, and the LibreOffice recording artifact.

### 3. pycel rejects negative single-argument ERF (#NAME?)

| formula      | pycel              | all other computing engines        |
| ------------ | ------------------ | ---------------------------------- |
| `=ERF(1)`    | 0.8427007929497148 | 0.8427007929497149 (± last digit)  |
| `=ERF(0)`    | 0                  | 0                                  |
| `=ERF(-1)`   | **#NAME?**         | -0.8427007929497149 (± last digit) |
| `=ERF(-0.5)` | **#NAME?**         | -0.5204998778130465 (± last digit) |
| `=ERF(0, 1)` | **#NAME?**         | 0.8427007929497149                 |

Live-confirmed. pycel's `ERF` accepts only a single non-negative argument; a negative argument or the two-argument form raises and maps to `#NAME?`. This is the **same negative-domain rejection** pycel shows for `DEC2BIN`/`DEC2HEX`/`DEC2OCT` (see `notes/BASE-CONVERSIONS.md`) — a consistent pycel pattern of `#NAME?`-on-out-of-supported-domain. So `ERF/erf-one` and `ERF/erf-zero` fork only on the LibreOffice blank (pycel computes them), while `ERF/erf-negative` and `ERF/erf-two-arg-lower-upper` additionally carry pycel's `#NAME?`.

## Edges explored beyond the corpus

- HyperFormula computes both `ERF(-1)`=-0.84270079295 and `ERF(0,1)`=0.84270079295 — it supports the negative domain and the two-arg form, and lacks only `ERF.PRECISE`.
- IronCalc computes `ERF.PRECISE(1)`=0.842700793 — it **does** implement ERF.PRECISE (unlike HyperFormula), placing it with Excel/formulas/gsheets/lattice.
- pycel's ERF is the narrowest: single non-negative argument only.

## Wiki-facing notes

- `ERF(x)` single non-negative argument is universal. The **negative-argument** form is portable everywhere except pycel (`#NAME?`). The **two-argument `ERF(lower, upper)`** form is supported by Excel, Google Sheets, HyperFormula, IronCalc, and formulas but **not Lattice** (`#N/A`) or pycel.
- `ERF.PRECISE` is supported by Excel, Google Sheets, IronCalc, formulas, and Lattice, but **not HyperFormula** or pycel (`#NAME?`). Functionally `ERF.PRECISE(x)` == `ERF(x)` for a single argument; consumers targeting HyperFormula should prefer `ERF`.
- Numeric values agree to ~15 digits; only displayed precision differs (IronCalc rounds to ~9 digits, JS engines carry full double).

## Open questions

- `engineering-005`: low-priority live re-confirmation that Excel/gsheets `ERF.PRECISE(-0.5)` ≈ -0.5204998778130465 (already in fixtures).
