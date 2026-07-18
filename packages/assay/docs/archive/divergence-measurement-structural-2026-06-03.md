# Divergence measurement — structural (operators / references / sort / arrays-of-lambdas), 2026-06-03

A targeted pass into the divergence-rich structural areas the first arrays/lambdas pass **skipped**
(flagged by the maintainer: implicit intersection, reference operators, sort order, arrays *of*
lambdas vs lambdas *over* arrays). It **qualifies the "highly portable" headline** of the
[synthesis](./divergence-measurement-synthesis-2026-06-03.md): there is a real, previously-missed
divergence class — Excel-only operators and divergent argument semantics — including a **silent
wrong-result**.

All five families → **EXPLICIT_BRIDGE** (the discriminators are syntactic). Each family was run in
**isolation** on Excel (see the contamination note below) and every probe spot-checked. The
arrays-of-lambdas family also served as a **harness sanity check** — Excel returned exactly the
maintainer's predicted `{2,3}`, confirming the drivers faithfully enter/read complex array/lambda
formulas (an earlier wrong conclusion there was a malformed probe, not a harness fault).

## Genuine divergences

### `@` implicit intersection — Excel-only operator (3/3 divergent)
| formula | Excel | Sheets |
|---|---|---|
| `=@D1:D3` | `1` (intersection on the formula's row) | `#ERROR!` |
| `=@D1:F1` | `#VALUE!` (no intersection) | `#ERROR!` |
| `=SUM(@D1:D3)` | `1` | `#ERROR!` |

Sheets has no `@` operator. Bridge: rewrite `@range` to an explicit `INDEX`/single-cell pick, or flag.

### Reference operators — intersection (space) & union are Excel-only (2/6 divergent)
| formula | Excel | Sheets |
|---|---|---|
| `=SUM(D1:D3 D2:D2)` (space ∩) | `2` | `#ERROR!` |
| `=SUM((D1:D1,D3:D3))` (union) | `4` | `#ERROR!` |
| `=INDIRECT("D2")` | `2` | `2` (agree) |
| `=INDIRECT("R2C4",FALSE)` (R1C1) | `2` | `2` (agree) |
| `=OFFSET(D1,1,0)` | `2` | `2` (agree) |

Space-intersection and union-of-ranges are Excel-only syntax. INDIRECT (incl. R1C1 mode) and OFFSET agree.

### SORT 3rd-argument semantics — a SILENT divergence (6/9 divergent)
`SORT`'s third argument means different things: Excel `sort_order` (`1`/`-1`), Sheets `is_ascending`
(boolean). Collation agrees; the *argument* does not.
| formula | Excel | Sheets |
|---|---|---|
| `=SORT(D1:D3)` (asc) | `[1;2;3]` | `[1;2;3]` (agree, all data types) |
| `=SORT(D1:D3,1,-1)` | `[3;2;1]` (descending) | `[1;2;3]` (**ascending — silent wrong result**) |
| `=SORT(D1:D3,1,FALSE)` | `#VALUE!` | `[3;2;1]` (descending) |

The `-1` case is the dangerous one: **no error, just the wrong order**. Text/mixed collation agrees
(`["A";"a";"b"]`, numbers-before-text) — the divergence is purely the argument convention. Bridge:
translate the 3rd arg (`-1` ↔ `FALSE`).

### Arrays of lambdas — Excel-only capability (2/3 divergent)
> **Correction:** an earlier version reported these as "unsupported on both." That was a
> **malformed probe** (`INDEX(VSTACK(…),2)(5)` — you cannot directly invoke the result of `INDEX`
> with `(5)`), not an engine fact. With the correct `MAP`-calling pattern, **Excel fully supports
> arrays of lambdas**; Sheets does not. (This case also served as a harness sanity check — Excel
> returned exactly the maintainer's predicted `{2,3}`, confirming the harness faithfully enters and
> reads these complex array/lambda formulas; the error was probe authoring, not the harness.)

| formula | Excel | Sheets |
|---|---|---|
| `=MAP({1;2;3}, LAMBDA(x,x*2))` (lambda *over* array) | `[2;4;6]` | `[2;4;6]` (agree) |
| `=MAP(HSTACK(LAMBDA(x,x+1),LAMBDA(x,x+2)), LAMBDA(x,x(1)))` | `[2,3]` | `[#N/A,#N/A]` |
| `=MAP(VSTACK(LAMBDA(x,x*2),LAMBDA(x,x*3)), LAMBDA(x,x(5)))` | `[10;15]` | `[#N/A;#N/A]` |

Excel stores lambdas as array elements and calls them; Sheets returns `#N/A` when an array element
lambda is invoked. A real **capability divergence** (Excel-only) → flag (Sheets can't express it).

### Regex — function-name split + capture-group semantics (3/5 divergent)
Sheets uses `REGEXMATCH`/`REGEXEXTRACT`/`REGEXREPLACE` (RE2); Excel's are `REGEXTEST`/`REGEXEXTRACT`/
`REGEXREPLACE` (2024+).
| formula | Excel | Sheets |
|---|---|---|
| `=REGEXMATCH("abc123","[0-9]+")` | `#NAME?` | `TRUE` |
| `=REGEXTEST("abc123","[0-9]+")` | `TRUE` | `#NAME?` |
| `=REGEXEXTRACT("abc123","[0-9]+")` | `"123"` | `"123"` (agree) |
| `=REGEXEXTRACT("2024-01","([0-9]+)-([0-9]+)")` | `"2024-01"` (whole match) | `["2024","01"]` (groups → array) |
| `=REGEXREPLACE("abc123","[0-9]+","#")` | `"abc#"` | `"abc#"` (agree) |

Two divergences: (1) **function-name** — `REGEXMATCH`↔`REGEXTEST` (same capability, rename to bridge);
(2) **capture-group semantics** — Sheets spills capture groups as an array, Excel returns the whole
match. Both syntactic → bridgeable, but (2) is a subtle result-shape difference. Simple extract and
replace agree.

## Method finding — Excel batch contamination

The first run of these four families **together** (16 probes in one Excel workbook) returned the SORT
probes *unsorted*; re-running `sortorder` **alone** returned them correctly. Error-producing formulas
(`@`, intersection, `{LAMBDA…}`) in the same workbook batch corrupted other formulas' recalculated
results. **Consequence:** Excel multi-family batches can contaminate; isolated runs are the safe
default, and **prior batched Excel results should be re-confirmed in isolation** before being treated
as load-bearing. (This is the 5th method artifact after array_context, type-faithful seeding,
blank-vs-empty, and array-literal-sort orientation.)

## How this changes the synthesis

The earlier "formula semantics are highly portable" claim was **too clean — it was sampling-biased
toward value-producing functions with clean inputs.** Corrected:

- **Value semantics** (what a function computes from clean typed inputs) remain highly portable:
  arithmetic, lookup values, collation, lambda-over-array, spill shapes.
- **But there is a real *structural* divergence class** the first passes missed: **Excel-only
  reference/intersection operators** (`@`, space-∩, union) and **divergent argument semantics**
  (SORT's 3rd arg). These are syntactic → bridgeable, but one (SORT `-1`) is a **silent wrong
  result**, the most dangerous kind for an unattended bridge.
- So a "thin bridge" must additionally: detect/flag-or-rewrite Excel-only operators, and translate
  divergent argument conventions — on top of the array-literal/ARRAYFORMULA rewrites, the POWER guard,
  the lookup flag, and value-type normalization.

## Caveats & next

- Excel↔Sheets, en-US, dynamic-array mode, test-not-prove. Run isolated (post-contamination).
- **Re-confirm prior batched Excel results in isolation** (contamination risk).
- Harden the harness: isolated Excel runs + the known-bridges/type-faithful-seed pre-filter, so the
  reported surface is honest by construction.
- Regex deserves a deeper pass (dialect: RE2 vs Excel's engine — backreferences, lookarounds,
  named groups, Unicode classes) — likely a substantial divergence area beyond the names + group shape.
