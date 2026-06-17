# Initiative: close the floor → verdict-free comparison → the hub

**Status: SCOPED (2026-06-17).** Three checkpoints from here to finish. The
governing vocabulary is `terminology.md` (no-verdict principle; the two-layer cut;
comparison frame = **multiplicity**, not conformance). This doc is the checkpoint
scope, not the design — CP2's design lands separately.

## Why this initiative exists (the step-back finding)

The distance from cartularium's load-bearing foundation is **not evenly spread**:

- **Floor (contracts value spine + drivers): ~solid.** Ratified, clean dep
  direction (`assay→drivers→contracts`), no back-edges. Soft tail ≈ the
  legacy-scalar bridge (`lift.ts`/`legacyToOutcome`) + the deferred corpus regen.
- **Comparison model: split-brain.** The verdict-free partition
  (`partitionByAgreement`/`AgreementClass`) is built and correct but **dead at the
  output boundary** — `report.ts` doesn't serialize `classes`, and no output
  surface reads it. Every output surface (`classify.ts`/`manifest`/`catalogue-site`/
  `benchmark`/`divergence-matrix`) is still the conformance fossil (`test.expect`
  as canonical; `match|diverge` verdicts).
- **Hub: fossil already exported + bridge unbuilt.** `sheets-wiki` is
  production-critical on `ManifestV4` (incl. `TestVerdict = match|diverge`) — the
  fossil is in the published contract. `interleaf`'s `FormulaCompatibilityManifest`
  feed is *defined in contracts* but never generated/wired (≈5% built).

**Keystone:** the multiplicity **output contract** — designing what a baseline-free
comparison computes *is* designing ManifestV5 *is* defining interleaf's bridge
feed. One artifact, three payoffs. That is the bulk of "what remains."

## Checkpoints

### CP1 — Floor closed. ✅ DONE (2026-06-17). *Gate: the regen holds — MET.*

The floor is closed when something lands on it and it holds — the **regen** is that
attack (first full end-to-end run: `drivers → Outcome → RichCellValue → fixtures →
equality`). Done when:
- corpus regenerated on the ratified value/outcome model across tier-1 (excel +
  gsheets);
- the rich-cell + equality model survives the real corpus — no value-kind gap
  (`opaque`/blank/null hold, tolerance behaves), no engine-extra surprise forces a
  redesign;
- the 69 hash-orphaned cases are healed (the dropped-`semanticDomain` regression);
- `lift.ts` / `legacyToOutcome` retired or explicitly proven adequate;
- tests green + a thin comparison-equality read over the regenerated fixtures.

This is **validation of an already-ratified design**, not new design.

**✅ RESULT (2026-06-17): the floor held.** Live full-corpus regen on the ratified
value/outcome model across the 6 runnable engines; **147 tests green** throughout (no
value-model gap surfaced). excel **1955/1955**, gsheets **1950/1955**, pure engines
(hyperformula/ironcalc/pycel/formulas) refreshed — the 69 hash-orphans healed for all 6.
The attack also FOUND + FIXED a real first-class bug: the gsheets read packed ~1250 tile
ranges into one `spreadsheets.get` URL → 400 HTML at full-corpus scale; fixed by bounding
ranges/GET (commit `fix(drivers): bound spreadsheets.get ranges per request`). Even the
failure degraded honestly (`infra` outcomes, never fake values — capability≠divergence held).
**Open tail (NOT floor gaps):** lattice/libreoffice un-regenerated (no env — orphans persist,
fixtures still legacy-shape); gsheets 404 default-spreadsheet-id (used a fresh scratch sheet —
2 scratch sheets leaked, no `drive.file` delete scope); `lift.ts`/`legacyToOutcome` still live
for the 6 lifted engines (retirement deferred).

### CP2 — Comparison-output contract. *Gate: the multiplicity shape designed + ratified.*

The serialized partition (uniform/forked + class structure) as it appears in the
manifest (V5) and the bridge feed. **Design-first** — it is a breaking contract with
a production consumer. Lifts the §4 quarantine premise; the `divergence→forked`
rename and the matrix rework follow from it. Most of "what remains" lives here.

