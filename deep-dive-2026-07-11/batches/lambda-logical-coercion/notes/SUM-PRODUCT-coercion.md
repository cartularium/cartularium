# SUM / PRODUCT — text & boolean coercion in aggregation — cross-engine deep dive

**Batch:** lambda-logical-coercion · **Refs:** PRODUCT/string-array-in-product, SUM/boolean-array-in-sum, SUM/mixed-array-in-sum, SUM/sum-of-string-range · **Confidence:** high

## Behavior summary

`SUM` and `PRODUCT` aggregate numbers. The cross-engine question is what happens to **non-number values** — numbers-stored-as-text (`"2"`) and booleans (`TRUE`) — when they arrive inside an aggregate. The spreadsheet convention (Excel and Google Sheets) draws a sharp line by _how the value arrives_:

- **Text/boolean typed directly as a scalar argument** (`=SUM(TRUE, "2")`) → coerced.
- **Text/boolean inside a cell range** (`=SUM(A1:A3)` where cells are text) → ignored.
- **Text/boolean as a literal inside an array constructor** (`=SUM({1,"2",TRUE})`) → ignored.

Several engines do not honor that "skip inside array/range" rule and coerce everything, so the same formula produces genuinely different numbers (not just different error codes). All pure-engine results below were reproduced by live probe.

## Divergences

### Array-literal coercion (three cases, one mechanism)

`=PRODUCT({"2","3","4"})` · `=SUM({TRUE,FALSE,TRUE})` · `=SUM({1,"2",TRUE})`

| engine       | `PRODUCT({"2","3","4"})` | `SUM({TRUE,FALSE,TRUE})` | `SUM({1,"2",TRUE})` | behavior                                      |
| ------------ | ------------------------ | ------------------------ | ------------------- | --------------------------------------------- |
| excel        | `0`                      | `0`                      | `1`                 | skip text & booleans in array literals        |
| gsheets      | `0`                      | `0`                      | `1`                 | skip text & booleans                          |
| ironcalc     | `0`                      | `0`                      | `1`                 | skip text & booleans (matches excel/gsheets)  |
| pycel        | `#NAME?`                 | `0`                      | `1`                 | PRODUCT unimplemented; SUM skips              |
| formulas     | `24`                     | `0`                      | `3`                 | coerces text (`"2"`→2); skips booleans        |
| lattice      | `24`                     | `2`                      | `4`                 | coerces **both** text and booleans (`TRUE`→1) |
| hyperformula | `1`                      | `#NAME?`                 | `#NAME?`            | see below                                     |
| libreoffice  | blank                    | blank                    | blank               | recording gap                                 |

Cause: **arg-semantics** (coercion policy). Reading the rows:

- **excel / gsheets / ironcalc** = strict spreadsheet rule: literals of non-number type inside `{...}` do not participate. `PRODUCT` of "no numeric factors" is 0; `SUM` counts only bare numbers.
- **formulas** coerces text strings but not booleans: `PRODUCT({"2","3","4"})` = 24, `SUM({1,"2",TRUE})` = 1+2 = 3.
- **lattice** coerces _everything_: `SUM({1,"2",TRUE})` = 1+2+1 = 4; `SUM({TRUE,FALSE,TRUE})` = 2.
- **hyperformula** has a parser quirk: its array-literal parser **rejects boolean literals** inside `{...}` → `#NAME?` (confirmed live: `=SUM({TRUE,FALSE})` → `#NAME?`, `=SUM({1,2,3})` → 6). For the text-only `PRODUCT({"2","3","4"})` it parses fine, ignores the text, and returns the empty-product identity `1` (not 0 — hyperformula's PRODUCT-of-nothing = 1, unlike excel/gsheets/ironcalc's 0).
- **pycel** does not implement PRODUCT (`#NAME?`) but computes the SUM cases the strict way.

Note the two different "empty product" answers: excel/gsheets/ironcalc say `PRODUCT` with no numeric factors = **0**, hyperformula says **1**. Mathematically 1 is the product identity; the spreadsheet convention is 0.

### Range coercion

`=SUM(A1:A3)` with A1:A3 seeded as **text** `"1"`, `"2"`, `"3"`

| engine                                    | result | behavior                          |
| ----------------------------------------- | ------ | --------------------------------- |
| excel, gsheets, pycel                     | `0`    | text in a range is ignored by SUM |
| formulas, hyperformula, ironcalc, lattice | `6`    | coerce the text cells to numbers  |
| libreoffice                               | blank  | recording gap                     |

Cause: **arg-semantics**. This is the range counterpart of the array-literal rule. excel/gsheets are internally consistent (skip text in both ranges and array literals). Interesting cross-check: **pycel** matches excel/gsheets here (0) even though it coerces differently elsewhere, and **hyperformula** coerces text in a range (6) even though it _rejects_ booleans in an array literal — so no engine's coercion policy is uniform across all three arrival paths.

## Edges explored beyond the corpus

- Confirmed the hyperformula boolean-literal rejection is specific to the `{...}` constructor: `=SUM({TRUE,FALSE})` → `#NAME?` but `=SUM({1,2,3})` → 6 and `=SUM(A1:A3)` (text range) → 6. So it is a _literal-parser_ issue, not a general boolean-in-SUM issue.
- pycel: `=SUM(1,2,3)` → 6 works, `=PRODUCT(2,3,4)` → `#NAME?`, `=SUM(A1:A3)` (text) → 0. Confirms PRODUCT is genuinely absent while SUM follows the strict skip-text rule.

## Wiki-facing notes

- **SUM.md / PRODUCT.md** should carry a coercion caveat: numbers-stored-as-text and booleans are **ignored** when they appear inside a range or an array literal (Excel/Google Sheets behavior), but coerced when passed as direct scalar arguments. Portability warning: `formulas`, `hyperformula`, `ironcalc`, and `lattice` disagree — several coerce text and/or booleans inside ranges/arrays, so a sum over text-typed cells can yield 6 on those engines vs 0 on Excel/Sheets.
- **PRODUCT.md** should note that `PRODUCT` of no numeric factors is 0 in Excel/Sheets/ironcalc but 1 in hyperformula, and that pycel does not implement PRODUCT.
- Practical advice for portable sheets: coerce explicitly (`--`, `N()`, `VALUE()`, `*1`) rather than relying on a range/array to auto-skip or auto-coerce text.

## Open questions

- `lambda-logical-coercion-006` (excel/gsheets): confirm `PRODUCT({"2","3","4"})` = 0 on both, and ideally contrast with scalar `PRODUCT("2","3","4")` to show the arrival-path rule.
- `lambda-logical-coercion-007` (excel/gsheets): confirm `SUM(A1:A3)` = 0 with the cells seeded as **text** (the divergence disappears if they are numeric).
- `lambda-logical-coercion-008` (excel/gsheets): confirm `SUM({TRUE,FALSE,TRUE})` = 0, contrast with scalar `SUM(TRUE,FALSE,TRUE)` = 2.
