import type { ComponentChildren } from "preact"
import { useCallback, useEffect, useMemo, useState } from "preact/hooks"
import { Chrome } from "../Chrome"
import { Editor, type EditorHandle, type InnerEditorHandle } from "../components/Editor"
import { LineageStrip } from "../components/LineageStrip"
import { StatusBar, type StatusState } from "../components/StatusBar"
import { SubmitModal } from "../components/SubmitModal"
import { AutoAttachPrompt } from "../components/AutoAttachPrompt"
import { ToastContainer } from "../components/Toast"
import { useAutosave } from "../hooks/useAutosave"
import { useToasts } from "../hooks/useToasts"
import { useEditorLoad } from "../hooks/useEditorLoad"
import { useDraftAttachment } from "../hooks/useDraftAttachment"
import { useEditorHandle } from "../hooks/useEditorHandle"
import { editShell, type DraftSummary, type MeResponse } from "../lib/edit-shell"
import { accountFromLogin } from "../lib/account"
import { parseFrontmatter, diffLockedFields } from "../lib/frontmatter"
import { lockedFieldsFor, type EditIndexEntry } from "@cartularium/contracts"

interface EditorRouteProps {
  slug: string
  user: MeResponse
  onAuthRequired?: () => void
  onEditorReady?: (h: EditorHandle | null) => void
  // fires when slug is unknown and not a kind-prefixed new-page; App swaps to
  // MissingSlugRoute. without it we render the inline missing-slug fallback.
  onMissingSlug?: (slug: string) => void
}

function statusBarState(s: string): StatusState {
  return s === "saving" || s === "saved" || s === "save-failed" ? s : "idle"
}

function StatusChrome({ login, children }: { login: string; children: ComponentChildren }) {
  return (
    <Chrome account={accountFromLogin(login)} hasChanges={false}>
      {children}
      <ToastContainer />
    </Chrome>
  )
}

export function EditorRoute({
  slug,
  user,
  onAuthRequired,
  onEditorReady,
  onMissingSlug,
}: EditorRouteProps) {
  const { state } = useEditorLoad(slug, user, onMissingSlug)

  if (state.kind === "loading") {
    return <StatusChrome login={user.login}><div class="editor-loading">loading…</div></StatusChrome>
  }
  if (state.kind === "missing-slug") {
    return (
      <StatusChrome login={user.login}>
        <div class="editor-error"><p>can't find <code>{slug}</code> in the wiki.</p></div>
      </StatusChrome>
    )
  }
  if (state.kind === "error") {
    return (
      <StatusChrome login={user.login}>
        <div class="editor-error"><p>could not load editor: {state.message}</p></div>
      </StatusChrome>
    )
  }

  return (
    <LoadedEditor
      slug={slug}
      user={user}
      entry={state.entry}
      path={state.path}
      branch={state.branch}
      initialContent={state.initialContent}
      canonicalContent={state.canonicalContent}
      wikilinkEntries={state.wikilinkEntries}
      onAuthRequired={onAuthRequired}
      onEditorReady={onEditorReady}
    />
  )
}

interface LoadedEditorProps {
  slug: string
  user: MeResponse
  entry: EditIndexEntry
  path: string
  branch: string
  initialContent: string
  canonicalContent: string
  wikilinkEntries: readonly EditIndexEntry[]
  onAuthRequired?: () => void
  onEditorReady?: (h: EditorHandle | null) => void
}

