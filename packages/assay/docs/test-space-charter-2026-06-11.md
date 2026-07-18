# Test-space charter — 2026-06-11

> **Re-founded 2026-07-18.** This document is design history. Labels such as
> "ratified" or "charter" inside it carry no authority; governing decisions
> live in the internal decisions ledger (see
> `internal/decisions/2026-07-18-assay-refounding.md`). Where this document
> describes the no-verdict frame it remains an accurate description; where it
> conflicts with the re-founding decisions, the decisions win.

**Status: RATIFIED §1–§10 (section-by-section, 2026-06-12 → 2026-06-14). Closes
the D2 gate — D2 greenlit 2026-06-14.** A current-best, probe-grounded model
(§9, Provisionality) of assay's test space — what the catalogue is *of* — read
off the evaluation relation itself.
Written as the method correction recorded in
`seeding-isolation-design-2026-06-07.md` §5.1-caveat/§5.2: every corpus-derived
envelope argument this design cycle ("zero cross-sheet tests ⇒ future-proofing
slot," "largest result 10×1 ⇒ staging sizing," "84% lumpable") was
survivorship-biased — the corpus lacks those tests because the old
architecture could not express them, not because they don't matter. **D2
(read/spill model) ratification was gated on this charter (gate CLOSED
2026-06-14 — §8):** the O3/O4 direction is checked against *this* envelope
(§8), with corpus statistics demoted to hot-path pricing (§9).

> **Naming.** Unrelated to `tests/charter/` (the Charter object-protocol
> suite). "Charter" here = the scope-charter of assay's test space.

> **Posture.** assay is descriptive, not normative
> (`cartularium-vision-2026-06-04.md`): this charter scopes what we *observe*,
> never what engines *should* do. Where references disagree, the fork is the
> documentation.

> **Provisionality (maintainer, 2026-06-14).** Nothing here is set fully in
> stone. assay commits to staying **flexible to unknown, unforeseeable
> behavior** — this charter is the **first current-best model** of the test
> space, not a closed axiom set. Every ratified section is the standing model
> until a probe or an engine fact revises it (the §1 "scope disputes are probe
> results" rule, generalized to the charter itself).

## 1. The criterion — the observable footprint of evaluation (RATIFIED 2026-06-12; input side generalized read→depends-on 2026-06-13)

assay catalogues the behavior of one relation:

```
eval(formula, environment) → outcome
```

The test space is that relation's **full observable footprint**, both sides:

- **Input side — anything eval's outcome DEPENDS ON** (generalized 2026-06-13;
  was "anything eval can read"). The boundary is *empirical*, not stipulated,
  and a property proves its membership two ways:
  - **Projection** — some engine's formula language has a function surface that
    *reads it* (`CELL("width")` reads column width ⇒ column width is
    environment; `SUBTOTAL` skips hidden rows ⇒ row visibility is environment).
    This readable subset is the **accessor frontier** (§2).
  - **Differential** — there is *no accessor*, but varying the property changes
    `eval(F)` for some formula F (the date epoch has no reader, yet
    `=DATE(1900,1,1)` returns a different serial under 1900 vs 1904; a merged
    region changes what a non-anchor deref returns). Indirect readability *is*
    readability — what matters is that eval's outcome depends on it.

  So `X ∈ environment ⟺ (∃ accessor reading X) ∨ (∃ formula F whose eval varies
  with X)`; `X ∉ environment ⟺ neither` (no accessor ∧ no such F — comments,
  row height, fill color). To claim **in**, exhibit the accessor or the F; to
  claim **out**, assert no F exists (falsifiable by anyone who finds one). The
  differential members are exactly the **non-readable ⟺ must-be-declared**
  set: they can't be probed in-band, so a test *declares* them (§3, §5.2's
  declared environment — the design has assumed this all along). The boundary
  is therefore enumerable, and scope disputes are **probe results, not
  arguments**. **Quantifier (ratified 2026-06-12):** "some
  engine" = *any catalogued engine* — the territory is philosophically
  engine-agnostic — but the **working universe during core development is
  Excel + gsheets, with lattice joining later**: their surfaces drive the §3
  enumeration and the design; peripheral-only surfaces don't get a say
  during core development and enter as capability facts when reached
  (consistent with the seeding doc's §2.1 first-class scope).
- **Output side — anything eval PRODUCES or PERTURBS.** Two classes:
  **cell-state outcomes** (the stored value *plus* terminal properties the
  evaluation deposits on its cell — hyperlink, auto-applied number format)
  and **host effects** (crash, wedge, capacity drawdown, time). **Formulas
  are not pure in the host model** — the purity assumption is exactly what
  erased the contamination channels the seeding design exists for (seeding
  doc §6.1). The write side is part of the criterion, not an appendix.

Two structural rules ride the criterion:

- **Terminal vs circulating** (the output-side sorter): does the property
  survive `=A1`? **Survives ⇒ value-model territory** (rich entities — part
  of what the cell's content *is*; `=A1.Price` works; **in-cell images
  circulate on both first-class platforms** — maintainer-confirmed
  2026-06-12; whether an image is a valid *lookup target*, e.g. for gsheets
  `VLOOKUP`, is a probe question). **Doesn't ⇒ terminal outcome property**
  of the producing cell (`HYPERLINK()`'s link does not ride a reference;
  `DATE()`'s auto-applied format stays behind). The sorter itself is
  per-engine empirical, and where engines disagree on which side a property
  falls, **that disagreement is itself catalogable divergence** (an
  accessor-frontier datum, §2).
- **Capability, never divergence** (the observability rule): per-engine
  readability of any channel is a *capture* fact about us, never a behavior
  fact about the engine. "Our blindness ≠ engine difference" — the
  semantic-null rule generalized to every channel. A channel we cannot read
  on engine E is recorded **no-data**, never manufactured into agreement or
  divergence.

Note the criterion is **per-side**: column width is *in* as input (readable
via `CELL("width")`) while staying *out* as outcome (we do not catalogue what
a cell looks like). Likewise number format: readable input via
`CELL("format")` (format-as-type), terminal output when `DATE()` auto-applies
it.

## 2. The cell-record ontology underlies both sides — but read and write are distinct maps (RATIFIED 2026-06-13)

The value-model collapse (`value-model-foundations-2026-05-30.md` Part 6)
gives the structure both sides of the criterion range over: a cell is a
**record of fields**; the environment is that record, layered
`cell ⊂ sheet ⊂ workbook` (guardrail 4) extended one layer to the
**host/session** (bridge-translation doc §8: environment also carries
execution-model config). What the collapse does *not* give is a single
relation unifying reading and writing — and the two-sided criterion forces
precision about that.

**Input side ⊇ the accessor frontier** (collapse, verbatim). "Formula
surfaces" are **field accessors**; the set of fields engine E exposes a
*reader* for is per-engine and time-varying (`FORMULATEXT` 2013, `A1#`,
`FIELDVALUE`), and that variation **is divergence data**, not a fixed
boundary (guardrail 3). §3's accessor rows are exactly "which fields of the
environment record have a reader, in any engine." **The accessor frontier is
the *projectable* (nameable) subset of the input side, not all of it**
(refined 2026-06-13): the §1 differential members — locale, date epoch,
iterative-calc, merged-ness, value-coercing data validation — are environment
proven by *effect*, with no accessor, so they sit in the record beyond the
frontier (collapse-consistent: guardrail 3 already allows record fields the
frontier hasn't reached). Input side = accessor frontier ∪ differential
remainder; §2's read-map covers the former, declaration (§5.2) covers the
latter.

**Output (field) side = the production relation** (guardrail 1:
`content = eval(formula, env)`), generalized from `content` to the other
fields eval deposits — auto-applied format, hyperlink, in-cell image. Its home
is the outcome union + `RichCellValue`/`EngineExtras` (§4), not the accessor
frontier.

**These are two distinct maps over one field set, partially overlapping —
written ≠ *value*-readable.** The disproof of read/write symmetry, **verified
live against Excel** (2026-06-13): `=HYPERLINK(url,label)`'s link facet does
not survive `=A1` — deref returns the *label* (`=A2 → "mylabel"`,
`ISTEXT → TRUE`); the link is recoverable only by reading the *formula text*
(`FORMULATEXT(A2)` returns the full `=HYPERLINK(...)` when the url is literal)
or by out-of-band driver capture, **never as the cell's value**. Whether a
deposited field is reachable by some *other* formula accessor is itself the
per-engine accessor frontier: `format` is deposited by `=DATE()` and read back
by Excel's `CELL("format")` (verified: returns `D4`) — but gsheets' `CELL` may
not expose "format" at all (probe, §7), so the same field is in-both-maps for
Excel and write-only-to-formulas for gsheets. Properties written but not
formula-readable are still catalogued — via the driver's out-of-band capture
(the §5 capture ceiling, which strictly contains the accessor frontier);
**for a `=HYPERLINK()` link that means parsing the formula text** — the
formula-form link is absent from the worksheet hyperlink collection (verified:
openpyxl `.hyperlink` is `None`, value is the formula string), whereas a
*manual/static* hyperlink (an **input** property a formula could branch on,
not an eval output) sits in the collection and is captured directly
(openpyxl `.hyperlink` populated). And write-only is a frontier *position*,
not an essence: `FORMULATEXT` (2013) moved formula text into the readable set;
a future `GETHYPERLINK` would do the same for the link. So the **löb knot is
*not* the read/write unifier** — it is the **content fixpoint** (content in,
content back), nothing wider. The terminal/circulating sorter (§1) relates the
write-map to the *deref slice* of the read-map: **circulating** = written ∧
deref-readable (content, image, rich entities); **terminal** = written ∧
not-deref-readable (format — still `CELL`-readable in Excel; the hyperlink link
facet — value-unreadable, driver-captured).

**Host effects** (crash / wedge / capacity / external-time) sit outside the
field set entirely — neither read nor written as fields — the "formulas are
not pure in the host" impurity the seeding/isolation design owns (§6.4 signal
classes), not the cell-record ontology (ratified 2026-06-13).

The accessor-reachable / not-reachable line coincides with the seeding doc's
**in-band / out-of-band native-probe line** (§2.2), which keeps the boundary
non-arbitrary: self-timed perf reads onto the readable side (clock field, read
twice via `LET/NOW`); crash-liveness, external wall-clock, and memory stay
out-of-band.

The collapse thread itself stays paused ([[assay-value-model]]); this charter
consumes its frame — the record ontology + the two relations over it — and in
particular does **not** adopt löb as a read/write unifier, nor reopen the
collapse.

## 3. The environment, enumerated (input side) (RATIFIED 2026-06-13)

Layered per §2. Each row carries its **proof kind** (§1): **P** = *projection*
(an accessor reads it — these are the accessor frontier); **D** = *differential*
(no accessor, but varying it changes some `eval(F)` — the **non-readable ⟺
must-declare** set, §5.2); **—** = *out* (neither test passes). The "surface /
witness" column names the accessor (P) or the witnessing formula F (D). Absence
of both = out until a probe proves otherwise.

| layer | property | proof | surface / witness | notes |
|---|---|---|---|---|
| **cell** | stored value + type | P | deref; `TYPE`, `ISTEXT`/`ISNUMBER`/`ISBLANK` | the VALUE layer — type-faithful seeding (D1/D6) exists for this |
| | formula text | P | `FORMULATEXT`, `ISFORMULA` | frontier moved 2013 — the canonical accessor-frontier example |
| | number format as data | P (Excel) / capture-only (gsheets) | `CELL("format")` Excel ✓ (lossy: currency→`C2`, custom date→`G`); **gsheets `CELL` has NO "format"** (resolved live 2026-06-15) ⇒ driver-capture only | format-as-type; also terminal *output* (§4) — per-side; confirms §2 "in-both-maps Excel / write-only gsheets" |
| | protect / locked state | P (Excel) / capture-only (gsheets) | `CELL("protect")` Excel ✓; **gsheets `CELL` has NO "protect"** (resolved live 2026-06-15) | added 2026-06-13; gsheets driver-capture only |
| | position | P | `ROW`, `COLUMN`, `ADDRESS` | why position-sensitivity breaks lumping (§5.2 lump screen) |
| | rich-entity fields | P | `FIELDVALUE`, `.field` deref | circulating values — value-model proper |
| | merged-ness | D | non-anchor deref returns empty/0 (F=`=A2` over a merge) | added 2026-06-13; the "ghost values" exploit (spill→merge state-store) is patched, but the deref dependence persists ⇒ in (probe §7) |
| | data validation — value-coercing | D | a checkbox makes the cell read `TRUE`/`FALSE` (F=`=A1`) | added 2026-06-13; gsheets checkbox. **Entry-gate DV (dropdown / range-restrict) has no F ⇒ Ring 2** (its rule is an eval call-site, §6) |
| | comments/notes | — | no accessor ∧ no F | **out** — the empirical boundary excluding; doubly principled (neither test passes) |
| | minor `CELL` edges | P | `CELL("prefix")` (alignment), `CELL("color")` (neg-color flag), `CELL("width")` (col width) | thin but real readers — tracked, not individually load-bearing (note: row *height* has no reader ⇒ out — the width/height asymmetry) |
| **sheet** | dimensions | P | `ROWS(A:A)`, `COLUMNS(1:1)` | **observable AND elastic** (gsheets auto-insert) ⇒ derived dims silently change evidence — hence the §5.2 derived-dims screen; dims declarable per test |
| | row/col visibility | P | `SUBTOTAL`, `AGGREGATE` | declared visibility state = environment |
| | sheet identity | P | `SHEET` (`CELL("filename")` Excel-only) | |
| | spill-path obstacles | D | a blocker flips spill → `#SPILL!` (F = the spilling formula) | declared obstacles = legal fixtures (the spill-block family, §5.2 reframe); the `#SPILL!` is the *effect*, not a reader |
| **workbook** | named ranges | P | denotable (Strachey) — name deref | |
| | named functions / `LAMBDA` bindings | P | name deref / call | gsheets named functions; Excel name-manager `LAMBDA` |
| | tables / structured refs | P | `Table1[Col]` | |
| | cross-sheet refs | P | `Sheet2!A1` | suppressed family ★ (§7) |
| | 3D refs | P | `Sheet1:Sheet3!A1` | Excel-only ⇒ Coverage-level divergence by construction |
| **host/session** | locale | D | separators / parsing / collation change `TEXT`, `SORT`, number↔text coercion | host-pinned; must-declare; environment-compatibility packing |
| | calc settings | D | epoch via `=DATE(1900,1,1)` serial; iterative via convergence-vs-`#REF!`; precision via arithmetic rounding | bridge-translation §8; epoch = environment, not a value bug; must-declare |
| | clock | P | `NOW`, `TODAY` | volatile — per-cell volatility flagging (comparison doc §5) |
| | RNG | P | `RAND` | stateless for our purposes — excluded from drift |
| | capacity headroom | D | auto-insert / refusal at the seam changes the outcome | shared pool, client-variable — **monitored signal, never a constant**; must-declare |
| | external world | P | `IMPORTRANGE`, RTD, `GOOGLEFINANCE` (accessor exists; value is async) | async/external ⇒ policy/pending outcome class |
| | host identity | P | `INFO("release")` etc. | engine/version as readable environment |

**Vocabulary alignment (unification duty):** this enumeration *is* the measure
harness's first-class **`environment` locus** (divergence loci: syntactic |
environment | data-borne — `bridge-translation-2026-06-02.md` §7/§8), now
given its layered structure. One vocabulary, two uses: the measure harness
classifies *where a divergence lives*; the charter enumerates *what the
harness must be able to declare and control*.

**Packing tie-in (the D rows are the declared set):** the **differential (D)**
rows — locale, calc settings, capacity, merged-ness, value-coercing DV,
spill-path obstacles — are *exactly* what §5.2's **environment-compatibility
packing reframe** requires a test to **declare**, because they have no
accessor to probe in-band (the **non-readable ⟺ must-declare** equivalence of
§1). A test declares its environment demands; the planner co-hosts only
compatible tasks; undeclared collisions are violations, declared ones are
fixtures (declared spill obstacles → the spill-block family). The **projection
(P)** rows, by contrast, are probe-able in-band and need no declaration. So the
P/D split *is* the probe-vs-declare split of the seeding design.

## 4. The outcome, enumerated (output side) (RATIFIED 2026-06-14)

| class | members | schema home |
|---|---|---|
| **value (circulating)** | the stored result, incl. in-cell errors, arrays/spills, rich entities, in-cell images (both first-class platforms, §1) | §6.6 outcome union `value` kind; rich values = `RichCellValue` |
| **terminal cell-state properties** | hyperlink, auto-applied number format | **`RichCellValue`/`EngineExtras`** — precedent: ratified driver-contract decision 3 (volatility = result property). NOT a parallel §6.6 outcome slot. |
| **host effects** | crash-liveness, wedge, capacity drawdown (auto-inserted rows, pool exhaustion), time | §6.4 signal classes; §6.6 `crashed` kind + version-stamped `observed`; self-timed perf rides native probes (§2.2) |

The §6.6 outcome union (seeding doc) is the single schema home: the
load-bearing line is engine-attributable (catalogue-worthy) vs not (excluded
from divergence). Nothing in this charter adds an outcome *kind*; terminal
properties extend the `value` payload, host effects are already modeled.

**Ratified 2026-06-14 (maintainer), two rulings:** (1) the **three-class
partition** stands and adds **no new outcome kind** — the homes above are all
pre-existing (`RichCellValue.primitive`; `RichCellValue.number_format` /
`.hyperlink`, re-verified live at `contracts/src/cell-value.ts:50,53`; §6.4/§6.6).
(2) The terminal pair `{auto-format, hyperlink}` is ratified
**"current-surface, NOT closed"**: the terminal-vs-circulating sorter admits a
third member if some engine grows a new deposit — symmetric with the
time-varying accessor frontier (FORMULATEXT-2013 moved a field across the *read*
line; a new deposit moves one across the *write* line). `number_format` is
deliberately **per-side** — input (P, `CELL("format")`, §3) *and* terminal
output (when `DATE()` auto-applies it) — the §1 per-side membership, not a
duplication to reconcile.

**Addendum (live probe 2026-06-15) — the rendered-rich sub-family + a contract gap.**
In-cell **images and sparklines** are **circulating** values (survive `=A1`, valid
`VLOOKUP`/`MATCH` targets, distinct non-coercible kind) whose **content is opaque
through every channel** (driver-capture empty; in-engine `=` content-blind — confirmed
via sparklines, where different-data sparklines compare `=`-equal) — so they resolve
only to *kind*; content = **no-data** (§5 ceiling, §1 capability). They expose a
**value-model gap:** `PrimitiveValue` (`contracts/src/cell-value.ts`) is a *closed*
union with no slot for them. Fix = one open escape-hatch variant
`{ kind: "opaque", type_tag, content? }` so the rendered-rich category is open as
*data*, not a union edit per type (value-model thread item; consistent with §9
provisionality — the territory surprised the map). Confirms §1's "images circulate on
both first-class platforms" on the gsheets side. (Harness caveat: the headless gsheets
API refuses `=IMAGE(url)` external fetch — assay cannot seed `=IMAGE(url)` headless.)

