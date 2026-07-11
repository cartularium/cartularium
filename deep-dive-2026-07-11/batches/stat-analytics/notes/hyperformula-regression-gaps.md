# HyperFormula & pycel regression/moment gaps (KURT, INTERCEPT, SLOPE) — cross-engine deep dive

**Batch:** stat-analytics · **Refs:** KURT/kurt-canonical, KURT/kurt-inline, KURT/kurt-peaked, INTERCEPT/intercept-canonical, SLOPE/slope-linear-fit · **Confidence:** high

## Behavior summary

These are the higher-moment and simple-linear-regression primitives. `KURT` = sample excess kurtosis; `SLOPE`/`INTERCEPT` = slope and y-intercept of the least-squares line. Every engine that implements a given function agrees to float precision; the interesting structure is _which_ engines are missing each one, which reveals HyperFormula's partial regression/moment coverage.

## Divergences

### KURT — `=KURT(A1:A5)` (and inline-args form)

| engine                                          | result       | class           |
| ----------------------------------------------- | ------------ | --------------- |
| excel / formulas / gsheets / ironcalc / lattice | -1.2 (± ULP) | implements      |
| hyperformula                                    | #NAME?       | not implemented |
| pycel                                           | #NAME?       | not implemented |
| libreoffice                                     | blank        | recording gap   |

hyperformula and pycel both lack KURT (live-confirmed: `KURT(A1:A5)` => #NAME? on both). Note ironcalc **does** implement KURT (returns -1.2), unlike the legacy-alias functions. The inline-args form (`=KURT(3,4,5,...)`) behaves identically — the gap is the function, not the argument shape.

### INTERCEPT — `=INTERCEPT(B1:B5, A1:A5)`

| engine                                                      | result      | class           |
| ----------------------------------------------------------- | ----------- | --------------- |
| excel / formulas / gsheets / ironcalc / lattice / **pycel** | 2.2 (± ULP) | implements      |
| hyperformula                                                | #NAME?      | not implemented |
| libreoffice                                                 | blank       | recording gap   |

Only hyperformula lacks INTERCEPT (live-confirmed). pycel implements it (returns 1.8999999999999966 on the probe grid).

### SLOPE — `=SLOPE(B1:B5, A1:A5)`

| engine                                                                 | result      | class         |
| ---------------------------------------------------------------------- | ----------- | ------------- |
| excel / formulas / gsheets / hyperformula / ironcalc / lattice / pycel | 0.6 (± ULP) | implements    |
| libreoffice                                                            | blank       | recording gap |

All seven live engines — **including hyperformula** — implement SLOPE. The only outlier is the libreoffice blank recording gap.

## The finding: HyperFormula's linear-regression coverage is incomplete and asymmetric

Putting SLOPE, INTERCEPT and FORECAST together:

| function                       | hyperformula                |
| ------------------------------ | --------------------------- |
| SLOPE                          | ✅ implemented              |
| INTERCEPT                      | ❌ #NAME?                   |
| FORECAST / FORECAST.LINEAR     | ❌ #NAME? (see FORECAST.md) |
| CORREL / PEARSON / RSQ / STEYX | ✅ implemented              |

So HyperFormula can give you the slope of a fit but not its intercept or a forecast — you cannot do a full linear extrapolation on HyperFormula from these built-ins alone. pycel has the mirror-image gap on the moment side (no KURT, no SKEW/CONFIDENCE/CORREL — see the pycel note) but _does_ have SLOPE/INTERCEPT/FORECAST.

## Edges explored beyond the corpus

Live batch confirmed: hyperformula `SLOPE`=>0.7, `INTERCEPT`=>#NAME?, `KURT`=>#NAME?, `FORECAST`=>#NAME?; ironcalc `KURT`=>-1.2; pycel `INTERCEPT`=>1.899..., `SLOPE`=>0.700..., `KURT`=>#NAME?.

## Wiki-facing notes

- **KURT**: not available on HyperFormula or pycel. Available on Excel, Sheets, IronCalc, Lattice, formulas.
- **INTERCEPT**: not available on HyperFormula (but SLOPE is). If you need an intercept on HyperFormula, compute `AVERAGE(y) - SLOPE(y,x)*AVERAGE(x)` manually.
- **SLOPE**: universally supported (only the libreoffice recording is blank).

## Open questions

- Confirm real LibreOffice returns numbers (not blank) for KURT/INTERCEPT/SLOPE (probe stat-analytics-004; this is the suite-wide recording-gap question).
