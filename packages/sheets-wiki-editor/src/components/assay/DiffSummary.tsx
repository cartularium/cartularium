import { addressFor, type AssayGridDiff } from "@cartularium/contracts"
import { formatCell } from "./format"

interface Props {
  diff: AssayGridDiff | null
}

export function DiffSummary({ diff }: Props) {
  if (!diff) return null
  const total = diff.differentCells + diff.extraCells + diff.missingCells

  if (total === 0) {
    return (
      <p class="diff-summary diff-summary-pass">
        <span class="diff-glyph">✓</span> matches expected ({diff.matchingCells} cells)
      </p>
    )
  }

  const shapeNote = shapesDiffer(diff)
    ? ` · shape ${diff.resultShape[0]}×${diff.resultShape[1]} vs ${diff.expectedShape[0]}×${diff.expectedShape[1]}`
    : ""

  return (
    <details class="diff-summary diff-summary-diff" open>
      <summary>
        {total} {total === 1 ? "difference" : "differences"}
        {shapeNote} · first {diff.firstDifferences.length} shown
      </summary>
      <ul class="diff-list">
        {diff.firstDifferences.map((d, i) => (
          <li key={i} class={`diff-row diff-row-${d.kind}`}>
            <span class="diff-addr">{addressFor(d.row, d.column)}</span>
            <span class="diff-pair">
              actual={formatCell(d.actual ?? null).display}
              {"  "}
              expected={formatCell(d.expected ?? null).display}
            </span>
          </li>
        ))}
      </ul>
    </details>
  )
}

function shapesDiffer(diff: AssayGridDiff): boolean {
  return (
    diff.resultShape[0] !== diff.expectedShape[0] ||
    diff.resultShape[1] !== diff.expectedShape[1]
  )
}
