import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen } from "@testing-library/preact"
import { DiffSummary } from "./DiffSummary"
import type { AssayGridDiff } from "@cartularium/contracts"

afterEach(cleanup)

const matchDiff: AssayGridDiff = {
  resultShape: [1, 1],
  expectedShape: [1, 1],
  matchingCells: 1,
  differentCells: 0,
  extraCells: 0,
  missingCells: 0,
  firstDifferences: [],
}

const failDiff: AssayGridDiff = {
  resultShape: [2, 1],
  expectedShape: [2, 1],
  matchingCells: 1,
  differentCells: 1,
  extraCells: 0,
  missingCells: 0,
  firstDifferences: [
    { row: 1, column: 0, actual: { error: "#NAME?" }, expected: 6, kind: "different" },
  ],
}

describe("DiffSummary", () => {
  it("collapses to a one-liner when all cells match", () => {
    render(<DiffSummary diff={matchDiff} />)
    expect(screen.getByText(/matches expected/i)).toBeTruthy()
  })

  it("shows differences when present", () => {
    render(<DiffSummary diff={failDiff} />)
    expect(screen.getByText(/1 difference/)).toBeTruthy()
    expect(screen.getByText(/A2/)).toBeTruthy()
    expect(screen.getByText(/#NAME\?/)).toBeTruthy()
  })

  it("renders shape annotation when shapes differ", () => {
    const ragged: AssayGridDiff = { ...failDiff, expectedShape: [3, 1] }
    render(<DiffSummary diff={ragged} />)
    expect(screen.getByText(/2×1 vs 3×1/)).toBeTruthy()
  })

  it("renders nothing for empty diff (e.g. no expected)", () => {
    const { container } = render(<DiffSummary diff={null} />)
    expect(container.firstChild).toBeNull()
  })
})
