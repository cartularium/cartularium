# The suite-wide libreoffice "blank" recording gap — cross-cutting meta-finding

**Batch:** stat-analytics · **Refs:** ALL 41 refs in this batch (every case has a libreoffice=blank branch) · **Confidence:** high

## What was observed

In every single case across statistical-analytics (35), database (2) and external (4), the recorded libreoffice fixture value is `{ "c": "blank" }`. This includes cases where blank is impossible as a genuine result:

- `=TRUE()` → libreoffice recorded `blank` (no engine returns blank for the TRUE literal).
- `=FALSE()` → `blank`.
- `=CORREL(A1:A5, B1:B5)`, `=SLOPE(...)`, `=T.TEST(...)`, `=KURT(...)` → all `blank`, while every other engine returns a number.

A blank cell is what a spreadsheet shows for an _empty_ cell or an uncomputed formula — not what LibreOffice Calc returns for these well-defined functions (LibreOffice implements CORREL, SLOPE, T.TEST, KURT, TRUE, FALSE, DSTDEV, etc.).

## Interpretation

This is a **recording / ingestion gap in the libreoffice lane**, not genuine LibreOffice behavior. The most likely mechanisms:

- the libreoffice recordings for these suites were never populated (the lane ran but results were dropped), or
- the harness read the pre-calculation cell state (formulas not yet recalculated → blank) rather than computed values.

Either way, the libreoffice `blank` branch should be treated as **"no data"**, not as an engine that disagrees. It manufactures a spurious extra agreement class in every fork in this batch.

Under the no-verdict principle, the annotations describe the branch factually ("libreoffice records blank") and attribute it to a recording gap (cause `TODO` on the cleanest exemplar, TRUE/FALSE); they do NOT claim LibreOffice computes blank.

## Impact on the fork catalogue

- Every fork in this batch would lose one agreement class (the libreoffice-blank class) if the lane were re-recorded — many would remain forks only because of float precision + a genuine missing-function branch (pycel/ironcalc/hyperformula).
- A few refs (e.g. SLOPE/slope-linear-fit, lit:boolean/true-basic, lit:boolean/false-basic) would likely **cease to be forks entirely** once libreoffice is re-recorded, since libreoffice-blank is their ONLY categorical divergence.

## Recommended action

Re-record the libreoffice lane for statistical-analytics, database and external (and probably the whole corpus — this pattern is unlikely to be suite-local). Probe stat-analytics-004 asks the libreoffice lane owner to confirm that real LibreOffice returns `TRUE` for `=TRUE()` and numbers for `=CORREL(...)`/`=SLOPE(...)`; a positive result confirms the gap and justifies a full re-record.

## Cross-batch note

Other analyst batches in this fan-out are very likely seeing the identical libreoffice=blank pattern in their suites. This should be reconciled as a **single cross-suite libreoffice recording defect**, not 877 independent libreoffice divergences.
