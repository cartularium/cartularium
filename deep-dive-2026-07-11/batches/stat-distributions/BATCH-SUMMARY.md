# stat-distributions — batch summary

**Suite:** statistical-distributions · **Forks in work-list:** 106 · **All 106 covered, 0 skipped.**

## What this batch is

106 uncovered forks across the spreadsheet statistical-distribution functions (BETA/BINOM/CHISQ/
CHI/EXPON/F/GAMMA/HYPGEOM/LOGNORM/NEGBINOM/NORM/POISSON/T/WEIBULL distributions and their inverses,
plus CONFIDENCE.NORM, FISHER, GAUSS, PHI). The forks are overwhelmingly a **coverage map** — which
engine registers which function name — with the distribution _math itself being portable_: every
engine that implements a function agrees on the value to within floating-point last-place rounding.

## Headline findings

1. **lattice uses the wrong degrees of freedom in CHISQ.TEST / CHITEST** (`arg-semantics`, high
   confidence). For an r×c contingency table lattice uses `df = r·c − 1` instead of Excel's
   `df = (r−1)(c−1)`, producing a materially different p-value (2×3 table: 0.0064 vs 0.00031;
   2×2: 0.799 vs 0.315). Confirmed by back-solving the chi-square statistic on hyperformula and
   reproducing both lattice values to full precision at df=5 and df=3. A real correctness bug, not
   float noise.

2. **The naming-era coverage split.** ironcalc implements only the modern dotted names
   (`NORM.DIST`), never the legacy aliases (`NORMDIST` → `#NAME?`). hyperformula is patchy in
   _both_ eras — it has the `.RT`/`.INV` variants but not the plain `.DIST` bodies
   (`NORM.DIST`/`BETA.DIST`/`POISSON.DIST` → `#NAME?`). pycel implements none of the family except
   `GAMMA`. All confirmed live.

3. **hyperformula's #N/A quirk.** For a specific legacy set (`BETADIST`, `HYPGEOMDIST`,
   `LOGNORMDIST`, `NEGBINOMDIST`, `NORMSDIST`, `LOGINV`) hyperformula returns `#N/A` (registered-
   but-unimplemented) rather than `#NAME?`; `BETADIST` with explicit bounds returns `#NUM!`.
   Extends DV-0072.

4. **lattice cannot parse `T.DIST.2T` / `T.INV.2T`** → `#PARSE!` (specific to the `.2T` name form;
   other `T.*` names parse fine). Portable workaround: `2*T.DIST.RT(ABS(x),df)`.

5. **Precision:** gsheets and hyperformula each carry a distinct inverse-normal approximation
   (~1e-9 offset from Excel), and hyperformula is consistently the least-accurate engine for
   special/inverse functions (GAMMA, NORMINV, TINV, FINV) — good to ~8 sig figs, not full double.

6. **libreoffice recorded blank for all 106 cases** — a recording/harness gap in this suite's
   libreoffice fixture (DV-0004 shows libreoffice emitting `#NAME?` on a sibling case, so it is not
   truly empty). Flagged for re-recording.

## Deliverable counts

- **annotations.json:** 8 annotations (disjoint clusters), covering all **106 / 106** refs, 0
  dupes. Causes: `missing-function` ×6 (clusters A–F), `arg-semantics` ×1 (CHISQ df),
  `precision` ×1 (GAMMA).
- **work-list refs covered:** 106 · **skipped:** 0 (`skipped.json` = `[]`).
- **notes/:** 4 files — `CHISQ.TEST-CHITEST.md` (df divergence, deepest), `distribution-function-
coverage.md` (full legacy/modern/error-code coverage matrix), `T-DIST-family.md` (lattice `.2T`
  parse failure + t coverage), `inverse-precision-and-GAMMA.md` (inverse-normal precision +
  GAMMA/pycel).
- **probe-requests.json:** 4 requests (all excel+gsheets) — CHISQ.TEST degenerate-table df,
  CHISQ.TEST shape mismatch, BETA.DIST out-of-support `#NUM!` baseline, gsheets inverse-normal
  stability re-confirm.

## Grounding

Coverage and error-code claims confirmed **live** on hyperformula / ironcalc / formulas / pycel
(`packages/assay/scratch/stat-distributions-probe1.mts`). The CHISQ.TEST df mechanism confirmed
live by df back-solve (`stat-distributions-probe2.mts`). Excel/gsheets/lattice/libreoffice values
are from the recorded fixtures (those engines are not runnable here). Existing DV-0004 / DV-0072 /
DV-0225 checked — the work-list refs are genuinely uncovered; annotations extend, not duplicate.

## What needs excel/gsheets confirmation (probe requests) or a human

- **Excel/gsheets probes (4, in probe-requests.json):** CHISQ.TEST df at the degenerate 1×N
  boundary; CHISQ.TEST range-shape mismatch error; BETA.DIST out-of-support `#NUM!` baseline;
  gsheets inverse-normal offset stability (`NORM.S.INV(0.99)`).
- **Re-record the libreoffice fixture** for `statistical-distributions` (all-blank recording gap).
- **File with the lattice maintainer** (not confirmable via Excel/gsheets): the CHISQ.TEST/CHITEST
  degrees-of-freedom bug and the `T.DIST.2T`/`T.INV.2T` `#PARSE!` bug.
