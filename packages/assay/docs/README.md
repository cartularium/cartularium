# assay design — current state

> **Re-founded 2026-07-18.** Assay's governing decisions now live in the
> internal decisions ledger (`internal/decisions/2026-07-18-assay-refounding.md`
> and its sibling records), under the approved Assay charter. No label in
> this directory ("ratified", "charter") carries authority of its own. The
> dated docs, including everything in `archive/`, are design history: often
> accurate, never authoritative. Headline re-founding facts: Assay is raw
> data and evidence with no verdicts and no authority over meaning;
> evidence-grade engines are gsheets and excel (lattice first-class pending
> v4, the other five engines hibernated); the corpus predating the evidence
> ledger's run #1 is held suspect; the public compatibility surfaces are
> withdrawn until a principled corpus exists.

The distilled design of assay, in one place. assay runs the same formulas
across spreadsheet engines and records, with evidence, where they agree and
where they fork.

This doc is the **front door**. It states the settled conclusions and points to the
detailed docs for provenance; the dated docs hold the full reasoning. If you read one
thing, read this. The [docs map](#docs-map) at the bottom sorts every file by role.

> **Standing posture (charter §9).** Nothing here is set fully in stone. assay is
> **descriptive, not normative**, and the design stays **flexible to unforeseeable
> engine behavior**. The order of authority is **territory → anatomy → corpus**: the
> actual behavior of the engines (probed) scopes the work; this model is the revisable
> lens; the frozen corpus only prices the hot path, it never scopes. Scope disputes are
> probe results, not arguments.

---

## The design, top to bottom

### 1. Strategy — why assay exists
*(`cartularium-vision-2026-06-04.md`)*

Cartularium is a cross-platform hub for spreadsheet logic. The product is a chain, each
link a project: **share knowledge → sheets.wiki**; **share work → formulary**; **make it
run everywhere → interleaf** (cross-dialect translation); **guarantee that → assay**
(compatibility evidence). lattice (an owned engine) is a later, separate bet.

- **Drivers are the floor.** The whole stack is a chain of trust bottoming out in one
  capability: *run this on the real engine and observe.* The drivers are not an assay
  detail — they're the ground truth everything inherits, slated to extract as the named,
  public-by-default `@cartularium/drivers`. **Harden the floor before building above it.**
- **Descriptive, not normative.** assay states what each engine *does*, with evidence.
  Translatability/carve-ability judgments belong to interleaf, downstream. The drivers
  *are* the semantics oracle (verify a translation by running both, not by modeling
  meaning), so **interleaf stays a thin AST phrasebook**, not a separate semantics IR.
- **Codification, not discovery.** The divergences are largely known; what's missing is a
  *reproducible, persistent, public, evidence-backed* record tracked across engine
  versions. The guarantee is **"certified compatible as of \<engine versions>, monitored"**
  — continuously re-verified, never "proven." That recurring re-verification is the moat.
- **Bridge now, star-shaped.** Pairwise Excel↔Sheets today; keep interleaf's per-dialect
  modules separable so lattice later is *adding a spoke*, not a rewrite.

### 2. What the catalogue is *of* — the test-space charter  ✅ RATIFIED §1–§10
*(`test-space-charter-2026-06-11.md`)*

A from-first-principles model of assay's test space, read off the evaluation relation
itself: `eval(formula, environment) → outcome`.

- **The criterion = the full observable footprint of eval, both sides.** *Input* = anything
  eval's outcome **depends on** (proven by **projection** — some engine's function surface
  reads it, e.g. `CELL("width")`; or by **differential** — no accessor, but varying it
  changes some `eval(F)`, e.g. the date epoch). *Output* = anything eval **produces or
  perturbs** — the stored value, terminal cell-state (hyperlink, auto-applied format), and
  **host effects** (crash, wedge, capacity, time). **Formulas are not pure in the host** —
  that impurity is exactly what the seeding/isolation design exists for.
- **Membership is empirical and falsifiable.** `X ∈ environment ⟺ (∃ accessor) ∨ (∃ witnessing F)`.
  To claim *in*, exhibit one; to claim *out*, assert no F exists. Scope disputes are settled
  by probes.
- **Rings:** R0 the eval relation · R1 its observables (in scope) · **R2 other call-sites**
  (CF/validation/filter rules — *deferred*, not excluded) · out = presentation state, until
  some function surface proves otherwise.
- **A "family" = a distinct demand on the batch/seeding model**, not a function-category;
  divergence lives at the *case* level inside a family. The ★ families (cross-sheet, 3D,
  spill-block, names, locale, …) are ones the *old corpus could not express* — the proof
  the corpus distorts.

The charter's **§8 gate-check closed the D2 gate** (below): the read/spill model serves
every extent-bearing family without clipping truth, co-hosts opaque references safely, and
forecloses no environment family.

### 3. The floor — the driver contract  ✅ RATIFIED
*(`driver-contract-ratified-2026-06-04.md`)*

