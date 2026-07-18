export interface Entry {
  id: string
  label: string
  children: Entry[]
}

// 2-level nested structure for chrome rail/fab templates. depth 0 → top, depth 1+ → child of last top.
// orphan deeper-depth entries (no preceding depth 0) get promoted to top
export function flatToNested(toc: Array<{ depth: number; text: string; slug: string }>): Entry[] {
  const top: Entry[] = []
  for (const e of toc) {
    if (e.depth === 0) {
      top.push({ id: e.slug, label: e.text, children: [] })
    } else if (top.length > 0) {
      top[top.length - 1].children.push({ id: e.slug, label: e.text, children: [] })
    } else {
      top.push({ id: e.slug, label: e.text, children: [] })
    }
  }
  return top
}
