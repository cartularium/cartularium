# Value-equality & the result fingerprint — PROPOSED 2026-06-15

**Status: ✅ RATIFIED 2026-06-15 (section-by-section). Converged + REVISED 2026-06-15
against live cross-engine probes (Appendix): ① deref-slice criterion, ② collapse to
capability/circulating/terminal. Open items resolved — #1 distinct-by-layer, #2/#3 by
probe, #4 design-ratified (code tracked-downstream), #5 defer-but-ready. **BUILT
2026-06-15:** #2 blank-vs-null distinction (the B1 fix, `format/equality.ts` + the
`gridsEqual` rich-path) and #6 the `opaque` value kind (`cell-value.ts` + equality
canonicalizes opaque by `type_tag`). Remaining tracked code: #4 (`semanticDomain`
sweep, mechanical) and #5 (the fingerprint, defer-but-ready).** Companion to **§5.3** of
`seeding-isolation-design-2026-06-07.md` (the read/spill/isolation model): §5.3
decided to build a *result fingerprint* for over-budget results; this doc defines
**what equality the fingerprint encodes**, and in doing so collapses the
comparison model's rung vocabulary and pins the matcher's role. Extends
`comparison-model-design-2026-05-30.md` §1 (the C/B/E rungs); grounded in the
charter (`test-space-charter-2026-06-11.md` §1/§2/§5).

> **How we got here (the thread):** kill the content-hash → "digest = in-engine
> aggregates" → *what is the digest used for?* → it's the comparison/baseline unit
> for un-materialized results → *is full comparison even expensive?* (no — KB–MB,
> one API call) → build the fingerprint anyway, to futureproof → *what does
> equality mean?* → it's rung-scoped, facet-scoped, descriptive-by-default → collapse
> the vocabulary → drop the author lanes → **sweep the presets so no expressiveness
> is lost.** This doc is the settled end of that thread.

## 1. One axis — does the deref map (`=A1`) carry the facet? (vocabulary collapse)

A cell is a record of facets. The principled distinction is the charter's
**circulating vs terminal** (§1/§2) — stated precisely against the §2
*two-distinct-maps* refinement (read ≠ write; the deref slice is *narrower* than the
full read-map):

- a facet is **circulating** iff it **survives the deref map `=A1`** — a formula that
  merely *references* the cell carries it forward (value, type/coercion,
  error-vs-value, blank-vs-null). This *is* the value's semantic content.
- a facet is **terminal** iff it does **not** survive `=A1` — *even if some other
  accessor reads it*. The decisive case (verified live 2026-06-15): `number_format` is
  read by `CELL("format")` on Excel, so a downstream eval *does* depend on it — yet it
  is **terminal**, because it does not ride `=A1`. The criterion is therefore the
  **deref slice**, *not* "any downstream eval depends on it" (which would wrongly pull
  every `CELL`-readable property into circulating, re-blurring the §2 read/write split
  the löb-is-content-fixpoint ruling exists to protect).

The rigorous circulation probe is **differential on the deref slice**: does a
formula's *output value* change with the facet when reached *through `=A1`*? "The
facet appears on the result cell" is **not** the test — it is polluted by per-engine
cosmetic inheritance (live: gsheets re-deposits a source's `number_format` onto
`=A1*2`, Excel drops it; gsheets even keeps DATE through `*2` but drops PERCENT
through `*100` — a messy heuristic, never circulation).

**Capability is a prior gate, not on this axis.** Coverage = did the engine produce a
result vs not-implement it — upstream of any facet partition.

