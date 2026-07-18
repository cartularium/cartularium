# Seeding & Isolation design — 2026-06-07

> **Re-founded 2026-07-18.** This document is design history. Labels such as
> "ratified" or "charter" inside it carry no authority; governing decisions
> live in the internal decisions ledger (see
> `internal/decisions/2026-07-18-assay-refounding.md`). Where this document
> describes the no-verdict frame it remains an accurate description; where it
> conflicts with the re-founding decisions, the decisions win.

**Status: D2 RATIFIED 2026-06-14 — design phase complete; implementation
(sequencing step 2, §9) is next.** Replaces the ad-hoc, per-driver seeding and
half-built isolation with one designed *batch execution model*. This is the
design half of harden-Step-2 (see `driver-contract-ratified-2026-06-04.md`
§2.2 isolation guarantee + §3.2 ingestion fidelity); it generalizes both from
"two Excel/gsheets cracks" to a cross-driver contract, because a current-state
survey (2026-06-07) showed both problems are systemic across the 8 drivers, not
local to two.

Open decisions are in §8, ratify-style (the `§6` pattern of the contract doc).

> **▶ NEXT-SESSION PICKUP (updated 2026-06-15).** **⚠ The D2 read/spill/isolation MECHANICS were
> re-derived 2026-06-15 → see §5.3 (PROPOSED, for section-by-section ratification): kill the
> content-hash, kill the tier ladder, two orthogonal bounds (output-extent ⟂ compute/liveness),
> selective probe, and declare-don't-screen (author class-tag, not static inference).
> `read-model.ts` + `cohost.ts` rework to match; canonical value-formatting is the open foundational
> dependency. The D2 GREENLIT conclusion (O3 contract + O4 strategy) still holds — §5.3 sharpens the
> expression.** **The test-space charter that
> gated D2 is RATIFIED §1–§10** (`docs/test-space-charter-2026-06-11.md`, section-by-section
> 2026-06-12 → 2026-06-14); its **§8 gate-check found O3+O4 PASSES** (serves every
> extent-bearing family without clipping truth, forecloses no environment family). **⇒ D2
> (read/spill model) is RATIFIED/GREENLIT: O3 (escalation ladder) = the contract, O4
> (probe-en-masse two-phase) = the gsheets strategy** (full record §5.2; decision row §8).
> **Resume = SEQUENCING STEP 2 (§9) — implementation:** lay `BatchLayout` + the
> ingestion/isolation clauses + the two invariant tests (type-fidelity, contamination),
> implement the D2 read model (O3 ladder + O4 two-phase), and add the charter's one envelope
> addition — **opaque-reference (`INDIRECT`/`OFFSET`) detection → isolation routing** (co-host
> safety; detect via per-case function-extraction). layout.ts spill pieces graduate from
> PROVISIONAL → implement per O3/O4. **Standing posture (charter §9):** nothing set fully in
> stone — scope from the territory (probes), the charter-anatomy is the revisable lens, the
> corpus prices only. **Three gating probes still owed before/with implementation** (§5.2):
> trailing-blank wire repr; composite-probe collapse live; sheets-per-spreadsheet cap — plus
> blank-vs-null D8.β (the charter's corroborate-mode opener). Earlier state still standing:
> D1/D5/D6/D9 ratified; D3/D4 settled on evidence **and BUILT + VERIFIED LIVE 2026-06-15**
> (Excel process-death recovery; gsheets whole-spreadsheet-wedge recovery — the §6.3 mirror
> acceptance passes live; the persistent-effect remedies stay coupled to dense-packing
> adoption, not yet triggered — drivers remain one-task-per-sheet); §2.2 sub-quanta resolved (LET eager, guard
> dropped); §6.6 outcome union (may grow terminal cell-state properties — home is
> `RichCellValue`/EngineExtras, §5.2). **Still open:** **D7** (peripheral bounds); per-item
> confirm of **D1′** + principles **§2.1 / §2.2**. **D8 de-clocked** (frozen corpus + solo
> maintainer; parks indefinitely). **Backlogged:** `drive.file` scope to sweep bricked-orphan
> spreadsheets; replace the 404 default spreadsheet id (`preview.ts:323`, `shared.ts:107`); 2
> scratch-sheet orphans to trash. Probe scripts were ephemeral (`/tmp`, removed); method +
> results live in §6.1 + §2.2.

---

## 1. Why now

The current seeding is a pile of per-driver magic constants with implicit type
handling; isolation is half-built (Excel bisects only *open-rejections*; gsheets
does neither). Two empirical facts force a redesign before any layer above is
trustworthy:

- **Manufactured divergence from seeding is systemic.** The *same* seed becomes a
  *different in-engine type* per driver — so a divergence the corpus attributes
  to the formula under test can actually be an artifact of how its inputs were
  typed in. That poisons the evidence at the source.
- **The per-task boundary is not an isolation boundary** for the expensive
  engines. Five of eight share a mutable host across a batch; one poison/volatile
  formula can corrupt siblings (Excel: silently; gsheets: loudly).

Both inherit into assay's evidence, the compatibility feed, and everything
downstream. They are also the last design debt before `@cartularium/drivers`
can carry a real contract instead of inherited constants.

## 2. The model: one batch is `host → packing → layout → seed → isolated read`

Every driver, today, improvises these five layers. Naming them is the design:

```
host        one workbook / one spreadsheet / one in-proc engine   ← the blast radius
  packing   N tasks share a host (CHUNK_SIZE)                      ← amortization knob
    layout  where grid / formula / spill-window / probe live       ← coordinate + dimension contract
      seed  how an input cell's declared TYPE survives ingestion   ← ingestion fidelity
      read  capture each task's result with no cross-talk          ← isolation guarantee
```

Layers 4–5 are correctness (they must hold for the evidence to be true). Layers
1–2 are performance (they exist only to amortize setup cost). **The governing
rule:** correctness is unconditional; amortization is optional; *a driver that
amortizes (shares a host) owns the isolation of layer 5 within that host.*

### 2.1 Scope — who the contract bends for

Not every engine gets a vote in the contract's shape. Three tiers (the
owned-vs-foreign axis, applied to the *input* side):

- **Foreign + first-class — Excel, gsheets.** The contract must be expressible
  within their limits; we account for them.
- **Foreign + peripheral — hyperformula, ironcalc, formulas, pycel, libreoffice.**
  The core does not bend. Each per-driver adapter conforms, or the engine is
  *marked* for the cases it can't meet. Nice-to-haves.
- **Owned — lattice.** If it can't meet the contract, fix it at the source
  (lattice's assay-mode serialization), never weaken the core. Until that lands,
  lattice behaves as peripheral.

**Guardrail — the principle governs the mouth, not the ears.** It bounds what we
*feed* engines (the seed contract); it does **not** stop us *measuring* what any
engine returns. The bridge: an engine that cannot ingest the canonical seed
faithfully is recorded as **no-data / hole for that test — never as a
divergence** (else we re-manufacture the very artifact this design exists to
kill). A hole there means *"not made conformant,"* not *"engine incapable"* —
label it so; the project's credibility rests on that honesty.

**Consequence — a principled expressiveness ceiling.** The seed contract must
express exactly what Excel *and* gsheets can both faithfully represent — their
**intersection** — and nothing more. Formula-seeding (§4) is the move that raises
both ceilings at once.

### 2.2 Native probes — in-band measurement (the read layer)

Several signals assay needs are read not by external instrumentation but by
**getting the engine to report them as a value through its own formula
language**:

- null-ness → `=ISBLANK(ref)` (D8.β) returns the engine's internal null state as a
  boolean;
- duration → `LET(s,NOW(),…,e,NOW(),e-s)` returns the engine's self-measured
  elapsed time as a number.

These are **native probes**: the formula language *is* the instrument; an
otherwise hidden/external signal becomes an **in-band value** on the ordinary
value path.

**Principle: push measurement in-band wherever the formula language can express
the question; reserve out-of-band (driver/host instrumentation) for what it
genuinely can't.** In-band is cheap (rides the batched value recalc), portable
(any compatible dialect), and faithful (the engine answers in its own semantics).

| | In-band (native probe) | Out-of-band (external) |
|---|---|---|
| signals | value, error-ness (`ISERROR`), null-ness (`ISBLANK`), type (`ISTEXT`), duration (`LET`/`NOW`), shape (`ROWS`/`COLUMNS`) | crash / process-death, true wall-clock + overhead, memory |
| cost | cheap, batchable, portable | expensive — isolation + per-driver instrumentation |
| reporter | the engine, in its own semantics | the driver, observing from outside |

Caveats (Excel, empirically grounded 2026-06-08):

- **Resolution floor.** Self-timing scales ~linearly (verified: SUMPRODUCT over
  250K/500K/1M → 0.01/0.03/0.06 s) but `NOW()` quantizes at ~**10 ms** here;
  faster formulas read 0. (Sub-second and per-call — both confirmed against a
  wrong "second-granular/cached" assumption.)
- **Eager evaluation — *not* dead-binding elision (RESOLVED 2026-06-09).** `LET` here is
  **eager**: an *unused* binding's work still runs, so the earlier "force consumption" caveat
  was wrong. Grounded via the real Excel driver — an *unused* `SUMPRODUCT(SQRT(ROW(A1:E1048576)))`
  binding read **40 ms**, identical to the forced positive control (`e,IF(x>0,NOW(),NOW())`) and
  far above both bare `LET` (0 ms) and an unused *trivial* binding (`x,1` → 0 ms). That last
  contrast is the proof: the 40 ms is the *work*, not per-binding overhead — so the work ran
  despite `x` never reaching the output. The prior session's 0-readings were therefore
  **sub-quanta** (work < the ~10 ms `NOW()` quantum), not the optimizer skipping unused work.
  **Consequence:** no consumption guard (`IF(x>-1,…)`) is needed; the only rule is **scale the
  probed work above the ~10 ms floor**, and read a 0 as "faster than the floor," never "didn't
  run." *(Method: ephemeral `/tmp` batch, NOW()-bracketed self-timing through the Excel driver.)*
- **Trust floor.** Native probes are *self-reports* — you can't probe the prober.
  A small set of probe functions must be trusted or cross-validated out-of-band.
  (For a descriptive catalogue this is mostly fine: the self-report *is* the
  behavior.)

These behaviors themselves become codified native-probe fixtures (NOW ~10 ms /
per-call; **eager `LET` / sub-quanta floor**, not elision) — *codification-not-discovery*.

## 3. Current state (survey 2026-06-07)

### 3.1 Seed type handling — divergent

| Driver | Grid seed mechanism | Type fidelity |
|---|---|---|
| Excel / LibreOffice / Pycel / Formulas | openpyxl `cell.value = val` | **faithful** — string stays string, number stays number |
| Ironcalc | `set_user_input(…, str(val))` | **stringify-then-reparse** — `"3"` and `3` collapse, ironcalc re-infers |
| Lattice | `serializeGrid` → strings | **stringify** — lattice re-parses |
| GSheets | `values.batchUpdate` `USER_ENTERED` | **re-inferred** — string `"3"` → number 3 (the known crack) |
| Hyperformula | `setCellContents` | **faithful** — primitives pass through |

The openpyxl four and hyperformula honor the JS/YAML type; ironcalc, lattice,
and gsheets re-derive it. Result: a corpus seed has no single, driver-independent
meaning.

### 3.2 Layout constants — universal, hard-coded

`AA1` formula target + `A1:Z` grid region + **`20×20` spill/read window** appear
in every driver. gsheets adds sheet dims `30×60`, probe sheet `2000×2`, chunks of
50; Excel chunks of 25 + app-restart every 10; pycel chunks of 32. None is
derived — all are constants that have drifted per driver.

### 3.3 Isolation — a spectrum

| Class | Drivers | Behavior |
|---|---|---|
| **Fresh-per-task (isolated by construction)** | hyperformula, ironcalc, formulas | new sheet/model/xlsx per task; satisfies §2.2; pays full setup cost |
| **Shared host (contamination risk)** | Excel, pycel, libreoffice | one workbook/xlsx per chunk; Excel = silent value-contamination; pycel "compiler state leaks past ~50 sheets" (`CHUNK_SIZE=32` is a *guess*); libreoffice = all tasks recalc together |
| **Shared blast-radius** | gsheets | per-task sheets, but one spreadsheet + one read; a crash formula voids the whole chunk; **no bisect** |
| **Unverified** | lattice | persistent process; per-line isolation *assumed*, not tested |

Excel's bisect (`_run_with_bisect`) only catches workbook-*open* rejection; the
silent value-contamination (a `SORT` returning unsorted next to an error formula)
survives it.

### 3.4 Foot-guns the survey flagged

1. **Spill silently truncates** — a formula spilling beyond `20×20` is clipped
   with no signal.
2. **Formula overwrite** — corpus may write `grid: {AA1: …}`; nothing reserves
   the formula cell.
3. **Error-as-seed is lossy** — `{error:"#DIV/0!"}` seeds coerce to a string in
   several engines; a formula reading that cell sees text, not an error.
4. **Chunk bounds are heuristic** (Excel 25, pycel 32) — no observability into
   when a chunk exceeds the engine's safe limit; failure mode is OOM/contamination.
5. **Dimension-by-default distrust** — historically a gsheets sheet at its
   default size bit us; the lesson is *derive dimensions from need, never inherit
   an engine default.*

## 4. Sub-design A — Seed ingestion fidelity

**Resolve the canonical type once, in the harness; forbid drivers from
re-inferring it.** Type resolution already happens at the corpus boundary
(`coerceCellValue` / `normalizeToGrid` → `CellValue = number|string|boolean|
CellError|null`). The fix is to make that the *only* place type is decided, and
bind every driver to it:

> **Ingestion clause.** A driver MUST write a seed `CellValue` into its engine
> *as the canonical type the contract carries* (number→number, text→text,
> boolean→boolean). A driver MUST NOT re-infer type from the value's string form.
> A seed may also be a **formula-bearing entry `{formula:"…"}`** (D6 decision B) —
> the driver writes it as a formula and lets the engine evaluate it; this is the
> portable path for values scalars can't express (dates, and any formula-derived
> input). The grid seed type widens to `CellValue | {formula:string}`.

