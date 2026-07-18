import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen, fireEvent } from "@testing-library/preact"
import { ComparisonBody } from "./ComparisonBody"
import type { AssayPreviewPlatformInspection } from "@cartularium/contracts"

afterEach(cleanup)

function platform(name: string, result: number): AssayPreviewPlatformInspection {
  return {
    platform: name,
    knownPlatform: true,
    state: "succeeded",
    verdict: "passed",
    passed: true,
    diff: null,
    result: [[result]],
    expected: [[6]],
  }
}

describe("ComparisonBody", () => {
  it("renders target select with all platforms plus 'expected'", () => {
    render(<ComparisonBody platforms={[platform("excel", 6), platform("gsheets", 6)]} />)
    const select = screen.getByLabelText("target") as HTMLSelectElement
    const options = Array.from(select.options).map((o) => o.value)
    expect(options).toContain("expected")
    expect(options).toContain("excel")
    expect(options).toContain("gsheets")
  })

  it("renders one ref checkbox per non-target platform with all checked", () => {
    render(<ComparisonBody platforms={[platform("excel", 6), platform("gsheets", 6)]} />)
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[]
    expect(checkboxes.length).toBeGreaterThan(0)
    expect(checkboxes.every((c) => c.checked)).toBe(true)
  })

  it("folds matching rows into a collapsed footer when all refs match target", () => {
    render(<ComparisonBody platforms={[platform("excel", 6), platform("gsheets", 6)]} />)
    expect(screen.getByText(/1 matching cell \(collapsed\)/)).toBeTruthy()
  })

  it("changes target when select changes", () => {
    render(<ComparisonBody platforms={[platform("excel", 6), platform("gsheets", 7)]} />)
    const select = screen.getByLabelText("target") as HTMLSelectElement
    fireEvent.change(select, { target: { value: "excel" } })
    // refs are now gsheets only → 7 vs 6 → diverge
    expect(screen.getAllByText(/diverge|matches-none|matches-some/).length).toBeGreaterThan(0)
  })
})