**Collapse to one terminology (the ② resolution — ratified 2026-06-15: one opinionated
set, no duplicates).** Retire **Coverage / Behavior / Evidence** as parallel names; carry
exactly **capability / circulating / terminal**. This is a *rename*, not a conflation:
*Behavior* ("changes what the value does") **is** *circulating*, *Evidence* ("only how
it's represented") **is** *terminal* — the §1/§2 facet partition and the §5 fidelity
*rung* are one distinction used two ways (a partition of facets / a depth you compare
at), so one name covers both; *Coverage* is the odd one out, correctly pulled off the
axis as the prior **capability** gate. This **revises the ratified charter §5 rung
vocabulary** — the Provisionality posture permits it ("nothing set fully in stone"). The
rename is canon here and at charter §5 + comparison-model-design §1 (its definitional
site); the deep body sweep of the comparison doc + the paused value-model doc is tracked
downstream cleanup (like the `semanticDomain` refactor — mechanical, do carefully).

**Per-engine, and capture ≠ circulation.** Whether a facet circulates is *probe-able*
and **per-engine** (charter §1: "the sorter is per-engine empirical"); engine
*disagreement* on which side a facet falls is *itself catalogued*, never adjudicated.
And "we cannot read it" (capture ceiling) is held strictly apart from "it does not
circulate" (behavior): the first is **no-data, never divergence** (§1 capability rule).
The in-cell **image** is the pure case — fully circulating (survives `=A1`,
`VLOOKUP`/`MATCH` targets, distinct non-coercible `type image`) yet **zero capturable
content** (API blank; in-engine `=` content-blind for the rendered-rich family).

## 2. Equality is descriptive-by-default; presets and the oracle are layers

- **Default scope = the engine-invariant circulating *core*** — the primitive axis
  (number, boolean-kind, string·NFC, error-vs-value+sentinel, blank/null-kind, array
  extent): the facets that circulate *and agree on which side they fall across
  engines*. Descriptive, no imposition — and *already the implemented default*:
  `gridsEqual` compares the primitive axis only, "engine extras do not trigger
  divergence" (`match.ts`). Per-engine-*variable*-circulation facets (the rendered-rich
  family; format-inheritance) are **not** the default basis — they are dialed in by
  rung or recorded as their own divergence (charter §1), never silently unified.
- **The rung is a read-time projection** (`capability | circulating | +terminal`),
  dialed at query/analysis time — **not** a per-test author tag. Capture everything
  (up to the capture ceiling); project to the rung you want; default circulating. A
  "format test" isn't a lane — it's "view this at the terminal rung."
- **The matcher / `expect` is the one per-test override** — the opt-in oracle (the
  2026-06-07 retained-oracle decision), `declare-the-exact-facets` (structural-
  subset). It is *not* the descriptive core (green = relationship-stability is).
- **No author scope-lanes.** `semanticDomain`-as-scope is dropped: a named taxonomy
  invites the inversion (reach for the preset instead of the principle; the taxonomy
  silently becomes the foundation). Its legitimate uses re-home as **derived
  properties** (volatility = a captured flag from the formula; external-effect /
  metadata fall out of the outcome's own class — the charter's value / terminal-
  cell-state / host-effect partition).

**The discipline that keeps it principled:** the default scope is the territory-
grounded circulating facets; lanes and the matcher are *layers / overrides, never
the foundation.* The inverse — a taxonomy or the normative oracle *as* the base — is
exactly the imposition to avoid.

## 3. The result fingerprint

**Purpose.** The comparison + baseline unit for any result you choose not to read
back and store in full: (a) **cross-engine divergence detection** (A's fingerprint
vs B's; mismatch → escalate), and (b) **drift / regression baseline** (a later run
whose fingerprint changed flags drift). It is for results **past the materialize
budget** — and the budget is the real cost cliff (API/memory limits), *not* an
arbitrary cell count.

**Scale, honestly.** These aren't million-cell monsters — modest (past the staging
window; hundreds–thousands of cells). A *single* such result is cheap to materialize
(KB–MB, one API call). The fingerprint's payoff is **aggregate** (corpus storage +
repeated drift re-reads), so this is a **futureproofing build, not a present
necessity**: materialize-and-compare is the default, the fingerprint is the
over-budget path + a storage optimization (maintainer call 2026-06-15: build it now
anyway).

**Design.**
- The fingerprint = a hash of the result **projected to the engine-invariant
  circulating core** (default; §2), **canonicalized**. Per-test-scoped — the same
  result fingerprints a different surface for a value comparison vs a terminal-rung view.
- **Numeric equality = relative tolerance** — per `cellsEqual`
  (`diff / max(|a|,|b|,1) < tol`, default `1e-10`): round to tolerance before hashing.
  (Settles the abs-vs-relative fork for *cohort* equality — already relative.)
- **Text = canonicalize to NFC; do NOT case-fold or trim.** Grounded live 2026-06-15:
  both engines treat `NFC ≡ NFD` under `=` (and store raw — `LEN` sees the difference),
  so byte-comparing would manufacture divergence ⇒ NFC-normalize. But `=` is also
  case-insensitive and trailing-space-sensitive on both, and case/whitespace are
  *genuine produced content* (an engine can emit upper vs lower) ⇒ the fingerprint
  **preserves** them. (Closes the §5.3-Foundation "text exact vs NFC/trim" fork.)
