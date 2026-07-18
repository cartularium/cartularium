import { useCallback, useMemo, useState } from "preact/hooks"
import { Chrome } from "./Chrome"
import { ToastsProvider, ToastContainer } from "./components/Toast"
import { Palette, type PaletteCommand } from "./components/Palette"
import { type EditorHandle } from "./components/Editor"
import { useAuthState } from "./hooks/useAuthState"
import { useToasts } from "./hooks/useToasts"
import { readVimPreference } from "./editor/vim"
import { editShell } from "./lib/edit-shell"
import { deriveSlug } from "./lib/draft-display"
import { accountFromLogin } from "./lib/account"
import { parseEditPath } from "./lib/path"
import { SignIn } from "./routes/SignIn"
import { EditorRoute } from "./routes/EditorRoute"
import { LandingRoute } from "./routes/LandingRoute"
import { DraftsRoute } from "./routes/DraftsRoute"
import { AssayRoute } from "./routes/AssayRoute"
import { MissingSlugRoute } from "./routes/MissingSlugRoute"

const ANON_ACCOUNT = { handle: "anonymous", initials: "?" }

export function App() {
  return (
    <ToastsProvider>
      <AppInner />
    </ToastsProvider>
  )
}

function AppInner() {
  const auth = useAuthState()
  const [editorHandle, setEditorHandle] = useState<EditorHandle | null>(null)
  const [missingSlug, setMissingSlug] = useState<string | null>(null)
  const { pushToast } = useToasts()

  // stable identities so EditorRoute's load effect doesn't re-fire each parent render.
  const handleAuthRequired = useCallback(() => {
    window.location.assign(
      `/api/edit/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`,
    )
  }, [])
  const handleMissingSlug = useCallback((slug: string) => {
    setMissingSlug(slug)
  }, [])

  const commands = useMemo<PaletteCommand[]>(() => {
    const result: PaletteCommand[] = []

    if (editorHandle) {
      const vimOn = readVimPreference()
      result.push({
        id: "vim-toggle",
        label: vimOn ? "vim mode: off" : "vim mode: on",
        run: () => editorHandle.setVimMode(!vimOn),
      })
      result.push({
        id: "insert-image",
        label: "insert image",
        run: async () => {
          const input = document.createElement("input")
          input.type = "file"
          input.accept = "image/png,image/jpeg,image/gif,image/webp"
          input.onchange = async () => {
            const file = input.files?.[0]
            if (!file) return
            try {
              const { url } = await editShell.uploadAsset(file)
              // palette inserts append at doc end (no cursor accessor on EditorHandle yet).
              editorHandle.dispatch({
                changes: { from: editorHandle.docLength, insert: `\n\n![](${url})\n` },
              })
              editorHandle.focus()
            } catch (err) {
              pushToast({
                kind: "error",
                message: "couldn't upload image. retry.",
                detail: err instanceof Error ? err.message : undefined,
                persistent: true,
              })
            }
          }
          input.click()
        },
      })

      if (editorHandle.hasChanges) {
        result.push({
          id: "submit",
          label: "submit",
          run: () => editorHandle.openSubmit(),
        })
      }

      if (editorHandle.draftBranch) {
        const draftBranch = editorHandle.draftBranch
        const currentPath = editorHandle.filePath
        result.push({
          id: "switch-file",
          label: "switch file in this draft",
          run: async () => {
            try {
              const { files } = await editShell.listDraftFiles(draftBranch)
              if (files.length <= 1) return
              const currentIdx = files.findIndex((f) => f.path === currentPath)
              const next = files[(currentIdx + 1) % files.length]
              if (!next) return
              const slug = deriveSlug(next.path)
              if (slug) window.location.assign(`/edit/${slug}`)
            } catch (err) {
              pushToast({
                kind: "error",
                message: "couldn't list draft files.",
                detail: err instanceof Error ? err.message : undefined,
              })
            }
          },
        })
      }
    }

    result.push({
      id: "go-drafts",
      label: "go to drafts",
      run: () => {
        window.location.assign("/edit/drafts")
      },
    })
    result.push({
      id: "sign-out",
      label: "sign out",
      run: async () => {
        await editShell.logout()
        window.location.reload()
      },
    })

    return result
  }, [editorHandle, pushToast])

  if (auth.status === "loading") {
    return (
      <Chrome account={ANON_ACCOUNT} hasChanges={false}>
        <div class="editor-loading">loading…</div>
        <ToastContainer />
      </Chrome>
    )
  }

  if (auth.status === "unauth") {
    return <SignIn returnPath={window.location.pathname || "/edit/"} />
  }

  if (auth.status === "error") {
    return (
      <Chrome account={ANON_ACCOUNT} hasChanges={false}>
        <div class="editor-error">
          <p>auth check failed: {auth.error.message}</p>
        </div>
        <ToastContainer />
      </Chrome>
    )
  }

  if (missingSlug) {
    return <MissingSlugRoute slug={missingSlug} userLogin={auth.user.login} />
  }

  const path = parseEditPath(window.location.pathname)

  if (path && "landing" in path) {
    return <LandingRoute userLogin={auth.user.login} />
  }

  if (path && "drafts" in path) {
    return <DraftsRoute userLogin={auth.user.login} />
  }

  if (path && "assay" in path) {
    return <AssayRoute userLogin={auth.user.login} />
  }

  if (path && "slug" in path) {
    return (
      <>
        <EditorRoute
          slug={path.slug}
          user={auth.user}
          onAuthRequired={handleAuthRequired}
          onEditorReady={setEditorHandle}
          onMissingSlug={handleMissingSlug}
        />
        <Palette commands={commands} />
      </>
    )
  }

  return (
    <Chrome account={accountFromLogin(auth.user.login)} hasChanges={false}>
      <section class="editor-placeholder">
        <h1>edit-wiki</h1>
        <p>signed in as <code>{auth.user.login}</code>.</p>
        <p>unrecognized path: <code>{window.location.pathname}</code></p>
      </section>
      <ToastContainer />
      <Palette commands={commands} />
    </Chrome>
  )
}
