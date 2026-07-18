import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete"
import type { EditorView } from "@codemirror/view"

// subset of EditIndexEntry, kept local so tests skip the contracts dep.
export interface LookupEntry {
  slug: string
  title: string
  aliases?: string[]
}

const RESULT_CAP = 20
const WIKILINK_TRIGGER = /\[\[([^\]\n]*)$/

export function wikilinkCompletionSource(
  getEntries: () => LookupEntry[],
): (ctx: CompletionContext) => CompletionResult | null {
  return (ctx) => {
    const match = ctx.matchBefore(WIKILINK_TRIGGER)
    if (!match) return null
    const query = match.text.slice(2).toLowerCase() // strip leading "[["
    const entries = getEntries()
    const results: Completion[] = []
    for (const e of entries) {
      if (results.length >= RESULT_CAP) break
      if (matches(e, query)) {
        results.push({ label: e.title, apply: makeApply(e.title) })
      }
    }
    return {
      from: match.from + 2,
      to: ctx.pos,
      options: results,
      filter: false,
    }
  }
}

// closeBrackets autopairs `[[` → `[[]]`; consume the trailing `]]` to avoid `]]]]`.
export function planWikilinkInsert(
  textAfter: string,
  title: string,
): { insert: string; consumeAfter: number } {
  const closeAlreadyThere = textAfter.startsWith("]]")
  return {
    insert: `${title}]]`,
    consumeAfter: closeAlreadyThere ? 2 : 0,
  }
}

function makeApply(title: string) {
  return (view: EditorView, _completion: Completion, from: number, to: number) => {
    const textAfter = view.state.doc.sliceString(to, to + 2)
    const { insert, consumeAfter } = planWikilinkInsert(textAfter, title)
    view.dispatch({
      changes: { from, to: to + consumeAfter, insert },
      selection: { anchor: from + insert.length },
    })
  }
}

function matches(e: LookupEntry, query: string): boolean {
  if (query === "") return true
  if (e.title.toLowerCase().includes(query)) return true
  if (e.slug.toLowerCase().includes(query)) return true
  if (e.aliases) {
    for (const a of e.aliases) {
      if (a.toLowerCase().includes(query)) return true
    }
  }
  return false
}

export function wikilinkAutocomplete(getEntries: () => LookupEntry[]) {
  return autocompletion({
    override: [wikilinkCompletionSource(getEntries)],
    activateOnTyping: true,
  })
}
