# FORECAST / FORECAST.LINEAR — cross-engine deep dive

**Batch:** stat-analytics · **Refs:** FORECAST/forecast-linear-fit, FORECAST.LINEAR/forecast-linear-canonical · **Confidence:** high

## Behavior summary

`FORECAST(x, known_ys, known_xs)` predicts a y-value at `x` from a simple linear regression of `known_ys` on `known_xs`. `FORECAST.LINEAR` is the 2016 rename with identical semantics (`FORECAST` is retained as the legacy alias). Both corpus cases fit the same line and expect `5.8`.

## Divergences

`=FORECAST(6, B1:B5, A1:A5)` and `=FORECAST.LINEAR(6, B1:B5, A1:A5)`:

| engine       | FORECAST              | FORECAST.LINEAR   |
| ------------ | --------------------- | ----------------- |
| excel        | 5.8                   | 5.8               |
| formulas     | 5.800000000000001     | 5.800000000000001 |
| gsheets      | 5.8                   | 5.8               |
| lattice      | 5.8                   | 5.8               |
| pycel        | **5.799999999999999** | **#NAME?**        |
| hyperformula | #NAME?                | #NAME?            |
| ironcalc     | #NAME?                | #NAME?            |
| libreoffice  | blank                 | blank             |

The coverage matrix is the whole story (cause: **missing-function**):

- **excel, formulas, gsheets, lattice** — implement both names.
- **hyperformula, ironcalc** — implement **neither** (live-confirmed: both `FORECAST` and `FORECAST.LINEAR` => #NAME?). Unlike COVAR/FTEST/etc., ironcalc does not even have the modern `FORECAST.LINEAR`.
- **pycel** — asymmetric: implements the legacy `FORECAST` (returns `6.099999999999997` on the probe grid, `5.799999999999999` on the corpus grid) but NOT `FORECAST.LINEAR` (#NAME?). Live-confirmed.

So `FORECAST/forecast-linear-fit` has pycel in the numeric class, while `FORECAST.LINEAR/forecast-linear-canonical` has pycel in the #NAME? class — the only structural difference between the two forks.

This extends DV-0215 (which recorded hyperformula/ironcalc #NAME? for `FORECAST/forecast-exact-linear`) and DV-0013 (which listed `FORECAST.LINEAR` among hyperformula/ironcalc/libreoffice/pycel unimplemented) — the new datum is the pycel legacy-vs-modern asymmetry.

## Edges explored beyond the corpus

Live batch (probe grid A1:A5=1,2,3,5,4 / B1:B5=2,3,5,4,6, x=6):

- pycel `FORECAST` => 6.099999999999997, pycel `FORECAST.LINEAR` => #NAME?.
- hyperformula/ironcalc => #NAME? for both.

## Wiki-facing notes

- **Portability ranking:** legacy `FORECAST` is the more portable spelling — supported by Excel, Sheets, Lattice, formulas AND pycel. `FORECAST.LINEAR` drops pycel.
- **Neither** name works on HyperFormula or IronCalc; use `SLOPE`/`INTERCEPT` composition only if those are available (note: hyperformula lacks INTERCEPT too — see hyperformula-regression-gaps.md — so linear extrapolation is genuinely unavailable there without manual arithmetic).

## Open questions

None — coverage fully live-confirmed on the four pure engines.
