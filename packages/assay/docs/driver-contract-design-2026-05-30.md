# Driver-contract design — 2026-05-30

A from-first-principles pass on assay's **driver contract**: the interface
between "drive a spreadsheet engine, get values back" and everything built on
top of it. This is the M2 (fixture generation) analog of the cell-model work —
where [`cell-value-schema-review-2026-05-30.md`](./cell-value-schema-review-2026-05-30.md)
asked "is the *value* model right," this asks "is the *driving* model right."

**Status: design exploration.** It is grounded in the code as it really is
(`src/drivers/driver.ts`, `src/runner.ts`, `src/commands/generate.ts`,
`src/format/capabilities.ts`, `buildDrivers` in `src/commands/shared.ts`), but
the load-bearing calls (§6) are open. Motivating goal (maintainer, 2026-05-30):
the modules were accreted without contracts/interfaces in mind; drawing a
deliberate driver contract is the lever to fix that — and the payoff is a
`@cartularium/drivers` package other tools can use as a dev affordance
("what does Excel do if I try X?").

Companion to the [assay roadmap](./assay-roadmap.md) (this *is* the start of M2)
and [`comparison-model-design-2026-05-30.md`](./comparison-model-design-2026-05-30.md)
(M3's capture-side dependencies — volatility, missing-function, capability —
land on this contract).

---

## 1. TL;DR

The `Driver` interface is a clean 5-method seam, and the dependency graph is
already one-way (drivers → a value-type slice → contracts; nothing catalogue
reaches back into a driver). But the **orchestration around** drivers is the
accreted part:

- **Two divergent generation loops** — `runner.ts` and `commands/generate.ts`
  each drive the same drivers with different capabilities. This is the clearest
  "not designed" artifact.
- **Capability-gating lives in the catalogue, not the driver** — it rewrites
  formula text before the driver sees it; the driver can't answer "can I do X?"
- **Construction is a heterogeneous if/else chain** — zero-arg for pure engines,
  config-object + OAuth for gsheets, positional + temp-workbook for excel,
  sibling-binary for lattice. No uniform contract.
- **Timeouts, real timing, volatility, and missing-function capture are absent**
  from the contract entirely.