// content is seeded from initialContent (draft branch if present, else canonical),
// but hasChanges compares against canonical so submit stays enabled and the diff
// gutter shows after navigating away and back.
function LoadedEditor({
  slug,
  user,
  entry,
  path,
  branch,
  initialContent,
  canonicalContent,
  wikilinkEntries,
  onAuthRequired,
  onEditorReady,
}: LoadedEditorProps) {
  const { pushToast } = useToasts()
  const [content, setContent] = useState<string>(initialContent)
  const [innerHandle, setInnerHandle] = useState<InnerEditorHandle | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  const { drafts, attachBranch, prompt, dismissPrompt, attachToBranch } =
    useDraftAttachment(slug)

  const effectiveBranch = attachBranch ?? branch
  const { status, retry, flush } = useAutosave({ path, content, branch: effectiveBranch })

  // flush autosave so the PR opens against latest content, not the debounce-window snapshot
  const openSubmit = useCallback(() => {
    setShowSubmitModal(true)
    void flush()
  }, [flush])

  useEffect(() => {
    if (status === "auth-required") onAuthRequired?.()
  }, [status, onAuthRequired])

  const hasChanges = content !== canonicalContent

  // ⌘↵ inside the editor; CodeMirror keymap dispatches the event, route gates it
  useEffect(() => {
    function onShortcut() {
      if (showSubmitModal) return
      if (!hasChanges) return
      openSubmit()
    }
    document.addEventListener("cartularium-submit-shortcut", onShortcut)
    return () => document.removeEventListener("cartularium-submit-shortcut", onShortcut)
  }, [hasChanges, showSubmitModal, openSubmit])

  const lockedFieldChanges = useMemo(() => {
    if (!showSubmitModal) return [] as string[]
    const before = parseFrontmatter(canonicalContent)
    const after = parseFrontmatter(content)
    return diffLockedFields(before, after, lockedFieldsFor(entry.kind))
  }, [showSubmitModal, content, canonicalContent, entry.kind])

  const imageUploader = useCallback((file: File) => editShell.uploadAsset(file), [])
  const onImageError = useCallback(
    (message: string) => {
      pushToast({
        kind: "error",
        message: `couldn't upload image. ${message.toLowerCase()}.`,
        persistent: true,
      })
    },
    [pushToast],
  )

  const filename = path.split("/").pop() ?? path

  // synth-record updated_at is "" so the memo stays identity-stable across keystrokes
  const currentDraft: DraftSummary | null = useMemo(() => {
    if (!hasChanges) return null
    const branchToUse = attachBranch ?? branch
    if (drafts) {
      const byBranch = drafts.find((d) => d.branch === branchToUse)
      if (byBranch) return byBranch
    }
    return {
      branch: branchToUse,
      slug,
      commit_sha: "",
      updated_at: "",
      files: [{ path, added: 0, removed: 0 }],
      added: 0,
      removed: 0,
    }
  }, [hasChanges, drafts, attachBranch, branch, slug, path])

  useEditorHandle(
    innerHandle,
    {
      filePath: path,
      draftBranch: currentDraft?.branch ?? null,
      hasChanges,
      openSubmit,
    },
    onEditorReady,
  )

  return (
    <Chrome
      account={accountFromLogin(user.login)}
      hasChanges={hasChanges}
      onSubmitClick={openSubmit}
    >
      <div class="editor-frame">
        {prompt && (
          <AutoAttachPrompt
            slug={slug}
            mostRecent={prompt.mostRecent}
            onAdd={attachToBranch}
            onStartNew={dismissPrompt}
          />
        )}
        <LineageStrip filename={filename} modified={hasChanges} />
        <Editor
          initialContent={initialContent}
          baseContent={canonicalContent}
          wikilinkEntries={[...wikilinkEntries]}
          imageUploader={imageUploader}
          onImageError={onImageError}
          onChange={setContent}
          onReady={setInnerHandle}
        />
        <StatusBar state={statusBarState(status)} onRetry={retry} />
      </div>
      {showSubmitModal && currentDraft && (
        <SubmitModal
          draft={currentDraft}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={(result) => {
            setShowSubmitModal(false)
            pushToast({
              kind: "success",
              message: "submitted!",
              detail: `pull request #${result.number}`,
            })
            window.open(result.url, "_blank", "noopener,noreferrer")
          }}
          pushToast={pushToast}
          lockedFieldChanges={lockedFieldChanges}
        />
      )}
      <ToastContainer />
    </Chrome>
  )
}
