# Community classification — authority without unmarked influence (PROPOSED 2026-07-11)

**Status: PROPOSED — from a maintainer brainstorm session (2026-07-11), for ratification.**
How classification (fork causes, attestations, and eventually case tags) should work once
contributed by a community, given cartularium's community-driven positioning. The frame below
was discussed with the maintainer; the concrete mechanisms are design, not commitments.

Read with: `terminology.md` (two-layer cut), `annotation-store-design-2026-06-20.md` (the
store; §9 Option B), `handoff-provenance-reclassify-2026-06-27.md` (the three provenance axes),
`reclassify-policy-2026-07-11.md` (the 3f pass this doc draws its worked examples from).

---

## 1. The question, and the two opposing desires

Cartularium is positioned as community-driven. But:

- **Readers want an authoritative view.** A visitor asking "why does this fork?" wants one
  answer, not a debate transcript. Every successful reference property (below) serves one.
- **Community philosophy resists privileged classes.** Some members — maintainers foremost —
  are flatly more qualified to make accurate attribution claims. Baking that into the system
  (maintainer rank, trust tiers, gated verification) is philosophically antithetical to
  community-driven, even when it is epistemically defensible.

**The maintainer's stated worry (verbatim intent):** maintainers will have more influence than
others; that influence may be *warranted*, but a structure that privileges them contradicts the
community positioning. Both desires are legitimate. The design must not pick one.

## 2. What classification already is

Four axes exist today, each with a different authority model — the design below changes none
of their layer placements:

| axis | vocabulary | who decides | authority model |
|---|---|---|---|
| fork **cause** | closed enum (18, symmetry-audited) | annotation author | attributed reading, never vouched |
| case **tags** | open vocab + hygiene denylist | test author | authored intent, gated at publish |
| **capability** | fixed observation kinds | mechanical | relation layer, no judgment |
| **verification** | `verified_by/_at` | maintainer-gated today | attributed attestation |

The standing commitment underneath: **classification is a reading, not a fact.** The partition
is observed; everything naming *why* is contributed and signed.

## 3. Rejected mechanisms (and why)

- **Voting on the right cause** — crowd-verdict. The majority classification becomes de-facto
  canon; re-breaks no-authority exactly as `agrees-with-canonical` did for engines.
