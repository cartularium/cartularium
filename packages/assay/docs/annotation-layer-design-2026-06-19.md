# The annotation layer — contributed, out-of-band, scoped (design)

**Status: RATIFIED (2026-06-19).** A design session on DV-identity that resolved into a
re-placement of the whole annotation/cause layer. It **refines CP2**
(`comparison-output-contract-2026-06-17.md`, where annotations were "load-bearing in the
manifest") and **extends the no-verdict principle** one step: from *no correct value* to
*no authority over meaning*. Grounded in an edit-shell + sheets-wiki investigation
(2026-06-19). Read `terminology.md` (the lexicon) and the CP2 contract first.

## 1. The principle (the extension)

> assay holds the observed **WHAT** (forks + capability), never the **WHY** or the
> correct. Everything interpretive — *cause, naming, explanation* — is **contributed and
> attributed**, never vouched by assay.

No-verdict said the catalogue holds no *correct value*. The DV-identity review found that
a curated divergence catalogue with causes makes assay the **authority on meaning** —
which "reads badly and is a lot of responsibility" (maintainer). So normativity *and*
interpretation both leave the relation layer. assay's job shrinks to its honest core:
surface what every engine did, partitioned.

## 2. The three layers (each does what it already does)

| layer | role | holds | vouches for |
|---|---|---|---|
| **assay** | observe | atomic per-case **forks** (ManifestV5: agreement `partition` + per-engine `capability`) — observation only | the observation |
| **edit-shell** | collect | **attributed, scoped explanations** (D1/R2, `owner_id` provenance, existing review rails; already runs the fork-observing runner) | nothing — claims are signed |
| **sheets-wiki** | render | nothing of its own — renders the join (forks + signed explanations) | nothing |

The annotation layer was the anomaly — *assay playing contributor*. Routing it to
edit-shell puts contributions where contributions already live (`/api/edit/assay-runner/*`,
the submitted-case → review → PR pipeline, `owner_id` attribution).

## 3. The annotation model

An annotation is **`(author, content/cause, scope)`** — an attributed claim, out-of-band.

- **Out-of-band.** Not a field in the manifest; joined to forks by case-ref (the oracle
  precedent, CP2 §6).
- **Attributed, not authority.** Signed by its contributor; assay vouches for nothing
  interpretive. The cause is "@alice's reading," never assay's verdict.
- **Identity = sticky id**, not a content-key. The `DV-####` always *was* the identity;
  the content-fingerprint `clusterKey(cause+engines+behaviorSignature)` was an auto-seed
  crutch and **retires**.
- **Scoped, not per-fork.** `scope` covers many forks — written once:
  - **ref-set** — "these cases" (simple, safe; new same-shaped cases don't auto-join), or
  - **predicate** — "forks where pycel is alone-in-class with `#NAME?` on subject ∈ {…}",
    evaluated lazily against the live partition (auto-covers matching forks, including ones
    added later — this doubles as the coverage-growth fix).
- **A shared explanation *is* a cluster.** What makes 200 atomic forks feel like "one
  divergence" is a shared cause — and *that grouping is interpretation*, so it lives in the
  authored layer (one scoped annotation), while the observed forks stay atomic (the
  manifest). Duplication isn't a bug to dedupe; the explanation is itself the unit.
- **The unit is the authored annotation, NOT the `cause` label.** The enum is coarse —
  an excel/gsheets float fork and a date-serial fork can both be `cause: precision` and
  remain two distinct annotations with two distinct scopes. Grouping is "what an author
  chose to scope together," never "same cause value" (that would re-smuggle the auto-seed
  content-key).

## 4. Coverage & staleness are derived reads (never write-cascades)

Computed on demand from **(live forks) × (annotations)** — never a stored list reconciled
on every corpus change:

- **un-annotated forks** → contribution prompts (the `matrix --view forks` shape view).
- **annotations whose forks have converged / match nothing** → flagged *when you look*.

"Check staleness on every change" becomes "compute the coverage view when you want it."
This is what dissolves the per-change reconciliation burden — and makes ref-vs-predicate a
contributor-ergonomics choice, not an architectural one.

## 5. Where it lives — the investigation (2026-06-19)

- **edit-shell IS the attributed-contribution rail.** Worker on D1+R2; `submit → review →
  accept → PR` with provenance (`owner_id`, timeline, `runner_id`, maintainer accept/reject).
  The volunteer runner already observes forks for contributed cases. Join key:
  `canonical_case_id` + semantic-hash. No annotation concept *yet* — but every rail exists.
- **sheets-wiki is a pure read-only renderer.** Quartz markdown; reads the manifest at
  build, injects per-function frontmatter. **No provenance** (function pages carry no
  `author`; only blog posts do). Not a store.
- **The assay repo is the wrong home** — git-committed, maintainer-reviewed YAML *is* the
  us-as-authority the principle refuses.

> Both explorers' *recommendations* (annotations in the assay repo / manifest) reflected
> the pre-2026-06-19 design and are superseded; their *facts* stand.

## 6. Migration & build implications

- **ManifestV5 → observation-only.** Drop `annotations` + `ManifestForkAnnotation` +
  fork-`cause`; `ManifestV5FunctionEntry.forks` = observed forked-case-refs only. **Keep**
  the `no-data` operational `cause` (`policy`/`infra`/`driver-error`/… — mechanical, observed,
  not interpretive). A grep for fork-`cause`/`annotation` in the manifest output is then empty.
- **`buildManifestV5` (CP3 step 4)** stops emitting `annotations` / reading `dv.cause`; its
  annotation-gating tests move to the (future) edit-shell side.
- **The 255 `DV-*.yaml`** lift to attributed provisional scoped clusters (content + scope +
  `author="auto-seeded/maintainer (provisional)"`); the cluster survives as authored scope —
  nobody re-writes 200 explanations. `links.divergence` back-refs and the in-repo
  `history`/`dv-lifecycle`/`seed-catalogue` machinery retire or become edit-shell flows.
- **sheets-wiki reworked** (10 hard V4→V5 break sites — named in the explore: 3 version
  assertions, 7 data-shape). Rides the website rework; **not a migration gate** (settled).

## 7. Open / deferred (for the build phase)

- **Scope grain default** — allow both ref-set and predicate; author picks. The predicate
  form needs a **fork-property matcher** (partition shape / engines / subject / value-kind).
- **The edit-shell annotation schema** (a D1 table, attributed) + the contribution UX —
  its own design when the edit-shell side is built. The investigation sketched
  `assay_fork_annotations(id, author_id, scope, cause, content, join-key, timestamps)`.
- **Lifecycle = the stability relation** over referenced forks (terminology §0) — neutral
  vocabulary (no "resolved"/"vanished-as-defect").
- **Sequencing** vs the manifest observation-only rework, the `divergence→forked` rename,
  the §4 quarantine sweep, and the (deferred) website rework.
