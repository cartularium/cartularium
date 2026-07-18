import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/preact"
import { ToastsProvider } from "../components/Toast"
import { AssayRoute } from "./AssayRoute"

vi.mock("../lib/edit-shell", () => ({
  editShell: {
    getAssayContracts: vi.fn(),
    getAssayRunnerStatus: vi.fn(),
    listSubmittedCases: vi.fn(),
    getSubmittedCase: vi.fn(),
    getSubmittedCaseLatestRun: vi.fn().mockResolvedValue({
      job: null,
      resultSummary: null,
      result: null,
    }),
    createSubmittedCase: vi.fn(),
    submitSubmittedCase: vi.fn(),
    previewSubmittedCase: vi.fn(),
    acceptSubmittedCase: vi.fn(),
    rejectSubmittedCase: vi.fn(),
    getAssayPrProposal: vi.fn(),
    logout: vi.fn(),
  },
}))

function submittedCase(overrides: Record<string, unknown> = {}) {
  return {
    id: "case-1",
    draftId: "draft/Astral1119/sum-proof",
    localCaseId: "submitted/sum-proof",
    ownerId: "Astral1119",
    status: "submitted",
    caseHash: "a".repeat(64),
    inputContractVersion: 1,
    caseSchemaVersion: 2,
    requestedPlatforms: ["excel", "gsheets"],
    source: "sheets-wiki",
    canonicalCaseId: null,
    acceptedResultId: null,
    createdAt: "2026-05-16T00:00:00.000Z",
    updatedAt: "2026-05-16T00:00:00.000Z",
    submittedAt: "2026-05-16T00:00:00.000Z",
    acceptedAt: null,
    rejectedAt: null,
    errorCode: null,
    errorMessage: null,
    latestJob: {
      id: "job-1",
      state: "completed",
      requestedPlatforms: ["excel", "gsheets"],
      claimedBy: "mac-mini-runner-review",
    },
    latestResult: {
      id: "result-1",
      state: "completed",
      runnerId: "mac-mini-runner-review",
      resultR2Key: "assay-preview/results/job-1.json",
    },
    reviewReferences: {
      submittedCase: { d1Id: "case-1", r2Key: "assay/submitted-cases/case-1/case.v1.json" },
      previewJob: { d1Id: "job-1", inputR2Key: "assay-preview/inputs/job-1.json" },
      acceptedResult: null,
      caseHash: "a".repeat(64),
    },
    ...overrides,
  }
}