Per-driver consequences:

- **gsheets** — **type-route the write** (validated live 2026-06-09, D6), not a flat
  RAW/USER_ENTERED split: ordinary literals (number/text/bool) via `RAW` (no type
  re-inference); the *formula under test* via `USER_ENTERED`; **error-typed seeds via
  `USER_ENTERED` as the sentinel string** (`"#DIV/0!"` → stored `userEnteredValue.errorValue`
  — a real error literal, no formula; under `RAW` the same string is plain text, the lossy
  path). Two `valuesBatchUpdate` calls (a RAW set + a USER_ENTERED set), or per-range options.
  *(The structured `updateCells.errorValue` API is rejected 400 "Cannot set cell to an error
  value" — unused; the USER_ENTERED sentinel is the working literal door.)*
- **ironcalc / lattice** — stop blanket `str(val)`; encode the type so the engine
  ingests text-as-text and number-as-number deterministically (typed setter, or
  a value+type envelope at the subprocess boundary).
- **openpyxl four + hyperformula** — already conformant; covered by an invariant
  test (below), no change.

**Corpus authoring contract.** Because the harness resolves type from the
YAML/JSON scalar, **quoting *is* the type declaration**: `A1: 3` is a number,
`A1: "3"` is text. This is deterministic but currently undocumented — it becomes
a documented rule. The one axis scalars can't express — a **date** (no portable
serial; no `CellValue` date variant) — is declared by a **formula-bearing grid
entry `{formula:"=DATE(y,m,d)"}`** (D6, decision B 2026-06-09): the grid seed type
widens to `CellValue | {formula:string}`, so any input cell can be formula-seeded
and the engine resolves it to its own correct value. *(Errors need no such entry —
`CellError` is already a `CellValue`.)*

**Acceptance:** a *type-fidelity invariant test* — seed `"3"` (text), `3`
(number), `TRUE`, and an error into a passthrough formula (`=A1`, `=ISTEXT(A1)`,
`=ISNUMBER(A1)`, `=ISERROR(A1)`); every driver must report the *same* ingested type.
Any driver that coerces fails. This retires the manufactured-divergence class at its
root. **Extend the error case to the classic-7 sentinels** (`#DIV/0!`, `#N/A`,
`#NAME?`, `#NULL!`, `#NUM!`, `#REF!`, `#VALUE!`) — only `#DIV/0!` is confirmed live on
gsheets' USER_ENTERED-sentinel path (D6); verify the rest per-type rather than assume.

## 5. Sub-design B — Layout & coordinate contract

Replace the per-driver constants with **one declared `BatchLayout`** the drivers
consume (and which travels to `@cartularium/drivers`):

```
INPUT   region   reserved for grid seeds            e.g. A1:Z{rows}
FORMULA cell     reserved, outside INPUT            AA1
SPILL   window   result read-back rectangle         AA1 : (AA+W, 1+H)
PROBE   region   side-channel (gsheets D8.β)         isolated from INPUT/SPILL
DIMENSIONS       host sized to the declared regions, bounded by engine caps
```

Three hardening rules fall out:

1. **Dimensions derived, never defaulted.** Sheet/workbook size is computed from
   the declared regions plus headroom, then clamped to the engine's caps
   (gsheets 10M cells/spreadsheet; 1000-row *default* explicitly overridden).
   Closes foot-gun #5.
2. **Spill overflow is a tripwire, not a truncation.** If a result reaches the
   SPILL boundary, emit a loud `result-truncated` signal (or grow-and-retry) —
   never return a silently clipped grid. Closes #1. **(RE-OPENED — see §5.1:
   tripwire-as-evidence was rejected; a boundary hit may become a routing
   trigger instead. Do not build on this rule as written.)**
3. **Region validation.** Reject (at load) any corpus grid whose refs fall
   outside INPUT, or collide with FORMULA/SPILL/PROBE. Closes #2.

### 5.1 D2 RE-OPENED — the read model ledger (2026-06-10) — RESOLVED 2026-06-14 — mechanics SUPERSEDED by §5.3 (2026-06-15)

> **RESOLVED 2026-06-14:** this ledger is history. O3 (escalation ladder) became
> the contract and O4 the gsheets strategy (§5.2); the charter gate
> (`test-space-charter-2026-06-11.md` §8) passed and **D2 is ratified / greenlit**
> (see the §8 decision row and §5.2). Kept as the option-ledger record.

D2's provisional "(a) fixed window + overflow tripwire" was rejected in working
session (2026-06-09/10): **the window conflates two jobs** — bounding the I/O
payload (legitimately ours) and *defining the result's extent* (the engine's
alone). Guard bands, truncation flags, and grow-and-retry were all patches on
that conflation. **Maintainer call: record the options, sleep, decide fresh —
nothing below is ratified.** layout.ts's spill pieces (`spillOverflowed`, the
window-as-read-contract) are PROVISIONAL pending this decision.

**Grounding gathered this session:**

- **Corpus scan (06-09):** 16,129 fixture entries; the largest result is 10×1.
  The common case is scalar-out or a handful of cells; genuinely large results
  will be *deliberate* seam tests. The read model must price for this
  distribution, not for the pathological tail. **(CAVEAT 2026-06-11: this
  distribution describes the OLD architecture's corpus and is survivorship-biased
  — no cross-sheet / spill-block / big-spill tests exist because they were
  inexpressible under it. Source corpus = 2,509 formulas; 16,129 counts
  per-platform result entries. Valid for pricing the current hot path; INVALID
  as a design envelope — see the §5.2 charter gate.)**
- **gsheets extent cannot be inferred from the wire.** Semantic nulls: a
  trailing null spill region is wire-indistinguishable from "spill ended"
  (G5/D8.β). Whole-sheet sparse reads do NOT yield true extent.
- **In-band dims probes work** (§2.2, LET-eagerness now proven):
  gsheets `=LET(foo,<formula>,ROWS(foo)&"x"&COLUMNS(foo))` — re-evaluates the
  formula (volatiles already excluded; scalar results need an IFERROR guard;
  probe shares the task's blast radius). Excel cheaper via spill-ref
  `=ROWS(AA1#)&…` (no re-eval). In-proc engines: array shape, free.
- **Shared-capacity facts (maintainer, 06-09):** the gsheets pool is **10M cells
  per SPREADSHEET**, shared across all sheets — i.e. across co-resident tasks
  and later chunks. Recently bumped but **not uniformly rolled out** →
  client/version-variable → treat as a **monitored signal, never a hardcoded
  constant**. A spill without room triggers **row auto-insertion** (soft limit
  ~50,500 rows; more can be added manually) → host dims are **elastic** → a
  greedy spill draws down the shared pool = **capacity contamination**, the
  structural twin of Excel's process-memory channel (unify into §6.1's channel
  table once settled). Engine behavior *at* these seams (auto-insert, soft-limit
  refusal, pool exhaustion) is catalogable evidence, reachable deliberately by
  declaring small hosts/tight pools as test parameters.

