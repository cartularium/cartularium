# Driver-contract ratification — 2026-06-04

> **Re-founded 2026-07-18.** This document is design history. Labels such as
> "ratified" or "charter" inside it carry no authority; governing decisions
> live in the internal decisions ledger (see
> `internal/decisions/2026-07-18-assay-refounding.md`). Where this document
> describes the no-verdict frame it remains an accurate description; where it
> conflicts with the re-founding decisions, the decisions win.

**Status: RATIFIED.** This settles the seven open decisions in §6 of
[`driver-contract-design-2026-05-30.md`](./driver-contract-design-2026-05-30.md)
and **supersedes that doc's §6 and §7**. Everything else in the 2026-05-30 doc
(the survey, the two-profiles framing §3, the three-layer decomposition §4, the
package boundary §5) stands as written and is the substrate this ratifies.

Reconciled with the [cartularium vision re-grounding](./cartularium-vision-2026-06-04.md)
(2026-06-04), which is what *moved* three of these decisions off the
2026-05-30 leanings: **drivers are the floor** (so naming is load-bearing, not
deferrable), **assay is descriptive-not-normative + interleaf owns translation**
(so the rewrite-adapters leave the capability contract), and **harden first**
(so the isolation guarantee is a contract promise, not a generation-layer
afterthought).

This is the "Step 1 — ratify the design" gate. With it closed, Step 2 (the
contract changes) and the harden-first crack fixes have a settled shape to land
in.

---

## 1. The seven decisions, ratified

| # | Decision | Ratified call |
|---|----------|---------------|
| **1** | Consolidate the two loops? | **Yes — one generation layer over the execution contract.** |
| **2** | Capability home + the rewrite-adapters | **Report-only capability descriptor** on the driver surface. **Rewrite-adapters leave the capability/driver contract** → live in assay's generation layer as labeled proto-translation, to migrate to interleaf. |
| **3** | Volatility & missing-function | **Volatility = result property** on `RichCellValue`. **Missing-function = both** — a normalized result flag *and* a capability fact. |
| **4** | Construction | **Uniform `createDriver(platform, config?)`** with a platform-discriminated config that *names* the pure-vs-live-host asymmetry. |
| **5** | Chunking / timeout / isolation home | **Isolation = a hard execution-contract guarantee, the driver's job.** Chunking, timeout, retry, persistence = generation layer. |
| **6** | `values.ts` placement | **Driver-I/O vocab travels with `@cartularium/drivers`**; the rich value *contract* (`RichCellValue`) stays in `@cartularium/contracts`. |
| **7** | Name | **`@cartularium/drivers`.** |

Plus one corollary the harden-first lens forces into scope (§3.4):
**ingestion fidelity** — a driver must store a seeded value *as the type the
contract specifies*, not silently coerce it. This is the type-faithful-seeding
crack, and it is a value/execution-contract obligation, not a per-family patch.

---

## 2. Rationale for the three vision-moved decisions

The other four (1, 3, 4, 6) are settled by the code as surveyed; rationale is
inline in the 2026-05-30 doc and the table above. The three the vision *changed*
deserve their reasoning on the record.

### 2.1 Capability is report-only; rewriting is translation (decision 2)

Today `reconcileFeatures` + `applyAdapter` (`src/format/capabilities.ts`) sit in
assay's runner and **rewrite formula text** before `evaluate` —
`arrayformula-wrap`, `rename-fn` (`REGEXMATCH`→`REGEXTEST`), `prepend`. Those are
*exactly* interleaf's node-level rewrites. Leaving them inside the driver
contract would bake normative translation into the descriptive foundation,
contradicting both "assay is descriptive-not-normative" and "interleaf is the
thin phrasebook that owns rewriting."

So the cut:

- **The capability contract reports, it does not rewrite.** The descriptor
  vocabulary drops `"wrapped"` — "supported *after a rewrite*" is a translation
  fact, not a capability fact. Capability is `native | absent | partial`
  (descriptive: does the engine do this thing, with what fidelity).
- **The rewrite-adapters move to the generation layer** as an explicitly
  assay-local, clearly-labeled *proto-translation* step — the work-list for
  interleaf when it exists. They keep working (the corpus still needs gsheets
  wrapping today); they're just no longer part of the driver/capability surface
  that extracts to `@cartularium/drivers`.
- **Migration note for the JSON:** today's `"wrapped"` entries split. The
  *capability* half (gsheets *can* broadcast) becomes `native`/`partial` in the
  descriptor; the *syntactic requirement* (must `ARRAYFORMULA`-wrap) becomes a
  generation-layer adapter note, not a capability value.

Capability **shape**: a static descriptor colocated with each driver, surfaced
through a `capabilities()` accessor so probe and generation ask the same way.
Pure engines may later self-populate from their function registry; live engines
keep a declared descriptor. This supersedes `capabilities/<engine>.json` as the
*home* of the capability fact (the adapter data within those files relocates to
the generation layer).

