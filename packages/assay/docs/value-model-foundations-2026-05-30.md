# Value-model foundations — 2026-05-30

**What *is* a spreadsheet value?** This is the M1 foundational companion to the
[driver-contract design](./driver-contract-design-2026-05-30.md): where that doc
asks "is the *driving* model right," this asks "is the *value* model right —
philosophically, not just field-by-field." It grounds the current model in code,
lays out the ontology the session converged on, and parks the open calls.

It came out of the driver-contract session drilling down: a question about
*package boundaries* (should drivers be `@cartularium/drivers`?) bottomed out at
*what a cell value fundamentally is*, because the modules were accreted without a
deliberate value contract. Companion to
[`cell-value-schema-review-2026-05-30.md`](./cell-value-schema-review-2026-05-30.md)
(the field-level survey) and [`comparison-model-design-2026-05-30.md`](./comparison-model-design-2026-05-30.md)
(M3, whose Coverage/Behavior/Evidence ladder turns out to be this same ontology
viewed from the comparison side).

**Status:** the grounded inventory (Part 1) is fact; the north star (Part 4) is
direction, not commitment. **The ontology evolved during the session — Part 2's
four-peer-tier framing was refined and then *collapsed*. Read Part 6 for the
current frontier; it supersedes Part 2.** The session was paused (handoff
2026-05-30) at the collapse hypothesis, which is the pick-up point.

---

## Part 1 — What a value can be *today* (grounded in `contracts/src/cell-value.ts`)

Four layers, as the code actually is.

### ① Scalar `CellValue` — the cross-engine projection ("tested spine")

```
CellValue = number | string | boolean | CellError | null      CellError = { error: string }
```
Exactly five things. This is what divergence detection and legacy matchers run
on, via `projectPrimitive`.

### ② `PrimitiveValue` — the rich per-cell value (8 discriminated kinds)

| kind | carries | note |
|---|---|---|
| `number` | `value: number` | |
| `string` | `value: string` | |
| `boolean` | `value: boolean` | |
| `error` | `sentinel` | classic 7: `#DIV/0! #N/A #NAME? #NULL! #NUM! #REF! #VALUE!` |
| `extended-error` | `sentinel`, `error_type?` | non-classic (Excel rich-value family; gsheets LOADING/ERROR/…) |
| `blank` | `reason?` | Excel cell-state: `untouched \| spill-recipient \| formula-no-effective` |
| `null` | `reason?` | gsheets runtime Null: `formula-returned-null \| spill-null` |
| `rich-text` | `collapsed: string` | runs live in engine extras |

### ③ `RichCellValue` — primitive + shared fields + per-engine extras

```
{ primitive, formula?, formatted?, number_format?{type?,pattern?}, hyperlink?, engine }
```

### ④ `EngineExtras` — representation (discriminated on `platform`)

- **excel** (rich): `data_type`, `is_date`, `comment`, `rich_runs`, `raw_xml`,
  `modern_error_detail`, `value2`, `display_format`, `saved_as_array`, `formula_dialect`
- **gsheets** (rich): `wire_kind`, `semantic_null`, `raw_api`
- **lattice / hyperformula / ironcalc / libreoffice / formulas / pycel**: `{platform}`-only stubs

### Grid + projection

`RichGridValue = (RichCellValue | null)[][]`. `projectPrimitive` collapses
rich→scalar — and the collapses are where information dies:
`blank` & `null` → `null`; `error` & `extended-error` → `{error}`;
`rich-text` → its string.

### Wrinkle

The scalar `CellValue`/`CellError` is **defined twice** — in
`contracts/cell-value.ts` and again in `assay/src/format/values.ts`
(structurally identical, so it compiles). The contract pass should collapse this.

---

## Part 2 — The ontology (the lens)

Scalar / semantic value / representation aren't three sibling categories —
they're three **projections of the same content at decreasing engine-specificity**.
**Cell** is orthogonal: the container, not the content.

```
engine representation  ──►  semantic value (engine algebra)  ──►  scalar (universal projection)
   (most specific)              (the behavioral truth)              (the lossy lingua franca)
```

| term | one-line | engine-relativity |
|---|---|---|
| **scalar** | atomic projection: number/string/bool/error/absence | engine-neutral |
| **semantic value** | the typed meaning + behavior in *this* engine's algebra | engine-relative |
| **representation** | the engine's stored encoding (bytes, wire shape) | maximally engine-specific |
| **cell** | positioned container holding content; **has an address** | identity is what *references* denote |

Key consequences:
- A **reference** denotes cell *identity*; a **value** is cell *content*. The
  value/reference distinction is the cell-identity/cell-content distinction.
- The same scalar can be **different semantic values** in two engines; some
  semantic values (chips, dicts, references) have **no faithful scalar**.
- Therefore **scalar is a derived projection, not captured truth** — it should
  emerge from cross-engine agreement, not be the unit of capture.

This is not invented. Two existing decisions already operate at the semantic
layer: **β blank/null** (same scalar, distinct semantic values, kept apart
because they behave differently) and the **Coverage/Behavior/Evidence** ladder
(Behavior = semantic, Evidence = representation). The structure is latent in the
design; the work is to make it explicit and uniform.

