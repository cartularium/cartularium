export type PageKind =
  | "function"
  | "concept"
  | "blog"
  | "guide"
  | "about"
  | "people"
  | "project"
  | "page"

const KINDS = ["function", "concept", "blog", "guide", "about", "people", "project"] as const

// prefer relativePath: function-page slugs are flattened (function/SUM.md → slug "SUM")
export function pageKind(file: { slug?: string; relativePath?: string }): PageKind {
  const path = file.relativePath ?? file.slug ?? ""
  // folder index pages take the editorial frame, not the parent kind's wide layout
  if (path.endsWith("_index.md") || path.endsWith("/index")) return "page"
  const seg = path.split("/")[0]
  return (KINDS as readonly string[]).includes(seg) ? (seg as PageKind) : "page"
}
