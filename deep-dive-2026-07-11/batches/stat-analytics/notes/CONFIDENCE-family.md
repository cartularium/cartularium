# CONFIDENCE / CONFIDENCE.T / CONFIDENCE.NORM — cross-engine deep dive

**Batch:** stat-analytics · **Refs:** CONFIDENCE/confidence-normal-95, CONFIDENCE/confidence-normal-99, CONFIDENCE.T/confidence-t-medium-sample, CONFIDENCE.T/confidence-t-small-sample · **Confidence:** high

## Behavior summary

These functions return the half-width of a confidence interval for a population mean. `CONFIDENCE`/`CONFIDENCE.NORM` use the normal distribution: `NORM.S.INV(1 - alpha/2) * sigma / sqrt(n)`. `CONFIDENCE.T` uses the Student-t distribution: `T.INV.2T(alpha, n-1) * s / sqrt(n)`. `CONFIDENCE` is the pre-2010 name; `CONFIDENCE.NORM` is its modern successor (identical semantics). All engines that implement a given name agree on the mathematics; the divergences are (a) which _name_ each engine ships and (b) small differences in the inverse-distribution approximations.

## Divergences

### CONFIDENCE (legacy normal name) — `=CONFIDENCE(0.05, 1, 100)`

| engine       | result              | class                       |
| ------------ | ------------------- | --------------------------- |
| excel        | 0.19599639845400538 | consensus                   |
| formulas     | 0.19599639845400535 | consensus (ULP)             |
| hyperformula | 0.19599639845       | consensus (rounded display) |
| lattice      | 0.1959963984539396  | consensus (ULP)             |
| gsheets      | 0.1959963986120195  | **diverges @ ~8th sig fig** |
| ironcalc     | #NAME?              | legacy name not implemented |
| pycel        | #NAME?              | not implemented             |
| libreoffice  | blank               | recording gap               |

Two mechanisms in one fork:

- **ironcalc** ships only `CONFIDENCE.NORM`, not the legacy `CONFIDENCE`. Live-confirmed: `CONFIDENCE(0.05,1,100)` => `#NAME?`, but `CONFIDENCE.NORM(0.05,1,100)` => `0.195996398`. Cause: missing-function.
- **gsheets** computes a value that departs from the excel/formulas/hyperformula/lattice consensus at the 8th significant figure (`0.1959963986120195` vs `0.19599639845400538`; and for the 99% case `0.9106931848827708` vs `0.9106931838592245`). This is a genuine difference in Google's inverse-normal (`NORM.S.INV`) approximation, well beyond IEEE last-ULP noise. Cause: precision.

### CONFIDENCE.T (Student-t) — `=CONFIDENCE.T(0.05, 2.5, 50)`

| engine       | result             | class                       |
| ------------ | ------------------ | --------------------------- |
| excel        | 0.7104921387393245 | consensus                   |
| formulas     | 0.7104921387393246 | consensus (ULP)             |
| gsheets      | (consensus)        | consensus                   |
| ironcalc     | 0.710492139        | consensus (rounded display) |
| lattice      | 0.7104921387393219 | consensus (ULP)             |
| hyperformula | 0.71049212538      | **diverges @ ~8th sig fig** |
| pycel        | #NAME?             | not implemented             |
| libreoffice  | blank              | recording gap               |

Here **hyperformula** is the outlier: `0.71049212538` vs the consensus `0.7104921387393245`, and `0.41277970947` vs `0.4127797123256051` for the small-sample case. Live-reproduced exactly. The difference is in hyperformula's inverse-t (`T.INV.2T`) routine — an algorithmic approximation difference, not rounding. Cause: precision. Interestingly hyperformula's _normal_ inverse (used by `CONFIDENCE`) matches the consensus, so only its t-inverse is affected.

## Edges explored beyond the corpus

- Live probe on hyperformula/ironcalc/formulas/pycel confirmed: ironcalc `CONFIDENCE`=>#NAME?, `CONFIDENCE.NORM`=>0.195996398, `CONFIDENCE.T`=>0.710492139. hyperformula implements all three of `CONFIDENCE`/`CONFIDENCE.NORM`/`CONFIDENCE.T`, and its `CONFIDENCE`/`CONFIDENCE.NORM` both return `0.19599639845` (consensus) — the divergence is isolated to the t-variant.
- pycel implements none of the three (all #NAME?).

## Wiki-facing notes

- Portability: for **ironcalc**, use `CONFIDENCE.NORM`, not the legacy `CONFIDENCE`.
- **gsheets** returns a slightly different value for `CONFIDENCE`/`CONFIDENCE.NORM` (8th-sig-fig level) because Google's inverse-normal approximation differs from Excel's — safe to ignore for any practical confidence-interval use, but do not expect bit-identical agreement with Excel.
- **hyperformula**'s `CONFIDENCE.T` agrees only to ~7 significant figures with Excel; its `T.INV`-family approximation is the least precise of the engines here.
- **pycel** does not support the CONFIDENCE family at all.

## Open questions

- Confirm the gsheets `CONFIDENCE` value `0.1959963986120195` is stable on live Google Sheets (probe stat-analytics-003).