**Option ledger:**

- **O1 — fixed window + truncation tripwire** (original D2(a); what layout.ts
  currently implements). Rejected as unprincipled: exact-fit is ambiguous with
  clipped (a legit 20-row result flags forever); worse, a flagged-but-clipped
  grid can **manufacture agreement** (two engines' identical 20×20 prefixes of
  diverging 50-row results); our window acts as a semantic boundary.
- **O1′ — +1 guard band** (declare 20×20, read 21×21; band occupancy ⇔ genuine
  overflow). Fixes only the exact-fit ambiguity; evidence is still clipped.
- **O2 — extent-from-engine + materialize budget.** No semantic window; extent
  captured always via the in-band probes; staged default-range read + sized
  follow-up; over-budget → record extent + explicit `unread` outcome (attributed
  no-evidence, never a clipped grid). Concerns raised: taxes the common case
  (two-phase machinery, gsheets double-eval on every task); the budget felt
  under-motivated as a primitive.
- **O3 — escalation ladder** (front-runner, NOT settled). Size-classed,
  per-task escalation; boundary-hit is a **routing trigger, never an evidence
  marker** (a false trigger costs one re-read, not wrong data):
  - **T0** packed/shared chunk + small staging window (the ~99.9%);
  - **T1** extent exceeds staging → sized follow-up read (same host/batch);
  - **T2** extent exceeds materialize budget → **hash/sample instead of values**
    (sqllogictest's move — divergence detection without materialization;
    caveat: needs canonical value formatting, exact hash vs numeric tolerance);
  - **T3** misbehavior (crash / wedge / capacity contamination) → quarantine:
    fresh host → fresh **spreadsheet**, serialized property reads — which is
    §6.5's isolated-attributed mode; one rung, two reasons to climb.
  - Known seam tests **declare** their class up front (à la WPT `timeout=long`);
    the runtime ladder is the safety net for the undeclared. Capacity monitoring
    rides the wedge-proof metadata read as an escalation *trigger*, not
    per-cell bookkeeping. **Nuclear-as-default explicitly rejected**
    (API-prohibitive); it is the top rung only.

**Prior art to mine (maintainer asked; shortlist + what to steal):**

- **sqllogictest** (SQLite; format adopted by DuckDB / CockroachDB / DataFusion)
  — the closest structural twin (one corpus, many engines, agreement
  cataloguing): hash-threshold result storage; `skipif`/`onlyif` engine labels;
  format precedent also relevant to parked D8.
- **Web Platform Tests** — per-engine expectations files with CRASH/TIMEOUT as
  first-class statuses, updated by runs (≈ D9's version-stamped
  `crashes-engine`); per-test resource declarations; stability re-runs.
- **Flaky-test quarantine systems** (Google TAP, Chromium LUCI) — quarantine +
  scheduled re-test + auto-unquarantine = the "detect when Google fixes it"
  lifecycle, industrialized.
- **AFL fork server** — warm-template isolation; gsheets analog = a pre-created
  **spreadsheet pool** to make T3 affordable within API limits.
- **jemalloc size classes / Spark AQE** — tier by observed size; escalate the
  partition, not the world.

**Maintainer's standing position (for the morning review):** common cases must
drive the shape; the arbitrary window is unprincipled; full isolation is
principled but overkill / API-hostile as a default; wants prior-art input
weighed; **has substantial unresolved concerns about the overall shape — no
option above is chosen.**

### 5.2 Session record 2026-06-11 — D2 direction + the charter gate (RATIFIED 2026-06-14) — read mechanics SUPERSEDED by §5.3 (2026-06-15); the O3-contract/O4-strategy conclusion stands

Working session on the §5.1 morning call. Direction reached; ratification
deliberately deferred behind the test-space charter (below). **The charter was
ratified §1–§10 section-by-section (2026-06-12 → 2026-06-14) and its §8
gate-check passed — D2 (O3 contract + O4 gsheets strategy) is GREENLIT by the
maintainer 2026-06-14.** The direction below is now the ratified D2 model; one
addition fell out of the charter (the opaque-reference family — see the charter
gate note below and §9).

**D2 direction: O3 is the contract; O4 is the gsheets strategy under it.**

