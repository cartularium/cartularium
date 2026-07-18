# Architecture map — assay · contracts · interleaf · lattice (2026-05-31)

The **connective overview** that the deep-dive design docs assume but never draw.
Written to un-shake the "how do the pieces fit / what did we promise" mental model
before resuming design work. Grounded in code as it really is on this date, not in
the vision. Companions (deeper, narrower):
[`value-model-foundations`](./value-model-foundations-2026-05-30.md),
[`driver-contract-design`](./driver-contract-design-2026-05-30.md),
[`comparison-model-design`](./comparison-model-design-2026-05-30.md),
[`assay-roadmap`](./assay-roadmap.md).

---

## 0. The one initiative
Everything below is one move: **retroactively installing deliberate contracts on a
system that was accreted without them**, *design-first* (settle what a thing **is**
before structuring or extracting it). The four design threads (value model, driver
contract, comparison model, AST substrate) are faces of that single move.

---

## 1. The cast — grounded identities

| Package | What it **is** (verified) | Owns | Has an evaluator? |
|---|---|---|---|
| **assay** | the engine-divergence **catalogue** + pipeline (read→generate→compare→surface) | compatibility *evidence* | no — it *drives* engines |
| **@cartularium/contracts** | the conservative **schema spine** | `RichCellValue` (the **storable** value model), `Platform`, manifest, the new `FormulaCompatibility*` feed schema | n/a |
| **@cartularium/interleaf** | Excel↔Sheets **surface-syntax transpiler** (parse→print + compat diagnostics) | `FormulaExpr` (23 surface AST nodes), the 2 dialect printers | **no** — pure syntax; defers eval to Lattice |
| **lattice** (sibling repo) | a versioned, typed, **functional spreadsheet language + runtime** | `ExprKind` (full-language AST), `ValueKind` (rich values), its own evaluator | **yes** — demand-driven, löb, memoized |

Two of these have an AST (`interleaf.FormulaExpr`, `lattice.ExprKind`). **They are
different ASTs and are not connected** (see §6 — the open decision).

---

## 2. First-class vs nice-to-have engines

assay drives 8 engines, but only **three are first-class: `excel`, `gsheets`,
`lattice`.** The other five (`hyperformula`, `ironcalc`, `libreoffice`, `formulas`,
`pycel`) are **nice-to-haves** — useful divergence signal, not a support promise.
Design decisions optimize for the three.

How a formula reaches each first-class engine (**all verbatim — no driver rewrites the string**):

| engine | entry point | dialect parsed | printer needed |
|---|---|---|---|
| excel | xlwings `Range.formula2` (live, dynamic-array aware) | Excel A1 (modern) | interleaf `excel` |
| gsheets | Sheets API `userEnteredValue.formulaValue` | Google Sheets | interleaf `gsheets` |
| lattice | `lattice assay` stdin JSON line → Lattice grid parser → `ExprKind` | **Lattice's own grid dialect** (Excel-A1-ish superset) | none today (Lattice parses it) |

So **2 printers (excel, gsheets) cover the engines that need text**, and lattice
parses its own grid dialect. (The 5 nice-to-haves all consume Excel-A1 — verbatim
into an xlsx cell or in-process — so the `excel` printer reaches them too, *syntactically*.)

Layout quirk: the harness writes the formula-under-test at **`AA1`** for most drivers
but **`Z1`** for lattice; grid in the A1 region; a spill window is read from the target.

---

## 3. The value spine — Strachey, now instantiated in code
The recurring ontology (storable ⊊ expressible; a reference is expressible+denotable
but **not** storable) is no longer abstract — it maps onto real types:

| Strachey set | "what can ___ be?" | **where it lives in code** | members |
|---|---|---|---|
| **storable** | a *cell* hold (what assay captures) | `contracts/RichCellValue` + `PrimitiveValue` | number, string, boolean, error, extended-error, blank, null, rich-text — **no reference, no lambda** |
| **expressible / denotable** | an *expression* evaluate to / a *name* bind to | **`lattice/value.rs ValueKind`** | + **Reference, Lambda, Dict, Table, List, Range, Date, Sheet, Bytes, Annotated, Native, Transient** |

`storable ⊊ expressible` is **literally true** comparing the two enums. And the
**expressible→storable coercion already exists**: lattice's `value_to_json` (in the
`assay` driver) maps Number/Date→number(serial), String, Boolean, Error→`{error}`,
and **everything richer (Dict/Lambda/List/Reference/Range) → a Display string**.
That collapse is lossy in exactly the way assay's own `rich-text → string` projection
is — the structured-value hole is **symmetric** across both sides.

> **Correction to the earlier note** ("lattice has no richer-than-ordinary values yet",
> value-model-foundations §6.3): `ValueKind` clearly declares Dict/Lambda/Reference/
> Table/List/Date. Either that note is now stale, or the rich values exist *in the
> language* but are collapsed by the grid/`assay` projection (`value_to_json` above).
> **Verify** whether rich values surface through the grid before treating Lattice as
> the structured-value reference.

---

## 4. "Evaluate the IR" — two realizations (the corrected framing)
`eval(node, env)` has **two** realizations, not one. The earlier docs implied only the
second (an unbuilt interpreter); the first is more assay-native and mostly already built.

- **Execution (extensional)** — `print(IR, dialect) → driver.evaluate(formula, grid)`.
  The engine *is* the evaluator. Defines semantics by what engines actually do.
  **~built**: verbatim pass-through + 2–3 printers; N engines = **N denotations** =
  the north-star's "N per-engine interpretations." Gated by **printability =
  Coverage** (a *partial* function — where the IR can't print to engine X you get ⊥,
  and that ⊥ *is* the coverage divergence). This also replaces assay's current ad-hoc
  per-platform formula rewriting (`reconcileFeatures`/`arrayformula-wrap`).