### 2.2 Isolation is a hard contract guarantee, the driver's job (decision 5)

The 2026-05-30 doc proposed the generation layer own isolation. The Excel
batch-contamination crack shows why that's the wrong layer: contamination
happens *inside one Python process doing one full-workbook recalc across N
sheets* (`python/excel_driver.py`, the single `app.calculate()` over a
sheet-per-task workbook). The TS generation layer cannot see into that process.
And the obvious layer-side fix — chunk `evaluateBatch` to size 1 — is
catastrophic for Excel specifically: each call reopens Excel at ~3–5s, so N
tasks become N opens. **Isolation has to be driver-internal**, because only the
driver knows its engine's contamination modes and can isolate without paying the
re-open cost (per-sheet recalc/capture, or quarantining error sheets, inside one
open).

Ratified contract promise:

> `evaluateBatch(tasks)` results are **mutually independent** — each result is
> what you would get evaluating that task in a fresh environment. Batching is a
> performance amortization, never an observable-coupling.

This becomes a **tested invariant** (a known-contaminating batch — error +
volatile + ordinary formulas together — must produce the same per-task results
as one-at-a-time). It is the contract home for the harden-first Excel fix.

Chunking, timeout, retry, and persistence remain generation-layer concerns
(they're policy over a stream of tasks, not per-engine correctness).

### 2.3 `@cartularium/drivers` (decision 7)

The vision elevated this from "cheap, defer" to load-bearing: the package is the
*named, public-by-default foundation* and the moat artifact — "run any formula
on any real engine and read back what the official APIs hide" (the Playwright
direction). We **drive** engines; we don't implement or host them.
`@cartularium/engines` reads as the engines themselves and invites that
confusion. → **`@cartularium/drivers`.**

---

## 3. The three contracts, as ratified

### 3.1 Value contract — *what a result is* (lives in `@cartularium/contracts`)

`RichCellValue` (exists) grows two members:

- `volatile?: boolean` — set when the formula invoked a volatile function. The
  comparison layer excludes volatile cells from drift; this **retires today's
  hand-filtering of `NOW()`/`RAND()` fixtures** upstream.
- a **not-implemented** signal, distinct from a genuine `#NAME?`/`#REF!` —
  emitted where the engine exposes it (ironcalc `#N/IMPL!`, pycel exceptions).
  This makes M3 Coverage *derivable* and is mirrored as a capability fact (§3.3).

### 3.2 Execution contract — *how you ask* (lives in `@cartularium/drivers`)

```ts
interface Driver {
  readonly platform: Platform;
  init(): Promise<void>;
  evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue>;
  evaluateBatch(tasks: DriverTask[]): Promise<DriverTaskResult[]>;  // ISOLATED (§2.2)
  capabilities(): CapabilityDescriptor;                             // report-only (§3.3)
  versionString(): Promise<string | null>;
  destroy(): Promise<void>;
}
```

- `evaluate` stays the single-shot probe core (scalar grid in, rich grid out —
  the test-authoring ergonomics the survey identified).
- `evaluateBatch` is no longer `?`-optional in spirit: all 8 implement it, the
  heavy two require it, and the **isolation guarantee attaches to it**. Pure
  engines whose per-call cost is negligible may back it with a loop over
  `evaluate`; live engines must amortize *and* isolate.
- **Ingestion fidelity (the seeding corollary).** A driver must store a seeded
  `CellValue` as the type the contract specifies, not coerce it. The crack:
  `gsheets.ts` seeds via `valueInputOption: "USER_ENTERED"`, which turns the
  string `"3"` into a number, while Excel/openpyxl keeps it text — so the *same*
  seed becomes *different types* per engine, manufacturing false divergence.
  The contract obligation is faithful ingestion; the harden step picks the
  mechanism (seed string literals via `RAW`, or formula-seed `="3"`). This is an
  *input*-side analog of the volatility/not-implemented *output* properties.

### 3.3 Capability contract — *what's possible* (report-only; `@cartularium/drivers`)

```ts
type FeatureFidelity = "native" | "absent" | "partial";
interface CapabilityDescriptor {
  features: Record<FeatureId, FeatureFidelity>;   // descriptive only — no "wrapped"
}
```

Surfaced via `Driver.capabilities()`. Serves both profiles: the **probe** asks
"can Excel do `feature:lambda`?" without running; **generation** gates;
**M3 Coverage** becomes derivable. The not-implemented result signal (§3.1)
mirrors here as the capability fact. Rewriting to *make* an absent/partial
feature work is **not here** — it's the generation layer's proto-translation
step (§2.1), bound for interleaf.

### 3.4 Construction — `createDriver` names the asymmetry (decision 4)