Three contracts, seven decisions settled:

- **Value** *(`@cartularium/contracts`)* — `RichCellValue` is what a result *is*; grows
  `volatile?` and a not-implemented signal (distinct from a real `#NAME?`).
- **Execution** *(`@cartularium/drivers`)* — the `Driver` interface; `evaluate` (single-shot
  probe) + **`evaluateBatch` whose results are ISOLATED** — mutually independent, batching is
  amortization never observable coupling. **Isolation is a hard, driver-internal guarantee**
  (only the driver knows its engine's contamination modes and can isolate without paying the
  re-open cost). Plus **ingestion fidelity**: store a seeded value as the contract's type,
  never silently coerce.
- **Capability** — **report-only** `native | absent | partial`; rewriting to *make* an absent
  feature work is **not** a capability fact — it's generation-layer proto-translation, bound
  for interleaf.
- Construction via `createDriver(platform, config?)`; the package is **`@cartularium/drivers`**.

### 4. The batch execution model — seeding & isolation  ✅ design RATIFIED (D1–D9)
*(`seeding-isolation-design-2026-06-07.md`)*

One designed batch execution model — `host → packing → layout → seed → isolated read` —
replacing the ad-hoc per-driver seeding and half-built isolation. Decisions D1–D9; see the
[ledger](#decision-ledger). The load-bearing ones:

- **Seeding (D1/D6):** a seed's type is decided **once** (scalar type *is* declaration; a
  number is a number, `"3"` is text). Errors seed as **native error literals**, dates/format-
  bearing inputs as **formula-seeds** (`{formula:"=DATE(y,m,d)"}`). Built in `contract/seed.ts`.
- **Read/spill (D2 — the last gate, GREENLIT 2026-06-14):** **O3 escalation ladder** is the
  contract (boundary-hit is a *routing trigger*, never an evidence flag — thresholds route
  **cost, never truth**; no grid is ever clipped into evidence), with **O4 probe-en-masse
  two-phase** as the gsheets strategy (phase-1 scalar-collapsing composite probes make extent
  engine-authoritative *before* the read range is chosen, and move the budget gate ahead of
  materialization). The old fixed-window-as-evidence model (O1) was **rejected**.
- **Isolation (D3/D4), grounded live:** Excel's silent value-contamination **did not reproduce
  → retired**; the real channels are **Excel process-death** (a crash kills every co-resident
  task → relaunch + bisect + record `crashes-engine`) and the **gsheets whole-*spreadsheet*
  wedge** (one poison formula 500s every value read *and* `deleteSheet` → recover by clearing
  the poison cell, then re-run suspects in a fresh spreadsheet). Isolation exists for
  **attribution**: keep crash/time/resource as monitored evidence, discard only corrupted
  *values*.
- **Outcome schema (§6.6):** one union — `value | rejected | crashed | skipped | driver-error |
  infra` — splitting engine-attributable (catalogue-worthy) from not. No `truncated` (nothing is
  clipped); terminal cell-state properties home on `RichCellValue`/`EngineExtras`.

### 5. Foundations it rests on

