# LAMBDA / LET / MAP / REDUCE / SCAN / BYROW / BYCOL / MAKEARRAY / FILTER / SORT / SORTBY / UNIQUE — cross-engine deep dive

**Batch:** lambda-logical-coercion · **Refs:** BYCOL/bycol-sum, BYROW/byrow-sum, MAP/map-over-column, MAP/map-over-row, MAP/map-two-arrays, REDUCE/reduce-product, REDUCE/reduce-string-concat, REDUCE/reduce-sum, SCAN/scan-cumulative-sum, SORT/sort-ascending, SORT/sort-descending, SORTBY/sortby-basic, UNIQUE/unique-column, LET/let-basic, LET/let-multiple-bindings, LET/let-scoping, MAKEARRAY/makearray-multiplication-table, FILTER/filter-basic, FILTER/filter-with-condition, LAMBDA/lambda-basic-iife, LAMBDA/lambda-two-args, LAMBDA/lambda-nested, LAMBDA/lambda-as-higher-order · **Confidence:** high

## Behavior summary

This family is the modern Excel/Google-Sheets "dynamic array + lambda" surface: `LAMBDA`/`LET` (name binding and anonymous functions), the higher-order helpers `MAP`/`REDUCE`/`SCAN`/`BYROW`/`BYCOL`/`MAKEARRAY`, and the spilling array functions `FILTER`/`SORT`/`SORTBY`/`UNIQUE`. The clean split is **modern vs legacy engines**: excel, gsheets, lattice, and the `formulas` npm engine implement essentially the whole surface and agree on results; hyperformula, ironcalc, and pycel are legacy calculation cores that mostly return `#NAME?` (function name unknown). libreoffice returns blank across the board — a recording gap, not a computed result (see `engine-artifacts.md`).

The exceptions are what make this interesting, and there are four of them: FILTER (hyperformula supports it), immediate LAMBDA invocation (only excel/gsheets/lattice), SORT's third-argument signature (excel vs gsheets), and SORTBY (Excel-family-only, with a lattice no-op).

All pure-engine results below were reproduced by live probe on hyperformula/ironcalc/pycel/formulas.

## Divergences

### 1. The main cluster: helpers unimplemented in hyperformula/ironcalc/pycel

`MAP`, `REDUCE`, `SCAN`, `BYROW`, `BYCOL`, `MAKEARRAY`, `SORT`, `UNIQUE`, `LET`. Representative: `=MAP({1;2;3}, LAMBDA(x, x*2))`

| engine                            | result                |
| --------------------------------- | --------------------- |
| excel, gsheets, lattice, formulas | `{2;4;6}` (computed)  |
| hyperformula                      | `#NAME?`              |
| ironcalc                          | `#NAME?`              |
| pycel                             | `#NAME?`              |
| libreoffice                       | blank (recording gap) |

Cause: **missing-function**. Two wrinkles inside the cluster:

- **MAKEARRAY / ironcalc**: `=MAKEARRAY(3,3,LAMBDA(r,c,r*c))` — ironcalc returns `#ERROR!` (recognizes the name, fails during evaluation) rather than `#NAME?`. hyperformula/pycel still `#NAME?`.
- **LET / formulas**: `formulas` evaluates a single non-referencing binding (`=LET(x,5,x+1)` → 6, `=LET(x,3,y,4,x+y)` → 7) but returns **no clean value** for `=LET(x,1,y,x+1,z,y+1,z)` (LET/let-scoping), where a later binding references an earlier one. That is why `formulas` is absent from the value-agreement class for let-scoping in the fixtures — its forward-reference resolution breaks.

### 2. FILTER — the one helper hyperformula implements

`=FILTER({1;2;3;4;5}, {1;0;1;0;1})` and `=FILTER(A1:A4, A1:A4>10)` (grid A1:A4 = 10,20,5,30)

| engine                                              | result                |
| --------------------------------------------------- | --------------------- |
| excel, gsheets, lattice, formulas, **hyperformula** | `{1;3;5}` / `{20;30}` |
| ironcalc, pycel                                     | `#NAME?`              |
| libreoffice                                         | blank (recording gap) |

Cause: **missing-function** (for ironcalc/pycel). The notable fact is that hyperformula's coverage is uneven: it has FILTER but not MAP/REDUCE/SORT/UNIQUE/LET. Live probe: `FILTER({1;2;3},{1;0;1})` → `{1}` (first element; the probe shows it computes), while `SORT`/`UNIQUE`/`SCAN`/`BYROW` all → `#NAME?`.

### 3. LAMBDA immediate invocation (IIFE / currying)

`=LAMBDA(x, x+1)(5)`, `=LAMBDA(x, y, x*y)(3, 4)`, `=LAMBDA(x, LAMBDA(y, x+y))(1)(2)`, `=LAMBDA(f, f(5))(LAMBDA(x, x*2))`

