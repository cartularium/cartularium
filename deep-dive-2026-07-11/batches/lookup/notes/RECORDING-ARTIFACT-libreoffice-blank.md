# Recording artifact — libreoffice blank across lookup / lookup-longtail

**Batch:** lookup · **Confidence:** high · **Not a wiki page — an evidence-quality note for the reconciler and assay maintainers.**

## What this is

In this batch, `libreoffice` appears as a separate agreement class — recorded as **blank** — in almost
every fork that carries a libreoffice branch. It is **not** behavior. The libreoffice recording for the
entire lookup and lookup-longtail suites (`fixtures/lookup/libreoffice.json` and
`fixtures/lookup-longtail/libreoffice.json`, `generatedAt` 2026-05-11) returns `{"result": [[null]]}` for
**every** case — all 17 lookup and all 55 lookup-longtail entries, including trivially-correct ones.

Direct evidence (from the fixture files):

```
=INDEX(A1:B2, 2, 1)  -> {"result": [[null]], ...}   (should be 3)
=INDEX(A1:A3, 2)     -> {"result": [[null]], ...}   (should be 20)
=INDEX(A1:A2, 5)     -> {"result": [[null]], ...}   (should be #REF!)
```

LibreOffice Calc implements INDEX, MATCH, ROW, COLUMN, LOOKUP, ADDRESS, CHOOSECOLS/CHOOSEROWS (recent
builds), etc. A blank for `=ROW(A1)` (which is `1` in any spreadsheet) can only be a capture / ingestion
failure of that recording run — the whole suite came back empty.

## Which refs are affected

Every fork below is a **pure artifact** — all engines that actually evaluated agree, and libreoffice-blank
is the _only_ dissenting class:

- INDEX/index-row-and-column, INDEX/index-single-column
- MATCH/match-exact, MATCH/match-approximate, MATCH/match-not-found
- COLUMN/column-a1, COLUMN/column-c1, COLUMN/column-z1
- ROW/row-a1, ROW/row-a5, ROW/row-c10, ROW/row-no-arg

These 12 refs are covered by the single "libreoffice-blank artifact" annotation (cause TODO).

libreoffice-blank _also_ appears as an extra branch inside genuinely-divergent forks (CHOOSECOLS,
CHOOSEROWS, XMATCH, INDEX/index-out-of-bounds, COLUMN/column-range-first-col, ROW/row-range-first-row,
COLUMN/column-no-arg, LOOKUP/lookup-array-form). In those, the libreoffice branch should be disregarded;
the real mechanism is documented in the corresponding subject note. (FORMULATEXT, SHEET, GETPIVOTDATA have
no libreoffice branch at all — they are `external-io` and libreoffice was skipped there.)

## Recommended action

Re-record the libreoffice lookup and lookup-longtail suites. Until then, treat any libreoffice=blank class
in these two suites as missing data, not as a `#N/A`/`blank`/`null` result. If the fork's only division is
libreoffice-blank, it should not count as a divergence at all.