The fix is not to enrich one flat `Driver`. It's to recognize the contract
serves **two consumer profiles** (§3) and to split it into **three layered
contracts** (§4: value / execution / capability), with the orchestration
concerns living in a *generation layer on top of* the driver, not inside it.
The package boundary (§5) then falls out. **Step 0 is already done:** the
`format/types.ts` split into `values.ts` (the driver's value vocabulary) +
`catalogue.ts` made the future cut line literal.

---

## 2. The contract as it really is

### 2.1 The `Driver` interface (`src/drivers/driver.ts`)

```ts
interface Driver {
  readonly platform: Platform;
  init(): Promise<void>;
  evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue>;
  evaluateBatch?(tasks: DriverTask[]): Promise<DriverTaskResult[]>;   // preferred when present
  versionString(): Promise<string | null>;   // null when unprobeable (gsheets)
  destroy(): Promise<void>;
}
```

Honest and minimal. The one real subtlety: `evaluate` returns **rich**
(`RichGridValue`) but the input grid is **scalar** (`CellValue`) — test-authoring
ergonomics. All 8 drivers implement `evaluateBatch`; the two heavy ones
(excel/gsheets) *need* it (amortised workbook/API setup).

### 2.2 Construction is heterogeneous (`buildDrivers`, `shared.ts:103`)

A per-platform if/else with four different shapes:

| driver | construction | hidden setup cost |
|---|---|---|
| hyperformula / ironcalc / formulas / pycel / libreoffice | `new XDriver()` | none (pure-ish) |
| gsheets | `new GSheetsDriver({ spreadsheetId, accessToken })` | OAuth (`getAccessToken`, aborts if not logged in) |
| excel | `new ExcelDriver(verbose, workbookPath)` | temp workbook w/ packages installed (`createWorkbook`) |
| lattice | `new LatticeDriver(latticeBin?)` | built sibling binary at `../lattice` |

There is no uniform "give me a driver for platform P" contract — the heavy
drivers carry config the pure ones don't, and the probe use case
(`new ExcelDriver()` → `evaluate`) is trivial for the pure engines and
ceremony-laden for the live ones. **This asymmetry is real and won't disappear;**
the contract should *name* it (pure vs live-host drivers), not pretend it away.

### 2.3 Two divergent orchestration loops

This is the load-bearing finding. The same drivers are driven by two different
hand-rolled loops:

| | `runner.ts` (`evaluateSuite`/`runSuite`) | `commands/generate.ts` (own loop) |
|---|---|---|
| timing | `timeMs: 0` (stubbed) | real `Date.now()` per suite/test |
| per-test errors | try/catch → `error` | try/catch → `error` + `driverIssue` flag + log |
| batch path | uses `evaluateBatch` when present | single `evaluate` loop only |
| persistence | none (in-memory `RunResult`) | `saveFixture` + prune |
| feature-gating | `resolveFormulaForPlatform` (adapter/skip) | pre-resolved `formula`/`asEvaluated` |

Generation and running share a *driver* but not an *orchestrator*. Volatility
filtering, timeout policy, isolation, and chunk-sizing have no single home —
which is exactly why M2 reads as "accreted." **The generation layer wants to be
one thing**, and the driver contract should be the seam it sits on.

### 2.4 Capability-gating is catalogue-side formula rewriting

`capabilities/<engine>.json` (hand-authored) → `reconcileFeatures` → one of
`native` / `wrapped` (rewrite the formula: `arrayformula-wrap`, `rename-fn`,
`prepend`) / `skip`. This happens in the **runner**, against declared JSON; the
**driver never participates**. So "can gsheets do `feature:lambda`?" is answered
by a JSON file and applied by mutating the formula string before `evaluate`.

Consequence for the probe profile: a dev asking "what does Excel do if I try X?"
gets *no capability answer from the driver* — they get whatever the engine
returns (often a bare `#NAME?`), with no signal distinguishing "unsupported"
from "supported but errored." That's the same gap M3 Coverage needs closed.

### 2.5 What's simply absent

- **Timeouts** — neither loop bounds `evaluate`; a hanging engine hangs the run.
- **Volatility** — `NOW()`/`RAND()` handled by *hand-filtering fixtures*
  upstream; not a driver signal or a result property.
- **Missing-function capture** — ironcalc `#N/IMPL!` / pycel exceptions exist but
  aren't normalized into a "not implemented" signal; others bury it in `#NAME?`.
- **Setup isolation** — `buildDrivers` inits drivers in a bare loop
  (`shared.ts:127`); generation wraps the *run* in try/finally for
  destroy/cleanup, but init-failure isolation is ad-hoc, not contractual.

---

## 3. Two consumer profiles

The contract has been designed (implicitly) for one consumer — the generation
pipeline. But the package the maintainer wants serves a second, and the two want
*overlapping but distinct* slices. Naming both is what turns an accreted
interface into a deliberate one.

| profile | who | wants | shape |
|---|---|---|---|
| **Probe** (dev affordance) | lattice / formulary / interleaf / a REPL: "what does Excel do if I try X?" | construct → ask one thing → read rich result → "can it even do this?" | minimal, ergonomic, single-shot |
| **Generation** (the catalogue) | assay's M2 pipeline | batching/chunking, isolation, timeouts, volatility, missing-function, capability-gating, persistence | orchestrated, robust, bulk |

The probe profile is the **minimal honest core**; the generation profile is an
**orchestration layer built on top of it**. The mistake to avoid: smearing both
into one flat `Driver` (which is what `Driver` + the two loops are today). The
unifying insight: **capability introspection** ("can it do X?") is wanted by
*both* — the probe asks directly, generation needs it to gate. Design it once.

---

## 4. The deliberate contract: three layers

Decompose the single `Driver` into three contracts by *what kind of thing each
describes*:

### 4.1 Value contract — *what a result is*

Already extracted (`@cartularium/contracts`: `RichCellValue` & friends), and the
just-landed `format/values.ts` is the local driver-facing slice. **Proposed
growth:** volatility and missing-function are *properties of a result*, so they
belong here, not on the interface —

- a cell (or result) carries a `volatile?` flag (set when the formula invoked a
  volatile function), which the comparison layer excludes from drift. This is
  the captured property that replaces today's hand-filtering — *shovel-ready,
  self-justifying* (per the M3 design doc).
- a "not-implemented" primitive/flag (distinct from a genuine `#NAME?`/`#REF!`),
  emitted where the engine exposes it — makes M3 Coverage *derivable*.

### 4.2 Execution contract — *how you ask*

The probe core, plus the lifecycle:

```
evaluate(formula, grid?) -> rich result      // the single-shot probe core
evaluateBatch?(tasks) -> results             // amortised; batch *semantics* per driver
init() / destroy()                           // lifecycle
versionString()                              // provenance
```

Open boundary question (§6): **where does chunking/timeout/isolation live?**
Today batch-vs-single is the runner's call but chunk *size* is uncontrolled (the
driver gets the whole task list). Proposed: the **generation layer owns
chunking, timeout, isolation, retry, persistence** and sits *on top of* the
execution contract; the driver owns only "evaluate this (batch of) formula(s)
against my engine." That keeps the driver independently consumable (probe
profile) and gives generation one home (collapsing the two loops of §2.3).

