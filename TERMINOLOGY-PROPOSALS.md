# Terminology proposals & corrections — 2026-07-11 wiki contribution

Merged per-agent logs for maintainer review. Sections preserved verbatim.

---

# Terminology proposals — agent: arrays

One line per coined or redefined term. Maintainer reviews.

## Coined terms

- **Broadcasting** — concept/Broadcasting.md (title) — the elementwise combination of arrays of different shapes under an operator or array-enabled function (scalar-against-array, row-against-column outer product, cell-by-cell). Rationale: the NumPy term is already used informally in Array-enabled functions.md and the deep-dive notes, but had no concept-page home; it anchors the cross-engine orientation rules.
- **Broadcast collapse** — concept/Broadcasting.md — Google Sheets returning only the first (top-left) element when two array operands cannot be reconciled by broadcasting (same-orientation vectors of unequal length), instead of padding with `#N/A`. Rationale: names the silent, non-obvious Sheets behavior that contrasts with Excel's `#N/A` padding and is a wrong-answer hazard.
- **Entry rejection** — concept/Entry rejection.md (title) — an engine (chiefly Excel) refusing to store a formula at entry, leaving a genuinely empty cell rather than a value or an error. Rationale: distinguishes "never stored" from "stored then errored," which matters for reading recorded blanks correctly (a rejection is not a `0` or a computed blank).
- **Dynamic array** — concept/Dynamic array.md (title) — a formula result whose size is fixed at evaluation time and which spills into neighboring cells; the SEQUENCE / reshape / SORT / UNIQUE / FILTER / FLATTEN family. Rationale: "dynamic array" is Excel's official term and community-standard for the spill family, but is not Google's official terminology; the page is the cross-engine availability home. (Borrowed rather than newly coined; logged for the WARNING callout.)

## Corrections

None. All edits to existing pages (Array.md, Array-enabled functions.md) added cross-engine material without contradicting existing statements.

---

# Terminology proposals — coercion agent

## Coined / redefined terms

- **Arrival path** — used in `concept/Type coercion.md` (§Arrival path). Definition: the route by which a value reaches an operation — as a direct scalar argument, versus as an element of a range or array literal — which determines whether the value is coerced. Rationale: names the load-bearing distinction behind "coercion rules are not universally applied"; the same `"2"` coerces as a scalar argument to `SUM` but is ignored inside a range/array literal, and no existing term captured this arrival-dependent behavior. Sourced from the deep-dive note phrasing "by how the value arrives" (batches/lambda-logical-coercion/notes/SUM-PRODUCT-coercion.md).

## Corrections

- `concept/Type coercion.md` — reference table error literals `#VALUE` → `#VALUE!` (added the trailing `!`). Evidence: the style guide requires error literals be written as their full literal in code, and the actual Google Sheets error is `#VALUE!` (e.g. `=VALUE("TRUE")` → `#VALUE!`, assay: VALUE/value-of-boolean-string). Also filled the two `"FALSE"`/`"foo"` number-column cells that read `#VALUE` to `#VALUE!` for the same reason.
- `concept/Type coercion.md` — intro sentence "The rules behind this process are not universally applied; that is, some functions coerce data types and others do not" → reframed to attribute non-uniformity to both the operation and the value's arrival path (was: operation-only). Evidence: SUM/PRODUCT coerce a scalar `"2"`/`TRUE` argument but ignore the identical value inside a range or array literal (assay: SUM/mixed-array-in-sum, SUM/sum-of-string-range; gsheets probe, 2026-07-11) — the function alone does not decide.
- `concept/Zero element.md` — reframed engine support: the `TOCOL`/`TOROW`/`ARRAY_CONSTRAIN` constructs are not portable. Was: no engine framing (implied universal). Now: TOCOL/TOROW available in Google Sheets, Excel 365, Lattice, and the `formulas` library but `#NAME?` in HyperFormula/IronCalc/pycel; ARRAY_CONSTRAIN is Google-Sheets-only. Evidence: assay TOCOL/tocol-row, TOROW/torow-col; live probe 2026-07-11 (batches/arrays/notes/dynamic-array-reshape.md).

---

# Terminology proposals — errors agent

Coined or redefined terms introduced by the concept-errors-precision pages. One line each: term — where used — definition — rationale.

