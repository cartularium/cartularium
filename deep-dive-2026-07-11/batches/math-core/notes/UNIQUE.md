# UNIQUE — cross-engine deep dive

**Batch:** math-core · **Refs:** UNIQUE/unique-1d-column, unique-1d-strings, unique-2d-rows, unique-all-identical, unique-no-duplicates, unique-mixed-types-case · **Confidence:** high (support matrix + case story from recorded fixtures)

## Behavior summary

UNIQUE is a dynamic-array (spilling) function that removes duplicate rows/values from a range. Support is split: **excel, formulas, gsheets, lattice** implement it; **hyperformula, ironcalc, pycel** do not and return `#NAME?` (confirmed live). Where implemented, all four agree on numeric, string, all-identical, no-duplicate, and 2-D-row inputs. The one behavioral divergence _among supporters_ is **case-sensitivity** of string deduplication.

## Divergences

### Support matrix (all standard cases)

| input                       | excel / formulas / gsheets / lattice | hyperformula / ironcalc / pycel | libreoffice |
| --------------------------- | ------------------------------------ | ------------------------------- | ----------- |
| `=UNIQUE(A1:A5)` numbers →  | spill `1;2;3`                        | `#NAME?`                        | blank       |
| `=UNIQUE(A1:A4)` strings →  | spill `apple;banana;cherry`          | `#NAME?`                        | blank       |
| `=UNIQUE(A1:B4)` 2-D rows → | spill `1,a; 2,b; 3,c`                | `#NAME?`                        | blank       |
| `=UNIQUE(A1:A3)` all `5` →  | spill `5`                            | `#NAME?`                        | blank       |
| `=UNIQUE(A1:A3)` `1,2,3` →  | spill `1;2;3`                        | `#NAME?`                        | blank       |

Live probe (`formulas`): `=UNIQUE(A1:A3)` over `{1,1,2}` spilled `[1;2]` — confirming formulas is a genuine supporter. hyperformula, ironcalc, pycel each returned `#NAME?`. Cause bucket: `missing-function`.

### `unique-mixed-types-case` — case-sensitivity split (grid = "Apple", "apple", "APPLE")

| engine(s)                     | result                               | dedup rule                                                             |
| ----------------------------- | ------------------------------------ | ---------------------------------------------------------------------- |
| excel                         | `Apple` (1 value)                    | **case-insensitive** — treats the three as one, keeps first occurrence |
| formulas, gsheets, lattice    | `Apple`, `apple`, `APPLE` (3 values) | **case-sensitive** — all three distinct                                |
| hyperformula, ironcalc, pycel | `#NAME?`                             | function absent                                                        |
| libreoffice                   | blank                                | recording gap                                                          |

This is a genuine, documented Excel-vs-Sheets difference: Excel's UNIQUE compares text case-insensitively (so `Apple` = `apple` = `APPLE`), while Google Sheets' UNIQUE is case-sensitive. The pure JS engine `formulas` and `lattice` side with Sheets. Cause bucket: `arg-semantics`.

## Edges explored beyond the corpus

- Confirmed the three non-supporters emit `#NAME?` (not `#N/A` or a spill of the raw range) — clean absence, no partial implementation.

## Wiki-facing notes

- **Portability caveat:** UNIQUE is unavailable in HyperFormula, IronCalc, and pycel — do not rely on it if a workbook may be evaluated by those engines.
- **Case-sensitivity caveat:** the same UNIQUE call over mixed-case text yields _different row counts_ in Excel (case-insensitive, collapses casings) vs Google Sheets / formulas / lattice (case-sensitive, preserves them). This changes spill height and can break downstream references. Call this out explicitly on the UNIQUE page.
- Excel keeps the **first** occurrence's casing ("Apple"); confirm via probe math-core-002.

## Open questions

- Excel/gsheets live confirmation of the case-sensitivity split and Excel's keep-first-casing behavior — probe **math-core-002**.
