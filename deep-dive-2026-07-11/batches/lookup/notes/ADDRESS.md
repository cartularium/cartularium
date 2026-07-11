# ADDRESS — cross-engine deep dive

**Batch:** lookup · **Refs:** ADDRESS/address-with-sheet · **Confidence:** high

## Behavior summary

`ADDRESS(row, col, [abs_num], [a1], [sheet_text])` builds a textual cell reference. The first four
arguments (row, column, absolute/relative style, A1-vs-R1C1) are broadly portable across the engines that
implement ADDRESS. The fifth argument, `sheet_text`, prepends a sheet-qualifier and is where behavior
splits — both on _whether_ it is supported and on _how the sheet name is quoted_.

## Divergences

### `=ADDRESS(1,1,1,TRUE,"Sheet2")` (ADDRESS/address-with-sheet)

| engine       | result          | mechanism                                                                      |
| ------------ | --------------- | ------------------------------------------------------------------------------ |
| excel        | `Sheet2!$A$1`   | sheet name emitted unquoted — no quoting needed (reference)                    |
| gsheets      | `Sheet2!$A$1`   | same — conditional quoting                                                     |
| lattice      | `Sheet2!$A$1`   | same — conditional quoting                                                     |
| formulas     | `'Sheet2'!$A$1` | **always** wraps the sheet name in single quotes (format-rendering divergence) |
| hyperformula | `#NAME?`        | supports ADDRESS but **not the 5-argument sheet_text form** (missing arg-form) |
| ironcalc     | `#NAME?`        | ADDRESS not implemented at all (DV-0005)                                       |
| pycel        | `#NAME?`        | ADDRESS not implemented at all (DV-0005)                                       |
| libreoffice  | _blank_         | suite-wide recording artifact                                                  |

Cause bucket: **format-rendering** (the quoting divergence among implementers), plus a missing-arg-form
branch (hyperformula) and a missing-function branch (ironcalc, pycel).

## Edges explored beyond the corpus

Live probe (`scratch/lookup-probe2.mts`) on the pure engines:

| formula                           | hyperformula | ironcalc | formulas          | pycel    |
| --------------------------------- | ------------ | -------- | ----------------- | -------- |
| `=ADDRESS(1,1)`                   | `$A$1`       | `#NAME?` | `$A$1`            | `#NAME?` |
| `=ADDRESS(1,1,4)`                 | `A1`         | `#NAME?` | `A1`              | `#NAME?` |
| `=ADDRESS(1,1,1,TRUE,"Sheet2")`   | `#NAME?`     | `#NAME?` | `'Sheet2'!$A$1`   | `#NAME?` |
| `=ADDRESS(1,1,1,TRUE,"My Sheet")` | `#NAME?`     | `#NAME?` | `'My Sheet'!$A$1` | `#NAME?` |

Findings:

- **hyperformula** clearly implements the base function (`$A$1`, `A1`) but returns `#NAME?` the moment the
  5th `sheet_text` argument appears — so its `#NAME?` here is _missing arg-form_, distinct from ironcalc/
  pycel which reject `ADDRESS(1,1)` too (_missing function_). Worth distinguishing on the wiki.
- **formulas** quotes the sheet name unconditionally — both `"Sheet2"` (no quoting needed) and
  `"My Sheet"` (space, quoting needed) come back single-quoted. Excel/gsheets/lattice quote only when the
  name requires it.

## Wiki-facing notes

- The 4-argument ADDRESS forms (`ADDRESS(r,c)`, `ADDRESS(r,c,abs)`) are portable across excel, gsheets,
  lattice, hyperformula, formulas. ironcalc and pycel do not implement ADDRESS at all.
- The **5-argument sheet form** narrows portability further: only excel, gsheets, lattice, and formulas
  accept it. hyperformula rejects the sheet argument specifically.
- **Quoting is not portable.** `formulas` always quotes the sheet name; Excel/gsheets/lattice quote only
  when the name contains a space or special character. Round-tripping ADDRESS output back into a reference
  is safe in both cases (a quoted simple name is still valid), but string comparisons of ADDRESS output
  across engines will mismatch.

## Open questions

- Confirm on live Excel/gsheets that a space-containing sheet name (`=ADDRESS(1,1,1,TRUE,"My Sheet")`)
  produces `'My Sheet'!$A$1` — i.e. that they _do_ quote when needed, matching formulas only in that case
  (probe lookup-001).
