import { columnLetters, type AssayCellValue, type AssayGridValue } from "@cartularium/contracts"
import { formatCell } from "./format"

interface Props {
  grid: AssayGridValue
  // when provided, cells are annotated with diff state vs this grid.
  compareWith?: AssayGridValue
}

type DiffState = "match" | "different" | "extra" | "missing"

export function ResultGrid({ grid, compareWith }: Props) {
  const rows = Math.max(grid.length, compareWith?.length ?? 0)
  const columns = Math.max(
    grid.reduce((m, r) => Math.max(m, r.length), 0),
    compareWith?.reduce((m, r) => Math.max(m, r.length), 0) ?? 0,
  )

  // scalar: 1×1 and no diff context → render as a single styled cell
  if (rows === 1 && columns === 1 && !compareWith) {
    const value = grid[0]?.[0] ?? null
    const formatted = formatCell(value)
    return (
      <div class={`result-grid-scalar cell-${formatted.kind}`}>{formatted.display}</div>
    )
  }

  return (
    <table class="result-grid-table">
      <thead>
        <tr>
          <th class="result-grid-corner" />
          {Array.from({ length: columns }).map((_, c) => (
            <th key={c} class="result-grid-col-head">{columnLetters(c)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            <th class="result-grid-row-head">{r + 1}</th>
            {Array.from({ length: columns }).map((_, c) => {
              const actual = cellAt(grid, r, c)
              const expected = compareWith ? cellAt(compareWith, r, c) : undefined
              const state = compareWith ? diffState(actual, expected) : null
              const formatted = formatCell(actual ?? expected ?? null)
              const cls = [
                "result-cell",
                `cell-${formatted.kind}`,
                state ? `result-cell-${state}` : "",
              ].filter(Boolean).join(" ")
              return (
                <td key={c} class={cls} title={formatted.display}>
                  {state === "missing" && expected !== undefined
                    ? formatCell(expected).display
                    : formatted.display}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function cellAt(grid: AssayGridValue, row: number, column: number): AssayCellValue | undefined {
  if (row >= grid.length) return undefined
  const r = grid[row]
  if (column >= r.length) return undefined
  return r[column]
}

function diffState(
  actual: AssayCellValue | undefined,
  expected: AssayCellValue | undefined,
): DiffState {
  if (actual === undefined && expected !== undefined) return "missing"
  if (actual !== undefined && expected === undefined) return "extra"
  // shallow json equality is fine for diff annotation
  return JSON.stringify(actual) === JSON.stringify(expected) ? "match" : "different"
}