### 4.3 Capability contract — *what's possible*

New, and the highest-leverage addition because it serves both profiles. Lift
capability from "declared JSON the runner applies" to "a question the driver
surface can answer" — minimally a descriptor colocated with each driver
(supersedes / absorbs today's `capabilities/<engine>.json`), so:

- the **probe** can ask "can Excel do `feature:lambda`?" without running it;
- **generation** gates/adapts mechanically (today's `reconcileFeatures`);
- **M3 Coverage** becomes derivable rather than hand-authored.

Whether capability is a *method on the driver*, a *static descriptor beside it*,
or *both* is an open call (§6) — pure engines can self-report from their function
registry; live engines may still need a declared file.

---

## 5. The package boundary

With the three contracts, the cut is mechanical:

```
@cartularium/contracts   value contract (RichCellValue, primitives, Platform)   [exists]
        ▲
@cartularium/drivers     execution + capability contracts; the 8 drivers;       [new]
        │                lift/python-helpers; depends ONLY on contracts
        ▲
assay (this package)     generation layer (the consolidated orchestrator),
                         catalogue vocabulary, matcher, manifest, site
```

- **Step 0 (done):** `format/types.ts` → `values.ts` (driver value vocabulary) +
  `catalogue.ts` (catalogue vocabulary); all importers migrated directly and the
  old module deleted (no shim — pre-alpha, no debt). The one-way dependency
  (`catalogue → values → contracts`) is now enforced by file structure — this is
  the literal future package line.
- **What moves to `@cartularium/drivers`:** `src/drivers/*`, the execution +
  capability contracts, `values.ts` (or its merge into contracts), `lift.ts`,
  `python-helpers.ts`, and the capability descriptors.
- **What stays in assay:** the generation layer (the *merged* runner+generate
  orchestrator), `catalogue.ts`, matcher/parse/tolerance, manifest, identity,
  history, catalogue-site.
- **Live-host reality (§2.2):** the package gives all 8 a shared interface and a
  single home for auth/workbook/binary glue. Pure engines become trivially
  reusable; live ones still need credentials/a runner host. The win is "one
  stable interface + the pure ones drop in," not "anyone runs Excel for free."

Extraction is the *payoff* of the design, not a prerequisite — doing it before
the contract is settled would freeze the accreted interface (the very thing
we're fixing) behind a workspace boundary.

---

## 6. Open decisions (load-bearing)

1. **Consolidate the two loops?** Merge `runner.ts` + `generate.ts` orchestration
   into one generation layer over the execution contract. (Strong yes from the
   survey, but it's the biggest single change — confirm scope.)
2. **Capability home** — method on the driver, static descriptor beside it, or
   both? Pure engines can self-report; live engines may need a declared file.
   Does this *supersede* `capabilities/<engine>.json` or wrap it?
3. **Volatility & missing-function** — result property (on `RichCellValue`),
   driver capability signal, or both? (Leaning: volatility = result property;
   missing-function = both — a normalized primitive *and* a capability fact.)
4. **Construction** — a uniform factory (`createDriver(platform, config)`) vs the
   per-driver constructors? Reconciling probe ergonomics with live-driver config
   (auth/workbook/binary) is the tension.
5. **Where do chunking/timeout/isolation live** — generation layer (proposed) vs
   pushed into `evaluateBatch`? Determines how thin the execution contract stays.
6. **`values.ts` placement** — does the value vocabulary merge *into*
   `@cartularium/contracts` (it's already half there) or travel *with*
   `@cartularium/drivers`? Affects whether catalogue imports drivers or contracts.
7. **Naming** — `@cartularium/drivers` vs `/engines`; `values.ts`/`catalogue.ts`
   vs alternatives. Cheap; defer.

## 7. Sequencing

- **Step 0 — done:** `format/types.ts` split (`values.ts` + `catalogue.ts`).
- **Step 1 — now:** ratify this design / settle §6.
- **Step 2 — the M2 work:** consolidate the generation layer; add capability,
  volatility, missing-function, and timeout to the contract. (This is the
  substance of milestone 2, and it unblocks M3's capture-side dependencies.)
- **Step 3:** extract `@cartularium/drivers` — mechanical, because the boundary
  is already drawn.