describe("AssayRoute", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { editShell } = await import("../lib/edit-shell")
    ;(editShell.getAssayContracts as ReturnType<typeof vi.fn>).mockResolvedValue({
      apiVersion: 1,
      platforms: { defaultReview: ["excel", "gsheets"] },
    })
    ;(editShell.getAssayRunnerStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "ok",
      jobs: { queued: 0, claimed: 0, running: 0, stale: 0, completedRecent: 3, failedRecent: 0 },
      runners: [{ runnerId: "mac-mini-runner-review", activeJobCount: 0 }],
    })
  })

  afterEach(() => cleanup())

  it("renders the submitted-case queue and selected preview result", async () => {
    const { editShell } = await import("../lib/edit-shell")
    ;(editShell.listSubmittedCases as ReturnType<typeof vi.fn>).mockResolvedValue({
      submittedCases: [submittedCase()],
    })
    ;(editShell.getSubmittedCase as ReturnType<typeof vi.fn>).mockResolvedValue({
      submittedCase: submittedCase(),
      latestJob: submittedCase().latestJob,
      latestResult: submittedCase().latestResult,
      reviewReferences: submittedCase().reviewReferences,
    })

    render(
      <ToastsProvider>
        <AssayRoute userLogin="Astral1119" />
      </ToastsProvider>,
    )

    expect(await screen.findByRole("heading", { name: "assay workbench" })).toBeInTheDocument()
    expect(screen.getByText("submitted/sum-proof")).toBeInTheDocument()
    // result R2 key lives inside the maintainer-refs <details> — still in the DOM
    expect(await screen.findByText("assay-preview/results/job-1.json")).toBeInTheDocument()
    // no preview-run payload is mocked → inspector shows the placeholder
    expect(screen.getByText(/no preview run yet/i)).toBeInTheDocument()
  })

  it("creates, submits, and queues a new v1 assay case from the form", async () => {
    const { editShell } = await import("../lib/edit-shell")
    ;(editShell.listSubmittedCases as ReturnType<typeof vi.fn>).mockResolvedValue({
      submittedCases: [],
    })
    ;(editShell.createSubmittedCase as ReturnType<typeof vi.fn>).mockResolvedValue({
      submittedCase: submittedCase({ id: "created-case", status: "draft" }),
    })
    ;(editShell.submitSubmittedCase as ReturnType<typeof vi.fn>).mockResolvedValue({
      submittedCase: submittedCase({ id: "created-case" }),
    })
    ;(editShell.previewSubmittedCase as ReturnType<typeof vi.fn>).mockResolvedValue({
      job: { id: "queued-job", state: "queued" },
    })
    ;(editShell.getSubmittedCase as ReturnType<typeof vi.fn>).mockResolvedValue({
      submittedCase: submittedCase({ id: "created-case" }),
      latestJob: { id: "queued-job", state: "queued" },
      latestResult: null,
      reviewReferences: submittedCase().reviewReferences,
    })

    render(
      <ToastsProvider>
        <AssayRoute userLogin="Astral1119" />
      </ToastsProvider>,
    )

    fireEvent.input(await screen.findByLabelText(/subject/i), { target: { value: "SUM" } })
    fireEvent.input(screen.getByLabelText(/name/i), { target: { value: "sum-four" } })
    fireEvent.input(screen.getByLabelText(/formula/i), { target: { value: "=SUM(2,2)" } })
    fireEvent.input(screen.getByLabelText(/expected/i), { target: { value: "4" } })
    fireEvent.click(screen.getByRole("button", { name: /submit \+ preview/i }))

    await waitFor(() => {
      expect(editShell.previewSubmittedCase).toHaveBeenCalledWith("created-case", { priority: 10 })
    })
    expect(editShell.createSubmittedCase).toHaveBeenCalledWith(
      expect.objectContaining({
        contractVersion: 1,
        draftId: "draft/Astral1119/assay-sum-four",
        case: expect.objectContaining({
          id: expect.stringMatching(/^submitted\/sum-four-/),
          subject: "SUM",
          name: "sum-four",
          category: "value",
          formula: "=SUM(2,2)",
          expect: 4,
        }),
      }),
    )
    expect(await screen.findByText(/queued preview job queued-job/i)).toBeInTheDocument()
  })

  it("accepts a completed case and moves to the accepted queue", async () => {
    const { editShell } = await import("../lib/edit-shell")
    const accepted = submittedCase({
      status: "accepted",
      canonicalCaseId: "SUM/sum-proof",
      acceptedResultId: "result-1",
    })
    ;(editShell.listSubmittedCases as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ submittedCases: [submittedCase()] })
      .mockResolvedValue({ submittedCases: [accepted] })
    ;(editShell.getSubmittedCase as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        submittedCase: submittedCase(),
        latestJob: submittedCase().latestJob,
        latestResult: submittedCase().latestResult,
        reviewReferences: submittedCase().reviewReferences,
      })
      .mockResolvedValue({
        submittedCase: accepted,
        latestJob: accepted.latestJob,
        latestResult: accepted.latestResult,
        reviewReferences: accepted.reviewReferences,
      })
    ;(editShell.acceptSubmittedCase as ReturnType<typeof vi.fn>).mockResolvedValue({
      submittedCase: accepted,
    })

    render(
      <ToastsProvider>
        <AssayRoute userLogin="Astral1119" />
      </ToastsProvider>,
    )

    fireEvent.input(await screen.findByLabelText(/canonical ref/i), {
      target: { value: "SUM/sum-proof" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^accept$/i }))

    await waitFor(() => {
      expect(editShell.acceptSubmittedCase).toHaveBeenCalledWith("case-1", {
        canonicalCaseId: "SUM/sum-proof",
      })
    })
    await waitFor(() => {
      expect(editShell.listSubmittedCases).toHaveBeenCalledWith("accepted")
    })
    expect(await screen.findByText(/accepted as SUM\/sum-proof/i)).toBeInTheDocument()
  })
})
