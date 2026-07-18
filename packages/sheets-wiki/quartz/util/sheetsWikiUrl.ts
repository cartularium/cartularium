// URL rule for sheets.wiki. see DESIGN.md for the full scheme.
//
// the mapping handles both the legacy folder layout (docs/, guides/, misc/,
// archive/) and the post-reorg layout (function/, concept/, guide/, about/),
// so the build stays correct through the file-move transition.

import { FilePath, FullSlug, slugifyFilePath } from "./path"

// SHOUTY_CASE with optional dots/underscores/digits: SUM, NORM.S.DIST, T.
const FUNCTION_NAME_RE = /^[A-Z][A-Z0-9._]*$/

// INDEX function uses a folder URL to dodge case-folding collision with the
// homepage from _index.md on case-insensitive filesystems (macOS HFS+/APFS).
// directory name "INDEX" stays distinct from file "index.html" after folding.
export const INDEX_FUNCTION_SLUG = "INDEX/index" as FullSlug

export interface UrlMapping {
  canonicalSlug: FullSlug
  historicalAliases: FullSlug[]
}

export function computeUrlMapping(relativePath: FilePath): UrlMapping | null {
  const segments = relativePath.split("/")
  if (segments.length !== 2) return null

  const filenameWithExt = segments[segments.length - 1]
  const filename = filenameWithExt.replace(/\.md$/, "")
  const folder = segments[0]

  if (filename === "_index" || filename === "index" || filename === "README") return null

  const baseSlug = slugifyFilePath(filenameWithExt as FilePath)

  if (FUNCTION_NAME_RE.test(filename) && (folder === "function" || folder === "docs")) {
    if (filename === "INDEX") {
      return {
        canonicalSlug: INDEX_FUNCTION_SLUG,
        historicalAliases: ["docs/INDEX" as FullSlug],
      }
    }
    return {
      canonicalSlug: baseSlug,
      historicalAliases: [`docs/${baseSlug}` as FullSlug],
    }
  }

  if (folder === "concept" || folder === "docs") {
    return {
      canonicalSlug: `concept/${baseSlug}` as FullSlug,
      historicalAliases: [`docs/${baseSlug}` as FullSlug],
    }
  }

  if (folder === "guide" || folder === "guides") {
    return {
      canonicalSlug: `guide/${baseSlug}` as FullSlug,
      historicalAliases: [`guides/${baseSlug}` as FullSlug],
    }
  }

  if (folder === "about" || folder === "misc") {
    return {
      canonicalSlug: `about/${baseSlug}` as FullSlug,
      historicalAliases: [`misc/${baseSlug}` as FullSlug],
    }
  }

  // single archived page (Classic LAMBDA UDTs) folds into concepts.
  if (folder === "archive") {
    return {
      canonicalSlug: `concept/${baseSlug}` as FullSlug,
      historicalAliases: [`archive/${baseSlug}` as FullSlug],
    }
  }

  // blog/, people/, project/ already match their target URL prefix.
  return null
}
