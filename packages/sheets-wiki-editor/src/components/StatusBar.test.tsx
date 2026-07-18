import { describe, it, expect, afterEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/preact"
import { StatusBar } from "./StatusBar"

describe("StatusBar", () => {
  afterEach(() => cleanup())

  it("renders empty for state 'idle'", () => {
    const { container } = render(<StatusBar state="idle" />)
    expect(container.querySelector(".status-bar")?.textContent ?? "").toBe("")
  })

  it("renders 'saving…' for state 'saving'", () => {
    render(<StatusBar state="saving" />)
    expect(screen.getByText(/saving/i)).toBeInTheDocument()
  })

  it("renders 'saved' for state 'saved'", () => {
    render(<StatusBar state="saved" />)
    expect(screen.getByText(/saved/i)).toBeInTheDocument()
  })

  it("renders 'save failed: retry' with retry button for state 'save-failed'", () => {
    let called = false
    render(<StatusBar state="save-failed" onRetry={() => (called = true)} />)
    expect(screen.getByText(/save failed/i)).toBeInTheDocument()
    const btn = screen.getByRole("button", { name: /retry/i })
    btn.click()
    expect(called).toBe(true)
  })
})
