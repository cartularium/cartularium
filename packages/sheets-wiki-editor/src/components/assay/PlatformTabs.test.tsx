import { describe, it, expect, vi, afterEach } from "vitest"
import { cleanup, render, screen, fireEvent } from "@testing-library/preact"
import { PlatformTabs } from "./PlatformTabs"
import type { AssayPreviewPlatformInspection } from "@cartularium/contracts"

afterEach(cleanup)

function inspection(
  platform: string,
  verdict: AssayPreviewPlatformInspection["verdict"],
  state: AssayPreviewPlatformInspection["state"] = "succeeded",
): AssayPreviewPlatformInspection {
  return {
    platform,
    knownPlatform: true,
    state,
    verdict,
    passed: verdict === "passed",
    diff: null,
  }
}

describe("PlatformTabs", () => {
  it("renders one tab per platform with verdict glyph", () => {
    const platforms = [inspection("excel", "passed"), inspection("gsheets", "failed")]
    render(<PlatformTabs platforms={platforms} active="excel" onChange={() => {}} />)
    expect(screen.getByText("excel")).toBeTruthy()
    expect(screen.getByText("gsheets")).toBeTruthy()
    expect(screen.getByText("✓")).toBeTruthy()
    expect(screen.getByText("✗")).toBeTruthy()
  })

  it("marks the active tab with aria-pressed", () => {
    const platforms = [inspection("excel", "passed"), inspection("gsheets", "failed")]
    render(<PlatformTabs platforms={platforms} active="gsheets" onChange={() => {}} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false")
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true")
  })

  it("calls onChange with the platform name when clicked", () => {
    const onChange = vi.fn()
    const platforms = [inspection("excel", "passed"), inspection("gsheets", "failed")]
    render(<PlatformTabs platforms={platforms} active="excel" onChange={onChange} />)
    fireEvent.click(screen.getByText("gsheets"))
    expect(onChange).toHaveBeenCalledWith("gsheets")
  })

  it("disables tabs whose verdict is missing and prevents change", () => {
    const onChange = vi.fn()
    const platforms = [
      inspection("excel", "passed"),
      inspection("libreoffice", "missing", "missing"),
    ]
    render(<PlatformTabs platforms={platforms} active="excel" onChange={onChange} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[1].hasAttribute("disabled")).toBe(true)
    fireEvent.click(buttons[1])
    expect(onChange).not.toHaveBeenCalled()
  })
})
