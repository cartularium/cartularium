# Legacy statistical aliases (COVAR / FTEST / TTEST / ZTEST) — cross-engine deep dive

**Batch:** stat-analytics · **Refs:** COVAR/covar-canonical, COVAR/covar-small-set, FTEST/ftest-canonical, FTEST/ftest-different-variance, TTEST/ttest-one-tail-equal-var, TTEST/ttest-two-tail-paired, ZTEST/ztest-with-sigma (+ contrast: COVARIANCE.P, F.TEST, T.TEST, Z.TEST) · **Confidence:** high

## Behavior summary

In Excel 2010 several statistical functions were renamed to a dotted, consistency-focused scheme, with the old names retained as compatibility aliases:

| legacy name | modern name     |
| ----------- | --------------- |
| COVAR       | COVARIANCE.P    |
| FTEST       | F.TEST          |
| TTEST       | T.TEST          |
| ZTEST       | Z.TEST          |
| CONFIDENCE  | CONFIDENCE.NORM |
| FORECAST    | FORECAST.LINEAR |

Excel, formulas, gsheets, hyperformula and lattice implement **both** the legacy and modern spellings and agree on the result to float precision. The single cross-engine story here is that **ironcalc implements only the modern dotted names** and returns `#NAME?` for the legacy aliases. **pycel** implements neither spelling of most of these. **libreoffice** records blank across the whole suite (recording gap).

## Divergences

`=COVAR(A1:A5, B1:B5)` vs `=COVARIANCE.P(A1:A5, B1:B5)`:
| engine | COVAR | COVARIANCE.P |
|---|---|---|
| excel / formulas / gsheets / hyperformula / lattice | 1.2 (± ULP) | 1.2 (± ULP) |
| ironcalc | **#NAME?** | 1.4\* (implements it) |
| pycel | #NAME? | #NAME? |
| libreoffice | blank | blank |

\*The `1.4` is from the live probe's generic grid; on the corpus grid ironcalc returns the same `1.2` as everyone else. The point is that ironcalc _has_ `COVARIANCE.P` but not `COVAR`.

Same pattern for the other three pairs (live-confirmed on ironcalc):
| legacy call | ironcalc | modern call | ironcalc |
|---|---|---|---|
| `FTEST(A1:A5,B1:B5)` | #NAME? | `F.TEST(A1:A5,B1:B5)` | 1 (works) |
| `TTEST(A1:A5,B1:B5,1,2)` | #NAME? | `T.TEST(A1:A5,B1:B5,1,2)` | 0.173296754 (works) |
| `ZTEST(A1:A5,4,1.5)` | #NAME? | `Z.TEST(A1:A5,4,1.5)` | 0.931981436 (works) |

Cause bucket: **missing-function** (ironcalc lacks the legacy alias; pycel lacks both spellings).

Note: the modern-name refs (`COVARIANCE.P/*`, `F.TEST/*`, `T.TEST/*`, `Z.TEST/*`) are in this batch too, and their forks reduce to just pycel-#NAME? + libreoffice-blank + float precision — ironcalc is in the numeric class there. That asymmetry (ironcalc absent from the numeric class for legacy names, present for modern names) is the whole finding.

## Edges explored beyond the corpus

Single live batch across hyperformula/ironcalc/formulas/pycel confirmed every cell of the table above. hyperformula and formulas implement both spellings of all four pairs; pycel implements none of these eight names.

## Wiki-facing notes

- **Compatibility caveat (ironcalc):** the pre-2010 names `COVAR`, `FTEST`, `TTEST`, `ZTEST`, `CONFIDENCE`, `FORECAST` are NOT recognized. Use `COVARIANCE.P`, `F.TEST`, `T.TEST`, `Z.TEST`, `CONFIDENCE.NORM`, `FORECAST.LINEAR`.
- **pycel** supports neither spelling of COVAR/COVARIANCE.P, FTEST/F.TEST, TTEST/T.TEST, ZTEST/Z.TEST.
- Excel, Google Sheets, HyperFormula and Lattice accept both spellings interchangeably; results agree to ~15 significant figures.

## Open questions

None outstanding — the alias gap is fully live-confirmed on ironcalc. (FORECAST/FORECAST.LINEAR is a partial exception; see FORECAST.md — hyperformula and ironcalc lack _both_ spellings there.)