**CP2 progress (2026-06-17 — design STARTED, not ratified):**

- **The keystone cut — three axes.** The old `TestVerdict = match|diverge` conflated
  three things the philosophy separates: **relation** (which engines agree = the agreement
  class), **capability** (did the engine produce a result: value / no-data / not-implemented),
  and **oracle** (does the value satisfy an authored assertion — a lens). The multiplicity
  output contract IS the un-smushing: three explicit fields where there was one verdict.
- **Dead / rework / keep (grounded sweep).** DEAD HEART: `format/classify.ts`
  (`Verdict`/`classifyEngineResult` vs a `canonicalGrid` from `expect`) + its cascade (manifest
  `TestVerdict`, catalogue-site verdict cells/templates). REWORK: `divergence-matrix.ts`
  ("agrees-with-canonical" → class membership); 4 CLI commands (benchmark/matrix/measure/history —
  re-seat + relabel; `measure`'s verdict is a legitimate *portability* lens). KEEP: `relations.ts`
  (the partition — the core), `runner.detectDivergence`, `report.ts`, `match.ts` (equality + matcher).
  The matcher/`expect` survives as a LENS but is currently SMUGGLED into the verdict — decouple.
- **Grounding (both contracts verified on real regen data).** number / error / spill /
  capability-skip all structurally sound. `opaque` + `rich-text` kinds = **0** occurrences — but
  **corpus≠territory**, so that is NOT evidence to drop them (rendered-rich is real engine behavior;
  the corpus predates it + the headless API can't render it). blank≠null is real (24/7). `expect`
  is demonstrably NOT truth (IMAGE `expect: #NAME?` vs reality `#REF!`).
- **⏸ OPEN FORK — RESUME HERE (the test/input contract).** Where does an authored assertion live?
  An `expect` on the test — *even optional* — is a "correct" in the catalogue, which the no-verdict
  principle forbids (normativity lives at the point of use). Maintainer's instinct (more principled
  than the "optional expect" half-measure I'd proposed): **the test is pure observation; the
  assertion is an EXTERNAL, consumer-owned lens** — different consumers assert different correctness,
  so no single `expect` belongs on the test. Reconciliation floated (not decided): `expect` survives
  as **authoring sugar that compiles OUT to an external lens** at parse time (ergonomic authoring,
  pure catalogue). Decided from PRINCIPLE, not the corpus's expect-density. **Foundational — flagged
  to sleep on (2026-06-17).** Also pulls a dependency: `deriveCategory` reads `expect` today, so a
  category basis must be found if `expect` leaves the test.

### CP3 — Migrate onto the partition; retire the fossil; wire the hub. *Gate: output verdict-free end-to-end and the hub reads it.*

Re-seat `classify`/`manifest`/`catalogue-site`/`divergence-matrix` on the partition;
execute `divergence→forked`; migrate `sheets-wiki` V4→V5; generate the bridge feed
and wire `interleaf` (retire its hardcoded table). **Finish** for the initiative.

*(Open seam: CP3 may split into 3a output-rework / 3b consumer-migration. Decide at
CP2's close.)*

**`sheets-wiki` is NOT a migration gate (maintainer, 2026-06-17).** It is acceptable
to leave the website broken until the floor is solid — it was built on the unstable
foundations and will be **reworked, not preserved**. So CP3 changes the manifest/feed
contract freely (no V4→V5 back-compat obligation); the website rebuild rides on top of
the settled contract, not in lockstep with it.

## The CP1↔CP2 interlock

The floor's equality model isn't fully attacked until comparison reads through it,
so CP1's "holds" is *confirmed* by the earliest CP2 work, not fully provable alone.
CP1 = "holds under the regen + a thin comparison read." A CP2 finding that sends one
or two items back down into the value model is the floor doing its job under load —
**not** evidence that CP1 was premature.

## Definition of done (initiative)

The cross-engine comparison is verdict-free from leaf to published output, the floor
held under it, and at least one bridge consumer (`interleaf`) reads a generated feed
instead of a hardcoded table. cartularium reads its own evidence.
