import type { EditIndexKind } from "./edit-index.js"

// Frontmatter keys that contributors cannot edit via the wiki editor.
// Locked fields are governed by adjacent systems (assay, content tooling)
// and the editor surfaces a warning at the submit gate if they change.
//
// Function pages are the only kind with locked fields in P1: title, category,
// engines, aliases, and status all derive from assay generation, not contributor
// edits. Other kinds get no locked fields until governance evolves.
export const LOCKED_FIELDS_BY_KIND: Record<EditIndexKind, readonly string[]> = {
  function: ["title", "category", "engines", "aliases", "status"],
  concept: [],
  blog: [],
  guide: [],
  people: [],
  about: [],
  project: [],
  other: [],
}

export function lockedFieldsFor(kind: EditIndexKind): readonly string[] {
  return LOCKED_FIELDS_BY_KIND[kind]
}