---

## Part 3 — Where today's model sits in the lens

| axis | today |
|---|---|
| **scalar** | ✅ complete — the 5-option `CellValue` |
| **semantic** | 🟡 **partial** — the 8 `kind`s *are* a nascent semantic layer, but two pairs collapse on projection (blank/null, error/extended-error) |
| **representation** | 🟡 rich for 2 engines, stub for 6 |
| **cell** | 🟡 identity is *implicit* (the grid coordinate); some content fields ride on `RichCellValue`; **no reference type** |

The `kind` discriminator means a **semantic axis already exists** — it's just
thin. β blank/null is it working correctly.

**Two things the code already decides implicitly:**

1. **A date is presentation, not a semantic value.** No `date`/temporal kind;
   date-ness lives in `ExcelExtras.is_date` + `number_format` — representation
   over a `number` scalar. De-facto answer to the date question today: "number +
   format," not "temporal type."
2. **Structured values are unmodeled at the spine.** The only non-classic
   semantic kind is `rich-text`, which collapses to a string. Chips / dicts /
   linked-data have no kind — the chip-equals-string false-agreement hole is real
   and present *now*.

---

## Part 4 — North star: an operational-AST substrate

The session's furthest reach: model each engine's formula language as an **AST
with operational semantics over a stateful grid-store**, with a shared node
vocabulary and ⊥-transpilation. The pieces fall out of one core:

- **semantic value** = `eval(node, env)` — the node's *denotation* in a given
  engine (not the node itself); engine-relative.
