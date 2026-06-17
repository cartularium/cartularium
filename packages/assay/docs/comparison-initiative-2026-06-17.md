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

### CP1 — Floor closed. *Gate: the regen holds.*

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

### CP2 — Comparison-output contract. *Gate: the multiplicity shape designed + ratified.*

The serialized partition (uniform/forked + class structure) as it appears in the
manifest (V5) and the bridge feed. **Design-first** — it is a breaking contract with
a production consumer. Lifts the §4 quarantine premise; the `divergence→forked`
rename and the matrix rework follow from it. Most of "what remains" lives here.

### CP3 — Migrate onto the partition; retire the fossil; wire the hub. *Gate: output verdict-free end-to-end and the hub reads it.*

Re-seat `classify`/`manifest`/`catalogue-site`/`divergence-matrix` on the partition;
execute `divergence→forked`; migrate `sheets-wiki` V4→V5; generate the bridge feed
and wire `interleaf` (retire its hardcoded table). **Finish** for the initiative.

*(Open seam: CP3 may split into 3a output-rework / 3b consumer-migration —
`sheets-wiki` being production is a real gate. Decide at CP2's close.)*

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