- **Contract layer = O3's semantics:** the §6.6 outcome union; evidence never
  clipped (thresholds route *cost*, never truth — this also answers O2's
  "budget under-motivated" objection: in O3 the budget only picks between two
  faithful representations); boundary-hit = routing trigger; the runtime ladder
  is the safety net for the undeclared. Extent/digest *discovery mechanics* are
  driver-owned (consistent with the ratified driver contract's posture).
- **O4 — probe-en-masse two-phase execution (maintainer's proposal, new):**
  phase 1 writes tasks as **scalar-collapsing composite probes**
  (`=LET(r,<formula>,"d:"&ROWS(r)&"x"&COLUMNS(r)&";n:"&COUNTA(r)&";b:"&COUNTBLANK(r))`),
  phase 2 places real formulas with packing planned from known extents. Buys,
  in increasing importance: (1) packing density (measure before buying); (2)
  engine-authoritative extent — kills the semantic-null/trailing-blank
  ambiguity, since the phase-2 read range derives from declared extent; (3)
  **crash screening** — poison surfaces in cheap phase-1 hosts, the value run
  almost never wedges (AFL-prefilter analog); (4) **the budget gate moves ahead
  of materialization** — `ROWS(SEQUENCE(1000000))` is a scalar, so a T2-class
  monster's grid is never placed; digest/sampling ride further probes
  (`INDEX(r,i,j)`), making T2 capacity-*safe* instead of capacity-*spending*.
  Cost: double compute — transient coupling only, bounded by timeout→T3 and the
  lump-size cap; composable with the E3 screen (probe only where extent is in
  question).
- **Lump screen (sound direction = over-approximate):** dense-lump only
  statically reference-free AND position-insensitive formulas (no A1/R1C1
  tokens, no `INDIRECT`/`OFFSET`/`ROW()`/`COLUMN()`/`CELL`). Everything else
  **probes in-place** — phase 1 writes the probe at the task's own FORMULA cell
  on its own seeded sheet, phase 2 overwrites it — same cell, same seeds, same
  position, so context-sensitivity dissolves; probe hosts need no spill room.
- **E-ledger (gsheets extent / trailing blanks):** E1 always-probe (O2's tax) /
  **E2 canon-trim DEAD as primary** (manufactures extent agreement — O1's sin
  on a new axis; survives only as an explicit "extent: no-claim" comparison
  fallback) / E3 static spill-classification, probe only spill-capable
  (conservative, safe direction) / E4 probe carries a blank census
  (`COUNTA`/`COUNTBLANK`) / **E5 = O4, solves it outright.**
- **Packing reframe — environment compatibility (generalizes §5 rule 3 and the
  namespace question):** host-scoped settings — dims, locale, calc settings,
  sheet-name + named-range namespaces, capacity headroom — are part of a test's
  **declared environment**; the planner co-hosts only compatible tasks. Aux
  sheets become declared resources; a sheet-qualified ref must resolve to a
  name the task itself declares (load-time rejection otherwise); **declared
  obstacles in the spill path become legal fixtures** (the spill-block family)
  while undeclared collisions stay violations. Host dims are *observable*
  (`ROWS(A:A)`) ⇒ derived-dims must not silently change evidence for
  dimension-observing formulas (one more conservative static screen; dims
  declarable per test).
- **Thresholds, all declared + measured, never buried:** staging window (keep
  20×20 default; under O4 it governs only the unprobed safety-net path);
  materialize budget (cells); capacity watermark (measured fraction — pool is
  client-variable); **lump/chunk size = the deliberate knob** (wedge blast
  radius vs amortization).
- **Three gating probes before ratification:** (1) trailing-blank spill **wire
  representation** (`values.get` vs `includeGridData`; is a spilled `""` an
  empty-string cell or a true blank?); (2) composite-probe collapse behavior
  live (ROWS/COUNTA over big arrays; the §2.2 scalar guard; error propagation
  into the probe cell); (3) sheets-per-spreadsheet refusal (historical ~200 cap
  vs current — monitored signal, also catalogable seam evidence).

**The charter gate (method correction) — CLEARED 2026-06-14.** Every
corpus-derived justification this session — "zero cross-sheet tests ⇒
future-proofing slot," "largest result 10×1 ⇒ staging sizing," "84% lumpable" —
was survivorship-biased (§5.1 caveat). **D2 ratification was gated on
`docs/test-space-charter-2026-06-11.md`**, deriving the envelope from the
evaluation relation, corpus demoted to hot-path pricing where the argument
survives without it. **That charter is now RATIFIED §1–§10; its §8 gate-check
found O3+O4 PASSES** (serves every extent-bearing family without clipping truth,
forecloses no environment family) — **D2 greenlit.** The charter's one envelope
addition that lands here: a **dynamic/opaque-reference family** (`INDIRECT` /
`OFFSET`) whose reach can't be statically bounded ⇒ **route to isolation (the
existing T3 mode)** rather than co-host (detect cheaply via the per-case
function-extraction; sequencing-step-2 item, §9). It *sharpens* the lump screen
below — which already declines to dense-lump these: beyond position-sensitivity,
the genuinely-opaque-*reach* subset also defeats safe co-hosting.

The charter also pins the standing posture this design inherits: **nothing is set
fully in stone — the model stays flexible to unforeseeable behavior; scope from
the territory (probes), the charter-anatomy is the revisable lens, the corpus
prices only** (charter §9). Criterion
worked out in-session: **assay catalogues the full observable footprint of
evaluation** — everything eval can READ (environment, enumerable from function
surfaces; `CELL`/`SUBTOTAL` pull width/visibility across the line) and
everything it PRODUCES or PERTURBS (cell-state incl. terminal properties like
hyperlink and auto-applied number format; host effects = §6.4). Per-engine
observability is *capability*, never divergence.

**Charter unification duties — express in EXISTING vocabulary, do not invent
parallel terms** (this session re-derived several recorded designs before
catching it):

- The criterion **is** the value-model collapse's *accessor frontier*
  (`value-model-foundations-2026-05-30.md` Part 6): cell = record, formula
  surfaces = field accessors, frontier per-engine/time-varying = divergence
  data. State it as an application, link the paused thread.
- "Channels"/reader-matrix **are** the comparison model's
  capability/circulating/terminal rungs (renamed 2026-06-15) + the capture ceiling
  (`comparison-model-design-2026-05-30.md` §1/§5: "a rung only resolves as high
  as the driver captured"; stub-engine audits raise the ceiling).
- Terminal outcome properties (don't survive `=A1`: hyperlink, image,
  auto-applied format) likely home on `RichCellValue`/EngineExtras — precedent:
  ratified contract decision 3, volatility = result property. Circulating ones
  (rich entities, `=A1.Price`) are the value model proper.
- Channel demand = recorded-baseline bootstrap (green-by-construction, drift
  thereafter — comparison doc §2) **plus the RETAINED harness-oracle role of
  `expect`** (2026-06-07 decision: assay-core cohort-relative; oracle kept as
  self-check — it caught the SORT/seeding floor cracks; canon deferred to an
  engine-owner conformance layer). Read modes = §6.5's pattern: narrow
  baseline-tracking default, broad discovery sampled.
- Environment vocabulary aligns with the measure harness's first-class
  `environment` locus (syntactic | environment | data-borne).
- Ring 2 (other call sites of eval: CF rules, validation rules, filter
  conditions — restricted contexts with per-engine whitelists) explicitly
  deferred, with the criterion documenting why.

### 5.3 Revised read/spill/isolation model — ✅ RATIFIED 2026-06-15, Moves 1–5 (supersedes the §5.1 ladder mechanics)

**Status: ✅ RATIFIED 2026-06-15 (Moves 1–5, section-by-section) — STRESS-TESTED by an
adversarial architecture review, then ratified move-by-move against live cross-engine
probes. Outcomes: Move 2 ratified; Move 3 ratified (+ correlated-corner / shared-fate /
up-front-trigger reframe); Move 4 refined to RUNTIME-TRIGGERED (not tag-selected); Move 5
ratified (reworked → "annotations never load-bearing"); Move 1 DIRECTION ratified
(digest = the rung-scoped fingerprint), over-budget aggregate-digest mechanism HELD on its
prereqs.** A re-derivation of the read model from the
design work done *since* §5.1 — O4 probe-en-masse (§5.2) and the killed content-hash
(Move 1). The §5.1 option-ledger and §5.2 direction stay as the journey/record, and
their *conclusion* (O3 = the contract, O4 = the gsheets strategy) **holds** — this
sharpens the *expression*, not the substance. Ratification status per move (the
adversary's verdict, endorsed):

| move | call |
|---|---|
| **2** kill the tier ladder | **✅ RATIFIED 2026-06-15** — clean win; the cost-not-truth / no-clipped-grid invariant survives |
| **3** two bounds | **✅ RATIFIED 2026-06-15** — with the correlated-corner route + the gsheets shared-fate correction + the up-front-trigger reframe (below) |
| **4** selective probe | **REFINED 2026-06-15: probe is RUNTIME-TRIGGERED (ambiguous/overflow boundary), not tag-selected — load-bearing only for the gsheets silent-extent corner; else optimization** |
| **1** digest | **✅ DIRECTION RATIFIED 2026-06-15** (digest-not-hash = the rung-scoped fingerprint; in-budget = materialize+fingerprint). Over-budget aggregate-digest MECHANISM **still HELD** on: aggregate-comparability invariant + error-resilience + gating-probe #2 (`valueEquals` now resolved by the equality doc) |
| **5** declare-don't-screen | **✅ RATIFIED 2026-06-15** (reworked) — opaque-ref safety screen mandatory+automatic; tags additive; generalized by the "annotations never load-bearing" principle |

Implementation note: `src/drivers/contract/read-model.ts` (`ReadTier` + `routeByExtent`)
and `cohost.ts` were built last session against the *old* framing; they rework to match
— `routeByExtent` → the binary budget fork, `isolated` → the isolation contract, and
**`cohost.ts`'s opaque-ref screen STAYS** (only its lump/extent heuristics go, Move 5).

**Move 1 — kill the hash; the digest is in-engine aggregates, not a content hash. (HOLD — prereqs at the end of this move.)**
The O3 ladder borrowed "T2 = hash/sample" from sqllogictest, which MD5s *already-
materialized* rows to stay compact — a premise we invert: materializing is the cost
we avoid. And there is no portable in-engine hash (TEXTJOIN-then-hash blows
string/cell limits on exactly the big results that would need it), so a hash would
either force materialization or can't be computed where the data lives. **The digest
*is* the O4 composite-probe scalar** (`d:RxC;n:COUNTA;b:COUNTBLANK`) extended with a
few more in-engine aggregates (`SUM`, min/max) + targeted `INDEX(r,i,j)` samples,
compared **digest-vs-digest with the same tolerant `valueEquals` as everything
else**. Honest caveat: aggregates can collision-miss a cell-exact divergence in a
huge result → recorded **"agree at digest fidelity"** (explicitly below the §5
capture ceiling), never bare "agree". Need cell-exact truth on a big result? Raise
the budget and materialize (it's a cost call, not a truth call).

**Two prerequisites (adversary) before this is a *settled mechanism*, not just a right
direction — Move 1 HOLDS on them:** (a) **cross-engine aggregate comparability** —
`COUNTA`/`SUM`/`COUNTBLANK`/min-max must *mean the same thing* Excel↔gsheets (they
differ on blanks, error members, text coercion), or a digest *divergence* is a pure
aggregate-semantics artifact = **manufactured divergence, the §2.1 cardinal sin**;
prove it with a type-fidelity-style invariant over a known-identical seeded grid
(blank/error/text members included). (b) **error-resilience** — an error cell inside a
big result propagates through `SUM`/`COUNTA` → the probe cell returns the error →
`parseProbeReading` → null → *no digest, exactly when it's most needed* (large result
*containing* a divergent error); the digest aggregates must isolate errors
(`AGGREGATE`-ignore-errors / count errors as their own facet), not let one `#N/A` void
the measurement. And the comparison rides `valueEquals`, which is **OPEN** (Foundation,
below) and *defines* the digest's fidelity — so Move 1 cannot be ratified as a mechanism
until (a)+(b)+`valueEquals` land and gating-probe #2 (composite-probe collapse + error
propagation, still owed) runs. The *direction* — digest not hash — is sound and
ratifiable; the mechanism is not yet.

**Move 2 — kill the tier ladder; it conflated three orthogonal axes.** T0→T1→T2→T3
read as one escalation climb, but that only makes sense if you read a default window
and *discover* it was too small. O4 hands us the engine-authoritative extent *before*
the value read, so "escalate by discovery" becomes "route by known extent" — and
**T0 (staged) / T1 (sized-reread) collapse** (there is no staged-read-that-might-be-
too-small to escalate from). The ladder mashed together: **packing** (a layout
concern — O4 phase-2 planning from known extents), **extent-routing** (one binary
budget fork: materialize | digest), and **isolation** (a separate *failure* axis —
`routeByExtent` never returned `isolated`). They are up-front decisions from known
information, not a climb.

**Move 3 — two orthogonal bounds, both wrapping every execution.** Output-extent
(budget → **materialize | digest**) ⟂ compute/liveness (per-formula **timeout +
crash/wedge detection** → `rejected` (calc-limit, engine declines) | `crashed{timeout
| process-death | host-wedge}`). Independent axes: small-output/huge-compute (a nested
`REDUCE`) and huge-output/cheap-compute (`SEQUENCE(1e6)`) are different cells — the
budget never sees the first, the timeout never sees the second. **O4 *relocates*
crash/compute into phase 1 (the probe still evaluates F), it does not prevent them**,
so the compute/liveness bound wraps the *probe* too, not just the value read. The
isolation axis therefore has **up-front triggers** — the **automatic opaque-ref screen**
(Move 5; *not* a tag) and a **known-crash-class** from the version-stamped `crashes-engine`
record → isolate proactively so it can't poison a co-hosted batch; *(a declared `isolate`
tag is only an optimization hint, never load-bearing — see the unifying principle)* —
**and runtime triggers** (a
*new* crash/hang surfaces in the probe → recovery attributes it to the one formula →
records `crashes-engine as-of vX` → known/isolated next run — the
discovery→record→isolate feedback loop).

**Correction (adversary): on gsheets the discovery is NOT cheap, and "two
orthogonal bounds" is only *dimensionally* true.** Two things the draft overstated:

- *gsheets probe-en-masse is shared-fate.* The probe batch shares one spreadsheet, and
  a gsheets crash is a *whole-spreadsheet* wedge (§6.1, grounded live): one poison probe
  500s every co-resident probe's read *and* blocks `deleteSheet`, so a phase-1 wedge
  takes the whole lump's extent measurements down and recovery is the full D4 clear-cell
  + fresh-spreadsheet bisect — **not** the AFL-prefilter §5.2 advertised (AFL children die
  independently; gsheets co-tenants die together). So phase 1 needs its *own*
  wedge-recovery, and the **lump size is bounded by the wedge blast radius** (small lumps
  trade API calls for containment). The feedback loop still pays off *across* runs (a
  once-discovered crash is isolated thereafter), but the *first* discovery in a lump is
  priced at one D4 recovery, not free.
- *The correlated corner is huge-output ∧ heavy-compute* (a big `SORT`/`REDUCE` over a
  large array). There the probe is *both* the chosen path (Move 4: suspected-huge →
  probe) *and* the most likely place to hit the timeout (it runs the full F to aggregate
  over the monster). That joint cell needs an explicit route, not a fall-between-the-two:
  a **sampling-only digest** (`INDEX` samples *without* a full-array `COUNTA`/`SUM` pass,
  so measuring doesn't itself require traversing the monster), else `crashed{timeout}`
  with extent-unknown. The digest therefore must have a **sampling-only mode** for this
  corner.

**Move 4 — the probe is RUNTIME-TRIGGERED, not a phase and not tag-selected (refined
2026-06-15).** O4's double-compute (probe runs F, read runs F again) is waste, *and*
selecting the probe by an author tag is brittle (frozen corpus, no authors — §5.1/D8).
So the probe fires on a **runtime signal**, not a declaration: the common case **reads
direct + tripwire** (single compute, ~99.9%); when the direct read hits an **ambiguous
or overflowing boundary**, *then* probe to resolve extent authoritatively. The probe's
**only load-bearing job is the gsheets silent-extent corner** — the wire can't give
extent (trailing-blank / semantic-null ambiguity; no `A1#`; trimming manufactures
agreement, E2 dead), so an in-engine `ROWS(LET(_r,F,…))` is the one authoritative read,
and an ambiguous boundary is exactly its trigger. Everything else the probe buys
(extent-before-placement, dodging the gsheets auto-insert) is **optimization, not
correctness**: without it the tripwire still guarantees no clip (re-read sized/digest),
at the cost of a double-compute on the rare huge result. So the probe = a
runtime-triggered extent-resolver (+ an optional *learned* fast-path for known-huge),
never a mandatory phase. The crash/compute axes it does **not** help — those are Move
3's bounds (isolation + timeout); the probe *relocates* them, doesn't prevent them.

**Move 5 — declare, don't screen; the author tags the case class up front.** Static
text-analysis of "is this huge / crash-class / position-sensitive" is unreliable
without types or runtime data; the author wrote the seam test *on purpose* and already
knows. This is the ratified intent (§5.1: "known seam tests **declare** their class up
front, à la WPT `timeout=long`; the runtime ladder is the safety net for the
undeclared"). A `TestCase` carries a declared **class** (one more declared field beside
`status`/`supportLevel`; default `ordinary`):

| class | meaning | routing |
|---|---|---|
| **ordinary** (default, ~99.9%) | no special demand | pack freely; read direct + tripwire |
| **isolate** | crash-class / opaque (`INDIRECT`/`OFFSET`) / contaminating | run alone, recovery-wrapped |
| **spill:large** | suspected-huge output | probe once → digest (no phase 2) |
| **long** | compute-heavy | raise the timeout |

The **runtime backstop** (tripwire + timeout + crash-detect) catches the un/mis-tagged
→ re-route, record the observation, flag "should be tagged."

**REWORK (adversary, decisive) — the opaque-ref *safety* screen stays mandatory.** The
draft killed `cohost.ts` wholesale; that silently downgraded a charter §8 safety
guarantee. Detecting `INDIRECT`/`OFFSET` is the *cheap, reliable* static check
(function-name presence) — **not** the "difficult" inference (huge / position-breaking /
crash-class) that tagging is meant to replace. And on the **frozen, untagged corpus**
(D8: no authors) every formula defaults to `ordinary`, so an untagged `INDIRECT` reading
a co-tenant's seeded region produces a *silently wrong value* the backstop **cannot
sense** (no crash, no timeout, no extent-tripwire — value-contamination is silent,
§6.1). So co-host-safety must **not** hinge on a tag nobody sets. Resolution:
`cohost.ts`'s **opaque-ref → `isolate` screen stays mandatory and automatic** (a hard
pre-filter, `requiresIsolation`); only the *lump/extent heuristics* (`coHostPlacement`'s
reference/position inference) go. **Tags are *additive* isolation demand** (crash-class,
contaminating, `long`), never the only path to it. Volatility detection stays as a cheap
auto-tag (drift-exclusion).

**Backstop honesty:** two of its three sensors — the per-formula **timeout** and the
**crash-detect** machinery — are **unbuilt today** (§6.2, the next build); at
ratification the backstop is *one* working sensor (the extent tripwire). So "the
backstop catches the un/mis-tagged" is aspirational for 2/3 of it — the second reason
the mandatory opaque-ref screen, not the backstop, carries the safety load.

**Annotations are never load-bearing (unifying principle, 2026-06-15).** No author tag
is required for *safety* or *correctness* — only for *optimization*. Safety rests on the
**automatic pre-screen** (opaque-ref → isolate; declared-environment for capacity/dims)
for the *silent* hazards, and on the **discover→record→isolate loop** (run co-hosted; the
backstop senses crash / timeout / extent-overflow; record version-stamped; isolate next
run) for the *sensible* ones. The persistent-effect channels (§6.1: Excel sticky format,
gsheets permanent resize) ride the same loop — discovered on reuse/spill, then handled by
full-clear / fresh-host. Tags (`spill:large`, `long`) collapse to **pure optimization
hints** that save a double-compute or pre-raise a timeout; an un/mis-tagged case degrades
to one backstop-caught run, never silent breakage. This dissolves the brittleness of
relying on author annotation over a frozen, author-less corpus.

**Foundation — canonical value formatting (OPEN; needs its own ratification).** Both
the digest comparison *and* the materialized comparison flow through cross-engine
**value-equality**, which *is* the canonical form — and what it normalizes-away
(format, `number_format`, trailing zeros → **terminal**) vs preserves (typed value, error
sentinel, blank-vs-null, extent → **circulating**) *is the circulating/terminal boundary
drawn per facet* (comparison doc §1; rungs renamed 2026-06-15). So this is foundational
and **blocking for the digest**, not a T2 detail. Direction: reify **one
`canonicalize(cell)` / `valueEquals`** shared by the agreement layer, the digest, and the
matcher's circulating facet (one
source of truth for "when are two values the same"). **Open forks, not ruled:** (1)
tolerance model — absolute (today's `numTolerance`) vs **relative/ULP/hybrid**; (2)
reify-and-unify scope vs minimal; (3) text normalization — exact vs NFC/trim.
**Blank-vs-null is PRESERVED** (a real divergence — D8.β). Deferred to a dedicated pass
(likely a comparison-model update); the rest of §5.3 does not block on its resolution
except that the digest's *fidelity* is whatever `valueEquals` defines.

**▶ 2026-06-15 — this whole question now has its own doc:**
`value-equality-and-fingerprint-2026-06-15.md` (PROPOSED). It collapses the rung
vocabulary to **capability / circulating / terminal** (= the charter's depends-on-eval
criterion), makes equality **descriptive-by-default** (circulating facets; read-time
rung dial; matcher as the only per-test override; **no author lanes**), defines the
fingerprint (**circulating-projection + relative tolerance + preserved blank/null +
regenerate-on-miss with a self-invalidating cache**), and sweeps the matcher presets so
no expressiveness is lost (scope / equality-predicate / assertion-predicate — only the
`semanticDomain` lane drops). That doc supersedes Move 1's "aggregate digest" with the
rung-scoped fingerprint and narrows this Foundation to its three open items (tolerance
reconciliation, D8.β null policy, default rung).

**▶ 2026-06-15 (later) — the equality doc was REVISED post live cross-engine probes
(Excel xlwings + gsheets API; see its Appendix), absorbing ① (the criterion is the
**deref slice** `=A1`, not "any downstream eval" — `number_format` is `CELL`-readable
yet terminal) and ② (collapse to one terminology — capability/circulating/terminal, renaming C/B/E). Two of the three
Foundation forks are now CLOSED:** *D8.β null policy* = **distinguish** (Excel
decays-to-`0` vs gsheets propagating-`null`; side-channel = `ISBLANK`/`COUNTBLANK`/
effectiveValue-presence), and *default rung* = the **engine-invariant circulating
core**. The *text* fork also closed (**NFC-canonicalize, no case-fold/trim** — both
engines treat `NFC ≡ NFD` under `=`, store raw). Only **tolerance reconciliation**
(near/tol-abs vs cellsEqual-rel) stays open. New finding: a **rendered-rich** family
(image, sparkline) is circulating-but-content-opaque ⇒ a `PrimitiveValue` "opaque" kind
gap (logged in charter §4).

**Net model:**

```
PRE-SCREEN (mandatory, automatic — carries SAFETY for the SILENT hazards):
  opaque ref (INDIRECT/OFFSET) → isolate          [hard pre-filter, not a tag]
  declared environment (locale/dims/calc/…)        [compatibility packing]
  volatile                     → drift-exclusion auto-tag

READ PATH (annotation-free):
  read direct + tripwire (~99.9%, single compute)
  ambiguous / overflow boundary → PROBE (runtime-triggered) = authoritative extent
     └ load-bearing ONLY for the gsheets silent-extent corner; otherwise optimization

DISCOVER→RECORD→ISOLATE loop (safety net for the SENSIBLE hazards):
  backstop senses crash | timeout | extent-overflow | host-grow | sticky-format-on-reuse
  → record version-stamped → isolate / full-clear / fresh-host next run

case class = author TAG = OPTIMIZATION HINT ONLY (never load-bearing):
  spill:large → probe-first (skip the overflow round-trip)
  long        → pre-raise the timeout
  (un/mis-tagged → one backstop-caught run, never silent breakage)

two bounds wrap every execution (dimensionally orthogonal, correlated in one corner):
  output-extent     → budget fork: materialize | digest
  compute/liveness  → timeout + crash/wedge detect: rejected | crashed{channel}
  huge-output ∧ heavy-compute → sampling-only digest, else crashed{timeout}

comparison rides one tolerant `valueEquals` (equality doc — forks mostly closed 2026-06-15);
digest = in-engine aggregates + samples, error-resilient, at declared fidelity, never clipped.
  └ gsheets probe-en-masse is shared-fate (whole-spreadsheet wedge): lump size bounded by blast radius.
```

**§8 gate-check, re-run against §5.3 (PASSES for the spine; two arms gated —
adversary-corrected).** *Never-clip-truth:* preserved — the digest is declared-fidelity
(below the capture ceiling), never a clipped grid. *Extent-bearing families served:* the
budget fork routes known extent; big spills get `spill:large` → probe→digest. *Co-host-
safety:* preserved **only because the opaque-ref → isolate screen stays mandatory and
automatic** (Move 5 rework) — *not* "via the `isolate` tag," which was the silent
downgrade the adversary caught: on the untagged corpus the tag is never set and the
backstop can't sense silent value-contamination. The charter §8 mechanism *was* the
automatic static detection; it stays. *Environment families not foreclosed:* the class
tag is declared metadata, key-set extensible (the environment-compatibility packing
reframe). **What changes in §8's residuals:** "declared-obstacle layout support" stays a
bespoke layout item; "opaque-ref → isolation" stays an *automatic screen*, not a tag.
**Two arms gated (not failing — pending):** (1) the budget fork's **digest** arm is only
as trustworthy as Move 1's prereqs (`valueEquals` + aggregate-comparability +
error-resilience) — until they land, a digest *divergence* may be an aggregate-semantics
artifact. **CORRECTED 2026-06-15 (arch-review B1): the *materialize* arm does NOT pass
"now" either** — the shipped spine (`projectScalarGrid`→`cellsEqual`) collapses `blank`
and `null` to scalar `null` (`null===null`→equal), so it *manufactures agreement* on the
ratified blank/null divergence; the materialize arm passes only once `canonicalize`/
`valueEquals` is reified over `RichCellValue.kind` — the gate for the first
comparison-touching commit (§9 step 5). (2) gsheets phase-1 crash-screening passes only
once it carries its own wedge-recovery (Move 3 correction). **Residual opens:** canonical
value formatting; the timeout + crash-detect machinery (D3/D4, the isolation half — §6).

## 6. Sub-design C — Isolation contract

> **Isolation clause (generalizes ratified §2.2).** `evaluateBatch(tasks)`
> results MUST be mutually independent: each result equals what evaluating that
> task alone in a fresh environment would produce. Batching is a performance
> amortization, never observable coupling. A driver that shares a host across
> tasks owns isolation *within* that host.

But isolation isn't only for clean values. **Isolation exists for *attribution*:**
isolate enough that every observable — value, crash, time, resource — is
attributable to the formula that produced it. Then partition the observables:

- **measurement artifacts** (a corrupted *value*) → discard;
- **engine behavior** (crash, hang, time, resource) → **keep and monitor** — these
  are real, drift-prone, version-sensitive evidence, and the product of a
  continuously-verified monitor ("is this formula still crash-class on this
  version?"). Today's static `skip:` tag *throws this signal away*; it should be a
  re-tested, version-stamped failure observation.

### 6.1 What contamination actually is — grounded (Excel 2026-06-08; gsheets 2026-06-09)

Contamination = coupling through a shared resource. We **tested** the channels for
the two first-class engines rather than inheriting claims:

- **Excel — silent value-contamination: RETIRED.** The measurement-doc claim (an
  error formula corrupts a sibling's `SORT` inside the shared `app.calculate()`)
  **did not reproduce** across two configs and the exact named families
  (union / intersection / `@` / uncalled-`LAMBDA` / `#DIV/0!`; 3-arg
  `SORT(,1,-1)`; interleaved *and* block-ordered). Excel isolates errors per-sheet
  within one recalc. Likely the original was the *array-literal-orientation*
  artifact misattributed. → **no per-sheet-recalc value-isolation needed.**
- **Excel — process-death (capacity): REAL.** A memory-crash kills the host
  process → every co-resident task in the chunk dies with it (loud, total,
  presence-dependent). It's why `CHUNK_SIZE`/`APP_RESTART_EVERY` exist. **The
  current bisect does not survive it** (code-read): `_run_with_bisect` + the chunk
  loop reuse one `app` handle (`excel_driver.py:1250/1341`), so a crash cascades
  and mislabels up to `APP_RESTART_EVERY × CHUNK_SIZE ≈ 250` tasks as "excel
  rejected formula" before the periodic relaunch recovers.
- **gsheets — shared-spreadsheet wedge: REAL, and whole-*file* not whole-*chunk*
  (grounded live 2026-06-09 with `=GROUP_BY_AGGREGATE("player0",-1)`).** A single
  crash-class formula, once *present anywhere in the spreadsheet*, wedges the
  **entire spreadsheet's** value-recalc: every `spreadsheets.get?includeGridData`
  500s **regardless of range** (a read of two clean `=1+1`/`=2+2` siblings still
  500'd), `values.get` 500s, and **`deleteSheet` 500s** — so teardown cannot remove
  the culprit. Only pure metadata reads survive (the bare `init()` get → 200). The
  500 is a **5xx**, so `apiFetch`'s retry burns ~15 s then throws `quota/server
  error` → `isFatal` true → **`aborted`** → the whole remaining run is voided and
  *mislabeled* quota/auth (`gsheets.ts:213/218/780`). Teardown's `deleteSheet` 500
  **orphans the poison sheet**, which persists across runs (`cleanupOrphans` also
  deletes via `deleteSheet` → 500, swallowed) — so the shared spreadsheet is
  **permanently bricked for value reads until a human clears that cell**. One poison
  formula in the corpus = gsheets evidence dead for every run thereafter (plausibly
  how the hardcoded default `1QCumjd…OnOmo`, now 404, died). **Recovery is specific:**
  overwrite/clear the poison *cell* (RAW write → 200) heals the recalc graph; *then*
  structural ops work. `deleteSheet`-first does **not**.
- **Persistent state surviving formula deletion — the "delete ≠ reset" channel
  (grounded live 2026-06-15).** Two confirmed, both engine-asymmetric, both contaminating
  cell/host *reuse* — and **neither coerces the circulating value** (5 stays 5; `ISNUMBER`
  TRUE, `+1`=6), so the leak is into *capture* and *host dims*, not value:
  - *Excel sticky `number_format` (capture).* A date format is a persistent cell property:
    it survives a value-overwrite **and** a values-only `clear_contents`; only a **full
    `clear()`** resets it. The driver then mis-captures a reused cell's `5` as
    `1900-01-05` (openpyxl/xlwings is_date-convert). ⇒ **cell reuse needs a full clear
    (format+value), or fresh cells per task.**
  - *gsheets permanent resize (dims).* A spill past the grid auto-inserts rows
    (`=SEQUENCE(2000)` in a 1000-row sheet → `rowCount` 2500, +~500 buffer) and deleting
    the formula does **not** revert it. Dims are observable (`ROWS(A:A)`) ⇒ a spill-heavy
    task permanently grows its host + contaminates dimension-observing co-tenants. ⇒
    **isolate spill-heavy tasks to a fresh/throwaway spreadsheet (the D4 remedy) or
    `deleteDimension` in teardown; dim-observers declare dims.** (Excel grid is fixed —
    spill-past-edge is `#SPILL!`, no resize.)
  - *gsheets is NOT Excel-sticky:* `=DATE`'s format is auto/effective (value-derived) →
    clears with the value; only an **explicit** `userEnteredFormat` persists (assay sets
    none), and the API's `effectiveValue` is format-robust (reads `5`/`7` regardless), so
    the gsheets driver isn't capture-corrupted — only the terminal `number_format` facet
    (excluded from the fingerprint) goes stale.
- **Not contamination** (file elsewhere): volatile nondeterminism (`NOW()` shared
  instant → exclude), shared RNG (timeless/stateless for our purposes → dropped),
  spill truncation (intra-task fidelity → §5).

### 6.2 Realization — the first-class two

- **Excel — process-death recovery** (supersedes the old "per-sheet recalc," which
  solved a problem that doesn't exist): after `calculate()`, detect app death; on
  crash **relaunch immediately** (don't wait for the 10-chunk recycle), **bisect to
  quarantine** the crash-formula, **record it as a `crashes-engine` signal** (not
  "rejected"), resume. Add a **per-formula timeout** for the hang variant (none
  today). (D3)
- **gsheets — un-wedge, *then* attribute** (supersedes the old "bisect the read,"
  which can't dodge a *spreadsheet-global* wedge — §6.1): on a read 500, (1) stop
  treating it as quota/auth so it can't trip `aborted`; (2) **clear the chunk's
  formula cells** to heal the recalc graph — the only thing that un-wedges, since
  `deleteSheet` won't run while the poison is live; (3) **re-run suspects in a fresh
  throwaway spreadsheet** (`spreadsheets.create`, 1 call) to attribute the crash to
  the one task — the *spreadsheet*, not the *sheet*, is the isolation boundary;
  (4) record it `crashes-engine as-of <date>`; add a per-formula read timeout for the
  hang variant. Teardown must **clear-then-delete**, never `deleteSheet`-first. (D4)

*(Peripheral engines are fresh-per-task — isolated by construction — and out of
first-class scope per §2.1.)*

**Backlogged (deferred — accept cruft meanwhile, 2026-06-09).** Recover-by-clear
keeps spreadsheets reusable, but an *abandoned* bricked spreadsheet can't be trashed
without **`drive.file`** scope (the token holds only `spreadsheets`); add that scope
to sweep orphans — *deferred; let bricked/orphan scratch files accumulate while we
build.* Also replace the **404 default spreadsheet id** (`preview.ts:323`,
`shared.ts:107`).

### 6.3 Acceptance tests

- **Value-isolation invariant** — adversarial batch (error + order-sensitive
  `SORT`), **order-permuted**, **volatiles excluded/seeded first**, asserted
  element-wise equal to one-at-a-time. *Status: Excel passes (retired ①); this is a
  regression guard, not a fix target.*
- **Process-death recovery invariant** *(the live Excel gate)* — a batch containing
  a known crash/OOM formula must (a) lose **only** that task, (b) **attribute** the
  crash to it (recorded `crashes-engine`, not "rejected"), (c) leave siblings
  correct. Mirror for gsheets: a crash-class formula loses **only itself** *and*
  leaves the spreadsheet **reusable** (recovered via cell-clear, §6.1) — not bricked.
- **Reuse-isolation invariant** *(new 2026-06-15, persistent-effect guard)* — a cell or
  host *reused* across tasks must produce the same result as a *fresh* one. Excel: after a
  date-formatted task, a reused cell holding a plain number must capture *as that number*
  (⇒ full-clear, not value-overwrite). gsheets: after a spill that grew the grid, a
  dimension-observing co-tenant must read the *declared* dims, not the grown ones (⇒
  fresh/throwaway host for spill-heavy tasks). Both are §6.1 "delete ≠ reset" channels.

### 6.4 Signal classes

Attribution yields four observables with different cost profiles and homes:

| Signal | Read via | Cost | Cadence |
|---|---|---|---|
| value + error-state | native probe / batched recalc | ~free | every run |
| crash-liveness | out-of-band (process-death recovery) | ∝ `N_crash` | per engine version |
| performance | **native probe (self-timing)** ≳10 ms; else out-of-band isolated+sampled | self-timed ~free | self-timed every run; external rare |
| resource | collapses to the binary crash/OOM failure signal | — | with crash-liveness |

The contract grows a home for these: a **version-stamped failure/perf
observation** beside the value. Today's static `skip:` retires into a re-tested
`crashes-engine as-of vX`.

### 6.5 Measurement modes

Value/error/self-timed signals are batchable; external timing/resource need
isolation. So the batch model carries two modes:

- **Batched-amortized** (default): value + error-state + self-timed perf. Cheap,
  frequent — *the default run barely changes.*
- **Isolated-attributed** (opt-in, sampled, rare): external wall-clock + resource.
  `N×E×samples` host runs — **never in the hot path.**

**Cost bottom line:** failure and self-timed performance ride the value recalc
nearly free (because they're native probes, §2.2); the expensive residue
(external timing, resource, crash-liveness) is bounded / sampled / slow-cadence.
The line not to cross: isolated per-formula timing in the default run.

### 6.6 Outcome & observation schema — ✅ FINALIZED 2026-06-15 (was DRAFT 2026-06-10)

Redesign of `DriverTaskResult`/`FixtureEntry`, motivated empirically: the single
`error: string` conflates four attributionally-distinct outcomes (engine-rejected /
our-driver bug / infra / crash), disambiguated downstream only by a boolean and a
regex (`benchmark.ts:390`) — the same conflation that let the gsheets wedge mislabel a
whole run as quota/auth. **Finalized 2026-06-15 against the openness bar** (no closed
enum that forces novelty into redesign — the `PrimitiveValue`/`opaque` lesson):

```ts
type Outcome =
  // ── engine-attributable (catalogue-worthy) ──
  | { kind: "value";    grid: RichGridValue; extent: Extent; digest?: Fingerprint }
  | { kind: "rejected"; reason: string; code?: string }        // engine refused (calc-limit / declined)
  | { kind: "crashed";  channel: CrashChannel; detail?: string } // host DEATH (§4 host effect)
  | { kind: "pending";  source?: string }                      // async/external not-yet-settled (charter §3)
  // ── NOT engine-attributable (excluded from divergence) ──
  | { kind: "skipped";  cause: SkipCause; reason?: string }     // deliberately not run
  | { kind: "driver-error"; detail: string }                   // OUR bug — surfaced to us, never divergence
  | { kind: "infra";    detail: string; retryable?: boolean }  // transport / quota / auth
  // ── the openness floor: capability-never-divergence at the outcome level ──
  | { kind: "unclassified"; raw: unknown; note?: string }      // observed but unattributable → honest no-data

// OPEN tags (documented known-set + any string — novelty enters as DATA, not a union edit):
type CrashChannel = "process-death" | "host-wedge" | "timeout" | "capacity" | (string & {})
type SkipCause    = "capability" | "seed-infidelity" | "policy" | "environment-incompatible" | (string & {})

// Extensible monitored-signal record (host-effect signals accrete here, §6.4):
observed?: { asOf?: string; engineVersion?: string; durationMs?: number; [signal: string]: unknown }
```

**Load-bearing line (unchanged):** engine-attributable (`value`/`rejected`/`crashed`/
`pending`) vs not (`skipped`/`driver-error`/`infra`/`unclassified`) — this is what kills
the `benchmark.ts:390` regex classifier.

**Flexibility guarantee (the stamp bar, 2026-06-15).** The *only* closed set is the
top-level `kind` union, and it carries an explicit overflow — **`unclassified`** — so
exhaustive handlers stay safe *and* novelty has a home (degrades to honest no-data,
never force-fit). Every *growing* dimension is open: crash channels & skip causes are
open tags (documented known-set + any string); host-effect signals accrete on the
extensible `observed`; the `value` payload's rich/terminal/opaque facets ride
`RichGridValue`/`EngineExtras`/the `opaque` kind. So a new failure mode, engine quirk,
or rich type enters as data, rides an open tag, or degrades to no-data — never a
mislabel or a redesign.

**Capacity is two-faced (G4 ruling 2026-06-15):** *soft* drawdown (auto-inserted rows —
the gsheets permanent resize, §6.1) co-occurs with a successful `value`, so it rides
**`observed`** as a side-signal; only *hard* exhaustion (refusal / host death) is
`crashed{channel:"capacity"}`.

**`not-impl` splits** (unchanged): an engine-emitted `#NAME?` is a real `value` (in-cell
error, catalogued); *we* declining to run is `skipped{cause:"capability"}`.

**Folded/dropped** (unchanged): the standalone `hole` variant → `skipped{cause:
"seed-infidelity"}` (§2.1's honesty lives in the cause). `truncated` dropped — under
§5.3 no grid is ever clipped into evidence.

**Migration:** clean in-memory redesign; **back-compat lift-on-read** for persisted
fixtures (the `loadFixture` precedent); **full corpus regen deferred** until the majors
land.

## 7. Per-driver work summary

| Driver | Seed (A) | Layout (B) | Isolation (C) |
|---|---|---|---|
| Excel | ok (openpyxl; errors via `data_type='e'`, dates via `=DATE()`) | adopt `BatchLayout` + overflow tripwire | **process-death recovery** (D3): crash-detect→relaunch→bisect→signal + timeout |
| GSheets | **type-routed RAW / USER_ENTERED** (errors→USER_ENTERED sentinel, dates→`=DATE()`) | adopt; dims-from-need | **un-wedge (clear-cell) + fresh-spreadsheet re-run** (D4); fix `isFatal`; read timeout |
| Ironcalc | **typed ingest, no `str()`** | adopt | invariant test (already fresh-per-task) |
| Lattice | **typed ingest** | adopt | **verify** subprocess isolation |
| Hyperformula | ok | adopt | invariant test (passes by construction) |
| LibreOffice | ok | adopt | bound or isolate (D7) |
| Formulas | ok | adopt | invariant test (passes by construction) |
| Pycel | ok | adopt | **measured bound + observability** (D7) |

## 8. Decisions — status log (D1–D9; D2 ratified 2026-06-14, the last major gate)

| # | Decision | Options | Recommendation |
|---|---|---|---|
| **D1 — model (SETTLED 2026-06-07)** | Seed type model | scalar-type-is-declaration for the common five (number/text/bool/blank/empty); formula-seed the non-portable cluster (errors, dates/format-bearing); **no type-envelopes**; faithful literal ingest owed only to first-class Excel+gsheets (peripherals conform-or-hole, §2.1) | Chose literal-faithful (A) over formula-seed-everything (B) once §2.1 removed B's tame-the-peripherals rationale. |
| **D1′ — syntax under YAML (SETTLED: O)** | how the corpus *writes* a seed *given YAML* | (S) string conventions (leading-`=`, `'`-escape, quoting); (O) light sugar: bare scalars + greppable `{formula:}`/`{error:}` for the special few | **(O)** + a validator enforcing quote-intent. *Conditional on staying YAML; superseded if D8 moves the form factor.* **De-prioritized 2026-06-09** (frozen corpus, no authors) — sugar+validator can wait. |
| **D2 — read/spill model (RATIFIED 2026-06-14)** | how results are read back | see the **option ledger in §5.1** (O1 window+tripwire / O1′ guard band / O2 extent+budget / O3 escalation ladder) | **RATIFIED: O3 (escalation ladder) is the contract + O4 (probe-en-masse two-phase) the gsheets strategy (§5.2).** The provisional "(a) fixed window + tripwire" was rejected (window conflates I/O-bounding with extent-definition). Gated on — and **cleared by** — the test-space charter (`test-space-charter-2026-06-11.md` §8 gate-check: O3+O4 PASSES). **Greenlit 2026-06-14.** layout.ts spill pieces graduate from provisional → implement per O3/O4 in sequencing step 2 (incl. opaque-ref → isolation routing). **REVISED 2026-06-15 — see §5.3 (PROPOSED):** the O3 *escalation ladder* dissolves into a budget fork (materialize/digest) + an orthogonal isolation axis + a declared class-tag (no static screen) + an in-engine digest (no content-hash); the O3-contract/O4-strategy conclusion + §8 verdict re-checked and still hold. |
| **D3 — Excel isolation (RESOLVED 2026-06-08; BUILT + VERIFIED LIVE 2026-06-15, see §6.1–6.3)** | what Excel isolation protects | (was: per-sheet recalc vs quarantine — moot) | Silent value-contamination ① **retired** (didn't reproduce, 2 configs). Excel isolation = **process-death recovery**: crash-detect → immediate relaunch → bisect → record `crashes-engine` signal, + per-formula timeout. The open-rejection bisect provably doesn't survive a crash (`excel_driver.py:1250/1341`, ~250-task mislabeled cascade). **BUILT (`excel_driver.py` `_AppHolder`/`ExcelProcessDeath`/`_run_with_bisect`; `excel.ts` surfaces `crashed{process-death}` + a subprocess-timeout `crashed{timeout}`).** Live gate `excel-live.test.ts` (env-gated crash sentinel) PASSES: batch [real, crash, real] → crash attributed, siblings survive on the relaunched app. **Per-formula hang attribution stays coarse** (whole-batch `crashed{timeout}` at the 600s subprocess ceiling) — Excel recalc is whole-workbook, so finer hang attribution is deferred. |
| **D4 — gsheets isolation (GROUNDED 2026-06-09; BUILT + VERIFIED LIVE 2026-06-15, see §6.1–6.2)** | gsheets isolation | (was: per-task read vs bisect vs separate-spreadsheet) | The crash is a **whole-spreadsheet wedge** (`=GROUP_BY_AGGREGATE(…,-1)` → 500 on every value read *and* `deleteSheet`), so read-bisect can't dodge it. Recovery = **clear poison cell → un-wedge → re-run suspects in a fresh spreadsheet → record `crashes-engine`**; fix `isFatal` so a read-500 ≠ global abort; teardown clears-then-deletes; add read timeout. Per-spreadsheet isolation is the *recovery* boundary (rare path), not the common path. **BUILT (`gsheets.ts`: `GSheetsWedgeError` splits 5xx-wedge from 429-quota; `clearFormulaCells` un-wedge; `attributeWedge`/`runOneIsolated` re-run suspects one-at-a-time in a fresh throwaway; `AbortController` read-timeout → `crashed{timeout}`; `isFatal` no longer aborts on a wedge).** Live gate (`gsheets-live.test.ts`, opt-in) PASSES: outcomes value / `crashed{host-wedge}` / value, spreadsheet reusable after. **Known cruft:** the throwaway can't be deleted without `drive.file` scope → one orphan spreadsheet per wedge event (logged; backlog sweep). |
| **D5 — altitude (RATIFIED 2026-06-09)** | Altitude | (a) shared `BatchLayout` + ingestion/isolation clauses as a contract module; (b) point-fix the two cracked drivers | **(a) — module-first** (build the contract now, not fix-first-then-extract). Lives **inside assay** for now (assay `CLAUDE.md`: drivers stay until the audit; extraction is step 4) — designed to lift to `@cartularium/drivers` at extraction. |
| **D6 — error/date seeds (RATIFIED 2026-06-09, see §4)** | Error/date seeds | (was: formula-seed-all vs string-fallback vs disallow) | **Dates: declared via a formula-bearing grid entry `{formula:"=DATE(y,m,d)"}`** (decision B 2026-06-09 — grid seed type widens to `CellValue \| {formula}`; any input cell may be formula-seeded) — serials non-portable (1900-leap-bug / 1904-epoch / gsheets disagree); each engine resolves its own correct serial. **Errors: a real LITERAL in both first-class engines** — Excel openpyxl `data_type='e'`; gsheets `values`+`USER_ENTERED` sentinel → `userEnteredValue.errorValue` (validated live; structured `updateCells.errorValue` rejected 400, unused). Footgun-free; formula-seed (`=1/0`) is the fallback. **Error literals route to the USER_ENTERED bucket** (§4); never coerce to text (RAW = lossy). Sweep the classic-7 sentinels in the type-fidelity invariant. |
| **D7** | Heuristic chunk bounds (pycel/libreoffice) | (a) measure + add observability; (b) per-task isolation | **(a)** first (cheap, keeps amortization); (b) if contamination can't be bounded. |
| **D8 — corpus form factor (OPEN, parked)** | YAML vs a spreadsheet-native cell grammar | (a) stay YAML + O-sugar; (b) define a **cell-content grammar** (bare `3`=number, `'3`=text, `=…`=formula, `#…!`=error) for value positions — raw in a custom container, or quoted-string inside YAML | parked for its own turn. The ideal (write cells as typed) is *grammatically incompatible* with YAML on `#`/`'`/number-vs-text. **Separable**: the seeding *semantics* (D1, locked) are form-factor-independent, so a move is a pure syntax migration, not a re-litigation. Stakes raised by community-contribution ergonomics (sheets.wiki). **Has a clock: decide before the corpus grows materially — migration cost compounds per test written under YAML.** **Clock PAUSED 2026-06-09:** YAML frozen + solo maintainer ⇒ no growth/ergonomics pressure; parks indefinitely (semantics stay form-factor-independent — a future move is still a pure syntax migration). |
| **D9 — signal classes & measurement modes (§2.2, §6.4–6.5)** | what we measure + how it's batched | (a) batched-amortized default (value/error/self-timed perf) + isolated opt-in (external timing/resource); (b) everything isolated | **(a)** — native probes keep value/failure/self-timed in-band on the cheap batched path; quarantine external timing/resource to a sampled opt-in mode. Retire static `skip:` into a version-stamped `crashes-engine` observation. |

## 9. Sequencing

> **Review absorption (2026-06-15) — adversarial architecture pass before
> implementation.** Findings absorbed: **B1** the shipped comparison spine collapses
> blank/null (manufactures agreement) ⇒ reify `canonicalize`/`valueEquals` over
> `RichCellValue.kind`; *gates the first comparison-touching commit* (§8 corrected).
> **B2** the digest is aggregate-blind to *which* sentinel ⇒ force-materialize
> error-bearing results (or a per-sentinel census) — into the held Move 1 spec. **M5**
> the outcome classifier (`isFatal`/crash-detect) is unbuilt, so §6.6's *population path*
> misroutes the crash class until D4's `isFatal` fix ⇒ sequence §6.6 *with* it; the §6.3
> recovery invariant is a gate. **M1/m4** the **packing planner** is an unowned
> load-bearing component (lump-safety + spill-reach non-overlap; `validateGrid` checks
> only seed-regions) and couples to probe-first for dense lumping ⇒ build it explicitly.
> **M2** extent routing = `ROWS×COLUMNS` only; the `COUNTA`/`COUNTBLANK` census is
> D8.β-fraught ⇒ quarantined to the held digest. **M3** gsheets phase-1 probing inherits
> D4 recovery (not a safe AFL child); re-derive lump-size from the *whole-spreadsheet*
> blast radius. **M4** the correlated-corner sampling-digest is order-sensitive ⇒ valid
> only where extent agrees ∧ order canonical, else force-materialize / `crashed{timeout}`.
> **m1** gsheets tripwire can false-negative on trimmed trailing blanks ⇒ the probe is the
> *sole* extent authority on gsheets. **m2** land the `opaque` `PrimitiveValue` variant
> early (additive). **m3** keep `cohost.ts`'s opaque screen name-based (refining to
> "constant-foldable" reopens the silent-contamination hole). **m5** the type-fidelity
> invariant must *expect* `seed-infidelity` holes for unrepresentable sentinels (gsheets
> `#NULL!`), not fail. Spine confirmed sound (cost-not-truth; two orthogonal bounds; the
> mandatory automatic opaque-ref screen; the per-side deref-slice sorter).

**Corrected order (the next build):**

1. **`opaque` `PrimitiveValue` variant** (m2) — additive contract edit in
   `cell-value.ts`; unblocks rendered-rich fingerprint refs. Cheap, low-risk, first.
2. **§6.6 outcome union + the classifier fix** (M5) — land the value/rejected/crashed/
   skipped/… schema *and* fix gsheets `isFatal` + add crash/timeout detection together
   (the schema is meaningless while its population path misroutes); the §6.3 recovery
   invariant is the gate. Kills the `benchmark.ts:390` regex classifier.
3. **Rework `read-model.ts` + `cohost.ts` + the packing planner** (M1/M2/m1/m3) —
   `routeByExtent` → binary budget fork; runtime-triggered probe (gsheets = sole extent
   authority, no trim-trust); `cohost.ts` keeps the *automatic, name-based* opaque-ref→
   isolate screen and drops the lump/extent heuristics; the **new packing planner**
   validates spill-reach non-overlap and couples to probe-first for dense lumping.
4. **Isolation D3/D4** — Excel process-death recovery (fresh handle + bisect +
   `crashes-engine` + timeout); gsheets un-wedge (clear-cell + fresh-spreadsheet +
   `isFatal` + read-timeout, phase-1 probe wedge-recovery-wrapped, lump-size re-derived);
   the persistent-effect remedies (full-clear / fresh-host) land here. Invariant gates:
   type-fidelity (*expecting* sentinel holes), reuse-isolation, contamination.
   **✅ BUILT + VERIFIED LIVE 2026-06-15 (the crash/wedge recovery core):** Excel D3
   (`excel-live.test.ts`) and gsheets D4 (`gsheets-live.test.ts`) both pass the §6.3
   recovery invariant against real engines. **Deferred (coupled to dense-packing
   adoption, not yet triggered):** the persistent-effect remedies (full-clear / fresh-
   host) + the reuse-isolation invariant — the drivers are still **one-task-per-sheet**
   (each task its own sheet, deleted after), so there is **no cross-task cell/host reuse
   to contaminate** yet; these land when the packing planner is wired to reuse hosts.
   Likewise "phase-1 probe wedge-recovery-wrapped" lands when `probe.ts` is wired into
   the gsheets read hot-path (it already shares the same `GSheetsWedgeError` recovery).
5. **Comparison-touching work, gated by B1** — reify `canonicalize`/`valueEquals` over
   `RichCellValue.kind` before any divergence comparison; the digest (Move 1) and the
   fingerprint (equality doc #5, defer-but-ready) ride it; the digest force-materializes
   error-bearing / order-diverging results (B2/M4).
   **✅ B1 FIX BUILT 2026-06-15:** `format/equality.ts` (`canonicalizePrimitive`/
   `richGridsEqual` over `PrimitiveValue.kind`); `gridsEqual` routes two rich grids
   through it, so blank≠null (D8.β) + opaque-by-kind survive — the divergence spine no
   longer manufactures agreement. The B1 gate is **cleared**. **Still deferred (ride the
   equality, defer-but-ready):** the digest (Move 1, force-materialize error-bearing /
   order-diverging per B2/M4) and the result fingerprint (equality doc #5).
6. **Wire dense packing into the drivers (the amortization)** — the planner/read-model
   were built (step 3) as a contract module parallel to the drivers; this step makes the
   batch model *real* by adopting it in the hot path. **✅ EXCEL BUILT + VERIFIED LIVE
   2026-06-15:** TS computes the plan (`excel.ts` → `planPacking`, single-sourced) and
   Python executes it — **1a** region-driven placement (formula cell + read window from
   the plan, behaviour-preserving) then **1b** dense tiling (lump tasks co-tile onto
   shared sheets, `TILE_FACTOR=5` ⇒ 25 lumps/host; chunk by host SHEET count; the
   `#SPILL!`-artifact → isolate safety net; `ASSAY_EXCEL_STATS` observability). Live: 8
   tasks → 1 sheet, blocked spill recovered, D3 crash recovery preserved. **The
   reuse-isolation deferral (step 4) still holds even with tiling:** tiles are *distinct*
   cells written once and sheets are fresh-per-workbook then deleted, so there is no
   cross-task cell reuse to contaminate (the full-clear/fresh-host remedies would only be
   needed if hosts were *pooled* across tasks). **Validated against the REAL corpus
   (tiled-vs-untiled): 1855 deterministic formulas identical, ~4.5–5× fewer sheets — it
   caught + fixed the grid-bearing-lump bug (a reference-free formula carrying a blocker
   grid must not co-tile; `cohost.coHostPlacement` now takes `hasInput`).**
   **✅ GSHEETS ALSO WIRED + VERIFIED LIVE 2026-06-15:** lumps co-tile onto shared host
   sheets (per-tile reads via the per-range `spreadsheetsGetRich` refactor; chunk by host
   SHEET count, not task count — the gsheets win is *chunk count* / round-trip sequences;
   `#REF!`-artifact → isolate; D8.β probe mapped via per-task tile origin; D4 wedge
   recovery preserved). Live tiled-vs-untiled: 34/34 identical, 8.5× fewer sheets.
   **⏸ O4 probe-en-masse pre-sizing — BACKLOGGED 2026-06-15 (user call):** would measure
   extents up front so known-spilly lumps are sized/isolated before the read, cutting the
   `#SPILL!`/`#REF!` re-runs. Not urgent — the live corpus showed **0 re-runs** across
   1855 Excel formulas, so the probe-on-tripwire path is rarely hit; the safety net
   already recovers correctly when it does. Revisit if a spill-heavy corpus makes re-runs
   a measured cost. The composite-probe machinery already exists (`probe.ts`,
   unwired). **Amortization is otherwise COMPLETE for both tier-1 engines.**

**Tracked cleanup (mechanical, separate):** the C/B/E body-rename
(comparison-doc/roadmap/arch-map/value-model); the `semanticDomain` re-home (equality #4).

This is harden-Step-2 with a reviewed shape; it stays *below* Step-3 (consolidate loops /
capability / createDriver) and feeds Step-4 (extraction).