## 5. Channels = the rungs + the capture ceiling (RATIFIED 2026-06-14)

A **channel** (atom) is a `(facet, engine, accessor)` triple — *one* facet of a
property, read by *one* accessor on *one* engine. At this granularity the
read-path is a single band: **in-band** (a formula accessor like `CELL("format")`)
**XOR out-of-band** (driver capture — parsing `FORMULATEXT`, openpyxl). A channel
never straddles the §2 in-band/out-of-band line; a *property* often does (below).
The machinery already exists; this charter adds none:

- The fidelity at which a channel resolves = the **capability / circulating /
  terminal rungs** (renamed 2026-06-15 from Coverage / Behavior / Evidence — one
  terminology, no duplicates; = the §1/§2 facet sorter, all *depends-on-eval*;
  `comparison-model-design-2026-05-30.md` §1). Slotting rule unchanged: changes
  what the value *does* → **circulating**; only how it's *represented* →
  **terminal**; produced-a-result-or-not → **capability**.
- Per-engine readability = the **capture ceiling** (comparison doc §5: "a
  rung only resolves as high as the driver captured"). The 6 lifted engines
  emit Value-level scalar only; per-engine audits **raise the ceiling** —
  that, not new vocabulary, is how terminal properties and richer evidence
  become readable.
- Channel demand is **pull, not push**: green = relationship stability with
  recorded-baseline bootstrap (a new channel is green by construction,
  reddens on drift — comparison doc §2), **plus the retained harness-oracle
  role of `expect`** (2026-06-07 decision: assay-core cohort-relative; oracle
  kept as self-check — it caught the SORT/seeding floor cracks; canon
  deferred to an engine-owner conformance layer). No "vacuity guard" needs
  inventing.
- Read modes follow §6.5's pattern: narrow baseline-tracking default; broad
  discovery sampled.

**A property is a bundle of channels, resolved by aggregation (refined
2026-06-14 under maintainer pressure — "some surfaces need multiple accessors
to validate").** A single property is generally read by *several* channels; its
resolution is an aggregate over them in one of two distinct modes:

- **Coalesce** — different accessors read different **facets** of the property,
  unioned into one record. `number_format` = coarse code in-band
  (`CELL("format")` → `D4`) ∪ full pattern out-of-band (openpyxl); `hyperlink` =
  label via deref ∪ url via `FORMULATEXT`-parse / openpyxl. This is **already
  the contract**: `RichCellValue` *is* a coalesced bundle of separately-sourced
  facets (`primitive` / `formula` / `formatted` / `number_format` / `hyperlink`
  / `engine` — cell-value.ts:42-56, per
  `driver-surface-coalescing-2026-05-23.md`).
- **Corroborate** — several accessors read the **same** facet because no single
  one pins it; the facet resolves only when they agree (or a tie-breaker side
  channel fires). The exemplar is **blank-vs-null** (`D1.A.2` / `D8.β`): deref alone
  can't separate Excel-`blank` from gsheets-propagating-`null` (bare value-compare is
  ambiguous — both equal `0` ∧ `""`). **RESOLVED live 2026-06-15: the side-channel
  EXISTS** — Excel `=empty`→`0` (stored cell non-blank) vs gsheets→propagating `null`
  (no effective value; `ISBLANK`/`COUNTBLANK` of the *deref* see it; effectiveValue-
  presence at the wire). Policy: **distinguish** (cell-value.ts:33-36 `kind` preserved).

So **a property can straddle the in/out-of-band line; a channel cannot**, and
the **capture ceiling composes over the bundle** — a property resolves only as
high as its facet-channels were captured, and an unresolved corroboration caps
it *below* what any single read suggests. This is the existing per-signal
ceiling (comparison §5 enumerates capture as distinct signals, each with its own
reachability), not new machinery — only the corroboration *mode* names a
still-open member (D8.β).

## 6. Rings (RATIFIED 2026-06-14)

- **Ring 0 — the evaluation relation itself.** `formula × environment →
  outcome`, the core relationship assay documents.
- **Ring 1 — observables of eval.** Everything in §3 + §4. In scope; the
  write side is part of the criterion.
- **Ring 2 — other call sites of eval.** Conditional-format rules,
  data-validation rules, filter conditions: the *same relation* invoked in
  **restricted contexts** (per-engine function whitelists, occasionally
  different coercions). **Explicitly DEFERRED**, because (a) their outcomes
  surface as presentation/UX state outside the driver contract's read paths,
  (b) the restriction whitelists are themselves un-catalogued per engine, and
  (c) Ring 0/1 must be solid first. Deferral is sequencing, not exclusion —
  Ring 2 is in the territory. **The Ring 1 / Ring 2 boundary is already
  populated by §3, not aspirational:** the ratified §3 data-validation *split*
  routes value-coercing DV (a checkbox makes `=A1` read `TRUE`/`FALSE`) to
  **Ring 1-input** and entry-gate DV (dropdown / range-restrict) to **Ring 2**;
  filter conditions split the same way — the filter's *effect* (row visibility)
  is Ring 1-input (read by `SUBTOTAL`/`AGGREGATE`, §3), only its *rule
  evaluation* is the Ring 2 call-site. Sorting line: **does the rule feed
  eval's input (Ring 1), or is it a separate eval call-site (Ring 2)?** And
  reason (a) is, in §5's vocabulary, just **below the capture ceiling** (no
  channel captures CF/DV-rule outcomes yet) — a capture fact audits could lift,
  which is *why* deferral is sequencing, not a permanent wall.
