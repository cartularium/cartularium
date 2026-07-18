import { describe, it, expect, vi, afterEach } from "vitest"
import { cleanup, render, screen, fireEvent } from "@testing-library/preact"
import { KindPicker, looksFunctionShaped } from "./KindPicker"

afterEach(() => {
  cleanup()
})

describe("looksFunctionShaped", () => {
  it("returns true for all-caps no-space strings", () => {
    expect(looksFunctionShaped("MAGICSUM")).toBe(true)
    expect(looksFunctionShaped("VLOOKUP")).toBe(true)
  })
  it("returns false for mixed-case or strings with spaces", () => {
    expect(looksFunctionShaped("Implicit Volatility")).toBe(false)
    expect(looksFunctionShaped("rounding")).toBe(false)
    expect(looksFunctionShaped("")).toBe(false)
  })
  it("returns false for single-char input", () => {
    expect(looksFunctionShaped("A")).toBe(false)
    expect(looksFunctionShaped("S")).toBe(false)
  })
})

describe("KindPicker", () => {
  it("renders the open-kind options (no function)", () => {
    render(<KindPicker selected="concept" onSelect={() => {}} />)
    expect(screen.getByText("concept")).toBeTruthy()
    expect(screen.getByText("guide")).toBeTruthy()
    expect(screen.getByText("project")).toBeTruthy()
    expect(screen.queryByText("function")).toBeNull()
  })

  it("calls onSelect(kind) when clicked", () => {
    const onSelect = vi.fn()
    render(<KindPicker selected="concept" onSelect={onSelect} />)
    fireEvent.click(screen.getByText("guide"))
    expect(onSelect).toHaveBeenCalledWith("guide")
  })

  it("shows closed-kind escape when looksFunctionShaped is true", () => {
    render(<KindPicker selected="concept" onSelect={() => {}} closedKindEscape />)
    expect(screen.getByText(/looks like a function name/i)).toBeTruthy()
  })
})
