# SHEETS — cross-engine deep dive

**Batch:** info · **Refs:** SHEETS/sheets-no-arg, SHEETS/sheets-of-reference · **Confidence:** high (no-arg), medium (reference form) · **Wiki page:** MISSING (`content/function/SHEETS.md` does not exist)

## Behavior summary

`SHEETS()` with no argument returns the number of sheets in the workbook; `SHEETS(reference)` returns the number of sheets a reference spans. The no-arg form's _value_ is inherently an environment property — it counts whatever workbook the engine is running in — so the cross-engine number differences are a test-harness artifact, not a semantic divergence.

## Divergences

`=SHEETS()`:

| engine       | result | note                           |
| ------------ | ------ | ------------------------------ |
| excel        | 25     | host workbook had 25 sheets    |
| gsheets      | 52     | host spreadsheet had 52 sheets |
| hyperformula | 1      | single-sheet harness           |
| ironcalc     | 1      | single-sheet harness           |
| formulas     | #NAME? | not implemented                |
| pycel        | #NAME? | not implemented                |

The 25 / 52 / 1 spread reflects each engine's host-workbook sheet count, not a difference in what SHEETS means. Every implementing engine is behaving to spec. **Cause: intentional-spec (environment-dependent count).** Live-probe confirms the single-sheet hyperformula/ironcalc harness returns 1 and formulas returns #NAME?.

`=SHEETS(A1)`:

| engine       | result   | note                                   |
| ------------ | -------- | -------------------------------------- |
| excel        | 1        | reference spans one sheet              |
| hyperformula | 1        | reference spans one sheet              |
| gsheets      | #N/A     | rejects the single-cell reference form |
| ironcalc     | #N/IMPL! | reference form not implemented         |
| formulas     | #NAME?   | SHEETS not implemented                 |
| pycel        | #NAME?   | SHEETS not implemented                 |

Live-probe confirms hyperformula=1, ironcalc=#N/IMPL!, formulas=#NAME?, pycel=#NAME?. The notable branch is **gsheets #N/A**: gsheets accepts `SHEETS()` with no argument (returns 52 above) but returns #N/A for a single-cell reference argument. **Cause: missing-function (partial/uneven support of the reference form).**

## Edges explored beyond the corpus

- Reproduced the single-sheet count on both pure engines that implement SHEETS (hyperformula, ironcalc → 1), confirming the no-arg value is purely a function of harness workbook size.

## Wiki-facing notes

- There is no `SHEETS.md` wiki page yet; this is a good candidate to author.
- `SHEETS()` counts sheets in the current workbook; **the returned number is environment-specific and not portable as a constant**. Any test or doc example asserting a specific SHEETS() value is asserting a property of a particular workbook.
- Support is uneven: Excel and Google Sheets implement SHEETS; HyperFormula and IronCalc implement the no-arg form (returning the single-sheet count 1); **formulas and pycel do not implement SHEETS at all** (#NAME?).
- The reference form `SHEETS(ref)` is the least portable: Excel and HyperFormula return 1, but Google Sheets returns #N/A and IronCalc returns #N/IMPL! for a single-cell reference.

## Open questions

- Confirm gsheets #N/A for `SHEETS(A1)` and whether `SHEETS(A1:B2)` (a multi-cell range on one sheet) also errors or returns 1 (probe info-004, info-004b). This pins whether gsheets SHEETS supports any reference argument or only the no-arg form.