- **error-code split** — `concept/Error code portability.md` (title concept), `concept/Error.md` — A failure that every engine agrees is a failure but that different engines label with different error sentinels (e.g. `IMDIV`-by-zero → `#NUM!` in Excel vs `#DIV/0!` in Google Sheets). — Recurring cross-engine pattern with no existing name; distinguishes a code-labeling difference from a coverage gap (where the function is absent and returns `#NAME?`).
- **display read-back** — `concept/Numeric precision.md` — An engine (or its driver) capturing a numeric value at its formatted display precision rather than at its full stored double, so the value appears to diverge when only its rendering does (observed in IronCalc across the financial suites). — Names the reduced-precision capture artifact so an IronCalc-alone numeric class is read as agreement-at-lower-precision, not as a computed divergence.
- **significant-figure cap** — `concept/Numeric precision.md` — The ceiling (15 significant figures in Google Sheets and Excel) at which an engine stores or renders a numeric value, below the full IEEE-754 double precision that HyperFormula, formulas, and Lattice expose. — Gives a stable name to the 15-digit limit that separates the two engine precision families and explains last-digit cross-engine mismatches.

## Corrections

- `concept/Error.md` — divide-by-zero error literal `#DIV/0` → `#DIV/0!` (in the Error Types table and the Common Causes heading). Evidence: Google Sheets' actual error literal carries the trailing `!`, matching the other literals in the table (`#VALUE!`, `#REF!`, `#NUM!`) and the value returned live across engines (assay: SUM/sum-with-one-div-0; live probe, 2026-07-11).

---

# Terminology proposals — fn-quant

Scope: quantitative function pages (engineering, math, financial, statistical,
array, date). Cross-engine `### Engine compatibility` sections added from the
2026-07-11 deep dive.

## Coined / redefined terms

None. Every cross-engine behavior in this set was expressible in plain prose
(missing-function `#NAME?`, error-code splits, text-date coercion, precision-of-
rendering), so no new term was coined and no unofficial-terminology callouts were
added.

## Corrections

Each row: page — was → now — evidence.

- **ACOT.md** — Notes claimed unconditionally "ACOT returns results that are
  between 0 and π (pi)," which contradicted the page's own sample table
  (`ACOT(-4) = -0.2449786631`, a negative result). → Clarified that the (0, π)
  range is the Excel convention; Google Sheets (and HyperFormula) compute
  `ATAN(1/x)`, range (-π/2, π/2), so negative inputs return negative results as
  the sample table shows. Evidence: math-longtail/notes/ACOT-ACOTH.md; Excel
  `ACOT(-1) = 2.356194490192345` and `ACOT(-0.5) = 2.0344439357957027`
  (live probe 2026-07-11, probes/excel-lane-notes.md); gsheets branch from
  recorded fixtures + the page's own imported sample table.

---

# Terminology proposals — fn-text

Agent: **fn-text** (function pages, text / info / lookup / logical set).

## Coined or redefined terms

**None.** Every `### Engine compatibility` section was written in plain descriptive language, reusing
existing wiki vocabulary and wikilinks ([[Null]], [[Array]], [[Type coercion]], etc.). No unofficial
term was coined, so no page carries the unofficial-terminology WARNING callout.

A few descriptive phrases recur and could be formalized later if the maintainer wants canonical terms
for them, but none is presented on-page as established vocabulary:

- "empty-string cell" — a cell holding a zero-length string `""` (used on ISBLANK, COUNTA, COUNTBLANK, T).
- "array-wrapper idiom" — the Google Sheets `INDEX(array_expression)` trick with both indices omitted
  (used on INDEX; the phrase comes from the deep-dive notes).
- "byte functions" / "the `*B` family" — the DBCS byte-oriented text functions (used on LENB/MIDB/FINDB/LEFTB).

## Corrections

**None.** All edits added a new `### Engine compatibility` section (plus a `modified, undocumented`
tag) to each page; no existing statement was changed. Where the deep-dive corrected an earlier
hypothesis (notably `dve-007`: Google Sheets `=IFERROR(10/{1,0,2},-1)` returns the scalar `10`, not a
spilled array), the corrected value was used on the page (IFERROR) and the pre-correction value was not
propagated.

## Note on tags

Each edited page had its frontmatter `tags: []` changed to `tags: [modified, undocumented]`, per the
Style Guide (replace `#generated` with `#modified` on edited generated pages) and the `#undocumented`
rule (cross-engine behavior is not covered by the official Google documentation the pages were
generated from).

---

# Terminology proposals — agent `types`

Coined or redefined terms, one line each. Maintainer reviews.

## Terms

