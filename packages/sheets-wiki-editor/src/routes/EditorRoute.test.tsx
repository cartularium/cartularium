import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/preact"
import { EditorRoute } from "./EditorRoute"
import { editShell } from "../lib/edit-shell"
import * as editIndex from "../lib/edit-index"
import { ToastsProvider } from "../components/Toast"
import { AUTO_ATTACH_KEY_PREFIX, AUTO_ATTACH_NEW_DRAFT } from "../components/AutoAttachPrompt"

const userStub = { login: "alice", id: 1, fork_repo: "alice/cartularium" }

describe("EditorRoute", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    editIndex._resetForTests()
    localStorage.clear()
  })
  afterEach(() => cleanup())

  function setupIndex(entries: { slug: string; title: string; kind: string }[]) {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (req) => {
      const url = typeof req === "string" ? req : (req as Request).url
      if (url.endsWith("/edit-index.json")) {
        return new Response(
          JSON.stringify({ version: 1, generatedAt: "x", entries }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        )
      }
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } })
    })
  }

  it("renders the loaded file content in the editor", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    vi.spyOn(editShell, "getFile").mockResolvedValue({
      content: "# SUMIF\n\nbody.",
      sha: "abc",
      path: "content/function/SUMIF.md",
    })

    render(
      <ToastsProvider>
        <EditorRoute slug="SUMIF" user={userStub} />
      </ToastsProvider>,
    )

    await waitFor(() => {
      // CodeMirror renders into a contenteditable; the file body text shows up
      expect(document.body.textContent).toMatch(/body\./)
    })
    // LineageStrip shows the filename
    expect(screen.getByText(/SUMIF\.md/)).toBeInTheDocument()
  })

  it("shows an error state when the slug isn't in the index", async () => {
    setupIndex([])
    render(
      <ToastsProvider>
        <EditorRoute slug="MISSING" user={userStub} />
      </ToastsProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText(/can't find/i)).toBeInTheDocument()
    })
  })

  it("fires onMissingSlug when the slug isn't in the index and the callback is wired", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    const onMissingSlug = vi.fn()
    render(
      <ToastsProvider>
        <EditorRoute slug="Definitely-Not-A-Page" user={userStub} onMissingSlug={onMissingSlug} />
      </ToastsProvider>,
    )
    await waitFor(() => {
      expect(onMissingSlug).toHaveBeenCalledTimes(1)
    })
    // When the callback is wired the inline missing-slug surface should NOT
    // also render — App.tsx swaps to MissingSlugRoute instead.
    expect(screen.queryByText(/can't find/i)).toBeNull()
  })

  it("treats slugs containing '/' as new-page-create flows (no missing-slug fallback)", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    // The new page doesn't exist yet — both fork and canonical 404.
    const { EditShellError } = await import("../lib/edit-shell")
    vi.spyOn(editShell, "getFile").mockRejectedValue(
      new EditShellError(404, "not found"),
    )
    const onMissingSlug = vi.fn()
    render(
      <ToastsProvider>
        <EditorRoute
          slug="concept/Brand-New-Concept"
          user={userStub}
          onMissingSlug={onMissingSlug}
        />
      </ToastsProvider>,
    )
    // Editor mounts with empty content; LineageStrip reflects the new file.
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Brand-New-Concept\.md/)
    })
    // onMissingSlug must NOT be called — slugs with '/' bypass the lookup.
    expect(onMissingSlug).not.toHaveBeenCalled()
  })

  it("fires onMissingSlug for invalid kind in multi-slash slug", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    const onMissingSlug = vi.fn()
    render(
      <ToastsProvider>
        <EditorRoute
          slug="garbage/My-Page"
          user={userStub}
          onMissingSlug={onMissingSlug}
        />
      </ToastsProvider>,
    )
    await waitFor(() => {
      expect(onMissingSlug).toHaveBeenCalledTimes(1)
    })
    // Inline missing-slug surface should NOT also render — the App-level
    // swap handles the redirect.
    expect(screen.queryByText(/can't find/i)).toBeNull()
  })

  it("fires onMissingSlug for closed-kind slugs (function/X) typed by hand", async () => {
    // KindPicker doesn't expose "function" as a creatable kind, but a
    // hand-typed /edit/function/MAGICSUM URL must not bypass that gate.
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    const onMissingSlug = vi.fn()
    render(
      <ToastsProvider>
        <EditorRoute
          slug="function/MAGICSUM"
          user={userStub}
          onMissingSlug={onMissingSlug}
        />
      </ToastsProvider>,
    )
    await waitFor(() => {
      expect(onMissingSlug).toHaveBeenCalledTimes(1)
    })
  })

  it("falls back to inline missing-slug for invalid kind when no callback wired", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    render(
      <ToastsProvider>
        <EditorRoute slug="garbage/My-Page" user={userStub} />
      </ToastsProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText(/can't find/i)).toBeInTheDocument()
    })
  })

  it("shows the auto-attach prompt when slug is NOT in any draft and user has ≥1 drafts", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    vi.spyOn(editShell, "getFile").mockResolvedValue({
      content: "# SUMIF\n\nbody.",
      sha: "abc",
      path: "content/function/SUMIF.md",
    })
    // User has one existing draft for a different slug — prompt should show.
    vi.spyOn(editShell, "listDrafts").mockResolvedValue({
      drafts: [
        {
          branch: "draft/alice/content-function-VLOOKUP-md",
          slug: "VLOOKUP",
          commit_sha: "def",
          updated_at: new Date().toISOString(),
          files: [{ path: "content/function/VLOOKUP.md", added: 5, removed: 1 }],
          added: 5,
          removed: 1,
        },
      ],
    })

    render(
      <ToastsProvider>
        <EditorRoute slug="SUMIF" user={userStub} />
      </ToastsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText(/add to draft/i)).toBeInTheDocument()
    })
  })

  it("does NOT show the auto-attach prompt when slug is already in a draft (auto-attaches silently)", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    vi.spyOn(editShell, "getFile").mockResolvedValue({
      content: "# SUMIF",
      sha: "abc",
      path: "content/function/SUMIF.md",
    })
    vi.spyOn(editShell, "listDrafts").mockResolvedValue({
      drafts: [
        {
          branch: "draft/alice/content-function-SUMIF-md",
          slug: "SUMIF",
          commit_sha: "def",
          updated_at: new Date().toISOString(),
          files: [{ path: "content/function/SUMIF.md", added: 1, removed: 0 }],
          added: 1,
          removed: 0,
        },
      ],
    })

    render(
      <ToastsProvider>
        <EditorRoute slug="SUMIF" user={userStub} />
      </ToastsProvider>,
    )

    // Wait for drafts to resolve so the prompt has had a chance to render
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/SUMIF\.md/)
    })
    expect(screen.queryByText(/add to draft/i)).toBeNull()
  })

  it("respects a persisted 'new' decision in localStorage (no prompt)", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    vi.spyOn(editShell, "getFile").mockResolvedValue({
      content: "# SUMIF",
      sha: "abc",
      path: "content/function/SUMIF.md",
    })
    vi.spyOn(editShell, "listDrafts").mockResolvedValue({
      drafts: [
        {
          branch: "draft/alice/content-function-VLOOKUP-md",
          slug: "VLOOKUP",
          commit_sha: "def",
          updated_at: new Date().toISOString(),
          files: [{ path: "content/function/VLOOKUP.md", added: 1, removed: 0 }],
          added: 1,
          removed: 0,
        },
      ],
    })
    localStorage.setItem(`${AUTO_ATTACH_KEY_PREFIX}SUMIF`, AUTO_ATTACH_NEW_DRAFT)

    render(
      <ToastsProvider>
        <EditorRoute slug="SUMIF" user={userStub} />
      </ToastsProvider>,
    )

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/SUMIF\.md/)
    })
    expect(screen.queryByText(/add to draft/i)).toBeNull()
  })

  it("respects a persisted 'branch' decision in localStorage (silent attach, no prompt)", async () => {
    setupIndex([{ slug: "SUMIF", title: "SUMIF", kind: "function" }])
    vi.spyOn(editShell, "getFile").mockResolvedValue({
      content: "# SUMIF",
      sha: "abc",
      path: "content/function/SUMIF.md",
    })
    // Drafts list contains the branch the user previously attached SUMIF to.
    // Because the slug is NOT in any draft's files yet (autosave hasn't landed
    // a commit), discovery alone wouldn't auto-attach — the persisted decision
    // is the only signal that should drive silent attach.
    vi.spyOn(editShell, "listDrafts").mockResolvedValue({
      drafts: [
        {
          branch: "draft/alice/content-function-VLOOKUP-md",
          slug: "VLOOKUP",
          commit_sha: "def",
          updated_at: new Date().toISOString(),
          files: [{ path: "content/function/VLOOKUP.md", added: 1, removed: 0 }],
          added: 1,
          removed: 0,
        },
      ],
    })
    localStorage.setItem(
      `${AUTO_ATTACH_KEY_PREFIX}SUMIF`,
      "draft/alice/content-function-VLOOKUP-md",
    )

    render(
      <ToastsProvider>
        <EditorRoute slug="SUMIF" user={userStub} />
      </ToastsProvider>,
    )

    // Editor mounts and prompt does NOT appear — the persisted branch was
    // honored silently. (We can't directly observe the autosave branch from
    // here without prop-drilling; the absence of the prompt + presence of the
    // editor surface is the user-visible signal.)
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/SUMIF\.md/)
    })
    expect(screen.queryByText(/add to draft/i)).toBeNull()
  })
})
