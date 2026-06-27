// Fork-annotation coverage — a derived read over the published manifest × the annotation store
// (annotation-store-design-2026-06-20.md §6, CP3 increment #3, 3d).
//
// The store keeps no observation of its own: coverage is computed on demand by joining the
// authored, attributed annotations to the OBSERVED forks in the published manifest. This is the
// pure join (no I/O); a consumer supplies the manifest + the annotations it wants to consider
// (typically the `published` ones). It lives in contracts because every consumer reaches it from
// here — the assay CLI today, and the sheets-wiki renderer / an edit-shell endpoint later (neither
// can depend on assay) — so there is one implementation, not duplicates.
//
// Each scoped case-ref is classified against the manifest:
//   - live-fork  — the ref still forks (its partition has >1 agreement class): the annotation
//                  covers a real, current fork.
//   - converged  — the ref still exists but no longer forks (now uniform).
//   - dangling   — the ref no longer resolves to any case (renamed / deleted). [R3]
// And the inverse: forked case-refs with no covering annotation are contribution prompts.
//
// `predicate` scope clauses are NOT resolved here — tag predicates need the published manifest
// tags (3e) and the observed-dimension predicates need the deferred fork-property matcher. They
// are counted (`unresolvedPredicateClauses`) so a predicate-scoped annotation is never silently
// reported as covering nothing. Today's migrated DVs are all `ref-set`, so the real data resolves
// fully. Vocabulary stays neutral (no resolved/defect framing) per the no-verdict principle.

import type { ManifestV5 } from "./index.js"
import type { AnnotationScope, AssayForkAnnotationV1 } from "./assay-fork-annotation.js"

export interface AnnotationCoverage {
  id: string
  liveFork: string[]
  converged: string[]
  dangling: string[]
  unresolvedPredicateClauses: number
  /** True iff at least one scoped ref currently forks. False with resolved refs present means the
   * annotation covers no live fork (all converged / dangling) — a "look at me" candidate, kept
   * descriptive. False with no resolved refs means only unresolved predicate clauses. */
  coversLiveFork: boolean
}

export interface ForkCoverageReport {
  totals: {
    /** forked case-refs in the manifest (partition has >1 class) */
    forks: number
    /** forked refs covered by at least one annotation's live-fork ref */
    coveredForks: number
    /** forked refs with no covering annotation — contribution prompts */
    uncoveredForks: number
    annotations: number
    /** annotations that resolved ≥1 ref but cover no live fork (all converged / dangling) */
    annotationsWithoutLiveFork: number
  }
  annotations: AnnotationCoverage[]
  /** the uncovered forked case-refs, sorted — the contribution-prompt work-list */
  uncoveredForks: string[]
}

// the case-refs that currently fork (partition resolves to more than one agreement class)
function forkedRefs(manifest: ManifestV5): Set<string> {
  const out = new Set<string>()
  for (const [ref, entry] of Object.entries(manifest.tests)) {
    if (entry.partition.length > 1) out.add(ref)
  }
  return out
}

// resolve a scoped ref to its canonical test key, following one alias hop (a rename leaves the old
// name behind as an alias — so an aliased rename still resolves, not dangles). Returns null only
// when the ref is neither a test nor an alias to a live test: a genuine deleted / unaliased rename.
function canonicalRef(manifest: ManifestV5, ref: string): string | null {
  if (Object.hasOwn(manifest.tests, ref)) return ref
  const alias = manifest.aliases?.[ref]
  if (alias && Object.hasOwn(manifest.tests, alias.target)) return alias.target
  return null
}

// split a scope into explicit ref-set refs and a count of unresolved predicate clauses
function resolveScope(scope: AnnotationScope): { refs: string[]; unresolvedPredicates: number } {
  const refs: string[] = []
  let unresolvedPredicates = 0
  for (const clause of scope) {
    if (clause.kind === "ref-set") refs.push(...clause.refs)
    else unresolvedPredicates++
  }
  return { refs, unresolvedPredicates }
}

export function computeForkCoverage(
  manifest: ManifestV5,
  annotations: AssayForkAnnotationV1[],
): ForkCoverageReport {
  const forks = forkedRefs(manifest)
  const coveredForks = new Set<string>()
  const annotationCoverage: AnnotationCoverage[] = []
  let annotationsWithoutLiveFork = 0

  for (const ann of annotations) {
    const { refs, unresolvedPredicates } = resolveScope(ann.scope)
    const liveFork: string[] = []
    const converged: string[] = []
    const dangling: string[] = []
    // de-dup within an annotation: a clause list can name a ref more than once. We record the
    // AUTHORED ref in each bucket (what the contributor wrote, so the report is actionable) but key
    // coveredForks by the CANONICAL ref so the set-arithmetic against the manifest's forks lines up.
    for (const ref of new Set(refs)) {
      const canonical = canonicalRef(manifest, ref)
      if (canonical === null) dangling.push(ref)
      else if (forks.has(canonical)) {
        liveFork.push(ref)
        coveredForks.add(canonical)
      } else converged.push(ref)
    }
    const hasResolvedRefs = liveFork.length + converged.length + dangling.length > 0
    const coversLiveFork = liveFork.length > 0
    if (hasResolvedRefs && !coversLiveFork) annotationsWithoutLiveFork++
    annotationCoverage.push({
      id: ann.id,
      liveFork,
      converged,
      dangling,
      unresolvedPredicateClauses: unresolvedPredicates,
      coversLiveFork,
    })
  }

  const uncoveredForks = [...forks].filter((ref) => !coveredForks.has(ref)).sort()

  return {
    totals: {
      forks: forks.size,
      coveredForks: coveredForks.size,
      uncoveredForks: uncoveredForks.length,
      annotations: annotations.length,
      annotationsWithoutLiveFork,
    },
    annotations: annotationCoverage,
    uncoveredForks,
  }
}
