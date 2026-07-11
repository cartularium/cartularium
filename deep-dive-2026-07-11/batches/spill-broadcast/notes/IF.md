# IF (with array arguments) — cross-engine deep dive

**Batch:** spill-broadcast · **Refs:** IF/if-broadcasting-scalar-condition-to-array-branches, IF/if-with-array-condition, IF/if-with-array-condition-and-array-branches · **Confidence:** high

## Behavior summary

`IF` with array-shaped arguments broadcasts: an array condition selects elementwise between the branches, and array branches are picked cell-by-cell. Excel, Google Sheets, Lattice, and the `formulas` library all do this and agree:

| formula                                          | result         |
| ------------------------------------------------ | -------------- |
| `=IF({TRUE,FALSE,TRUE}, 1, 2)`                   | `[1, 2, 1]`    |
| `=IF(TRUE, {1,2,3}, {10,20,30})`                 | `[1, 2, 3]`    |
| `=IF({TRUE,FALSE,TRUE}, {10,20,30}, {-1,-2,-3})` | `[10, -2, 30]` |

## Divergences

| engine                            | result                     | mechanism                                                                                     |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| excel, gsheets, lattice, formulas | correct array              | broadcast IF (formulas live-confirmed)                                                        |
| **hyperformula**                  | `[#NAME?, #NAME?, #NAME?]` | **does not recognize the bare `TRUE`/`FALSE` keywords** — see below                           |
| ironcalc                          | `#N/IMPL!`                 | array evaluation not implemented                                                              |
| pycel                             | `1` / `1` / `#NAME?`       | collapses to the taken branch's first element; `#NAME?` when both branches are array literals |
| libreoffice                       | blank                      | recording gap                                                                                 |

### The HyperFormula result is NOT an IF-broadcasting failure

This is the key finding of the batch. HyperFormula's `#NAME?` here has nothing to do with IF or with array broadcasting — **HyperFormula does not parse the bare boolean literals `TRUE` and `FALSE`; it treats them as unknown names.** Any formula containing a literal `TRUE`/`FALSE` yields `#NAME?`. Live probes on the pure HyperFormula engine:

| formula                         | result      | reading                                                                           |
| ------------------------------- | ----------- | --------------------------------------------------------------------------------- |
| `=TRUE`                         | `#NAME?`    | bare keyword not recognized                                                       |
| `=TRUE()`                       | `TRUE`      | function-call form works                                                          |
| `=IF(TRUE, 5, 6)`               | `#NAME?`    | the `TRUE` argument is `#NAME?`                                                   |
| `=IF(1>0, 5, 6)`                | `5`         | computed boolean condition works                                                  |
| `=IF(TRUE(), 5, 6)`             | `5`         | `TRUE()` works                                                                    |
| `=AND(TRUE, TRUE)`              | `#NAME?`    | `=AND(TRUE(), TRUE())` -> `TRUE`                                                  |
| `=NOT(FALSE)`                   | `#NAME?`    | `=NOT(FALSE())` -> `TRUE`                                                         |
| `=IF(2>1, {1,2,3}, {10,20,30})` | `[1, 2, 3]` | **HyperFormula broadcasts IF correctly once the condition is not a bare literal** |

So HyperFormula fully supports IF and IF-broadcasting. It just requires `TRUE()`/`FALSE()` (or a computed boolean) instead of the bare keywords. In the corpus, the `#NAME?` array shape shows up because each `TRUE`/`FALSE` token inside the array literal resolves to `#NAME?` and broadcasts over the branch shape.

### pycel

pycel has no array engine: `IF(TRUE, {1,2,3}, {10,20,30})` -> `1` and `IF({TRUE,FALSE,TRUE}, 1, 2)` -> `1` (it evaluates the taken branch and returns its first element), but `IF({TRUE,FALSE,TRUE}, {10,20,30}, {-1,-2,-3})` -> `#NAME?` when both branches are array literals it cannot collapse.

## Wiki-facing notes

- The IF page should carry a **HyperFormula portability note**: HyperFormula does not accept the bare `TRUE`/`FALSE` keywords — use `TRUE()`/`FALSE()` or a comparison. This affects IF, AND, OR, NOT, and any formula with a literal boolean, not just array IF. (This is documented HyperFormula behavior: boolean literals must be written as nullary functions.)
- IF broadcasting itself is portable across Excel, Sheets, Lattice, HyperFormula (with `TRUE()`), and `formulas`. IronCalc and pycel do not broadcast IF.
- pycel silently returns a scalar from an array-branch IF — a correctness hazard.

## Open questions

- None blocking. The HyperFormula bare-literal mechanism is fully isolated by live probe. A cross-check that Excel/Sheets accept both `TRUE` and `TRUE()` is standard knowledge and not required.
