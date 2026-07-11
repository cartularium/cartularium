# INDEX — and the LibreOffice arrays-suite capture artifact — cross-engine deep dive

**Batch:** arrays · **Refs:** INDEX/index-into-grid (+ cross-cutting: the LibreOffice branch of _every_ ref in arrays and array-longtail) · **Confidence:** high

## Behavior summary

`=INDEX(A1:B2, 2, 1)` (with grid A1=10, B1=11, A2=20, B2=21) returns the value at row 2, col 1 of the
range = **20**. INDEX is one of the oldest, most universally supported spreadsheet functions.

## The divergence is not real — it is a recording artifact

`=INDEX(A1:B2, 2, 1)`:

| Engine                                                                 | Result  |
| ---------------------------------------------------------------------- | ------- |
| Excel, Google Sheets, HyperFormula, IronCalc, Lattice, pycel, formulas | `20`    |
| LibreOffice                                                            | `blank` |

Live-confirmed: HyperFormula, IronCalc, pycel, and formulas all return `20`. Seven of eight engines
agree; only LibreOffice diverges, and it diverges to **blank**. LibreOffice Calc has supported INDEX
for decades, so a blank result is impossible as genuine behavior.

This makes INDEX the diagnostic case for a batch-wide problem: **the entire arrays and array-longtail
LibreOffice fixture is a systematic capture failure.** The `libreoffice` fixtures for both suites
(platform `libreoffice`, generatedAt `2026-05-11`) recorded `[[None]]` (blank) for _every_ case,
regardless of function — including universally-supported ones like INDEX, and including simple
constructions like `HSTACK(1,2,3)` and `SEQUENCE(1)` that take no grid input. A whole-suite blank is
the signature of a harness/read-back failure (e.g. the spilled range was never read, or the run
errored to empty), not of real engine behavior.

## Implication for every other annotation in this batch

Across all 40 refs in this batch the LibreOffice branch is `blank`. In each annotation that branch is
described as a recording artifact and should be treated as **missing data**, not as a divergence
class. The correct fix is to re-record the arrays and array-longtail suites on LibreOffice; until
then, LibreOffice compatibility for these two suites is _unknown_, not _blank_.

Contrast: DV-0007 shows that when LibreOffice genuinely lacks a function it returns `#NAME?` (e.g.
BITAND, CEILING.MATH), not blank. The blank here is therefore clearly not "function absent" — it is
"result not captured".

## Cause bucket

`TODO` — this is not a mechanism-of-divergence; it is a measurement gap flagged for re-recording.
The INDEX fork itself has no genuine cross-engine divergence at all (all real engines return 20).

## Wiki-facing notes

- INDEX(range, row, col) is fully portable — all tracked engines agree.
- (Internal/data-quality, not user-facing:) the LibreOffice arrays/array-longtail evidence is not
  usable and needs a re-record.

## Open questions

- Needs a LibreOffice re-record of the arrays and array-longtail suites to replace the blank
  artifact with real results (probe arrays-006 flags this; LibreOffice is not live-probeable in this
  fan-out).
