import { gutter, GutterMarker } from "@codemirror/view"
import {
  Compartment,
  StateEffect,
  StateField,
  type Extension,
} from "@codemirror/state"

// 1-indexed cur line numbers added/modified vs base (LCS alignment).
// LCS rather than positional compare: a positional impl false-positives every line after any insert/delete.
export function changedLineSet(base: string, current: string): Set<number> {
  const baseLines = splitLines(base)
  const curLines = splitLines(current)
  const out = new Set<number>()
  const n = baseLines.length
  const m = curLines.length
  if (m === 0) return out

  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  )
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (baseLines[i - 1] === curLines[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]! + 1
      } else {
        dp[i]![j] =
          dp[i - 1]![j]! >= dp[i]![j - 1]! ? dp[i - 1]![j]! : dp[i]![j - 1]!
      }
    }
  }

  let i = n
  let j = m
  while (j > 0) {
    if (i > 0 && baseLines[i - 1] === curLines[j - 1]) {
      i--
      j--
    } else if (i > 0 && dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      i--
    } else {
      out.add(j)
      j--
    }
  }
  return out
}

function splitLines(s: string): string[] {
  const lines = s.split("\n")
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop()
  return lines
}

export const setDiffBase = StateEffect.define<string>()

const diffBaseField = StateField.define<{ base: string; changed: Set<number> }>(
  {
    create() {
      return { base: "", changed: new Set() }
    },
    update(value, tr) {
      let next = value
      for (const e of tr.effects) {
        if (e.is(setDiffBase)) {
          next = { base: e.value, changed: changedLineSet(e.value, tr.newDoc.toString()) }
        }
      }
      if (tr.docChanged) {
        next = {
          base: next.base,
          changed: changedLineSet(next.base, tr.newDoc.toString()),
        }
      }
      return next
    },
  },
)

class ChangedMarker extends GutterMarker {
  toDOM() {
    const span = document.createElement("span")
    span.className = "cm-diff-changed"
    span.textContent = "•"
    return span
  }
}

const changedMarker = new ChangedMarker()

const diffGutter = gutter({
  class: "cm-diff-gutter",
  lineMarker(view, line) {
    const state = view.state.field(diffBaseField, false)
    if (!state) return null
    const lineNumber = view.state.doc.lineAt(line.from).number
    return state.changed.has(lineNumber) ? changedMarker : null
  },
  initialSpacer: () => changedMarker,
})

// initialDoc lets callers seed mount-time changes when the doc already differs from base.
export function diffGutterExtension(initialBase: string, initialDoc?: string): Extension {
  const compartment = new Compartment()
  const doc = initialDoc ?? initialBase
  return compartment.of([
    diffBaseField.init(() => ({
      base: initialBase,
      changed: changedLineSet(initialBase, doc),
    })),
    diffGutter,
  ])
}