- **Blank** — used in `concept/Blank.md` (new page), and referenced from `Data type.md`, `Null.md`, `String.md`, `Boolean.md`. Definition: a cell that holds no content, for which `ISBLANK` is `TRUE` universally. Rationale: separates the cell-state notion of emptiness from the empty string `""` and from the null value, which the wiki previously conflated inside `Null.md`.
- **Null** (redefined) — used in `concept/Null.md`. Definition: the absence of a value in a formula expression — an empty argument slot or an expression that yields no value — as opposed to a blank _cell_. Rationale: `Null.md` and `Data type.md` previously used "null" to mean both "blank cell" and "empty argument", muddying the term; this pins it to the in-formula sense and hands the cell-state sense to [[Blank]].
- **Empty-string boundary** — used in `concept/Blank.md`, `String.md`. Definition: the cross-engine fault line over whether a cell holding a zero-length string `""` counts as blank (Excel-family) or as a text value (Google Sheets / HyperFormula / IronCalc). Rationale: names a recurring, load-bearing divergence so other pages can refer to it without re-deriving the engine split each time.

## Corrections

- **`concept/Data type.md`** — Null table row: was "Conceptual type for **blank cells** or expressions with no value" → now scoped to the in-formula null value, with blank cells handed to the new [[Blank]] concept. Evidence: the blank/null/empty-string three-way distinction (assay: ISBLANK/isblank-of-empty-string-cell; deep-dive info/ISBLANK.md).
- **`concept/Data type.md`** — added that the blank/empty-string boundary and cross-type comparison ordering are engine-dependent; the isolated-gsheets framing was sharpened to cross-engine truth. Evidence: assay COUNTA/counta-empty-string-cell, GT/gt-boolean-vs-number; live probe 2026-07-11.
- **`concept/Number.md`** — "approximately 15 decimal digits of precision" clarified as the Google Sheets / Excel ~15-significant-figure storage-and-render cap, contrasted with pure JS/Python engines that expose full IEEE-754 doubles. Evidence: gsheets-lane-notes.md (CONVERT `3.28083989501312`, 15-sig-fig cap); live probe 2026-07-11 (formulas `=1/3` → `0.3333333333333333`).
- **`concept/Boolean.md`** — added the aggregation arrival-path rule (booleans skipped inside ranges/array literals, coerced as direct scalar args) and the cross-type comparison ordering (booleans rank above all numbers/text); the `SUM(TRUE, TRUE, FALSE) → 2` example is the scalar-arg case and is left as-is. Evidence: assay SUM/boolean-array-in-sum, GT/gt-boolean-vs-number; deep-dive SUM-PRODUCT-coercion.md.

---

# Terminology proposals & corrections — calc-limits lane (2026-07-11)

## Coined terms

None. The additions to `concept/Calculation limits.md` reuse the page's existing descriptive
vocabulary (function call limit, stack limit, HOF overhead, pass-through position). The one new
distinction introduced — a string _produced by a function_ versus a string _literal_ — is stated in
plain prose rather than as a coined term, so no [[Unofficial terminology]] WARNING was added.

## Corrections

The wiki's function-call / HOF / stack model needed **no correction** — all 28 boundary pairs tested
reproduced live to the exact element. The changes below are additions and one refinement, not
overturns.

| Page                       | Was → Now                                                                                                                                                                                                                                            | Evidence                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| concept/Calculation limits | (implicit) all limits output `#ERROR!` → the array-size limit is a third independent limit that errors with `#VALUE!`, distinct from the `#ERROR!` of the call and stack limits                                                                      | live probe: `=SEQUENCE(10000001)` → `#VALUE!`; `=ROWS(MAP(SEQUENCE(10000000),LAMBDA(x,)))` → `10000000` |
| concept/Calculation limits | (absent) → new section "Other calculation limits": array size 10,000,000 (`#VALUE!`), computed-string 50,000 / REPT ~32,000 (`#VALUE!`), nesting depth ~280 (HTTP 500), argument count uncapped, formula length >2,000,000, numeric overflow `#NUM!` | live probes 2026-07-11 (see deep-dive-2026-07-11/calc-limits/NOTES.md)                                  |
| concept/Calculation limits | (absent) → stack-limit boundary stated exactly (9,999 ok / 10,000 `#ERROR!`) and shown to bind well before the call limit (~70k calls at depth 10,000)                                                                                               | live probe: self-applying recursive lambda, depth bisection                                             |

## Cross-engine claims to verify

- The new "Argument count" subsection states Excel "caps most functions at 255 arguments." This is a
  widely-documented Excel limit but was **not** measured in this gsheets-only lane; the gsheets side
  (no independent argument cap; `SUM` of 24,000 args returns 24000) **was** measured live. Flagging
  for maintainer confirmation of the Excel half.

## Notes on the machine-verified vs community-derived split

An `> [!INFO]` provenance callout was added near the top recording that the call-counting model, HOF
overhead, and stack limit were machine-verified live on 2026-07-11, and that the other limits were
measured in the same run. No part of the pre-existing page was found to be community-derived-but-wrong.
