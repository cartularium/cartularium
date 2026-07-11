# ISBLANK — cross-engine deep dive

**Batch:** info · **Refs:** ISBLANK/isblank-of-empty-string-cell (genuine fork); ISBLANK/isblank-of-blank-cell, -literal-empty-string, -literal-number, -number-cell, -text-cell (libreoffice-artifact only) · **Confidence:** high

## Behavior summary

`ISBLANK(value)` returns TRUE only for a genuinely empty cell. All seven functioning engines agree on the clear cases: a truly empty cell is blank (TRUE), and a literal empty string `""`, a number, or text is not blank (FALSE). The one genuine divergence is a cell that was _seeded with an empty string_.

## Divergences

### Genuine: `=ISBLANK(A1)` with `A1` seeded as `""` (empty string)

| engine       | result | interpretation                                   |
| ------------ | ------ | ------------------------------------------------ |
| excel        | TRUE   | stored as an empty cell → blank                  |
| formulas     | TRUE   | stored as an empty cell → blank                  |
| lattice      | TRUE   | stored as an empty cell → blank                  |
| pycel        | TRUE   | stored as an empty cell → blank                  |
| gsheets      | FALSE  | stored as a zero-length string value → not blank |
| hyperformula | FALSE  | stored as a zero-length string value → not blank |
| ironcalc     | FALSE  | stored as a zero-length string value → not blank |

(libreoffice records the suite-wide `blank` artifact.)

Live-probe confirmed: with `grid A1=""`, formulas=TRUE and pycel=TRUE, hyperformula=FALSE and ironcalc=FALSE. **Cause: arg-semantics, with an input-fidelity component.** The split is really about how each engine _stores_ a seeded empty string: excel/formulas/lattice/pycel treat writing `""` as leaving the cell empty (so ISBLANK is TRUE), while gsheets/hyperformula/ironcalc store an actual empty-string value (so ISBLANK is FALSE).

Contrast the neighbouring clear cases (all engines agree, libreoffice `blank` artifact only):

- `=ISBLANK("")` (literal empty string) → FALSE everywhere. Live-probe: hyperformula/ironcalc/formulas/pycel all FALSE.
- `=ISBLANK(A1)` (truly empty cell) → TRUE everywhere.
- `=ISBLANK(42)` / `=ISBLANK(A1)` over a number or text cell → FALSE everywhere.

So the divergence is _specific to a cell seeded with an empty string_ — it does not appear for a literal `""` argument or a genuinely empty cell.

## Edges explored beyond the corpus

- The literal `=ISBLANK("")` is FALSE on all four pure engines even though a _cell seeded with_ `""` gives TRUE on formulas/pycel — confirming the divergence is about stored-cell state, not about the empty string as a value.

## Wiki-facing notes

- ISBLANK is highly portable for the ordinary cases: empty cell → TRUE; empty-string literal / number / text → FALSE.
- **The one gotcha is a cell that contains an empty string** (e.g. produced by an import, or by a formula that returned `""`). Excel and LibreOffice-family treat such a cell as blank; **Google Sheets, HyperFormula, and IronCalc treat it as non-blank.** This is a classic source of cross-tool bugs in "is this cell empty?" checks.
- Portability advice: to test "empty or empty-string", use `=OR(ISBLANK(A1), A1="")` rather than ISBLANK alone.

## Open questions

- Confirm on live excel/gsheets that the seed `A1=""` yields ISBLANK TRUE (excel) vs FALSE (gsheets), and that a _formula_ returning `""` (`A1==""`) is non-blank on both (probes info-002, info-002b). This separates the seed-storage question from the semantic one.