- **Interpretation (intensional)** — a real evaluator over an `Env`. **Lattice already
  is one** (`ExprKind → eval → ValueKind`, löb, demand-driven). Needed for the
  *normative* overlay: `universal`/canon (pure-math correctness independent of engines),
  static "what would X do" without a live host, offline/deterministic, volatile control.

**Takeaway:** define assay's semantic value **extensionally first** (the family of
per-engine executions), with interpretation (Lattice / a tiny universal evaluator) as
a later normative overlay. Matches "assay is descriptive, not normative."

The eval bridge is therefore **mostly already built, distributed across the system**:
`interleaf.print` + `driver.execution-contract` + `value_to_json`-style coercion.
The driver-contract thread and the AST-substrate thread are the **same machine**.

---

## 5. The multi-AST reality — **the open architectural decision**
There are (at least) **three** parsers of spreadsheet-ish syntax, producing **three
different, unconnected ASTs**:

1. **interleaf `FormulaExpr`** — Excel/Sheets *surface* grammar; narrow (literals,
   refs, calls, operators, ranges, Excel-only surface forms). No binding/lambda/control-flow.
2. **lattice `ExprKind`** — a *full functional language* AST (Let, Lambda, If, Switch,
   Dict, comprehensions, pipes, member/binding access, type annotation). Rich.
3. **each engine's own internal parser** (excel, gsheets, …).

**There is no shared node vocabulary today.** The north-star "operational-AST
substrate = per-engine ASTs + **one shared node vocabulary** + ⊥-transpilation" is
**unrealized** — what exists is parallel, independent ASTs.

> **The keystone decision for the substrate vision:** what is the shared IR?
> (a) promote **lattice `ExprKind`** (richest, has an evaluator, but Lattice-specific);
> (b) extend **interleaf `FormulaExpr`** semantically (surface-shaped, Excel/Sheets-only today);
> (c) a **new third** vocabulary both map into.
> interleaf's README promise — "Lattice can evaluate the shared formula IR" — *presumes
> a `FormulaExpr → ExprKind` bridge that does not exist.* This decision, not the
> collapse pin, is probably the real blocker for the AST vision.

---

## 6. Promises (vision) vs reality (built) — the honest scorecard

| Promise | Status | Grounded note |
|---|---|---|
| **M1 — read truth from a sheet** (value model) | 🟢 mostly built | `RichCellValue` shipped; **collapse refinement paused** at the pin |
| **M2 — fixture generation** (driver contract) | 🟡 designed, not built | two divergent orchestration loops; 3-layer contract designed |
| **M3 — compare fixtures** | 🟡 designed, not built | Coverage/Behavior/Evidence + canon/origin |
| **surface to consumers** | 🟡 partial | manifest exists; interleaf **compat-feed schema** now in contracts (assay-generated feed not built) |
| **interleaf** (formula transpiler) | 🟢 owned, **v0** | Excel↔Sheets *text* only; no evaluator; tiny compat seed |
| **operational-AST substrate** (north star) | 🔴 not built | blocked on the §5 shared-IR decision; multiple un-unified ASTs |
| **@cartularium/drivers** (extraction) | 🟡 designed, not extracted | falls out *after* the driver contract is settled |

---

## 7. Where to resume design (revisit list)
1. **Ratify the collapse** (the paused value-model pin) — with the two sharpenings
   (containment-not-identity; the accessor-closure invariant).
2. **The shared-IR decision (§5)** — the real keystone for the substrate vision.
   Likely path: execution-first (extensional, §4), Lattice's `ExprKind` as the
   candidate shared vocabulary / interpreter, interleaf as the Excel/Sheets front-end
   that must eventually map into it.
3. **Eval = execution-first?** Confirm the extensional definition, with interpretation
   as a small normative overlay.
4. **M2 driver-contract consolidation** (merge the two loops; add capability/volatility/
   missing-function/timeout) — now understood to be the *execution* half of the eval bridge.

---

## Appendix — driver formula-input map (verified 2026-05-31)
No driver rewrites the formula string; each engine's own parser sets the dialect.

| engine | class | entry | dialect |
|---|---|---|---|
| excel | first | xlwings `.formula2` | Excel A1 (modern, dyn-array) |
| gsheets | first | Sheets API `formulaValue` | Google Sheets |
| lattice | first | `lattice assay` stdin → `ExprKind` | Lattice grid dialect |
| hyperformula | nice | `setCellContents([[f]])` in-process | Excel-A1-compatible |
| ironcalc | nice | `model.set_user_input(r,c,f)` | Excel A1 |
| libreoffice | nice | openpyxl xlsx cell → `soffice` recalc | Excel A1 (xlsx stored) |
| formulas | nice | openpyxl xlsx cell → `ExcelModel` | Excel A1 (xlsx stored) |
| pycel | nice | openpyxl xlsx cell → pycel compile | Excel A1 (xlsx stored) |

Confounds for transpile-and-execute (independent of dialect):
- **Spill entry-method artifact:** excel (`.formula2`) and hyperformula (`useArrayArithmetic`)
  spill; openpyxl-staged engines get the formula as a plain cell → "legacy non-array,
  spill top-left only" (per the excel driver's own comment). Same text, different spill.
- **`_xlfn.` stored-form gap:** modern dynamic-array functions often need `_xlfn.`/
  `_xlfn._xlws.` prefixes in the xlsx stored form; no script (and not interleaf's
  printer) emits them — modern functions may not resolve on the openpyxl path. *Unverified.*
- **Layout:** formula at `AA1` (most) vs `Z1` (lattice); IR references must target the harness layout.
- **Lattice dialect Excel-compatibility** beyond `=SUM(A1:A3)` is **unverified** (its own parser).
