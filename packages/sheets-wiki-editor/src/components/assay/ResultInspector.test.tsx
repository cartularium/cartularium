import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen, fireEvent } from "@testing-library/preact"
import { ResultInspector } from "./ResultInspector"
import type {
  AssayPreviewInspection,
  AssayPreviewResultPayload,
} from "@cartularium/contracts"

afterEach(cleanup)

function buildInspection(overrides: Partial<AssayPreviewInspection> = {}): AssayPreviewInspection {
  return {
    contractVersion: 1,
    contractSupported: true,
    jobId: "job-1",
    draftId: "draft/x",
    candidateHash: "abc",
    runnerId: "runner-1",
    startedAt: "2026-05-16T00:00:00Z",
    completedAt: "2026-05-16T00:00:01Z",
    overall: "pass",
    platforms: [
      {
        platform: "excel",
        knownPlatform: true,
        state: "succeeded",
        verdict: "passed",
        passed: true,
        diff: null,
        result: [[6]],
        expected: [[6]],
      },
    ],
    totals: {
      platforms: 1,
      passed: 1,
      failed: 0,
      errored: 0,
      skipped: 0,
      missing: 0,
      observed: 0,
    },
    diagnostics: { errors: 0, warnings: 0, infos: 0 },
    ...overrides,
  }
}

const rawPayload = { contractVersion: 1, jobId: "job-1" } as unknown as AssayPreviewResultPayload

describe("ResultInspector", () => {
  it("renders the verdict badge and per-platform tabs by default", () => {
    render(
      <ResultInspector inspection={buildInspection()} rawPayload={rawPayload} rawDiagnostics={[]} />,
    )
    expect(screen.getByText("PASS")).toBeTruthy()
    expect(screen.getByText("excel")).toBeTruthy()
  })

  it("shows the contract-mismatch state when contractSupported is false", () => {
    const inspection = buildInspection({ contractSupported: false, overall: "error" })
    render(
      <ResultInspector inspection={inspection} rawPayload={rawPayload} rawDiagnostics={[]} />,
    )
    expect(screen.getByText(/contract v1 unsupported/)).toBeTruthy()
    expect(screen.getByText(/raw payload/)).toBeTruthy()
  })

  it("disables the comparison toggle when fewer than 2 platforms have payload", () => {
    render(
      <ResultInspector inspection={buildInspection()} rawPayload={rawPayload} rawDiagnostics={[]} />,
    )
    const toggle = screen.queryByRole("button", { name: /comparison/i })
    if (toggle) expect(toggle.hasAttribute("disabled")).toBe(true)
  })

  it("switches to comparison view when toggle clicked (2+ platforms)", () => {
    const inspection = buildInspection({
      platforms: [
        {
          platform: "excel",
          knownPlatform: true,
          state: "succeeded",
          verdict: "passed",
          passed: true,
          diff: null,
          result: [[6]],
          expected: [[6]],
        },
        {
          platform: "gsheets",
          knownPlatform: true,
          state: "succeeded",
          verdict: "passed",
          passed: true,
          diff: null,
          result: [[6]],
          expected: [[6]],
        },
      ],
      totals: {
        platforms: 2,
        passed: 2,
        failed: 0,
        errored: 0,
        skipped: 0,
        missing: 0,
        observed: 0,
      },
    })
    render(
      <ResultInspector inspection={inspection} rawPayload={rawPayload} rawDiagnostics={[]} />,
    )
    fireEvent.click(screen.getByRole("button", { name: /comparison/i }))
    expect(screen.getByLabelText("target")).toBeTruthy()
  })
})
