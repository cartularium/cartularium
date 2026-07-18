// edit-wiki page index. emitted by sheets-wiki Quartz at build time as
// public/edit/edit-index.json; consumed by the editor SPA at load time for
// wikilink autocomplete and create-page kind gating.

export type EditIndexKind =
  | "function"
  | "concept"
  | "blog"
  | "guide"
  | "people"
  | "about"
  | "project"
  | "other"

export interface EditIndexEntry {
  // canonical slug, e.g., "function/SUMIF"
  slug: string
  // page title used for autocomplete display
  title: string
  // content kind (top-level directory under content/)
  kind: EditIndexKind
  // path of the source file relative to packages/sheets-wiki/content/.
  // present for entries the wiki emits; absent for synth entries the editor
  // builds for new-page-create. when set, the editor's read/write target
  // comes from here — slug differs from filename when Quartz slugifies
  // spaces to hyphens (e.g. "Asking Questions.md" → "blog/Asking-Questions").
  path?: string
  // optional editorial subtitle for richer autocomplete preview (P2 polish)
  dek?: string
  // alternate names that should match in autocomplete
  aliases?: string[]
  // function pages only: lifecycle status; drives autocomplete de-emphasis (P2)
  status?: "active" | "deprecated" | "hidden"
}

export interface EditIndex {
  version: number
  generatedAt: string
  entries: EditIndexEntry[]
}

// bump on incompatible schema changes; consumers fail loud on mismatch
export const EDIT_INDEX_VERSION = 1

export const SUPPORTED_EDIT_INDEX_VERSIONS: readonly number[] = [1]

export function assertSupportedEditIndexVersion(
  idx: { version: unknown },
  source: string,
): void {
  if (typeof idx.version !== "number" || !SUPPORTED_EDIT_INDEX_VERSIONS.includes(idx.version)) {
    throw new Error(
      `unsupported edit index version ${JSON.stringify(idx.version)} from ${source}; ` +
        `expected one of [${SUPPORTED_EDIT_INDEX_VERSIONS.join(", ")}]`,
    )
  }
}

// kinds whose page set is contributor-readonly (existing pages editable;
// new pages cannot be created from the editor). function pages are derived
// from native engine primitives — new functions require engine-side data,
// not a wiki edit.
export const CLOSED_KINDS: ReadonlySet<EditIndexKind> = new Set(["function"])

// runtime kind list + type guard. keep in sync with the EditIndexKind union;
// LOCKED_FIELDS_BY_KIND coverage tests provide a secondary safety net.
export const ALL_EDIT_INDEX_KINDS: readonly EditIndexKind[] = [
  "function",
  "concept",
  "blog",
  "guide",
  "people",
  "about",
  "project",
  "other",
]

export function isEditIndexKind(s: string): s is EditIndexKind {
  return (ALL_EDIT_INDEX_KINDS as readonly string[]).includes(s)
}
