import type { EditIndexEntry } from "@cartularium/contracts"

// Maps an EditIndexEntry to its canonical path inside the cartularium repo.
// The wiki content lives at `packages/sheets-wiki/content/<rest>` because
// sheets-wiki is a workspace package in a pnpm monorepo.
//
// Prefer entry.path (the actual file path emitted by the wiki) over
// reconstructing from slug: Quartz slugifies spaces to hyphens, so
// `Asking Questions.md` ships with slug `blog/Asking-Questions` and a
// slug-derived path 404s. Synth entries (new-page-create) don't have a
// path yet — fall back to slug-derived: the user types a slug-shape URL,
// so the new file we create matches.
export function slugToContentPath(entry: EditIndexEntry): string {
  if (entry.path) {
    return `packages/sheets-wiki/content/${entry.path}`
  }
  const hasPrefix = entry.slug.includes("/")
  const tail = hasPrefix ? entry.slug : `${entry.kind}/${entry.slug}`
  return `packages/sheets-wiki/content/${tail}.md`
}

// Converts a free-text page name into a slug-friendly token.
// Whitespace becomes hyphens; non-alphanumeric (other than `-_/`) is dropped.
// Case is preserved — existing concept slugs (e.g. `Volatile-functions`) are
// mixed-case and the wiki treats slugs case-sensitively.
export function kebab(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9\-_/]/g, "")
}

export type EditPathInfo =
  | { slug: string }
  | { drafts: true }
  | { assay: true }
  | { landing: true }

// Parses a /edit/* URL pathname.
// - /edit/<slug>           -> { slug }
// - /edit/<slug>/preview   -> null (Phase E)
// - /edit/drafts           -> { drafts: true }
// - /edit/, /edit          -> { landing: true }
// - everything else        -> null
export function parseEditPath(pathname: string): EditPathInfo | null {
  if (!pathname.startsWith("/edit")) return null
  // Strip /edit prefix
  let rest = pathname.slice("/edit".length)
  // Strip leading slash
  if (rest.startsWith("/")) rest = rest.slice(1)
  // Strip trailing slash
  if (rest.endsWith("/")) rest = rest.slice(0, -1)

  if (rest === "") return { landing: true }
  if (rest === "assay") return { assay: true }
  if (rest === "drafts") return { drafts: true }
  // /edit/<slug>/preview -> reject (Phase E)
  if (rest.endsWith("/preview")) return null

  return { slug: rest }
}
