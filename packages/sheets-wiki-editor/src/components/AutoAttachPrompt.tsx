import type { DraftSummary } from "../lib/edit-shell"

export const AUTO_ATTACH_KEY_PREFIX = "cartularium:editor:auto-attach-decision:"

/**
 * Sentinel value persisted in localStorage when the user chose to start a new
 * draft (instead of attaching to an existing one). Exported so consumers can
 * detect the "new draft" decision without comparing to a magic string literal.
 */
export const AUTO_ATTACH_NEW_DRAFT = "__NEW__"

/**
 * Discriminated union describing a previously persisted auto-attach decision
 * for a given slug. `none` = no decision recorded; `new` = user chose to start
 * a new draft; `branch` = user chose to attach to the named branch.
 */
export type AutoAttachDecision =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "branch"; branch: string }

interface Props {
  slug: string
  mostRecent: DraftSummary
  onAdd: (branch: string) => void
  onStartNew: () => void
}

export function AutoAttachPrompt({ slug, mostRecent, onAdd, onStartNew }: Props) {
  const handleAdd = () => {
    localStorage.setItem(`${AUTO_ATTACH_KEY_PREFIX}${slug}`, mostRecent.branch)
    onAdd(mostRecent.branch)
  }

  const handleNew = () => {
    localStorage.setItem(`${AUTO_ATTACH_KEY_PREFIX}${slug}`, AUTO_ATTACH_NEW_DRAFT)
    onStartNew()
  }

  return (
    <div class="auto-attach-prompt" role="region" aria-label="add to existing draft?">
      <div class="aap-text">
        you have an active draft <strong>{mostRecent.slug}</strong>
        {" "}({mostRecent.files.length} file{mostRecent.files.length === 1 ? "" : "s"}).
        add this page to it, or start a new draft?
      </div>
      <div class="aap-actions">
        <button type="button" class="aap-add" onClick={handleAdd}>
          add to draft "{mostRecent.slug}"
        </button>
        <button type="button" class="aap-new" onClick={handleNew}>
          start new draft
        </button>
      </div>
    </div>
  )
}

export function readAutoAttachDecision(slug: string): AutoAttachDecision {
  const raw = localStorage.getItem(`${AUTO_ATTACH_KEY_PREFIX}${slug}`)
  if (raw === null) return { kind: "none" }
  if (raw === AUTO_ATTACH_NEW_DRAFT) return { kind: "new" }
  return { kind: "branch", branch: raw }
}
