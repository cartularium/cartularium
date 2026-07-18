import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen } from "@testing-library/preact"
import { DiagnosticsList } from "./DiagnosticsList"
import type { AssayPreviewDiagnostic } from "@cartularium/contracts"

afterEach(cleanup)

const diagnostics: AssayPreviewDiagnostic[] = [
  { severity: "error", message: "formula evaluation timed out", field: "platforms.gsheets" },
  { severity: "warning", message: "subject has no recent runs", field: "subject" },
  { severity: "info", message: "candidate hash matches previous" },
]

describe("DiagnosticsList", () => {
  it("renders nothing when list is empty", () => {
    const { container } = render(<DiagnosticsList diagnostics={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it("shows counts in the summary", () => {
    render(<DiagnosticsList diagnostics={diagnostics} />)
    expect(screen.getByText(/1 error/)).toBeTruthy()
    expect(screen.getByText(/1 warning/)).toBeTruthy()
    expect(screen.getByText(/1 info/)).toBeTruthy()
  })

  it("filters by platform field path when filterPlatform is provided", () => {
    render(<DiagnosticsList diagnostics={diagnostics} filterPlatform="gsheets" />)
    expect(screen.getByText(/timed out/)).toBeTruthy()
    expect(screen.queryByText(/no recent runs/)).toBeNull()
    // field-less diagnostics still shown
    expect(screen.getByText(/candidate hash/)).toBeTruthy()
  })

  it("orders errors first, then warnings, then infos", () => {
    const { container } = render(<DiagnosticsList diagnostics={diagnostics} />)
    const items = container.querySelectorAll(".diagnostic-row")
    expect(items[0].className).toMatch(/diagnostic-row-error/)
    expect(items[1].className).toMatch(/diagnostic-row-warning/)
    expect(items[2].className).toMatch(/diagnostic-row-info/)
  })
})
