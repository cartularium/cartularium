// display helpers for DraftSummary rows.

// bare filename of a `.md` path. drops the `.md` by default; pass
// `{ withExtension: true }` for surfaces that read more file-like (e.g.
// SubmitModal). falls back to the input on non-`.md` paths.
export function shortName(path: string, opts?: { withExtension?: boolean }): string {
  const m = path.match(/([^/]+)\.md$/)
  if (!m) return path
  return opts?.withExtension ? `${m[1]!}.md` : m[1]!
}

// Maps `packages/sheets-wiki/content/<kind>/<rest>.md` to the slug used in
// `/edit/<slug>` URLs. Quartz flattens function pages, so function/<rest>.md
// emits as just <rest>.
//
// Returns `null` when the path doesn't match the expected shape — callers
// should fall back to a known-good slug rather than producing `/edit/`
// (the landing page itself), which silently links back to the surface
// the user is already on.
export function deriveSlug(path: string): string | null {
  const m = path.match(/content\/([^/]+)\/(.+)\.md$/)
  if (!m) return null
  const [, kind, rest] = m
  return kind === "function" ? rest! : `${kind}/${rest}`
}

// Renders an ISO timestamp as a coarse-grained "X ago" label.
// Empty input renders as an em-dash placeholder.
export function formatAgo(iso: string): string {
  if (!iso) return "—"
  const ms = Date.now() - Date.parse(iso)
  const m = Math.floor(ms / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
