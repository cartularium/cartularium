import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/preact"
import { ToastsProvider } from "../components/Toast"
import { DraftsRoute } from "./DraftsRoute"

vi.mock("../lib/edit-shell", () => ({
  editShell: {
    listDrafts: vi.fn(),
    logout: vi.fn(),
  },
}))

describe("DraftsRoute", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it("renders empty-state when no drafts", async () => {
    const { editShell } = await import("../lib/edit-shell")
    ;(editShell.listDrafts as ReturnType<typeof vi.fn>).mockResolvedValue({ drafts: [] })
    render(
      <ToastsProvider>
        <DraftsRoute userLogin="x" />
      </ToastsProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText(/no drafts yet/i)).toBeTruthy()
    })
  })

  it("renders a card per draft with file rows and totals", async () => {
    const { editShell } = await import("../lib/edit-shell")
    ;(editShell.listDrafts as ReturnType<typeof vi.fn>).mockResolvedValue({
      drafts: [
        {
          branch: "draft/x/round-fix",
          slug: "round-fix",
          commit_sha: "abc",
          updated_at: "2026-05-03T00:00:00Z",
          files: [
            { path: "packages/sheets-wiki/content/function/SUMIF.md", added: 15, removed: 4 },
            { path: "packages/sheets-wiki/content/function/ROUND.md", added: 12, removed: 3 },
          ],
          added: 27,
          removed: 7,
        },
      ],
    })
    render(
      <ToastsProvider>
        <DraftsRoute userLogin="x" />
      </ToastsProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText("round-fix")).toBeTruthy()
    })
    expect(screen.getByText("SUMIF")).toBeTruthy()
    expect(screen.getByText("ROUND")).toBeTruthy()
    expect(screen.getByText(/\+27/)).toBeTruthy()
    expect(screen.getByText(/−7/)).toBeTruthy()
  })
})
