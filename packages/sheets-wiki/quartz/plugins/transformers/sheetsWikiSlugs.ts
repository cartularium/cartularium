import { QuartzTransformerPlugin } from "../types"
import { FilePath, FullSlug } from "../../util/path"
import { computeUrlMapping } from "../../util/sheetsWikiUrl"

// canonical slug + alias setup per file. allSlugs is pre-populated in
// build.ts (main thread) so wikilinks resolve directly without redirect hops.
export const SheetsWikiSlugs: QuartzTransformerPlugin = () => ({
  name: "SheetsWikiSlugs",
  markdownPlugins() {
    return [
      () => {
        return (_, file) => {
          const rel = file.data.relativePath as FilePath | undefined
          const slug = file.data.slug as FullSlug | undefined
          if (!rel || !slug) return

          const mapping = computeUrlMapping(rel)
          if (!mapping) return

          file.data.slug = mapping.canonicalSlug
          const aliases = file.data.aliases ?? []
          for (const alias of mapping.historicalAliases) {
            if (alias !== mapping.canonicalSlug && !aliases.includes(alias)) {
              aliases.push(alias)
            }
          }
          file.data.aliases = aliases
        }
      },
    ]
  },
})
