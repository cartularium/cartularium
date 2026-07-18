import { QuartzTransformerPlugin } from "../types"
import {
  FunctionData,
  FunctionDataMap,
  LoadOptions,
  isEnginesMap,
  loadFunctionData,
} from "../../util/functionData"
import { INDEX_FUNCTION_SLUG } from "../../util/sheetsWikiUrl"

export interface Options extends LoadOptions {
  // disable for offline builds or CI without sibling repos
  enabled?: boolean
}

const defaultOptions: Options = { enabled: true }

// merges aggregated lattice + assay data into each function page's frontmatter.
// per-page frontmatter wins; this only fills absent fields.
export const CartulariumData: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts: Options = { ...defaultOptions, ...userOpts }

  let dataMap: FunctionDataMap = new Map()
  if (opts.enabled !== false) {
    try {
      dataMap = loadFunctionData(opts)
    } catch (err) {
      console.warn(`[CartulariumData] failed to load function data: ${(err as Error).message}`)
    }
  }

  return {
    name: "CartulariumData",
    markdownPlugins() {
      return [
        () => {
          return (_, file) => {
            const slug = file.data.slug
            if (!slug) return

            // read from slug not path so SheetsWikiSlugs has had its chance.
            const funcName = extractFunctionName(slug)
            if (!funcName) return

            const data = dataMap.get(funcName)
            if (!data) return

            const fm = (file.data.frontmatter ??= { title: funcName })
            mergeFunctionData(fm as Record<string, unknown>, data)
          }
        },
      ]
    },
  }
}

const FUNCTION_NAME_RE = /^[A-Z][A-Z0-9._]*$/

function extractFunctionName(slug: string): string | null {
  if (slug === INDEX_FUNCTION_SLUG) return "INDEX"
  if (slug.includes("/")) return null
  if (!FUNCTION_NAME_RE.test(slug)) return null
  return slug
}

function mergeFunctionData(fm: Record<string, unknown>, data: FunctionData): void {
  if (data.category && fm.category === undefined) fm.category = data.category
  if (data.syntax && fm.syntax === undefined) fm.syntax = data.syntax
  // outlier pages declare an engines override; source wins per-engine, data fills the rest
  if (data.engines) {
    if (fm.engines === undefined) {
      fm.engines = data.engines
    } else if (isEnginesMap(fm.engines)) {
      fm.engines = { ...data.engines, ...fm.engines }
    }
  }
  if (data.divergences && fm.divergences === undefined) fm.divergences = data.divergences
  if (data.divergenceMeta && fm.divergenceMeta === undefined)
    fm.divergenceMeta = data.divergenceMeta
  if (data.tests && fm.tests === undefined) fm.tests = data.tests
  if (data.testVerdicts && fm.testVerdicts === undefined) fm.testVerdicts = data.testVerdicts
}