- **Reputation scores** — a global authority ranking of *people* instead of engines. Same
  fossil, different substrate; compounds (SO's caste dynamics).
- **Single-slot classification** (one editable cause per fork, wiki-style) — edit wars resolve
  by moderator fiat, and moderation silently becomes correctness-vouching — the exact drift the
  §9 Option B constraint forbids.
- **Schema trust tiers** (bronze/silver/gold annotations; maintainer-rank columns) — re-smushes
  the three provenance axes into one rank. The axes stay independent; *lenses* compose them.
- **Auto-classification from outcomes** (cluster forks into causes by signature) — the retired
  `clusterKey` in a new hat. Reading-with-evidence-in-view is authoring; a rule doing it is the
  relation layer impersonating a reader. (Distinct from §5's *consistency checking*, which
  never assigns a cause — it only tests a claimed cause against the partition shape.)

## 4. Prior art

| system | where authority lives | steal | avoid |
|---|---|---|---|
| Wikipedia | displaced onto *sources* ("verifiability, not truth"); admins janitorial, never editorial | push authority out of people entirely | consensus-by-attrition; unmarked seniority cliques |
| OpenStreetMap | the **ground truth rule** — disputes settled by survey | already our charter: scope disputes are probe results | folksonomy drift into de-facto committees |
| MDN BCD / caniuse | migrated hand-claims → **test-generated data**; humans only interpret | closest domain analog: re-runnable claims end the authority question for the observed layer | their interpretive layer still bottlenecks on maintainer review |
| Wikidata | plural contradictory statements + community-editable **rank** (preferred/normal/deprecated) | plural-facts-plus-soft-pointer: one answer for readers, losers not deleted | rank fights relocate the war one level up |
| Stack Overflow | vote counts + reputation | proof readers *demand* one ranked answer | everything else |
| IETF/IANA | rough consensus + per-registry policy tiers (FCFS → expert review → standards action) | graduated vocabulary governance = our tag→enum pipeline | process weight (we are one maintainer) |
| Community Notes | **bridging-based ranking** — surfaced when usually-disagreeing raters agree; authority from cross-perspective agreement, not volume/identity | the one novel third seat of the last decade; keep the schema from foreclosing it | needs rater scale we won't have for years |

Cross-cutting lesson: every durable project keeps *some* named human backstop; the ones that
pretended otherwise got worse authority dynamics, not better. The goal is not zero maintainer
influence — it is zero **unmarked** maintainer influence.

## 5. The third seat of authority: evidence-consistency

Wikipedia and SO face people-vs-crowd because their claims have no oracle. Assay has the
territory, and its claims are re-runnable. Two consequences:

**A cause claim constrains the partition shape, and that constraint is checkable, verdict-free.**
`missing-function` implies an absence-shaped class (#NAME? / `unsupported`); `precision`
implies numerically-near value classes; `error-code` implies differing sentinels;
`format-rendering` implies circulating-equal / terminal-different. A **consistency checker**
reports *compatible / incompatible with the observed partition shape* — mechanical, symmetric,
person-blind. It never says a reading is right; it says whether the evidence could support it.

Precedent from the 3f session (run by hand, twice): the libreoffice blank-cell readings folded
into `missing-function` groups were caught exactly because *blank ≠ #NAME?* — that was
evidence-consistency checking before it had a name. Much of what readers want from "authority"
is satisfied by **consistent-with-evidence ∧ recently-probed**, with no human ranking involved.

## 6. The triad

1. **Flat store.** Plural attributed readings; plural attributed attestations; no rank column,
   no trust tier, no uniqueness constraint on (fork × cause). Maintainer rows are
   schema-identical to anyone's. `verified_by` generalizes from maintainer-gated to **open
   attestation** (any authenticated contributor, by name, snapshot-bound, cleared on edit —
   the existing invariants unchanged). Render attestors as *names, not counts* — "checked by
   @alice" is provenance; "✓ 47" is a verdict with extra steps.
2. **Contention as a derived view — and as the product.** Forks whose readings disagree are
   computable from the join, stored nowhere. Contested forks are the next contribution funnel
   (the uncovered-prompts list, which went 946 → 0, is the proven template). Genuinely
   interpretive forks *should* render plural; that honesty is a trust feature for a divergence
   catalogue.
3. **The reader's authoritative view is a named, substitutable lens.** The default render is
   "the editors' reading" — labeled on the page, defined in config (a lens: e.g. prefer
   evidence-consistent ∧ attested-by-\<names\>), and forkable: a dissenter publishes a rival
   lens over the same flat data rather than fighting for a slot. The maintainer's one
   irreducible power is choosing the default — a visible, contestable, one-line editorial act,
   exactly as legitimate as the benchmark naming its authority.

**The decoupling:** readers get one answer; the schema never knows whose it was. Maintainer
influence doesn't vanish — it moves from unmarked structure (schema fields, silent gates) into
a marked lens, which is precisely where the two-layer cut says normativity belongs.

Display priority inside the default lens (a starting policy, itself lens-content, not schema):
evidence-consistent ∧ attested → evidence-consistent → contested-shown-as-contested.

## 7. Sequencing (design now, build on demand)

Pre-traction reality: sole maintainer, no contributor flow yet. Nothing here is urgent to
*build*; what matters is that near-term work doesn't foreclose it.

1. **Now (schema discipline only):** keep the store flat — no rank/tier fields in
   `AssayForkAnnotationV1`; attestations stay per-person, snapshot-bound rows (this is already
   true, and is sufficient to leave the bridging-ranking upgrade path open).
2. **With the V5 renderer rework (#4):** the tiered "attributed-but-unreviewed" render — it
   both unblocks publish-on-sign (§9 flip A) and is the first surface where plural readings +
   the default lens become visible.
3. **When contribution flow exists:** open attestation (drop the maintainer gate on
   `/verify`, keep attribution); the contention view; the consistency checker (a pure function
   over manifest × annotation — contracts-shaped, like `computeForkCoverage`).
4. **At rater scale (years):** bridging-style surfacing, if ever needed.

## 8. Open questions

- **Default-lens governance:** who besides the maintainer can amend the default lens, and by
  what act? (Candidate: same rails as cause-enum graduation — proposal + audit, maintainer-
  paced.)
- **Case-tag contribution** (tags feed the relation layer through the R1 gate): sequence after
  annotation contention proves moderation load is tolerable, or together with it?
- **Attestation semantics:** does an attestation assert "evidence-consistent as of snapshot"
  (checkable) or "I endorse this reading" (interpretive)? Leaning: the former, so attestations
  compose with the checker instead of becoming soft votes.
- **Consistency-checker vocabulary:** which causes get shape-constraints v1? (`missing-function`,
  `error-code`, `precision`, `format-rendering` are crisp; `arg-semantics` is a catch-all that
  may stay uncheckable — and that's fine, it just renders as "not machine-screened.")
