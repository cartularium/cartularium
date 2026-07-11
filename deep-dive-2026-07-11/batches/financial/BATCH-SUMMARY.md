# Batch financial — SUMMARY

**Suites:** financial-securities (35 forks) + financial-timevalue (28 forks) = **63 uncovered forks**
**Coverage:** 63/63 refs annotated across **12 explanation clusters**; **0 skipped**.

## Headline findings

1. **Two engine tiers dominate the securities suite.** The bond-analytics family (ACCRINTM, DISC,
   DURATION, MDURATION, INTRATE, PRICE, PRICEDISC, PRICEMAT, RECEIVED, YIELD, YIELDDISC, YIELDMAT)
   and VDB are implemented only by Excel, Google Sheets, the `formulas` library, and Lattice;
   HyperFormula, IronCalc, and pycel return `#NAME?`. Confirmed live (HyperFormula `#NAME?` for
   ACCRINT/PRICE/YIELD/DISC/VDB). Cause: missing-function — one mechanism covers 29 refs.

2. **XNPV `#VALUE!` is a text-date coercion divergence, not an XNPV-value divergence — live-proven.**
   The corpus seeds date cells as ISO strings. Excel, Google Sheets, and HyperFormula reject text
   dates (`#VALUE!`); `formulas`, IronCalc, and Lattice coerce them and compute. Isolated live:
   HyperFormula XNPV returns 908.85 on numeric date serials but `#VALUE!` on ISO strings; IronCalc
   and `formulas` return the number either way. Portability rule: XNPV date cells must hold real
   dates, not text. (Excel/gsheets confirmation requested — financial-001.)

3. **ACCRINT genuinely disagrees on day count.** For basis-1 (actual/actual), Excel/gsheets give a
   full coupon 57.5 while `formulas` (57.4208) and Lattice (57.4213) compute a sub-1.0 day fraction.
   For basis-0 (30/360) three different values appear: Excel 295.8333, gsheets/Lattice 295.5556,
   `formulas` 295.2778 — 30/360 month-end handling differs by engine. Both `formulas` values
   reproduced live. Strongest "real" divergence in the batch. (Excel/gsheets confirm — financial-004.)

4. **IronCalc reports at display precision (cross-cutting).** IronCalc repeatedly forms its own
   agreement class only because its captured value has fewer digits (e.g. CUMIPMT -4966.49 vs
   -4966.494130578189). Reproduced live for CUMIPMT/PMT/NPER/DDB/NPV/IRR/MIRR/TBILLYIELD/IPMT — a
   value-capture read-back, not an algorithmic or stale-fixture difference. Likely a driver-level fix.

5. **Small genuine error-behavior divergences.** RRI(0,…): Excel/formulas/HyperFormula/IronCalc/
   Lattice → `#NUM!`, Google Sheets → `#DIV/0!` (error-code split, live-confirmed for pure engines).
   IPMT last period: the `formulas` library alone returns `#NUM!` where five engines compute
   ~4.4550 (error-attribution, live-confirmed).

6. **Root-finder tolerance.** IRR/RATE/XIRR converge to slightly different roots (~1e-8..1e-11);
   Excel stands alone on XIRR. A zero IRR reads back as assorted 1e-17..1e-12 dust across engines.

7. **LibreOffice recorded blank for all 63 financial forks** — a suite-wide harness gap, not engine
   behavior (LibreOffice Calc implements all these functions). Every annotation flags it; the one
   fork whose _only_ divergence is this blank is `NPV/npv-zero-rate` (filed `TODO`, needs re-record).

## Counts

- **Annotations written:** 12 clusters (annotations.json), covering all 63 refs. Causes:
  missing-function ×2 · precision ×5 (TBILL, DOLLARDE, ironcalc-timevalue, solver-tolerance,
  degenerate-ULP) · arg-semantics ×2 (ACCRINT, XNPV) · error-code ×1 (RRI) · error-attribution ×1
  (IPMT) · TODO ×1 (NPV libreoffice-only).
- **Work-list refs covered:** 63 / 63. **Skipped:** 0 (skipped.json empty).
- **Notes files:** 8 — ACCRINT.md, XNPV-XIRR.md, securities-family.md, ironcalc-display-precision.md,
  RRI-IPMT-error-edges.md, TBILL.md, timevalue-precision.md, libreoffice-financial-gap.md.
- **Probe requests emitted:** 5 (financial-001..005), all Excel/gsheets confirmations of live-derived
  hypotheses (XNPV text vs serial dates, XIRR text-date coercion asymmetry, RRI error codes, ACCRINT
  30/360 split, IPMT last-period).
- **Live probes run:** 2 scratch scripts (scratch/financial-probe1.mts, scratch/financial-probe2.mts)
  over hyperformula/ironcalc/formulas — grounding findings 1, 2, 4, 5.

## What needs excel/gsheets confirmation (single-owner lanes)

- The 5 Excel + Google Sheets probes in probe-requests.json (financial-001..005), highest-value:
  001 (XNPV text vs serial dates) and 004 (ACCRINT 30/360 Excel vs gsheets split).
- Re-record the **LibreOffice** financial lane — currently blank across all 63 cases.
- Optional: verify whether IronCalc's absence of the bond-pricing family is version-skew; pin each
  engine's 30/360 clamping rule for ACCRINT.