- **references** = l-values (locations) over `env` (the grid); most contexts
  implicitly dereference (identity → content). Solves "references at runtime"
  via the textbook l-value/r-value + environment distinction. (Hard part isn't
  references — it's that `env` is a fixpoint over the dependency DAG.)
- **scalar** = the equivalence class the consensus interpretations agree on —
  *derived at comparison time*, undefined where they diverge (= the divergence).
- **representation** = pure encoding; **cell** splits into identity
  (runtime-relevant: `env`'s address space) and presentation (runtime-irrelevant).
- **Coverage** = transpilability (no *reachable* ⊥); **volatility** = a volatile
  node present; **canon** = the engine whose interpretation is authoritative for
  a node it invented.

Crucial refinement: there is **no single consensus AST that perfectly describes
all runtimes** — that would encode contradictory evaluation rules in one object
and collapse the very disagreement assay exists to record. The achievable, more
faithful version: **one shared node vocabulary + N per-engine semantic
interpretations + "consensus" = the derived agreement subset.** An AST is
*syntax*; a *runtime* is syntax + the engine's semantics, and the divergences
live in the semantics.

**Not greenfield.** Per `contracts/CLAUDE.md`, a provisional formula IR already
lives at `packages/interleaf/src/ir/` (eventual `@cartularium/formula-ir`), with
a `sheets-excel-transpiler` worktree. So the AST/transpilation vision has a head
start in interleaf. The live consequence: **assay's semantic-value domain = that
IR's evaluator denotation domain** — the same type, currently in different
packages, unaware of each other. Relating them is the highest-leverage thread.

Prior art for "what's possible": Sestoft, *Spreadsheet Implementation
Technology* (Funcalc) — formalizes ASTs, references, the evaluation environment,
array formulas. OpenFormula/ODF — an existing consensus-semantics attempt
(useful as `spec:` canon *and* a cautionary tale, being consensus-by-committee).

---

## Part 5 — Open questions (parked)

Refined by the session progression (Part 6); the live framing is there.

1. **The collapse — ratify it?** (Part 6.5.) The load-bearing call now. Does the
   cell/value tier distinction collapse into "a cell is a record in one value
   universe; `content` is its derived field; the cell↔value line was the
   *accessor frontier* all along"? Everything below reframes under it.
2. **The date line** — under the collapse this becomes "where is the accessor /
   propagation frontier for date-ness in engine E?" — empirically checkable
   (does date-ness propagate through `=DATE(…)+1`?), not a fiat. Code today
   captures only the cell-applied facet.
3. **Structured values** — shape of a `structured`/`other` kind (chips, dicts,
   linked-data) that survives projection + a distinguishable scalar member so a
   chip never silently equals a string.
4. **References** — settled in principle (Part 6.2): **expressible + denotable but
   not storable.** First-class in the eval/AST domain, *absent* in the capture
   (read-back) domain. Remaining: how the eval domain models them (lattice
   captures `{resolved_ref, value}`).
5. **Relationship to the interleaf IR** — is assay's value model the denotation
   domain of `@cartularium/formula-ir` (`packages/interleaf/src/ir/`)? Where does
   the type live (contracts / formula-ir / drivers)? Highest-leverage thread.
6. **Re-found M2/M3 on the AST substrate, or keep them as designed?** Deferrable.

---

## Part 6 — Session progression & the collapse (handoff frontier · 2026-05-30)

The conversation refined Part 2's four peer-tiers (scalar / semantic /
representation / cell) through several moves and ended at a *collapse*. This is
where work resumes.

### 6.1 First refinement — value lives *inside* cell

"Cell" is not a peer of the other three; it's the **container**. Scalar /
semantic / representation are three **views of one value** at decreasing
engine-specificity (representation ⊃ semantic ⊃ scalar); a **cell** holds a value
plus identity (address), definition (formula), and presentation. Scalar is the
only engine-neutral view; **scalar is *derived*, not captured.**

### 6.2 References — the storable/expressible distinction (Strachey)

Three value-sets, not one (the l-value/r-value lineage):

| set | "what can ___ be?" | members |
|---|---|---|
| **expressible** | a (sub)expression evaluate to | …+ **reference**, array, lambda |
| **denotable** | a name be bound to | values · **references** (named ranges) · lambdas |
| **storable** | a *cell* hold | scalars · structured · array(spill) — **no bare reference** |

`storable ⊂ expressible`. A **reference is expressible + denotable but not
storable** — which resolves: `INDEX(A:A,2):INDEX(C:C,4)` works (refs are
expressible — INDEX returns one, `:` consumes two); you never read a reference
back from a cell (not storable — forced/dereferenced at the storage boundary);
named ranges work (denotable). ⇒ assay **captures storable values → no `reference`
kind, ever**; the **AST evaluator manipulates expressible values → `reference`
first-class.** Two different domains. Lattice confirms: it records
`{function:"offset", …, resolved_ref:"A4", value:42}` — the expressible reference
*and* the storable value (`lattice/spec/semantics.md:218`).

### 6.3 Environment = `address → cell` (not `→ value`)

Cell-owned properties are reachable from formulas (`CELL("format",·)`, `ROW`,
`FORMULATEXT`). They are **not** "brought down" to the value tier — instead the
**environment holds full cells**, and **dereferencing generalizes**: a reference
is a handle, and functions project different *facets* of the referenced cell into
values (value via default deref, format via `CELL`, position via `ROW`, formula
via `FORMULATEXT`). Lattice: all refs are "just cell reads"
(`semantics.md:237`). Execution model is **Löb** (`semantics.md:54–56`): each
cell is a function of the whole evaluated sheet and contributes its value back —
"read **and** impact" is the löb knot. Cross-node cycles / iterative calc are
**deferred** (`semantics.md:662`); single-node iteration is `FIXPOINT`. (Caveat
from maintainer: lattice has no richer-than-ordinary values yet — clean reference
for the *execution* model, not the structured-value layer.)

### 6.4 The discriminator that failed — and why

Proposed test: "would this property survive as an intermediate value with no
cell?" → value if yes, cell if only-on-a-slot. **It's unstable**: properties that
were cell-only *gained formula surfaces later* (`FORMULATEXT` (2013) exposed the
formula; `A1#` exposed spill extent; `FIELDVALUE` exposed linked-data fields). So
the test measures *whether an accessor exists yet*, per-engine and time-varying —
not what a property *is*.

### 6.5 The collapse (the pin — resume here)

There is **no ontological cell/value tier**. **A cell is a structured value (a
record)** with fields `{address, formula, content, format, comment, spill, …}`;
references denote such records; "formula surfaces" are **field accessors**. The
boundary that moved was never ontological — it's the **accessor frontier**. This
also collapses representation↔cell: **representation = the cell record un-parsed
(raw bytes); the named fields = it parsed** — same object, two fidelities.

```
CELL  =  one record, two fidelities
   representation  ──  raw encoding (unparsed)        ┐ same truth
   fields          ──  {address, formula, content,   ┘ two views
                        format, comment, spill, …}
                            │
                            └─ content : VALUE
                                  semantic ── meaning (engine-specific)
                                  scalar   ── cross-engine projection (derived)

reference  → denotes cell(s); accessors project fields
environment → address → CELL;   content = eval(formula, environment)   ← löb knot
```

So: **a cell (raw ↔ parsed) containing a content-value (semantic ↔ scalar),
reached by references via field-accessors.** Four tiers → one universe with
containment. **NOT** "cell ≡ value."

**Four guardrails the collapse must not erase:**
1. **`content` is *derived*, not a peer field** — `content = eval(formula, env)`;
   that relation is what assay tests. One computed field, the rest given.
2. **Storability survives** — `content ⊊ expressible`; a cell-value's content
   can't be a bare reference. Collapse unifies ontology, not the storable split.
3. **The accessor frontier is per-engine / time-varying — a *feature*.** "Is
   `format` cell or value?" (unstable) → "does engine E expose an accessor for
   field `format`?" (precise, a coverage-style divergence to catalogue).
4. **The record is layered** — some fields are sheet/workbook-scoped (CF, named
   ranges); environment is `cell ⊂ sheet ⊂ workbook`, not a flat map.

**Resume here:** decide whether to ratify the collapse and restructure Part 2
around it; if ratified, the date/structured/reference questions all reframe as
"where is the accessor frontier for engine E," and the next concrete step is the
interleaf-IR relationship (6.5 question / Part 5 #5).

**Discipline note:** the immediate value-algebra work (settling this value model)
is the shared first brick of *both* the roadmap and the AST vision — so it doesn't
force a bet. Finish the base interaction (what a value is) before structuring the
cathedral.
