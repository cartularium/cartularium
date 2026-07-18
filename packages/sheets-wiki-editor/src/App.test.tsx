import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, waitFor, cleanup } from "@testing-library/preact"
import { App } from "./App"
import { editShell, AuthRequiredError } from "./lib/edit-shell"

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    window.history.pushState({}, "", "/")
  })
  afterEach(() => cleanup())

  it("renders sign-in surface when unauthenticated", async () => {
    vi.spyOn(editShell, "getMe").mockRejectedValueOnce(new AuthRequiredError())
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/sign in with github/i)).toBeInTheDocument()
    })
  })

  it("renders the placeholder for an unmatched authed path", async () => {
    vi.spyOn(editShell, "getMe").mockResolvedValueOnce({
      login: "alice",
      id: 1,
      fork_repo: "alice/x",
    })
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/signed in as/i)).toBeInTheDocument()
    })
  })

  it("routes authenticated users to the assay workbench", async () => {
    window.history.pushState({}, "", "/edit/assay")
    vi.spyOn(editShell, "getMe").mockResolvedValueOnce({
      login: "alice",
      id: 1,
      fork_repo: "alice/x",
    })
    vi.spyOn(editShell, "getAssayContracts").mockResolvedValueOnce({
      apiVersion: 1,
      platforms: { defaultReview: ["excel", "gsheets"] },
    })
    vi.spyOn(editShell, "getAssayRunnerStatus").mockResolvedValueOnce({
      status: "ok",
      jobs: { queued: 0, claimed: 0, running: 0, stale: 0, completedRecent: 0, failedRecent: 0 },
      runners: [],
    })
    vi.spyOn(editShell, "listSubmittedCases").mockResolvedValueOnce({ submittedCases: [] })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "assay workbench" })).toBeInTheDocument()
    })
  })
})
