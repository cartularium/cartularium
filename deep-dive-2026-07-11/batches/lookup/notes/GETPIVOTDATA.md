# GETPIVOTDATA — cross-engine deep dive

**Batch:** lookup · **Refs:** GETPIVOTDATA/getpivotdata-smoke, GETPIVOTDATA/getpivotdata-with-field · **Confidence:** high

## Behavior summary

`GETPIVOTDATA(data_field, pivot_table, [field, item]...)` extracts an aggregate from an existing pivot
table. The assay harness contains no pivot table, so these cases really measure "how does the engine react
to a GETPIVOTDATA call whose target does not exist." This is a `features: external-io` function; no
libreoffice branch is recorded.

## Divergences

### `=GETPIVOTDATA("Sales", A1)` and `=GETPIVOTDATA("Total", A1, "Region", "West")`

| engine       | result   | mechanism                                                            |
| ------------ | -------- | -------------------------------------------------------------------- |
| gsheets      | `#REF!`  | function recognized; no pivot table anchored at A1 → reference error |
| formulas     | `#NAME?` | function not implemented                                             |
| hyperformula | `#NAME?` | function not implemented                                             |
| ironcalc     | `#NAME?` | function not implemented                                             |
| pycel        | `#NAME?` | function not implemented                                             |

Cause bucket: **missing-function** (four engines) vs implemented-but-no-target (gsheets `#REF!`). Both
GETPIVOTDATA forms behave identically. Live probe confirmed formulas/hyperformula/ironcalc/pycel all return
`#NAME?`.

## Edges explored beyond the corpus

None beyond the two corpus forms — the availability split is unambiguous. A pure engine cannot supply a
pivot table, so the interesting "GETPIVOTDATA against a real pivot" behavior is unreachable here.

## Wiki-facing notes

- GETPIVOTDATA is **only** available (in this corpus) on Google Sheets and Excel. The four pure engines
  (formulas, hyperformula, ironcalc, pycel) do not implement it at all.
- The error you get for a missing pivot differs: gsheets returns `#REF!`; an engine lacking the function
  returns `#NAME?`. Distinguish "no pivot table" from "no such function" when diagnosing.

## Open questions

- Confirm on live Excel that `=GETPIVOTDATA("Sales", A1)` with no pivot returns `#REF!` (matching gsheets),
  establishing that Excel too recognizes the function (probe lookup-004). Excel has no recorded value in
  the corpus for this case.
