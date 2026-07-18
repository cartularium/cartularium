import { useCallback, useEffect, useState } from "preact/hooks"
import { editShell, type DraftSummary } from "../lib/edit-shell"
import { deriveSlug } from "../lib/draft-display"
import { readAutoAttachDecision, AUTO_ATTACH_KEY_PREFIX } from "../components/AutoAttachPrompt"

function findDraftWithSlug(drafts: readonly DraftSummary[], slug: string): DraftSummary | null {
  for (const d of drafts) {
    for (const f of d.files) {
      if (deriveSlug(f.path) === slug) return d
    }
  }
  return null
}

function mostRecentDraft(drafts: readonly DraftSummary[]): DraftSummary {
  let best = drafts[0]!
  let bestTime = Date.parse(best.updated_at) || 0
  for (let i = 1; i < drafts.length; i++) {
    const t = Date.parse(drafts[i]!.updated_at) || 0
    if (t > bestTime) {
      best = drafts[i]!
      bestTime = t
    }
  }
  return best
}

export interface UseDraftAttachmentResult {
  drafts: DraftSummary[] | null
  attachBranch: string | null
  prompt: { mostRecent: DraftSummary } | null
  dismissPrompt: () => void
  attachToBranch: (branch: string) => void
}

// auto-attach precedence: persisted "branch" (if branch still exists) > persisted "new" >
// slug-already-in-draft discovery > prompt (if user has any drafts) > nothing
export function useDraftAttachment(slug: string): UseDraftAttachmentResult {
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null)
  const [attachBranch, setAttachBranch] = useState<string | null>(null)
  const [autoAttachShown, setAutoAttachShown] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await editShell.listDrafts()
        if (cancelled) return
        setDrafts(res.drafts)

        const decision = readAutoAttachDecision(slug)
        if (decision.kind === "branch") {
          // verify the recorded branch still exists; otherwise drop the stale
          // decision so autosave doesn't recreate a zombie branch
          if (res.drafts.some((d) => d.branch === decision.branch)) {
            setAttachBranch(decision.branch)
            return
          }
          localStorage.removeItem(`${AUTO_ATTACH_KEY_PREFIX}${slug}`)
        } else if (decision.kind === "new") {
          return
        }

        const draftWithSlug = findDraftWithSlug(res.drafts, slug)
        if (draftWithSlug) {
          setAttachBranch(draftWithSlug.branch)
          return
        }
        if (res.drafts.length > 0) setAutoAttachShown(true)
      } catch {
        // listDrafts is best-effort; on failure proceed with no-attach
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const dismissPrompt = useCallback(() => setAutoAttachShown(false), [])
  const attachToBranch = useCallback((branch: string) => {
    setAttachBranch(branch)
    setAutoAttachShown(false)
  }, [])

  const prompt =
    autoAttachShown && drafts && drafts.length > 0 && !attachBranch
      ? { mostRecent: mostRecentDraft(drafts) }
      : null

  return { drafts, attachBranch, prompt, dismissPrompt, attachToBranch }
}
