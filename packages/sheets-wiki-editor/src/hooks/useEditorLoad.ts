import { useEffect, useState } from "preact/hooks"
import { loadEditIndex } from "../lib/edit-index"
import { editShell, EditShellError, type MeResponse } from "../lib/edit-shell"
import { slugToContentPath } from "../lib/path"
import { CLOSED_KINDS, isEditIndexKind, type EditIndexEntry } from "@cartularium/contracts"

export type LoadState =
  | { kind: "loading" }
  | { kind: "missing-slug" }
  | {
      kind: "loaded"
      entry: EditIndexEntry
      path: string
      // initialContent seeds the editor (from draft branch if present, else canonical),
      // canonicalContent is the diff-gutter baseline AND the has-unsubmitted-changes ref.
      initialContent: string
      canonicalContent: string
      branch: string
      wikilinkEntries: readonly EditIndexEntry[]
    }
  | { kind: "error"; message: string }

function deriveBranch(user: MeResponse, contentPath: string): string {
  // mirror edit-shell's pathToBranchSlug so client+server agree on branch id
  const slug = contentPath.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return `draft/${user.login}/${slug}`
}

async function loadFileWithBaselines(
  path: string,
  draftBranch: string,
): Promise<{ initialContent: string; canonicalContent: string }> {
  const [canonicalResult, draftResult] = await Promise.allSettled([
    editShell.getFile(path),
    editShell.getFile(path, { fork: true, ref: draftBranch }),
  ])
  if (canonicalResult.status === "rejected") {
    const err = canonicalResult.reason
    if (!(err instanceof EditShellError && err.status === 404)) throw err
  }
  if (draftResult.status === "rejected") {
    const err = draftResult.reason
    if (!(err instanceof EditShellError && err.status === 404)) throw err
  }
  const canonicalContent =
    canonicalResult.status === "fulfilled" ? canonicalResult.value.content : ""
  const initialContent =
    draftResult.status === "fulfilled" ? draftResult.value.content : canonicalContent
  return { initialContent, canonicalContent }
}

// resolve a slug to either an existing index entry, a synthesized new-page-create entry,
// or a missing-slug signal. exported for unit testing.
export type Resolution =
  | { kind: "entry"; entry: EditIndexEntry }
  | { kind: "missing" }

export function resolveSlug(
  slug: string,
  entries: readonly EditIndexEntry[],
  findEntry: (s: string) => EditIndexEntry | undefined,
): Resolution {
  const entry =
    findEntry(slug) ?? entries.find((e) => e.slug === slug || e.slug.endsWith(`/${slug}`))
  if (entry) return { kind: "entry", entry }
  if (slug.includes("/")) {
    const slashIdx = slug.indexOf("/")
    const candidateKind = slug.slice(0, slashIdx)
    const tail = slug.slice(slashIdx + 1)
    // closed kinds (e.g. "function") and unknown kinds reject hand-typed URLs
    // that would otherwise skip locked-field enforcement
    if (!isEditIndexKind(candidateKind) || CLOSED_KINDS.has(candidateKind)) {
      return { kind: "missing" }
    }
    return { kind: "entry", entry: { slug, title: tail, kind: candidateKind } }
  }
  return { kind: "missing" }
}

export function useEditorLoad(
  slug: string,
  user: MeResponse,
  onMissingSlug: ((slug: string) => void) | undefined,
): { state: LoadState; setState: (s: LoadState) => void } {
  const [state, setState] = useState<LoadState>({ kind: "loading" })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const idx = await loadEditIndex()
        const res = resolveSlug(slug, idx.entries, (s) => idx.findEntry(s))
        if (res.kind === "missing") {
          if (cancelled) return
          if (onMissingSlug) onMissingSlug(slug)
          else setState({ kind: "missing-slug" })
          return
        }
        const { entry } = res
        const path = slugToContentPath(entry)
        const branch = deriveBranch(user, path)
        const { initialContent, canonicalContent } = await loadFileWithBaselines(path, branch)
        if (cancelled) return
        setState({
          kind: "loaded",
          entry,
          path,
          initialContent,
          canonicalContent,
          branch,
          wikilinkEntries: idx.entries,
        })
      } catch (err) {
        if (cancelled) return
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        })
      }
    })()
    return () => {
      cancelled = true
    }
    // onMissingSlug intentionally excluded: an unstable callback would re-fire
    // the load on every render and spam GET /api/edit/contents
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user.login])

  return { state, setState }
}
