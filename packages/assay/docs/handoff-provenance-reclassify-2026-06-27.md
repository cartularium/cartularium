# Handoff — DV provenance reclassify (2026-06-27)

> **Re-founded 2026-07-18.** This document is design history. Labels such as
> "ratified" or "charter" inside it carry no authority; governing decisions
> live in the internal decisions ledger (see
> `internal/decisions/2026-07-18-assay-refounding.md`). Where this document
> describes the no-verdict frame it remains an accurate description; where it
> conflicts with the re-founding decisions, the decisions win.

A philosophy-alignment session that re-prioritized the DV→store migration and shipped the
first piece: a **human-verification provenance axis** on fork annotations.

## Alignment (confirmed with the maintainer)

The audit/cut yardstick = the ratified end-state: **no-verdict / multiplicity / two-layer cut /
5 authoring kinds (S/I/O/R/A) / three-layer authority (territory > anatomy > corpus)**. Classify
code as **live** (relation-layer or lens-out-of-band), **fossil** (presupposes verdict / canon /
oracle / baseline), or **accidental** (neither, unreferenced). Marks: anything depending on the
*deferred* relations (stability/R2, input-fidelity) is **live-pending**, not fossil; the
`divergence-matrix` auto-seed / `DV-####` YAML / `history` / `seedCatalogue` are **intentional-
fossil** (retire at #4, when the store proves out); the 5 peripheral drivers are **dormant**
(conform-or-hole), lattice is **future** — neither is fossil; tier-1 = gsheets+excel only.

## The re-prioritization

The DVs are **all agent-generated** — fine for seeding, but a **human-authored/verified lens is
the asset** (philosophy-consistent: normativity lives in named lenses). So DV move/reclassify
jumps ahead of the deferred #4. The broad vestigiality audit is **subsumed** — the DV-YAML↔store
duplication was its main target; resolving it directly beats auditing it.

A "DV" is an **(R) relational annotation** (cause + partition) → it lives in the **store** (seeded
3c). The **(A) lenses are the `expect`s** → lens sidecar (designed, not built). "Reclassify the
DVs" is the (R) side.

## Shipped this session (commit `4d59d074`)

**Verification provenance** — `verified_by`/`verified_at` as a first-class, INDEPENDENT axis.
Before, auto-seeded and human content were both `published`, distinguishable only by a magic
`author_id` string. Three un-smushed axes now: **author_id** (authorship) · **status** (hygiene
moderation, never correctness) · **verified_by/_at** (a named human checked the claim against live
evidence and signed). Stays no-verdict: verification is ATTRIBUTED, not assay adjudicating.

- contracts `AssayForkAnnotationV1`: `verified_by`/`verified_at` (nullable); version stays 1
  (additive). The doc pins the three-axis model + the snapshot invariant.
- edit-shell: migration `0008` adds the columns (existing live rows → NULL = unverified, **no
  re-seed needed**); `POST /:id/verify` (maintainer-gated, mirrors `/review`) attests/retracts;
  `?verified=true|false` on the list GET = the human-verification backlog. **PATCH clears
  `verified_*` on any content/cause/scope edit** — an attestation is to a content SNAPSHOT.
- assay seed exporter: auto-seed stamps `verified_* = NULL`; the re-seed UPSERT preserves them
  ONLY when the claim is unchanged (the same snapshot invariant on the import path).
- Tests: contracts 53, edit-shell 123, assay 166 green; root `pnpm check` clean. Pushed.

## Sequenced plan (the rest of the reclassify)

1. **DONE — provenance reclassify** (this commit): `provisional` (unverified) vs `human-verified`
   is first-class; the 877 coverage prompts + the `?verified=false` backlog are the authorship queue.
2. **After 3e — scope reclassify (3f):** provisional ref-sets → tag/predicate scopes (needs tags
   resolvable; 3e publishes manifest `tags` + the R1 hygiene gate).
3. **After store-as-read-source — the move (#4):** re-point the ~10 `loadDvs()` read sites (site +
   manifest + matrix + history) off the in-repo YAML onto the store; retire the YAML; the
   `divergence-matrix` auto-seed / `history` / `seedCatalogue` fossils fall out. Blocked on the
   store→build delivery path (currently deferred).

## 3e — DONE (commit `6576a371`)

Publish manifest `tags` (R1 hygiene gate) + resolve author-declared predicates — lights up the
`predicate{tags}` clause 3d counted-but-couldn't-resolve.
- `ManifestV5TestEntry.tags` (threaded `TestInfo`→build-v5); a publish-time **hygiene GATE** drops
  outcome-claim tags (`divergence`/`coercion-divergence`/`excel-only`) at the relation-layer
  boundary — denylist (open vocab), re-applied every build. Live: 1867 tests, 1651 tagged, 0 leaks.
- `fork-coverage.ts`: an author-declared predicate (`tags` conjunction / `subjectIn` membership)
  auto-covers matching forked refs; observed-dimension predicates (`enginesAlone`/`valueKind`/
  `sentinel`) stay counted-unresolved (deferred fork-property matcher). Two-pass + canonical dedupe.
- contracts 57, assay 168 green.

## Open / next

- **3f reclassification** (now unblocked by 3e): the policy-driven pass converting the provisional
  ref-set DV scopes → tag/predicate scopes (auto-covering same-shaped forks), labelling tests, and
  writing annotation content. Likely workflow-automated; the 3d coverage report + the now-resolving
  tag-predicates are the inputs. This is where the agent-seeded scaffolding starts becoming
  human-authored/verified lenses at scale.
- A human-facing authoring/verification surface (turn the `?verified=false` backlog into actual
  human passes) rides the deferred "live edit-shell coverage endpoint + manifest-into-Worker delivery."
- Smaller gsheets follow-ups still parked: item 3 (37 multi-engine spot-checks); external-fetch build.