- **Out — presentation state** (display geometry, themes, fonts as such),
  *until some engine's function surface proves otherwise*. The criterion
  makes "out" falsifiable: exhibit a reading surface and the property crosses
  into §3. Per-side as always — `CELL("width")` already moved column width
  into the *input* enumeration while display stays out of the *output* one.

## 7. The test space — families (RATIFIED 2026-06-14)

★ = families the **old architecture suppressed** (absent from the corpus
because inexpressible — a 20×20 clipping window, no second sheet in the
schema, no way to place blockers — not because unimportant). These are the
survivorship-bias families the §5.1 caveat exists for.

**What a family is (membership criterion, ratified 2026-06-14).** A family is a
cluster of tests sharing a **distinct demand on the batch/seeding model** — the
membership test is *architectural demand*, **not** "divergence-rich function
category." Two functions that diverge wildly in value-semantics but impose the
same demand (both lump-packable reference-free scalars) are the *same* family;
their divergence is catalogued at the **case** level *inside* the family, never
as separate rows. Families serve two jobs: (i) the first-principles **coverage
map** of what the architecture must be able to *express* (§9 — the ★ rows are
the suppressed kinds), and (ii) the **substrate §8 checks against D2** (the
"demands on the batch model" column is the load-bearing one). Consequence
(co-derived this session): the **introspection accessors** (`CELL` / `INFO` /
`FORMULATEXT`) are **not** a family — a reference-bearing scalar imposes no novel
batch demand; their bite (the accessor frontier is engine-relative) is a §5
capture concern, already homed in §3's accessor rows.