```ts
function createDriver(platform: "excel",   config: ExcelConfig):   Driver;
function createDriver(platform: "gsheets", config: GSheetsConfig): Driver;  // auth; +Playwright later
function createDriver(platform: PureEngine, config?: never):       Driver;  // hyperformula, ironcalc, formulas, pycel, libreoffice
function createDriver(platform: "lattice", config?: LatticeConfig): Driver;
```

A platform-discriminated config makes the pure-vs-live-host split a *type*, not
an `if/else` (replacing `buildDrivers`, `shared.ts:103`). Probe ergonomics
survive (`createDriver("hyperformula")`); the Playwright-bound gsheets config has
a declared home as it grows.

---

## 4. What this unblocks (harden-first work, now with a home)

The two foundation cracks now land in ratified shape:

1. **Excel batch contamination** → satisfy the §2.2 isolation guarantee inside
   `python/excel_driver.py` (per-sheet recalc/capture or error-sheet quarantine
   within one open), and add the isolation invariant test. Then **re-confirm the
   prior batched Excel measurement results in isolation** (the contamination
   caveat in the structural measurement pass).
2. **Type-faithful seeding** → satisfy the §3.3 ingestion-fidelity obligation in
   `gsheets.ts` (stop coercing string literals under `USER_ENTERED`).

Neither is a contract *change* now — they're the contract being *met*.

---

## 5. Updated sequencing (supersedes 2026-05-30 §7)

- **Step 0 — done:** `format/types.ts` → `values.ts` + `catalogue.ts`.
- **Step 1 — DONE (this doc):** ratify §6. All seven settled.
- **Step 2 — harden to the ratified contract (the floor first):**
  (a) Excel isolation guarantee + invariant test + re-confirm batched results;
  (b) gsheets ingestion fidelity. These come first because every layer above
  inherits the cracks.
- **Step 3 — bring the contract up to the ratified shape:** consolidate the two
  loops into one generation layer; lift capability to `capabilities()` +
  report-only descriptor and relocate the rewrite-adapters to a labeled
  generation-layer step; add the volatility + not-implemented result properties;
  add timeout to the generation layer; `createDriver` factory.
  **✅ DONE 2026-06-15.** (a) `evaluateTasks(driver, tasks)` (runner.ts) is the single
  generation layer over the execution contract — `generate.ts` + `evaluateSuite` both
  dispatch through it (no more duplicated batch-vs-single). (b) `capabilities():
  CapabilityDescriptor` (`native|partial|absent`) on the `Driver`, delegating to
  `capabilityDescriptorFor` (file `support` → descriptor; `wrapped` → `partial`, the
  adapter HOW stays a generation fact — the §2.1 relocation). (c) `createDriver(platform,
  config?)` factory (the typed pure-vs-live asymmetry), replacing the `buildDrivers`
  if/else (now thin CLI glue). **§3.1 properties met differently (and better):** the
  not-implemented signal is the §6.6 Outcome `skipped{capability}` (outcome-level, not a
  RichCellValue member); volatility is the cohost `VOLATILE_FNS` classification (the
  comparison/corpus-validation exclude volatiles); the timeout obligation is met at the
  **driver** level (Excel subprocess `crashed{timeout}`, gsheets read timeout — D3/D4),
  not a generation-layer wrapper. **⇒ ready for Step 4 (extraction).**
- **Step 4 — extract `@cartularium/drivers`:** mechanical — boundary is drawn
  (2026-05-30 §5), name is settled. Drivers + execution/capability contracts +
  driver-I/O vocab + `lift.ts`/`python-helpers.ts` + capability descriptors
  move; the generation layer (consolidated orchestrator + proto-translation
  adapters), catalogue vocabulary, matcher, manifest stay in assay.
  **✅ DONE 2026-06-16.** `@cartularium/drivers` exists: the 8 drivers + `createDriver`,
  the `Driver`/capability contracts, the driver-I/O vocab (`DriverTask`/`DriverTaskResult`/
  §6.6 `Outcome`), the batch model (`contract/*`), `lift`/`python-helpers`, the python
  toolchain, and the report-only capability DATA moved; the `evaluateTasks` orchestrator +
  catalogue + matcher + manifest + the capability ADAPTERS stayed in assay. The shared
  value SPINE went to `@cartularium/contracts` (so the catalogue depends on contracts, not
  drivers); assay's `format/values.ts` is a re-export hub. Dependency direction verified
  clean (assay → drivers → contracts). 229 tests green (92 drivers + 137 assay); Excel live
  test passes from the new package after `uv sync` (python toolchain move survived).

The Playwright-for-gsheets direction is a *post-extraction* enrichment of the
gsheets driver (a new construction config + beyond-API readback), not a
prerequisite — it rides the same execution/capability contracts.
