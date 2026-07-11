# INDEX as an array wrapper — the Google Sheets `INDEX(array)` idiom

**Batch:** spill-broadcast · **Refs:** INDEX/index-wraps-multiplication-over-range, INDEX/index-wraps-outer-product, INDEX/index-into-sequence, INDEX/index-from-spilled-source · **Confidence:** medium (INDEX-wrap needs Excel live confirm); high on the pure-engine branches

## Behavior summary

`INDEX(array, row_num, col_num)` normally picks one element. Two of these forks exercise the **Google Sheets idiom** `INDEX(expr)` with row and column omitted, historically used in Sheets to force an array expression to materialize/spill (a pre-dynamic-array trick). The other two are ordinary INDEX-into-a-source uses.

## Divergences

### `INDEX(array)` with both indices omitted (the array-wrapper idiom)

`=INDEX(A1:A3*10)` with `A1:A3={1,2,3}`, and `=INDEX({1,2,3}+{10;20;30})`:

| engine                | result                                            | mechanism                                                              |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| gsheets               | full array (`[10;20;30]` / the 3x3 outer product) | treats a bare single-array arg as "return the whole array"             |
| excel                 | blank                                             | recorded blank — **uncertain, needs live confirm**                     |
| libreoffice           | blank                                             | recording gap                                                          |
| hyperformula, lattice | `#N/A`                                            | live-confirmed on HyperFormula (`INDEX({1,2,3}+{10;20;30})` -> `#N/A`) |
| formulas              | `#VALUE!`                                         | live-confirmed                                                         |
| ironcalc              | `#ERROR!`                                         | live-confirmed                                                         |
| pycel                 | `#NAME?`                                          | live-confirmed                                                         |

Only Google Sheets treats `INDEX(array)` as an array wrapper. This is a Sheets-specific idiom and does not port.

### Ordinary INDEX

- `=INDEX(A1:A3, 2)` with `A1:A3={10,20,30}` -> `20` on **every** engine except LibreOffice (blank, recording gap). Live-confirmed 20 on all four pure engines. The only "fork" is the LibreOffice recording artifact.
- `=INDEX(SEQUENCE(5,5), 3, 4)` -> `14` on excel/gsheets/lattice; the pure engines fail on the missing `SEQUENCE` in structurally different ways — `formulas` -> `#REF!` (index resolves against an empty/failed source), and hyperformula/ironcalc/pycel -> `#NAME?` (SEQUENCE unknown). See SEQUENCE note.

## Edges explored beyond the corpus

- `=INDEX({10;20;30})` (bare column literal, no math): HyperFormula -> `#N/A`, `formulas` -> `#VALUE!`, pycel -> `#NAME?`, ironcalc -> `#ERROR!`. Confirms the array-wrapper rejection is about the omitted indices, not about the multiplication.

## Wiki-facing notes

- The INDEX page should note: **`INDEX(array_expression)` with row_num and column_num omitted is a Google Sheets idiom for returning/spilling the whole array; it is not portable.** Excel, HyperFormula, Lattice, IronCalc, pycel, and `formulas` all reject it (each with a different error/blank). Use the array expression directly, or `ARRAYFORMULA` in Sheets.
- Ordinary `INDEX(range, n)` is fully portable.

## Open questions

- What does modern dynamic-array Excel actually return for `INDEX(A1:A3*10)`? The recorded blank is suspect — Excel may spill the whole array or return `#VALUE!`. Probe `spill-broadcast-001` / `spill-broadcast-002`.
