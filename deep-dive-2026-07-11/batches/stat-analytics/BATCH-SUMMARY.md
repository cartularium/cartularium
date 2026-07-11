# stat-analytics batch — SUMMARY

**Suites:** statistical-analytics (35) + database (2) + external (4) = **41 uncovered forks.**
**Coverage:** 41/41 refs annotated across 12 annotation clusters, **0 skipped.** All grounded in recorded fixtures + live probes on the four pure engines (hyperformula, ironcalc, formulas, pycel).

## Headline findings

1. **ironcalc ships only the modern (post-2010) dotted function names.** Live-confirmed: `COVAR`/`FTEST`/`TTEST`/`ZTEST`/`CONFIDENCE`/`FORECAST` all → `#NAME?`, while `COVARIANCE.P`/`F.TEST`/`T.TEST`/`Z.TEST`/`CONFIDENCE.NORM` compute fine. Wiki portability rule: use the dotted names on IronCalc. (9 refs)

2. **MARGINOFERROR is a genuine Google Sheets function, fully resolved.** Its wiki page documents `MARGINOFERROR(range, c) = CONFIDENCE.T(1-c, STDEV(range), COUNT(range))`; I verified that identity live (hyperformula/formulas reproduce the recorded gsheets/lattice values to ~13 sig figs). Present only on gsheets + lattice; `#NAME?` on all five Excel-lineage/OSS engines. (2 refs)

3. **Two genuine algorithmic (non-ULP) precision divergences:** hyperformula's inverse-t makes `CONFIDENCE.T` differ from consensus at the 8th significant figure (`0.71049212538` vs `0.7104921387393245`, live-reproduced); gsheets's inverse-normal makes `CONFIDENCE`/`CONFIDENCE.NORM` differ at the 8th sig fig (`0.1959963986120195` vs `0.19599639845400538`).

4. **FORECAST-family coverage is asymmetric:** excel/formulas/gsheets/lattice have both names; hyperformula/ironcalc have neither; **pycel has legacy `FORECAST` but not `FORECAST.LINEAR`.** (2 refs)

5. **HyperFormula's linear-regression coverage is partial:** `SLOPE` yes, `INTERCEPT` no, `FORECAST` no — no full linear extrapolation from these built-ins. pycel has the mirror-image gap (no KURT/SKEW/CONFIDENCE/CORREL, but has SLOPE/INTERCEPT/FORECAST).

6. **DSTDEV** matches the DSUM/DV-0011 partition: excel/gsheets/ironcalc/lattice implement the D\* family; formulas/hyperformula/pycel return `#NAME?`. The `#NAME?` (formulas/hf/pycel) vs `#VALUE!` (ironcalc, malformed grid) split is a clean absent-vs-present probe.

7. **Cross-cutting defect — the libreoffice lane records `blank` for ALL 41 cases**, including `=TRUE()` and `=SLOPE(...)`. This is a recording/ingestion gap, not LibreOffice behavior; it manufactures a spurious extra agreement class in every fork here. Should be reconciled as one cross-suite libreoffice recording defect (see notes/libreoffice-blank-artifact.md); other batches almost certainly see the same pattern. A few refs (SLOPE, TRUE, FALSE) would likely stop being forks once libreoffice is re-recorded.

## Annotation clusters (12)

pycel-only-missing (15 refs) · KURT hf+pycel (3) · legacy-alias ironcalc COVAR/FTEST/TTEST/ZTEST (7) · CONFIDENCE (2) · CONFIDENCE.T hf-divergence (2) · FORECAST family (2) · INTERCEPT hf-missing (1) · SLOPE precision/libo (1) · MARGINOFERROR (2) · DSTDEV (2) · HYPERLINK (2) · TRUE/FALSE libo-artifact (2).

## Counts

- **Annotations written:** 12 clusters covering 41 refs.
- **Work-list refs covered:** 41 / 41. **Skipped:** 0.
- **Notes files:** 8 — CONFIDENCE-family, legacy-aliases, FORECAST, MARGINOFERROR, HYPERLINK, DSTDEV, hyperformula-regression-gaps, libreoffice-blank-artifact.
- **Probe requests emitted:** 4.
- **Live probe scripts:** scratch/stat-analytics-probe1.mts (28 formulas × 4 engines), scratch/stat-analytics-probe2.mts (MARGINOFERROR identity check).

## What needs Excel / Google Sheets confirmation (probe requests)

- **stat-analytics-001** (gsheets): confirm `MARGINOFERROR(A1:A5, 0.05)` = `0.04718417110127355` and equals `CONFIDENCE.T(0.95, STDEV, COUNT)` on-engine — closes the loop on the documented identity (currently grounded via wiki doc + pure-engine reconstruction).
- **stat-analytics-002** (excel, gsheets): what scalar does a HYPERLINK cell expose to a reader — the label string or an opaque rich-link value? Resolves why excel/lattice/libreoffice are absent from the HYPERLINK partition.
- **stat-analytics-003** (excel, gsheets): confirm the gsheets `CONFIDENCE(0.05,1,100)` = `0.1959963986120195` (vs excel `0.19599639845400538`) — the stable inverse-normal divergence.
- **stat-analytics-004** (libreoffice): confirm real LibreOffice returns `TRUE` for `=TRUE()` and numbers for `=CORREL(...)`/`=SLOPE(...)`. **Highest leverage** — touches the libreoffice branch of all 41 refs; a positive result confirms the suite-wide recording gap and justifies a full re-record.

## Confidence

11 of 12 annotations **high** (recorded fixtures + live reproduction). HYPERLINK is **medium** (excel/lattice/libreoffice absent from the partition — value-vs-opaque question open, probe -002).
