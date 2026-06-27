// The fork-annotation contract (CP3 increment #3, 3a — ratified 2026-06-26).
//
// assay records the observed WHAT — which engines forked, and each engine's capability — never
// the WHY. Cause, naming, and explanation are CONTRIBUTED and ATTRIBUTED, never vouched by assay,
// and joined to the manifest's forks OUT OF BAND by case-ref. This file is that out-of-band
// shape: one authored, attributed, scoped claim about one or more observed forks.
//
// It lives in contracts so the store (edit-shell) and the renderer (sheets-wiki) share one shape
// instead of duplicating it. See packages/assay/docs/annotation-store-design-2026-06-20.md and
// annotation-layer-design-2026-06-19.md (the principle).

import type { Cause } from "./index.js"
import type { Platform } from "./platform.js"

export const ASSAY_FORK_ANNOTATION_VERSION = 1

/** A fork-annotation's publication state — the §9 review gate (OPTION B, "light review"). This is
 * OPERATIONAL moderation only (spam / abuse / off-topic); it must NEVER become correctness-
 * vouching, or it re-breaks the no-authority-over-meaning principle. It is not authored content,
 * so it is absent from {@link AssayForkAnnotationInput} and present on the stored record. Shaped so
 * flipping to publish-on-sign later is trivial (default to `published`, drop the gate). */
export type AssayForkAnnotationStatus = "pending" | "published" | "rejected"

/** Which observed forks an annotation covers: a LIST of clauses, UNIONed — a fork is covered iff
 * ANY clause matches. Mixing kinds is allowed (a predicate that auto-covers same-shaped forks,
 * plus cherry-picked refs for the stragglers it misses). v1 is union-only; an exclusion clause
 * ("cherry-pick out") is a possible later kind — new kinds land with no schema migration. */
export type AnnotationScope = ScopeClause[]

export type ScopeClause =
  | { kind: "ref-set"; refs: string[] } // explicit case-refs (SUBJECT/name)
  | { kind: "predicate"; query: ForkPredicate }

/** A fork predicate. `tags` reads author-declared CASE properties (matcher-free, v1-shippable —
 * the tag is already on the test, so the predicate just reads it). The observed dimensions
 * (`enginesAlone`, `valueKind`, …) read the cross-engine OUTCOME and need the deferred fork-
 * property matcher. Discipline: a predicate must never become a disguised auto-cluster (the
 * retired `clusterKey`) — tags are author-declared intent, never machine-inferred from outcomes. */
export interface ForkPredicate {
  tags?: string[]
  enginesAlone?: Platform[]
  valueKind?: "error" | "number" | "text" | "blank"
  sentinel?: string
  subjectIn?: string[]
}

/** The AUTHORED surface — what a contributor writes. Carries no observed fact (`engines` /
 * `category` are derived from the manifest join at read time, never stored) and no temporal /
 * lifecycle fact (stability is observation-side). `cause` is an optional coarse facet, NOT the
 * identity — two forks can share `cause: precision` and stay two annotations. */
export interface AssayForkAnnotationInput {
  content: string
  cause?: Cause
  scope: AnnotationScope
}

/** The canonical stored + published entity: the authored input plus server-assigned identity,
 * attribution, publication status, and timestamps. `id` is sticky (migrated DVs keep their
 * `DV-####`); the old content-fingerprint (`clusterKey`) is retired. The renderer consumes only
 * `published` rows and may ignore `status`. */
export interface AssayForkAnnotationV1 extends AssayForkAnnotationInput {
  id: string
  author_id: string
  status: AssayForkAnnotationStatus
  created_at: string
  updated_at: string
}