| family | ring/side | demands on the batch model |
|---|---|---|
| scalar value semantics (coercion, arithmetic, text, logical) | R0 | the structural bulk *by the shape of the space* (most divergence loci are value-level); lump-packable when reference-free ∧ position-insensitive |
| type ingestion — the VALUE layer | R1 input | type-faithful seeding (D1/D6); the known cracked floor |
| errors as values (propagation, precedence) | R0 | error literals (D6) |
| dates/serials + epoch ★(epoch) | R0 + host | formula-seed (D6); **epoch = declared environment**, untested today |
| arrays & spills, in-budget | R1 output | engine-authoritative extent (O4 probes); evidence never clipped |
| big spills ★ | R1 output | T2 digest; **probe-before-materialize** (budget gate ahead of placement); capacity watermark — T2's designed-in customers |
| spill obstruction (`#SPILL!` + blockers) ★ | input + output | declared obstacles as legal fixtures (spill-block family) |
| dimension-observing formulas (`ROWS(A:A)`) ★ | R1 input | dims declarable; derived-dims screen; gsheets auto-insert is itself catalogable seam evidence |
| cross-sheet refs ★ | R1 input | multi-sheet hosts; declared aux sheets; load-time rejection of undeclared sheet refs |
| 3D refs ★ | R1 input | Excel-only ⇒ Coverage divergence by construction |
| named ranges / named functions / `LAMBDA` ★ | R1 input | declared names; namespace-compatible packing |
| tables / structured refs ★ | R1 input | declared tables |
| visibility-dependent (`SUBTOTAL`) ★ | R1 input | declared visibility state per host |
| locale ★ | host input | locale-pinned hosts; environment-compatibility packing |
| calc settings + circular/iterative ★ | host input + R0 | declared calc settings; iterative-calc-pinned hosts |
| volatiles (`NOW`/`RAND`) | host input | per-cell volatility flagging (comparison §5); excluded from drift |
| async/external (`IMPORTRANGE`, RTD) ★ | host input | policy/pending outcome class |
| host effects (crash/wedge/capacity/time) | output | D3/D4 recovery; version-stamped `crashes-engine`; self-timed perf (§2.2) |
| terminal cell-state properties ★ | output | per-engine capture-ceiling raises; `RichCellValue`/`EngineExtras` home |
| rich/structured values (entities, `.field`) | R0/R1 | value-model thread; accessor-frontier data |
| dynamic / opaque references (`INDIRECT`, `OFFSET`) | R1 input + R0 | **opaque reach defeats static co-host analysis** — the planner can't statically bound which cells they read ⇒ refuse co-hosting or treat as full-scope (added 2026-06-14; *position*-sensitivity proper rides the §5.2 lump screen + the dimension-observing family, not this row) |