- **Comparison model** *(`comparison-model-design-2026-05-30.md`)* — the **capability /
  circulating / terminal rungs** (renamed 2026-06-15 from Coverage / Behavior / Evidence —
  one terminology) + the **capture ceiling** ("a rung only resolves as high as the driver
  captured"); green = **relationship stability** (recorded-baseline bootstrap, reddens on drift)
  plus the retained **`expect` harness-oracle**. The charter's "channels" are exactly these.
- **Value model** *(`value-model-foundations-2026-05-30.md`)* — the **accessor frontier** (cell =
  record of fields; formula surfaces = field accessors; the frontier is per-engine, time-varying,
  and *that variation is divergence data*). The charter's criterion *is* this frontier. The
  **collapse** thread (löb / a single read-write unifier) stays **PAUSED** — the charter clarified
  löb is the content-fixpoint only, not a read/write unifier.
- **Bridge / translation** *(`bridge-translation-2026-06-02.md`)* — the measurement-method record
  and the first-class **`environment` locus** (syntactic | environment | data-borne) the charter's
  §3 enumeration aligns to.

---

## Where we are

**The floor is DONE** (all four sequencing steps of driver-contract §5 / seeding §9, landed
2026-06-15): contract modules + invariant gates, the D2 read model (O3/O4, amortization complete
for tier-1), D3/D4 isolation grounded live, the generation-layer consolidation + `capabilities()`
+ `createDriver`, and the **`@cartularium/drivers` extraction** (`d2ada50b`). This section
previously tracked that work; it is kept as the ledger of record below.

**The current thread is the comparison initiative** (CP1–CP3, 2026-06-15→):

- **CP1/CP2 ratified + built** — no-verdict / multiplicity frame (`terminology.md`), the
  verdict-free **ManifestV5** output contract (`comparison-output-contract-2026-06-17.md`),
  observation-only manifest (annotation layer exiled out-of-band, 2026-06-19).
- **CP3 in flight** — the **fork-annotation store** (`annotation-store-design-2026-06-20.md`,
  RATIFIED): 3a–3e DONE (contracts DTO + edit-shell D1 store + CRUD API + DV import + coverage
  read + manifest tags with the R1 hygiene gate + verification-provenance axis). **3f (the
  reclassify pass) is in flight** — policy at `reclassify-policy-2026-07-11.md`, latest state in the dated handoffs.
- **Deferred behind #4 (store-as-read-source):** live coverage endpoint + manifest-into-Worker
  delivery (design: `store-delivery-2026-07-11.md`), sheets-wiki V4→V5, retiring the in-repo
  DV YAML / `history` / `seedCatalogue`.

---

## Decision ledger

| # | Decision | Status |
|---|----------|--------|
| **D1** | Seed type model — scalar-type-is-declaration; formula-seed the non-portable cluster | ✅ settled |
| **D1′** | Seed syntax under YAML (light sugar + validator) | settled (O); de-prioritized (frozen corpus) |
| **D2** | Read/spill model | ✅ **RATIFIED 2026-06-14** — O3 ladder + O4 two-phase (via charter §8) |
| **D3** | Excel isolation = process-death recovery (value-contamination retired) | ✅ resolved, grounded live |
| **D4** | gsheets isolation = un-wedge (clear cell) + fresh-spreadsheet re-run | ✅ grounded live |
| **D5** | Altitude — module-first shared contract, lives in assay until extraction | ✅ ratified |
| **D6** | Error/date seeds — native error literals; formula-seeded dates | ✅ ratified |
| **D7** | pycel/libreoffice chunk bounds — measure + observability, then isolate if needed | ◻ open |
| **D8** | Corpus form-factor (YAML vs cell grammar) | ⏸ parked (no growth pressure) |
| **D9** | Signal classes & measurement modes — batched-amortized default + isolated opt-in | ✅ ratified |

**Open / owed:** the three D2 gating probes (trailing-blank wire repr; composite-probe collapse
live; sheets-per-spreadsheet cap) + the blank-vs-null `D8.β` side-channel; D7; the value-model
**collapse** thread (paused); Ring 2 (deferred). Backlog: `drive.file` scope to sweep bricked
orphans; replace the 404 default spreadsheet id.

---

## Docs map

**Canonical (ratified — start here):**
- `cartularium-vision-2026-06-04.md` — strategy & the drivers-are-the-floor reframe
- `test-space-charter-2026-06-11.md` — what the catalogue is *of* (§1–§10 ratified)
- `driver-contract-ratified-2026-06-04.md` — the three contracts (supersedes `driver-contract-design-2026-05-30.md` §6/§7)
- `seeding-isolation-design-2026-06-07.md` — the batch execution model (D1–D9)

**Foundations (load-bearing; the canon consumes these):**
- `comparison-model-design-2026-05-30.md` · `value-model-foundations-2026-05-30.md` ·
  `bridge-translation-2026-06-02.md`
- `architecture-map-2026-05-31.md` — parts map *(note: its shared-IR keystone was reversed by the
  drivers-are-the-foundation reframe; read for the parts list, not the IR thesis)*
- `driver-contract-design-2026-05-30.md` — the survey/§3/§4/§5 substrate the ratification builds on

**Reference / raw evidence (territory data — kept, not archaeology):**
- `excel-driver-fidelity.md` · `excel-celldata-gap.md` · `excel-sme-questions.md`
- `gsheets-driver-fidelity.md` · `gsheets-celldata-gap.md` · `gsheets-celldata-probes.md`
- `driver-surface-coalescing-2026-05-23.md` (cited by charter §5) · `driver-surface-leads.md` ·
  `driver-surface-verifier-2026-05-23.md`
- `schema-design-precedents.md` · `cell-value-schema-review-2026-05-30.md` · `cell-value-fidelity-roadmap.md`

**Operational:**
- `assay-roadmap.md` · `runner-ops.md` · `preview-runner.md` · `history-runs.md` ·
  `writing-tests.md` · `queued-research-threads.md`

**Archive (`archive/`) — superseded session-records, kept for provenance:**
- `divergence-measurement-*-2026-06-03.md` — the `assay measure` passes. The **tool** (the probe
  harness) and the **empirical findings** survive (Excel-only operators; the VALUE layer is where
  real divergence lives), but the work was *premature* (it emitted normative portability verdicts —
  interleaf's call — and ran before the floor was hardened) and its function-category framing is
  superseded by the charter's family-as-batch-demand. **To be re-run and re-bucketed once the floor
  lands.**
- `audit-session-2026-05-22.md` — early audit index/handoff *(archival candidate; left in place this
  pass — still cross-linked by several reference docs)*.
