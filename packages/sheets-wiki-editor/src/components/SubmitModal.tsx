import { useEffect, useRef, useState } from "preact/hooks"
import { editShell, type DraftSummary, type SubmitDraftSuccess } from "../lib/edit-shell"
import { shortName } from "../lib/draft-display"
import type { Toast } from "../hooks/useToasts"

interface Props {
  draft: DraftSummary
  onClose: () => void
  onSuccess: (result: SubmitDraftSuccess) => void
  pushToast: (t: Omit<Toast, "id">) => void
  lockedFieldChanges: string[]
}

const FOCUSABLE = 'button:not([disabled]), input, textarea, a[href], [tabindex]:not([tabindex="-1"])'

export function SubmitModal({ draft, onClose, onSuccess, pushToast, lockedFieldChanges }: Props) {
  const [title, setTitle] = useState(defaultTitle(draft))
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [conflict, setConflict] = useState<{ prUrl: string; prNumber: number } | null>(null)
  const titleRef = useRef<HTMLInputElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  // restore focus to whatever was focused before mount
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    titleRef.current?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [])

  const handleSubmit = async () => {
    if (submitting) return
    if (!title.trim()) return
    setSubmitting(true)
    setConflict(null)
    try {
      const result = await editShell.submitDraft({
        branch: draft.branch,
        title: title.trim(),
        body: body.trim(),
      })
      if (result.ok) {
        onSuccess(result)
      } else if (result.kind === "conflict") {
        setConflict({ prUrl: result.prUrl, prNumber: result.prNumber })
      } else {
        pushToast({
          kind: "error",
          message: "couldn't submit. retry.",
          detail: result.message,
          persistent: true,
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        void handleSubmit()
      } else if (e.key === "Escape") {
        onClose()
      } else if (e.key === "Tab" && modalRef.current) {
        const nodes = modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (nodes.length === 0) return
        const first = nodes[0]!
        const last = nodes[nodes.length - 1]!
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, submitting, onClose])

  return (
    <div class="submit-scrim" onClick={onClose}>
      <div
        class="submit-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-heading"
        aria-describedby="sm-eyebrow"
        onClick={(e) => e.stopPropagation()}
      >
        <header class="sm-head">
          <div>
            <div id="sm-eyebrow" class="sm-eyebrow">draft → submitted</div>
            <h2 id="sm-heading">Submit your changes for review</h2>
          </div>
          <button class="sm-close" type="button" onClick={onClose}>esc · cancel</button>
        </header>

        <div class="sm-body">
          <section class="sm-section">
            <div class="sm-label">files in this draft <span class="scope">{draft.files.length} file{draft.files.length === 1 ? "" : "s"} · +{draft.added} / −{draft.removed}</span></div>
            <ul class="sm-files">
              {draft.files.map((f) => (
                <li key={f.path} class="sm-file">
                  <span class="sm-path">{shortName(f.path, { withExtension: true })}</span>
                  <span class="sm-stat"><span class="added">+{f.added}</span>{f.removed > 0 && <span class="removed">−{f.removed}</span>}</span>
                </li>
              ))}
            </ul>
          </section>

          <section class="sm-section">
            <label class="sm-label" for="sm-title">submission title<span class="scope">covers all selected files</span></label>
            <input id="sm-title" ref={titleRef} type="text" value={title} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} />
          </section>

          <section class="sm-section">
            <label class="sm-label" for="sm-body">description<span class="scope">optional · what you edited and why</span></label>
            <textarea id="sm-body" rows={6} value={body} onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)} />
          </section>

          {lockedFieldChanges.length > 0 && (
            <div class="sm-warn">
              <strong>locked-field warning.</strong>{" "}
              you changed{" "}
              {lockedFieldChanges.map((k, i) => (
                <span key={k}>
                  <code>{k}</code>{i < lockedFieldChanges.length - 1 ? ", " : ""}
                </span>
              ))}
              , which {lockedFieldChanges.length === 1 ? "is" : "are"} managed from assay. keep change anyway? reviewers may revert it.
            </div>
          )}

          {conflict && (
            <div class="sm-conflict">
              <strong>your draft conflicts with main.</strong>{" "}
              resolve via{" "}
              <a href={conflict.prUrl} target="_blank" rel="noopener noreferrer" aria-label="github web ui">
                github web ui ↗
              </a>
              , then re-submit from the editor.
            </div>
          )}
        </div>

        <footer class="sm-foot">
          <button class="sm-cancel" type="button" onClick={onClose}>save &amp; close</button>
          <button class="sm-submit" type="button" onClick={handleSubmit} disabled={submitting || !title.trim()}>
            {submitting ? "submitting…" : `submit ${draft.files.length} file${draft.files.length === 1 ? "" : "s"} ⌘↵`}
          </button>
        </footer>
      </div>
    </div>
  )
}

function defaultTitle(draft: DraftSummary): string {
  if (draft.files.length === 1) {
    const name = shortName(draft.files[0]!.path)
    return `update ${name === draft.files[0]!.path ? "page" : name}`
  }
  return `update ${draft.slug}`
}
