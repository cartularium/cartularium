import { describe, it, expect, afterEach } from "vitest"
import { cleanup, render, screen } from "@testing-library/preact"
import { ResultGrid } from "./ResultGrid"

afterEach(cleanup)

describe("ResultGrid", () => {
  it("renders a single styled cell for scalar (1×1) grids without table chrome", () => {
    const { container } = render(<ResultGrid grid={[[42]]} />)
    expect(container.querySelector(".result-grid-scalar")).toBeTruthy()
    expect(container.querySelector("table")).toBeNull()
    expect(screen.getByText("42")).toBeTruthy()
  })

  it("renders a table with row/column headers for 2D grids", () => {
    const { container } = render(<ResultGrid grid={[[1, 2], [3, 4]]} />)
    expect(container.querySelector("table.result-grid-table")).toBeTruthy()
    // column headers A, B
    expect(screen.getByText("A")).toBeTruthy()
    expect(screen.getByText("B")).toBeTruthy()
    // row headers 1, 2 (values 1 and 2 also appear in cells, so use getAllByText)
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1)
    // verify structural row headers exist
    expect(container.querySelectorAll(".result-grid-row-head").length).toBe(2)
  })

  it("annotates differences against an expected grid", () => {
    const { container } = render(
      <ResultGrid grid={[[1, 99]]} compareWith={[[1, 2]]} />,
    )
    const cells = container.querySelectorAll("td.result-cell")
    expect(cells[0].className).toMatch(/match/)
    expect(cells[1].className).toMatch(/different/)
  })

  it("annotates missing cells (expected present, actual absent) when in diff mode", () => {
    const { container } = render(
      <ResultGrid grid={[[1]]} compareWith={[[1, 2]]} />,
    )
    const missing = container.querySelector("td.result-cell-missing")
    expect(missing).toBeTruthy()
  })

  it("renders cell errors with the error class", () => {
    const { container } = render(<ResultGrid grid={[[{ error: "#NAME?" }]]} />)
    expect(container.querySelector(".result-grid-scalar.cell-error")).toBeTruthy()
    expect(screen.getByText("#NAME?")).toBeTruthy()
  })
})
