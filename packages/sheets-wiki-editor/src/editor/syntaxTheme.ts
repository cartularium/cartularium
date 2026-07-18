import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import type { Extension } from "@codemirror/state"
import { tags as t } from "@lezer/highlight"

const brandHighlightStyle = HighlightStyle.define([
  {
    tag: [
      t.heading1,
      t.heading2,
      t.heading3,
      t.heading4,
      t.heading5,
      t.heading6,
    ],
    color: "var(--ink)",
    fontWeight: "600",
  },
  { tag: t.emphasis, color: "var(--ink-2)", fontStyle: "italic" },
  { tag: t.strong, color: "var(--ink)", fontWeight: "600" },
  { tag: t.link, color: "var(--accent)" },
  { tag: t.url, color: "var(--accent-2)", fontFamily: "var(--font-mono)" },
  {
    tag: t.monospace,
    color: "var(--ink-2)",
    backgroundColor: "var(--paper-2)",
    fontFamily: "var(--font-mono)",
  },
  { tag: t.list, color: "var(--ink-3)" },
  { tag: t.quote, color: "var(--ink-3)", fontStyle: "italic" },
  { tag: t.contentSeparator, color: "var(--ink-4)" },
  { tag: t.processingInstruction, color: "var(--ink-4)" },
  { tag: t.meta, color: "var(--ink-4)" },
])

export function brandSyntaxTheme(): Extension {
  return syntaxHighlighting(brandHighlightStyle)
}