- **Blank/null: distinguish — preserve the primitive `kind`** (do not collapse to
  scalar `null`). D8.β is **empirically resolved** (live 2026-06-15): Excel `=A1` of an
  empty cell decays to `0` (stored cell non-blank), gsheets propagates a **null** (no
  effective value; `ISBLANK`/`COUNTBLANK` of the deref see it) — a genuine circulating
  divergence, and the corroborating **side-channel exists** (`ISBLANK`/`COUNTBLANK` on
  the result cell, or effectiveValue-presence). Implementation owed; policy settled.
- **Rendered-rich (image, sparkline): fingerprint the `kind` only — content = no-data.**
  These circulate but are content-opaque through *every* channel (capture blank;
  in-engine `=` content-blind — different-data sparklines compare equal). A cell holding
  one fingerprints as `kind: opaque-rich(type_tag)`; content equality is **no-data,
  never manufactured** (charter §1). `VLOOKUP`/`MATCH` "work" but are content-blind, so
  they cannot back out content either.
- **Tolerance residual the exact hash can't absorb** → **regenerate on a hash
  mismatch** (materialize the projected facets, run the tolerant compare) + a
  **self-invalidating known-equal cache** — the hash *is* the key, so a changed result
  auto-evicts and re-verifies. No manual invalidation.

**The hard line:** a fingerprint can only ever carry an **equality** (tolerance +
null-policy, over the circulating facets). Anything richer is an **assertion**
(§4) — not fingerprintable; it lives in the oracle, evaluated against the
materialized (or in-engine-reduced) result.

## 4. Preset sweep — nothing expressive is dropped

The matcher/comparison surface carries **three** separable kinds of expressiveness;
only the lane drops. Each survives, sorted into its right home:

| kind | members | home in the new model |
|---|---|---|
| **facet scope** | `primitive` / `number_format` / `formatted` / `formula` / `engine` / `hyperlink` / `shape` (extent-only) | matcher structural-subset + the **circulating default** |
| **equality predicates** | **precision tolerance** (relative, `cellsEqual`); **semantic-null** (blank/null `kind`, D8.β) | the **fingerprint's canonicalization** (the two things flagged in the sweep) |
| **assertion predicates** | `near`/`tol` (absolute), ranges `ge/gt/le/lt`, regex `matches`, `type`-only, `error:"any"`, `not`/`any-of`/`all-of` | the **oracle**, on the materialized (or in-engine-reduced) result — **never** the fingerprint |
| per-engine override | `Override.expect` / `recorded` / `cause` | unchanged (oracle / annotation) |
| **lane** | `semanticDomain`-as-scope | **dropped**; volatility → derived property |

The clean principle: **an equality (tolerance + null over circulating facets) is
fingerprintable; an assertion is not — it runs against a materialized result.**

## 5. Open items (for fresh eyes)

1. ~~`near/tol` (absolute) vs `cellsEqual` (relative)~~ **RESOLVED 2026-06-15: distinct
   by LAYER, not reconciled.** `cellsEqual` (relative) = the descriptive cohort/fingerprint
   equality; `near/tol` (absolute) = an authored oracle assertion (opt-in, normative). They
   sit in different layers (the fingerprint carries only an equality; assertions run in the
   oracle on the materialized result) and never collide — the only requirement is that
   naming disambiguates the role.
2. ~~Blank-vs-null policy~~ **RESOLVED 2026-06-15 (live probe): DISTINGUISH** (preserve
   `kind`); the D8.β side-channel is found (`ISBLANK`/`COUNTBLANK`/effectiveValue-
   presence). **Implementation BUILT 2026-06-15 — the B1 fix:** `format/equality.ts`
   canonicalizes over `PrimitiveValue.kind` (blank≠null), and `gridsEqual` routes two
   rich grids through it, so the divergence spine no longer manufactures agreement.
3. ~~Default rung = circulating~~ **RESOLVED: the engine-invariant circulating core**
   (§2) — answers comparison open-Q2.
4. **`semanticDomain` dissolution — DESIGN RATIFIED 2026-06-15; implementation
   tracked-downstream.** Drop `semanticDomain`-as-scope; re-home volatility → captured
   flag, lanes → derived outcome class. Load-bearing today (benchmark scoring + the
   `volatile`-out-of-value-benchmarks lint), so the *code* bundles with the other
   mechanical sweeps (the C/B/E body-rename; the `benchmark.ts:390` regex kill at §6.6).
