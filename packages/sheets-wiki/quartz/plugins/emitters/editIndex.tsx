import {
  EDIT_INDEX_VERSION,
  type EditIndex as EditIndexSchema,
  type EditIndexEntry,
  type EditIndexKind,
} from "@cartularium/contracts"
import { FilePath, FullSlug, joinSegments } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"

const KNOWN_KINDS: ReadonlySet<EditIndexKind> = new Set([
  "function",
  "concept",
  "blog",
  "guide",
  "people",
  "about",
  "project",
])

export function kindFromSlug(slug: string): EditIndexKind {
  const top = slug.split("/")[0] ?? ""
  return KNOWN_KINDS.has(top as EditIndexKind) ? (top as EditIndexKind) : "other"
}

interface DeriveInput {
  slug: FullSlug
  // relativePath is preferred for kind derivation because function-page slugs
  // are flattened by Quartz (function/SUMIF.md → slug "SUMIF"). When present,
  // the first path segment of relativePath gives the canonical kind.
  relativePath?: string
  frontmatter: Record<string, unknown> | undefined
}

function pickTitle(input: DeriveInput): string {
  const fm = input.frontmatter
  const fmTitle = fm?.title ?? fm?.name
  if (typeof fmTitle === "string" && fmTitle.length > 0) return fmTitle
  // fall back to last slug segment, replacing dashes/underscores with spaces
  const tail = input.slug.split("/").pop() ?? input.slug
  return tail.replace(/[-_]/g, " ")
}

function pickDek(input: DeriveInput): string | undefined {
  const fm = input.frontmatter
  if (!fm) return undefined
  const dek = fm.dek ?? fm.description
  return typeof dek === "string" && dek.length > 0 ? dek : undefined
}

function pickAliases(input: DeriveInput): string[] | undefined {
  const aliases = input.frontmatter?.aliases
  if (!Array.isArray(aliases)) return undefined
  const filtered = aliases.filter((x): x is string => typeof x === "string" && x.length > 0)
  return filtered.length > 0 ? filtered : undefined
}

function pickStatus(input: DeriveInput): EditIndexEntry["status"] {
  const status = input.frontmatter?.status
  if (status === "deprecated") return "deprecated"
  if (status === "hidden") return "hidden"
  // any other value (including "imported", "active", missing) → active for autocomplete
  return "active"
}

export function deriveEditIndexEntry(input: DeriveInput): EditIndexEntry {
  // Use relativePath when available so that function pages (whose slugs are
  // flattened: function/SUMIF.md → slug "SUMIF") resolve to kind "function".
  const kindSource = input.relativePath ?? String(input.slug)
  const entry: EditIndexEntry = {
    slug: String(input.slug),
    title: pickTitle(input),
    kind: kindFromSlug(kindSource),
  }
  // forward the file path so editor reads the actual file on disk (Quartz
  // slugifies spaces to hyphens; "Asking Questions.md" → slug "Asking-Questions").
  if (input.relativePath) entry.path = input.relativePath
  const dek = pickDek(input)
  if (dek) entry.dek = dek
  const aliases = pickAliases(input)
  if (aliases) entry.aliases = aliases
  const status = pickStatus(input)
  if (entry.kind === "function") entry.status = status
  return entry
}

export const EditIndex: QuartzEmitterPlugin = () => ({
  name: "EditIndex",
  getQuartzComponents() {
    return []
  },
  async emit(ctx, content): Promise<FilePath[]> {
    const entries: EditIndexEntry[] = []
    for (const [, file] of content) {
      const slug = file.data.slug
      if (!slug) continue
      // skip the wiki root index
      if (slug === "index") continue
      entries.push(
        deriveEditIndexEntry({
          slug,
          relativePath: file.data.relativePath ?? undefined,
          frontmatter: (file.data.frontmatter ?? {}) as Record<string, unknown>,
        }),
      )
    }
    entries.sort((a, b) => a.slug.localeCompare(b.slug))

    const idx: EditIndexSchema = {
      version: EDIT_INDEX_VERSION,
      generatedAt: new Date().toISOString(),
      entries,
    }

    const fp = await write({
      ctx,
      slug: joinSegments("edit", "edit-index") as FullSlug,
      ext: ".json",
      content: JSON.stringify(idx),
    })
    return [fp]
  },
  externalResources() {
    return {}
  },
})