| engine                  | `LAMBDA(x,x+1)(5)`                                               | mechanism                                                                           |
| ----------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| excel, gsheets, lattice | `6`                                                              | calling a LAMBDA value in place is supported                                        |
| formulas                | `#VALUE!` (single call); no clean value for double-call `(1)(2)` | trailing call rejected / crashes on currying                                        |
| hyperformula            | `#ERROR!`                                                        | recognizes LAMBDA name; the trailing `(...)` after the close-paren is a parse error |
| ironcalc, pycel         | `#NAME?`                                                         | LAMBDA not a callable name                                                          |
| libreoffice             | blank                                                            | recording gap                                                                       |

Cause: **unimplemented-edge**. Note the three _distinct_ error signatures for "cannot call a lambda in place": `#VALUE!` (formulas), `#ERROR!` (hyperformula), `#NAME?` (ironcalc/pycel). Immediate LAMBDA invocation is a niche syntax even Excel treats as advanced; portability is effectively excel/gsheets/lattice only.

### 4. SORT third argument — signature divergence

`=SORT({3;1;2}, 1, -1)`

| engine                        | result                 | third arg meaning                                      |
| ----------------------------- | ---------------------- | ------------------------------------------------------ |
| excel, formulas, lattice      | `{3;2;1}` (descending) | `sort_order`: 1=asc, **-1=desc**                       |
| gsheets                       | `{1;2;3}` (ascending)  | `is_ascending` (boolean): -1 is truthy → **ascending** |
| hyperformula, ironcalc, pycel | `#NAME?`               | SORT unimplemented                                     |
| libreoffice                   | blank                  | recording gap                                          |

Cause: **arg-semantics**. This is a genuine product-signature difference, not a bug: Excel's `SORT(array, sort_index, sort_order, by_col)` vs Google Sheets' `SORT(range, sort_column, is_ascending, ...)`. The same literal `-1` means "descending" in Excel and "ascending" (truthy) in Sheets. **The imported sheets.wiki `SORT.md` documents the gsheets `is_ascending` signature** — an Excel author copying `SORT(x,1,-1)` from that page will silently get ascending order in Sheets.

### 5. SORTBY — Excel-family only, with a lattice no-op

`=SORTBY({10;20;30}, {3;1;2})`

| engine                                 | result                   | mechanism                                                                    |
| -------------------------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| excel, formulas                        | `{20;30;10}`             | reorder values by ascending rank of by-array keys (1→20, 2→30, 3→10)         |
| lattice                                | `{10;20;30}` (unchanged) | recognizes SORTBY but returns input un-sorted — a no-op / unimplemented sort |
| gsheets, hyperformula, ironcalc, pycel | `#NAME?`                 | SORTBY not exposed (Sheets) / not implemented (pure engines)                 |
| libreoffice                            | blank                    | recording gap                                                                |

Cause: **missing-function** (with lattice's no-op as an unimplemented-edge). There is **no sheets.wiki page for SORTBY** — the only subject in this batch without one.

## Edges explored beyond the corpus

Live probes (hyperformula/ironcalc/pycel/formulas) beyond the recorded cases:

- **hyperformula boolean-in-array-literal**: `=SUM({TRUE,FALSE})` → `#NAME?` but `=SUM({1,2,3})` → 6. hyperformula's `{...}` parser rejects boolean literals (relevant to the coercion notes, not the lambda family, but discovered here).
- **pycel operator-in-argument**: `=SUM(1/2)`, `=ABS(1-2)`, `=SUM(1+1,2)`, `=IF(A1>2,1,2)` all → `#NAME?`, while literal-argument forms succeed. This is a pycel front-end limitation (see `engine-artifacts.md`) and is separate from the missing-function `#NAME?` for the lambda helpers.
- **formulas currying**: `=LAMBDA(x,LAMBDA(y,x+y))(1)(2)` yields no clean value (undefined), confirming the double-call breaks the engine rather than returning a clean error.

## Wiki-facing notes

- **SORT.md** should carry a compatibility caveat: the third argument is `is_ascending` (boolean) in Google Sheets but `sort_order` (1/-1) in Excel. `SORT(range, 1, -1)` sorts **descending in Excel** and **ascending in Google Sheets**. Recommend `FALSE` (Sheets) / `-1` (Excel) explicitly and warn against copying the numeric form across products.
- **The whole family** (LAMBDA, LET, MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY, FILTER, SORT, UNIQUE) is unsupported in the legacy engines hyperformula (except FILTER), ironcalc, and pycel — each returns `#NAME?`. Pages should flag "modern dynamic-array function; not available in older calculation engines."
- **LAMBDA immediate invocation** (`=LAMBDA(...)(args)`) is portable only across Excel, Google Sheets, and lattice. The LAMBDA/LET pages should note that calling a lambda in place is not universally supported.
- **SORTBY** needs a page created; note it is Excel-family and not (at recording time) a Google Sheets function.
- **FILTER** is the most portable of the helpers (adds hyperformula) — worth noting on FILTER.md.

## Open questions

- `lambda-logical-coercion-001` (excel/gsheets): confirm SORT descending vs ascending on the two hosted engines.
- `lambda-logical-coercion-002` (excel/gsheets): confirm SORTBY = `{20;30;10}` (excel) vs `#NAME?` (gsheets), and whether current Google Sheets has since added SORTBY.
- lattice SORTBY no-op: is it a lattice bug worth filing, or an intentional partial stub? Needs a human/lattice-maintainer call.