**Probe candidates — RESOLVED LIVE 2026-06-15 (Excel xlwings + gsheets API; per §1,
scope disputes are probe results).** The §2 read/write structure was verified live
2026-06-13 (deref of `=HYPERLINK()` → label; `FORMULATEXT` round-trips it; openpyxl
`.hyperlink` `None` for the formula-form link). The five open facts are now settled:

1. **gsheets `CELL` set — RESOLVED.** gsheets `CELL` supports only
   `{ADDRESS,COL,COLOR,CONTENTS,PREFIX,ROW,TYPE,WIDTH,SHEET}` — **no `format`, no
   `protect`** (it enumerates the set in its own `#VALUE!` message). So `format` /
   `protect` are **in-both-maps on Excel, capture-only on gsheets** — the §2
   engine-relative prediction, confirmed. (Excel `CELL` adds `format`/`protect`/
   `parentheses`/`filename`; gsheets adds `sheet`.) Excel `CELL("format")` is itself
   *lossy* (currency→`C2`, custom `yyyy-mm-dd`→`G`) ⇒ the §5 coalesce (coarse in-band
   ∪ full out-of-band) confirmed.
2. **image / hyperlink — RESOLVED.** *Hyperlink:* terminal on both (deref→label);
   gsheets exposes it as an API `hyperlink` field that *rides deref*, Excel only via
   FORMULATEXT — a per-engine terminal-capture divergence. *In-cell image:*
   **circulating** — survives `=A1`, valid `VLOOKUP` return AND `MATCH` target, distinct
   non-coercible `type image` — but **content-opaque through every channel** (API
   `effectiveValue` empty; in-engine `=` content-blind, confirmed via sparklines where
   different-data sparklines compare equal). Images/sparklines = the **rendered-rich**
   family: kind-observable, content = no-data (§5 ceiling; §4 addendum + the value-model
   gap). *Harness caveat:* the headless gsheets API refuses `=IMAGE(url)` external fetch
   ("use a desktop browser") — assay cannot seed `=IMAGE(url)` headless.
