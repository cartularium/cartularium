# LibreOffice blank across the entire financial corpus — harness-gap note

**Batch:** financial · **Scope:** every one of the 63 refs in both financial suites · **Confidence:** medium-high

## Observation

In `financial-securities` and `financial-timevalue`, **LibreOffice recorded `blank` for every
single case** — all 35 securities forks and all 28 time-value forks. There is not one financial
formula for which LibreOffice recorded a value or an error.

## Why this is almost certainly a recording gap, not engine behavior

LibreOffice Calc is a mature, full-featured spreadsheet that demonstrably implements ACCRINT, PRICE,
YIELD, IRR, NPV, XNPV, XIRR, CUMIPMT, DDB, VDB, RRI, and the rest — these are standard ODF/OOXML
financial functions that LibreOffice has shipped for years. A uniform `blank` across an entire
functional domain is the signature of a **harness/recording gap** (the LibreOffice lane did not
evaluate or did not capture the financial suites), not of an engine that genuinely returns empty for
every financial function.

Because LibreOffice is a single-owner recording lane that analysts in this fan-out cannot run, I
cannot re-record it here. Every financial annotation in this batch therefore notes the LibreOffice
branch as a suspected harness gap and does not treat "blank" as meaningful engine behavior.

## The one fork where this is the _only_ divergence

`NPV/npv-zero-rate` (`=NPV(0, 100, 200, 300)`) evaluates to **600 in every engine that ran it,
including pycel**. Its sole recorded divergence is LibreOffice's blank — i.e. absent the harness
gap it would not be a fork at all. It is annotated with cause `TODO` and confidence `medium`
pending re-recording.

## Recommended action

- Re-run the LibreOffice lane against both financial suites; the expectation is that LibreOffice
  joins the Excel/Google Sheets agreement classes for almost every case (with its own day-count and
  rounding quirks worth capturing).
- Until re-recorded, downstream consumers and the reconciling pass should **discount the LibreOffice
  branch** in the financial domain rather than surface "LibreOffice returns blank for PRICE/YIELD/…"
  as a compatibility claim.

## Open questions

- Is the blank a lane-wide failure (LibreOffice produced nothing for these suites) or a per-cell
  capture failure? Determines whether a simple re-run fixes it or the harness needs a fix. Needs the
  LibreOffice lane owner.
