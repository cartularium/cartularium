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
// AUTHOR-DECLARED `predicate` clauses (tags / subjectIn) resolve here (3e): the predicate
// auto-covers every forked case-ref whose published manifest tags + subject satisfy it. OBSERVED-
// dimension predicates (`enginesAlone`/`valueKind`/`sentinel`) still need the deferred fork-property
// matcher, so a predicate that names any observed dimension stays counted (`unresolvedPredicate-
// Clauses`) — never silently reported as covering nothing. Today's migrated DVs are all `ref-set`,
// so the real data resolves fully either way. Vocabulary stays neutral (no resolved/defect framing)
// per the no-verdict principle.

import type { ManifestV5, ManifestV5TestEntry } from "./index.js"
import type { AssayForkAnnotationV1, ForkPredicate } from "./assay-fork-annotation.js"

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

// A predicate is resolvable from the published manifest alone (3e) iff it constrains on at least
// one AUTHOR-DECLARED dimension (tags / subjectIn) and NO observed dimension. An observed dimension
// (`enginesAlone`/`valueKind`/`sentinel`) needs the deferred fork-property matcher; an empty
// predicate has no basis to resolve. Both stay counted-unresolved.
function predicateResolvable(q: ForkPredicate): boolean {
  const hasObserved = q.enginesAlone !== undefined || q.valueKind !== undefined || q.sentinel !== undefined
  const hasAuthorDeclared = (q.tags?.length ?? 0) > 0 || (q.subjectIn?.length ?? 0) > 0
  return hasAuthorDeclared && !hasObserved
}

// Does a forked test entry satisfy the predicate's author-declared dimensions? A clause's fields
// are a CONJUNCTION (all must hold); within `tags`, every listed tag must be present (a narrowing
// "has these properties"); `subjectIn` is set-membership on the case's subject.
function entryMatchesPredicate(entry: ManifestV5TestEntry, q: ForkPredicate): boolean {
  if (q.tags && !q.tags.every((t) => (entry.tags ?? []).includes(t))) return false
  if (q.subjectIn && !q.subjectIn.includes(entry.subject)) return false
  return true
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
    const liveFork: string[] = []
    const converged: string[] = []
    const dangling: string[] = []
    let unresolvedPredicates = 0
    // canonical forked refs this annotation already covers — dedupes a predicate auto-cover against
    // a ref-set (and other predicates) that named the same fork.
    const liveForkCanonical = new Set<string>()

    // pass 1 — ref-set clauses. De-dup within a clause-list (a ref can appear more than once). We
    // record the AUTHORED ref in each bucket (what the contributor wrote, so the report is
    // actionable) but key coveredForks by the CANONICAL ref so the arithmetic vs the manifest lines up.
    for (const clause of ann.scope) {
      if (clause.kind !== "ref-set") continue
      for (const ref of new Set(clause.refs)) {
        const canonical = canonicalRef(manifest, ref)
        if (canonical === null) dangling.push(ref)
        else if (forks.has(canonical)) {
          liveFork.push(ref)
          liveForkCanonical.add(canonical)
          coveredForks.add(canonical)
        } else converged.push(ref)
      }
    }

    // pass 2 — predicate clauses. A resolvable author-declared predicate auto-covers every forked
    // ref matching it that a ref-set (or earlier predicate) did not already name. Run after pass 1 so
    // an explicitly authored ref takes precedence in `liveFork`. Observed-dimension predicates count.
    for (const clause of ann.scope) {
      if (clause.kind !== "predicate") continue
      if (!predicateResolvable(clause.query)) {
        unresolvedPredicates++
        continue
      }
      for (const ref of forks) {
        if (liveForkCanonical.has(ref)) continue
        if (entryMatchesPredicate(manifest.tests[ref], clause.query)) {
          liveFork.push(ref)
          liveForkCanonical.add(ref)
          coveredForks.add(ref)
        }
      }
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