3. **merged-ness — RESOLVED both engines.** Non-anchor deref reads empty (Excel `0`,
   gsheets `null` — inherits the blank/null split); `COUNTA(merge)=1`. §3 D-row locked.
4. **data-validation split — RESOLVED (gsheets).** A checkbox makes `=A1` read `TRUE`
   (`ISLOGICAL`✓) ⇒ value-coercing ⇒ Ring 1-input. (Entry-gate dropdown DV stays the
   Ring 2 side by construction.)
5. **blank-vs-null side channel (`D8.β`) — RESOLVED: the side-channel EXISTS.** Excel
   `=empty`→`0` (stored cell non-blank), gsheets→propagating `null` (no effective
   value; `ISBLANK`/`COUNTBLANK` of the *deref* see it). Bare value-compare is
   ambiguous (both equal `0` ∧ `""`); `ISBLANK`/`COUNTBLANK`/effectiveValue-presence
   corroborate. Policy: **distinguish** (cell-value.ts:33-36 `kind` preserved).

Also swept: the **classic-7 error sentinels** all round-trip + survive deref on both;
**`#NULL!` is Excel-only** (gsheets has no intersection operator → parse `#ERROR!`),
and the *same condition* can map to different sentinels (empty-FILTER: Excel `#CALC!`
= `ERROR.TYPE` 14, gsheets `#N/A`) ⇒ sentinel is circulating-but-divergent. gsheets
errors carry a per-occurrence **message** that survives deref (capability-asymmetric ⇒
EngineExtras). Text `=` is case-insensitive ∧ NFC-insensitive ∧ trailing-space-
sensitive on **both**; `EXACT` byte-exact; storage un-normalized.

