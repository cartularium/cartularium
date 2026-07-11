# Time-value functions — precision & degenerate-fork taxonomy

**Batch:** financial · **Subjects:** CUMIPMT, CUMPRINC, DB, DDB, NPER, NPV, PMT, PPMT, ISPMT, PV, RATE, IRR, MIRR · **Confidence:** high

## The pattern

Almost every time-value fork in this batch is _not_ an algorithmic divergence. The core annuity /
depreciation / cash-flow functions are broadly implemented (Excel, `formulas`, Google Sheets,
HyperFormula, IronCalc, Lattice); pycel is the main gap (`#NAME?`, per DV-0001) and LibreOffice is
blank (harness gap). The forks arise from three benign sources, in decreasing order of frequency:

1. **IronCalc reduced-precision read-back** — IronCalc lands in its own class purely because its
   captured value has fewer digits. See `ironcalc-display-precision.md`. Affects CUMIPMT (both),
   CUMPRINC first-year, DB, DDB, NPER, NPV five-year, PMT, MIRR (both), IRR growing.

2. **Iterative-solver tolerance** — the root-finders (IRR, RATE) converge to slightly different
   roots. RATE mortgage-implied spreads over ~1e-11 (0.004166644536345589 / …359948 / …337786 /
   Lattice …36018). IRR simple-project sits at a **near-zero root**, so the "answers" are just
   different tiny residuals: exact 0 (gsheets), 1.28e-17, 7.83e-18, 2.93e-17 (IronCalc), up to
   Excel's 1.95e-12 — a vivid example that a zero IRR is reported as assorted floating-point dust.

3. **Degenerate forks (no computing-engine divergence)** — the fork exists only because pycel is
   missing and/or LibreOffice is blank; the implementing engines agree exactly or to one ULP:
   - `PV/pv-zero-rate` = 1000 exactly (all but pycel `#NAME?` / libreoffice blank).
   - `RATE/rate-unreachable` = `#NUM!` for all implementers (the target is unreachable) — pycel
     `#NAME?`, libreoffice blank.
   - `CUMPRINC/cumprinc-full-life-equals-principal` ≈ -100000 with ULP noise (the sum of principal
     over the full loan life equals the original principal, as it must).
   - `ISPMT/ispmt-mid-loan` ≈ -64814.8148, `PPMT/ppmt-first-period-mortgage` ≈ 240.3099 — ULP noise.

## Cause buckets

Sources 1 and 2 are `precision`; source 3 is `missing-function` (pycel is the substantive splitter;
`NPV/npv-zero-rate` is the lone libreoffice-only fork, filed as `TODO`).

## Wiki-facing notes

- The annuity/cash-flow/depreciation core (PMT, PV, FV-adjacent, NPER, RATE, IRR, MIRR, NPV,
  CUMIPMT, CUMPRINC, DB, DDB, ISPMT, PPMT) is portable across Excel, Google Sheets, HyperFormula,
  IronCalc, and Lattice. pycel is the notable omission.
- Compare results to a tolerance: IronCalc rounds to display precision, and the root-finders
  (IRR/RATE/MIRR) differ from Excel at ~1e-8..1e-11. Never test these for exact cross-engine equality.
- A computed IRR "of zero" will not read back as exactly 0 in most engines — expect values like
  1e-17..1e-12. Treat |IRR| < ~1e-9 as zero.

## Open questions

- None blocking; these are well-understood precision/support effects. The only re-recording need is
  the LibreOffice lane (see `libreoffice-financial-gap.md`).
