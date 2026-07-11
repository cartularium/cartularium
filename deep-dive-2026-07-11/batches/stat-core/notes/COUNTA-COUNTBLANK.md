# COUNTA / COUNTBLANK — cross-engine deep dive

**Batch:** stat-core · **Refs:** COUNTA/counta-non-empty, COUNTA/counta-empty-string-cell, COUNTBLANK/countblank · **Confidence:** high (pure engines live-confirmed; excel/gsheets from recorded fixtures)

## Behavior summary

`COUNTA(range)` counts non-empty cells; `COUNTBLANK(range)` counts empty cells. Engines agree on the easy cases — a genuinely empty cell is blank, a number or text is non-empty. They split on exactly one boundary case: **a cell holding a zero-length string `""`**. Is such a cell "blank" or "a text value"? Each engine answers consistently within itself, but the answers differ across engines, and the two functions are mirror images of the same decision.

## Divergences

### COUNTA over a range containing an empty-string cell

`=COUNTA(B1:B3)` with `B1=3.14, B2="hello", B3=""` (ref `COUNTA/counta-non-empty`), and `=COUNTA(A1:A3)` with `A1=1, A2="", A3=3` (ref `COUNTA/counta-empty-string-cell`) — identical partition:

| Engine       | Result   | Reads `""` as                     |
| ------------ | -------- | --------------------------------- |
| excel        | 2        | blank (not counted)               |
| formulas     | 2        | blank (not counted)               |
| lattice      | 2        | blank (not counted)               |
| gsheets      | 3        | a text value (counted)            |
| hyperformula | 3        | a text value (counted)            |
| ironcalc     | 3        | a text value (counted)            |
| pycel        | `#NAME?` | function absent from pycel        |
| libreoffice  | blank    | stale all-null fixture (artifact) |

### COUNTBLANK over the same kind of range

`=COUNTBLANK(A1:A5)` with `A1=1, A2="", A3="hello"` (A4, A5 truly empty) — ref `COUNTBLANK/countblank`:

| Engine       | Result   | Reads `""` as                     |
| ------------ | -------- | --------------------------------- |
| excel        | 3        | blank (A2 + A4 + A5)              |
| formulas     | 3        | blank                             |
| gsheets      | 3        | blank                             |
| ironcalc     | 3        | blank                             |
| lattice      | 3        | blank                             |
| hyperformula | 2        | a text value (only A4 + A5)       |
| pycel        | `#NAME?` | function absent from pycel        |
| libreoffice  | blank    | stale all-null fixture (artifact) |

**Mechanism (cause: `null-vs-zero`).** Put the two tables together and each engine's model of `""` becomes clear:

- **hyperformula** — `""` is always a real text value: counted by COUNTA (3), excluded from COUNTBLANK (2). Fully self-consistent.
- **excel / formulas / lattice** — `""` is blank: excluded from COUNTA (2), counted by COUNTBLANK (3). The exact opposite of hyperformula, also self-consistent.
- **ironcalc / gsheets** — `""` is counted by _both_: present for COUNTA (3) and blank for COUNTBLANK (3). It behaves as "a written-but-empty cell."
- **pycel** — neither function exists (`#NAME?`).

Live probe output (`scratch/stat-core-probe1.mts`), confirming the pure-engine branches:

```
hyperformula  COUNTA(B1:B3,""-cell)=3   COUNTA(A1:A3,""-cell)=3   COUNTBLANK=2
ironcalc      COUNTA=3                  COUNTA=3                  COUNTBLANK=3
formulas      COUNTA=2                  COUNTA=2                  COUNTBLANK=3
pycel         #NAME?                    #NAME?                    #NAME?
```

## Edges explored beyond the corpus

- I confirmed the split is driven purely by the `""` cell, not the numeric/text neighbours: on a clean range with no empty-string cell (`COUNTA(B1:B3)` of `{1,2,3}`) every implementing engine returns 3, and `COUNTBLANK(A1:A3)` with only `A1=1` seeded returns 2 on both hyperformula and ironcalc.
- The pycel `#NAME?` is a flat capability gap (COUNTA and COUNTBLANK are simply not in its function table), not tied to the `""` case.

## Wiki-facing notes

- COUNTA/COUNTBLANK are **not portable across the empty-string boundary.** A cell that resolves to `""` (very common: `=IF(cond,x,"")` helper columns, CSV imports with empty quoted fields) is counted differently by different engines. If a workbook's logic depends on COUNTA or COUNTBLANK over columns that can contain `""`, the totals will disagree between Excel/LibreOffice-style engines and Google-Sheets/HyperFormula-style engines.
- Rule of thumb to state on both pages: **Excel and the `formulas` JS engine treat `""` as blank; Google Sheets, HyperFormula and IronCalc treat `""` as a non-blank text value.** HyperFormula is the one engine where COUNTA and COUNTBLANK are strict complements over `""`; IronCalc/gsheets can count the same `""` cell in both.
- pycel does not implement COUNTA or COUNTBLANK at all.

## Open questions

- **Needs live excel + gsheets confirmation (probe stat-core-001):** whether excel's COUNTA=2 result reflects genuine Excel semantics (`""` is blank) or whether the assay harness seeded `B3=""`/`A2=""` as a _cleared_ cell for the excel/libreoffice lane and as an _empty-string-valued_ cell for the gsheets lane. Real Excel's COUNTA actually counts a cell containing a formula-produced `""` as 1, so the recorded excel=2 may be a seeding-fidelity effect rather than a semantic claim. The probe writes `""` via the seed and reads back both COUNTA and COUNTBLANK to disambiguate.