## 8. The D2 gate-check (RATIFIED 2026-06-14 — closes the D2 gate)

D2 is the read/spill model, so the check splits the **D2-relevant** families
three ways: those D2 must **serve now** (extent-bearing), those it must merely
**not foreclose** (environment-keyed — they land on packing, not on reads), and
those it must **co-host safely** (packing-safety — opaque reach, added
2026-06-14). Families that are *none* of these — scalar value-semantics, type
ingestion (D1/D6 seeding), errors, terminal properties, rich values, volatiles,
async — are **D2-orthogonal by construction**: they ride seeding, §5 capture, or
the outcome-class machinery, not the read/spill model, so their absence below is
a positive scoping claim, not an omission.

**Serve now — O3 (contract) + O4 (gsheets strategy) against the extent-bearing
families:**

- *Arrays in-budget:* O4 phase-1 composite probes make extent
  engine-authoritative before the read range is chosen — kills the
  semantic-null/trailing-blank ambiguity (E5 solves the E-ledger outright).
  **Serves**, pending gating probes 1–2 (trailing-blank wire repr; composite
  collapse live).
- *Big spills:* the budget gate moves ahead of materialization
  (`ROWS(SEQUENCE(1e6))` is a scalar — a T2 monster's grid is never placed);
  digest/sampling ride further probes, so T2 is capacity-*safe* not
  capacity-*spending*. Thresholds route **cost, never truth** (the §6.6
  union has no clipped grid). **Serves**, with T2's canonical-value-formatting
  question still open (named in §5.1 — a detail under the contract, not a
  contract change).
- *Spill obstruction:* boundary-hit = routing trigger, never an evidence
  marker; declared obstacles become legal fixtures under the environment
  reframe. **Serves**; needs layout-contract support for declared obstacles —
  a sequencing-step-2 work item, not a foreclosure.
- *Dimension-observing:* O4 probes **in-place** at the task's own FORMULA
  cell (same cell, same seeds, same position) so the probe itself doesn't
  perturb position/dims; the derived-dims conservative screen is recorded.
  **Serves.**
- *Host effects:* T3 = §6.5's isolated-attributed mode; D3/D4 recovery
  settled on evidence. **Serves.**

**Not foreclose — the environment-keyed families** (cross-sheet/3D, names,
tables, visibility, locale, calc settings, iterative calc): all land on the
**environment-compatibility packing reframe** — declared environment keys,
compatible co-hosting. O3/O4 routes on extent and cost, orthogonal to which
environment keys exist; nothing in the ladder or the two-phase model assumes
single-sheet, default-locale, or fixed-dims hosts. **Charter demand on
sequencing step 2:** `BatchLayout`'s environment/declaration surface must keep
its key-set extensible (adding `locale` or `calcSettings` later = adding a
compatibility key, not reshaping the contract). **No foreclosure found.**

**Co-host safely — the opaque-reference family** (`INDIRECT` / `OFFSET`): its
reach can't be statically bounded, so it can't be safely co-hosted by static
analysis. D2 **serves** it by routing such tasks to **isolation** — the same T3
isolated-attributed mode host effects use — rather than co-hosting; no
co-tenant, no contamination. This is **cost, not truth** (isolation packs fewer
tasks per batch; the §6.6 union is unaffected), consistent with the "thresholds
route cost, never truth" principle. Detection reuses the existing per-case
**function-extraction** to flag `INDIRECT`/`OFFSET` → isolate (conservative; a
precise version isolates only when the reference args aren't constant-foldable).
**Charter demand on sequencing step 2:** add opaque-reference detection →
isolation routing (one work item, not a contract change). **Serves.**

**Verdict (RATIFIED 2026-06-14):** O3 + O4 passes the charter check — serves
every extent-bearing family without clipping truth, co-hosts the
opaque-reference family safely via isolation, and forecloses no environment
family. Residual opens ride below ratification: the three gating probes (§5.2),
T2's canonical formatting, and two sequencing-step-2 work items (declared-obstacle
layout support; opaque-reference detection → isolation). **This ratification
closes the D2 gate** — "ink §5.2, close §8" is satisfied; **D2 (the read/spill
model — O3 contract + O4 gsheets strategy) is greenlit by the maintainer
2026-06-14.**

## 9. Method rule — the corpus prices, it never scopes (RATIFIED 2026-06-14)

Standing rule (2026-06-11 correction, recorded as feedback; **sharpened
2026-06-14** — the original "derive the test space *from the anatomy*" quietly
promoted the anatomy to the source, but the anatomy is itself a map). **Three
layers, in order of authority:**

- **The territory** — the actual evaluation behavior of the engines — is what
  *scopes* the test space. It is primary, partly unknown, the only ground
  truth. Scope disputes are settled empirically, by probes (§1: "scope disputes
  are probe results, not arguments").
- **The anatomy** (this charter — criterion, environment, families) is our
  **current-best model *of*** the territory, **not** a substitute for it. It is
  *downstream* of the territory — a map *we* drew — so it stays **based on** the
  territory and **revises when the territory surprises us**. (The Provisionality
  posture at the top is this same fact: the model is provisional *because* it is
  downstream of the ground truth.) The anatomy is the **lens** designs are
  checked through, never the **source** they are derived from in place of the
  territory.
- **The corpus** is one *frozen, survivorship-biased* map of the territory,
  drawn under the old architecture's constraints. It may **price the hot path**,
  never **scope**, and only when the argument survives without it:
  - *Survives:* "scalar value-semantics tests are structurally the bulk" — an
    argument about the shape of the territory (most divergence loci are
    value-level), which the corpus merely corroborates.
  - *Does not survive:* "p100 result is 10×1 ⇒ size the window accordingly" —
    extrapolation of the old architecture's ceiling (the 20×20 clip *produced*
    that statistic).

So: **scope from the territory** (probes), **model it through the anatomy**
(current-best, revisable), **let the corpus price only**. The corpus is not the
territory — but neither is the charter; both are maps, and the anatomy earns its
authority only by staying grounded in the territory. The ★ rows of §7 are the
proof the corpus distorts: whole families absent precisely because they were
unsupportable, not because the territory lacks them.

## 10. Status & links (RATIFIED 2026-06-14 — charter complete)

**Ratified §1–§10 section-by-section, 2026-06-12 → 2026-06-14** (maintainer, one
section at a time). Drafted 2026-06-11, honoring the §5.2 unification duties:
criterion = the value-model collapse's accessor frontier (§2); channels = the
comparison model's rungs + capture ceiling (§5); terminal properties →
`RichCellValue`/`EngineExtras` (§4); channel demand = recorded-baseline +
retained `expect` oracle (§5); environment vocabulary = the measure harness's
`environment` locus (§3). Standing posture: **nothing is set fully in stone —
the charter is the first current-best model of the test space, flexible to
unforeseeable behavior** (Provisionality, top), grounded in the territory and
revised by probes (§9). This charter does **not** ratify the value-model
collapse (paused), reopen the comparison design, or schedule Ring 2.

**§8 closed the D2 gate (2026-06-14):** D2 (read/spill model — O3 contract + O4
gsheets strategy) is **greenlit**. Downstream: ink D2-ratified into
`seeding-isolation-design-2026-06-07.md` §5.2/§8 and advance to sequencing
step 2 (lay `BatchLayout` + ingestion/isolation clauses + the two invariant
tests; add opaque-reference → isolation routing).

Gates: `seeding-isolation-design-2026-06-07.md` §5.2/§8 D2. Siblings:
`value-model-foundations-2026-05-30.md` ·
`comparison-model-design-2026-05-30.md` ·
`bridge-translation-2026-06-02.md` ·
`driver-contract-ratified-2026-06-04.md` ·
`cartularium-vision-2026-06-04.md`.