5. **Build-now confirm — RESOLVED 2026-06-15: DEFER-but-ready.** The fingerprint is
   futureproofing (materialize is cheap at KB–MB; payoff is aggregate). Design is ready;
   defer the *build* behind the correctness path (§6.6 → read-model/cohost rework → D3/D4),
   building it when storage/re-read measures bad or when it falls out alongside §6.6.
   "Additive, not perturbative" — the spine doesn't need it.
6. **NEW — the `opaque-rich` value kind (contract gap).** `PrimitiveValue`
   (`cell-value.ts`) is a *closed* union with no slot for the rendered-rich family
   (image, sparkline — both first-class, circulating, content-opaque). Add **one open
   escape-hatch variant** `{ kind: "opaque", type_tag, content? }` so the category is
   open as *data*, not a union edit per type. Value-model item (logged in charter §4 +
   the paused value-model thread); with the §3 text-NFC closure, the two value-model
   touches this session earned. **BUILT 2026-06-15:** the `{ kind: "opaque", type_tag,
   content? }` variant landed in `cell-value.ts` (projectPrimitive → null for scalar
   consumers); `format/equality.ts` canonicalizes opaque by `type_tag` only (content
   no-data — different-data sparklines compare equal).**

## 6. Charter coherence (why this tightens, not strains)

The rungs *are* the charter's depends-on-eval criterion; the default is descriptive
(circulating); presets and the oracle are layers; fidelity-is-a-knob = a read-time
projection; capture-everything-then-project. This gives the abstract "canonical
value formatting" a **territory-grounded definition** — *project the result to its
circulating facets* — instead of an invented normalization. The one genuinely-open
choice is the default rung, and circulating is the descriptively-natural one ("do
they do the same thing," a relationship question), with terminal available by
dialing the rung.

## 7. Links

Companion: `seeding-isolation-design-2026-06-07.md` §5.3 (the read model the
fingerprint serves). Extends: `comparison-model-design-2026-05-30.md` §1 (rungs),
§5 (capture ceiling). Grounded in: `test-space-charter-2026-06-11.md` §1 (criterion
/ circulating-terminal), §2 (read/write maps), §5 (channels = rungs + ceiling).
Touches the paused `value-model-foundations-2026-05-30.md` (canonical form = the
value's circulating content) without reopening the collapse.

## Appendix — cross-engine facet map (live probes, 2026-06-15)

Excel (xlwings, real Excel) + gsheets (live API). Probe scripts ephemeral; the verdicts
below ground §1–§4. "core" = engine-invariant circulating (default fingerprint);
"excluded" = terminal / per-engine / capability → rung or EngineExtras.

| facet | Excel | gsheets | verdict |
|---|---|---|---|
| number / boolean-kind / string | bool distinct (`TRUE≠1`, ISLOGICAL✓, ISNUMBER✗) | identical | **core**; string canon NFC |
| error-vs-value + type | `ERROR.TYPE` thru deref | same | **core** |
| error *sentinel* | classic-7 all; `#CALC!`=type 14 | **`#NULL!` impossible** (→`#ERROR!`); empty-FILTER→`#N/A` not `#CALC!` | core but **divergent** → `extended-error`; catalogued |
| error *message* | none | rich, survives deref, per-occurrence | EngineExtras (capability) |
| **blank vs null** | `=empty`→`0`, non-blank | propagating **null** (ISBLANK/COUNTBLANK of deref see it) | **core, distinguish (D8.β)** |
| number_format | terminal; `CELL("format")`✓ lossy | terminal; **no `CELL("format")`**; inheritance heuristic differs | **excluded** |
| hyperlink | terminal; link via FORMULATEXT only | terminal; API `hyperlink` field, rides deref | EngineExtras |
| array/spill extent | `A1#` | plain range | **core (structural)**, agree |
| **image / sparkline** | (M365 IMAGE; not probed) | **circulating** (deref/VLOOKUP/MATCH) but **content-opaque** (API blank; `=` content-blind) | **kind-only; content no-data**; `opaque` kind gap |
| merged non-anchor | →`0` | →null | input-env (§3 D); inherits blank/null split |
| checkbox DV | — | `=A1`→TRUE | input-env (value-coercing) |

`CELL` accessor frontier (in-band, per engine): **common** address/col/row/color/
contents/prefix/type/width; **Excel-only** format/protect/parentheses/filename;
**gsheets-only** sheet. Text `=`: case-insensitive ∧ NFC-insensitive ∧
trailing-space-sensitive on *both*; `EXACT` byte-exact on both; storage un-normalized.
