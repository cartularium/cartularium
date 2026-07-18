import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/preact"
import { LandingRoute } from "./LandingRoute"
import { ToastsProvider } from "../components/Toast"

vi.mock("../lib/edit-shell", () => ({
  editShell: {
    listDrafts: vi.fn().mockResolvedValue({ drafts: [] }),
    logout: vi.fn(),
  },
}))

vi.mock("../lib/edit-index", () => ({
  loadEditIndex: vi.fn().mockResolvedValue({
    version: 1,
    generatedAt: "2026-05-03",
    entries: [
      { slug: "SUMIF", title: "SUMIF", kind: "function" },
      { slug: "concept/Volatile-functions", title: "Volatile functions", kind: "concept" },
    ],
  }),
}))

function renderLanding(userLogin = "x") {
  return render(
    <ToastsProvider>
      <LandingRoute userLogin={userLogin} />
    </ToastsProvider>,
  )
}

describe("LandingRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => {
    cleanup()
  })

  it("shows the first-time advisory when no drafts in flight", async () => {
    renderLanding("dorothea.tilney")
    await waitFor(() => {
      expect(screen.getByText(/first time here/i)).toBeTruthy()
    })
    expect(screen.queryByText(/active drafts/i)).toBeNull()
  })

  it("filters EditIndex by substring when typing", async () => {
    renderLanding()
    const input = await screen.findByLabelText("search pages")
    fireEvent.input(input, { target: { value: "SUM" } })
    await waitFor(() => {
      expect(screen.getByText("SUMIF")).toBeTruthy()
    })
  })

  it("matches substrings (non-prefix)", async () => {
    // "olatile" is a substring of "Volatile-functions" / "Volatile functions"
    // but is not a prefix of either — proves we're using includes(), not
    // startsWith() (per feedback_wikilink_substring_match memory).
    renderLanding()
    const input = await screen.findByLabelText("search pages")
    fireEvent.input(input, { target: { value: "olatile" } })
    await waitFor(() => {
      expect(screen.getByText("Volatile functions")).toBeTruthy()
    })
  })

  it("shows create-row when typed string has no exact match", async () => {
    renderLanding()
    const input = await screen.findByLabelText("search pages")
    fireEvent.input(input, { target: { value: "Brand New Page" } })
    await waitFor(() => {
      expect(screen.getByText(/create a new page named/i)).toBeTruthy()
    })
  })
})

describe("LandingRoute (returning user)", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const m = await import("../lib/edit-shell")
    ;(m.editShell.listDrafts as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      drafts: [
        {
          branch: "draft/x/round-fix",
          slug: "round-fix",
          commit_sha: "abc",
          updated_at: "2026-05-03T00:00:00Z",
          files: [{ path: "packages/sheets-wiki/content/function/SUMIF.md", added: 15, removed: 4 }],
          added: 15,
          removed: 4,
        },
      ],
    })
  })
  afterEach(() => {
    cleanup()
  })

  it("renders the active drafts ledger when drafts exist", async () => {
    renderLanding()
    await waitFor(() => {
      expect(screen.getByText(/active drafts/i)).toBeTruthy()
    })
    expect(screen.getByText("round-fix")).toBeTruthy()
  })
})
