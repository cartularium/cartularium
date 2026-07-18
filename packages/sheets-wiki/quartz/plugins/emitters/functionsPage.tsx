import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FilePath, FullSlug, pathToRoot } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { FunctionsContent } from "../../components"
import { write } from "./helpers"
import { isEnginesMap, type CoverageMarker, type EnginesMap } from "../../util/functionData"

export interface FunctionRow {
  name: string
  slug: string
  href: string
  category: string
  description: string
  engines: string[]
  engineStatus: EnginesMap
  coverage?: CoverageMarker
  syntax: string
}

export interface FunctionsPayload {
  byCategory: Map<string, FunctionRow[]>
  orderedCategories: string[]
  totalCount: number
}

declare module "vfile" {
  interface DataMap {
    functionsPayload: FunctionsPayload
  }
}

// fallback for any function page that hasn't been migrated to the phase-1 schema yet.
// post-migration the frontmatter `category` field is authoritative.
const META_TAGS = new Set(["function", "generated", "modified"])

function deriveCategoryFromTags(tags: string[]): string {
  const remaining = tags.filter((t) => !META_TAGS.has(t))
  return remaining[0] ?? "uncategorized"
}

function sanitizeTsv(s: string): string {
  return s.replace(/[\t\n]/g, " ")
}

export const FunctionsPage: QuartzEmitterPlugin = () => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: FunctionsContent(),
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "FunctionsPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, content, resources) {
      const cfg = ctx.cfg.configuration
      const allFiles = content.map((c) => c[1].data)

      const rows: FunctionRow[] = []

      for (const [, file] of content) {
        // anchor on folder, not tag: concept pages can carry the "function" tag without being function entries
        const relativePath = (file.data.relativePath ?? "") as string
        if (!relativePath.startsWith("function/")) continue

        const fm = (file.data.frontmatter ?? {}) as Record<string, unknown>
        const slug = file.data.slug! as string
        // post-migration: category is authoritative from frontmatter. fall back to tag derivation
        // for any straggler that escapes phase-1 normalization.
        const category =
          (typeof fm.category === "string" && fm.category) ||
          deriveCategoryFromTags((fm.tags as string[] | undefined) ?? [])

        const name =
          (fm.name as string | undefined) ??
          (fm.title as string | undefined) ??
          slug.replace(/\/index$/, "")
        // INDEX function lives at INDEX/index to dodge case-folding collision; href trims to folder url
        const href = slug === "INDEX/index" ? "INDEX/" : slug
        const description = (file.data.description ?? "").trim()
        const engineStatus = isEnginesMap(fm.engines) ? fm.engines : {}
        const engines = Object.keys(engineStatus)
          .filter((e) => engineStatus[e]?.status === "available")
          .sort()
        const coverage = fm.coverage as CoverageMarker | undefined
        const syntax = typeof fm.syntax === "string" ? fm.syntax : ""

        rows.push({
          name,
          slug,
          href,
          category,
          description,
          engines,
          engineStatus,
          coverage,
          syntax,
        })
      }

      const byCategory = new Map<string, FunctionRow[]>()
      for (const row of rows) {
        const list = byCategory.get(row.category) ?? []
        list.push(row)
        byCategory.set(row.category, list)
      }
      for (const [, list] of byCategory) {
        list.sort((a, b) => a.name.localeCompare(b.name))
      }
      const orderedCategories = Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b))

      const payload: FunctionsPayload = {
        byCategory,
        orderedCategories,
        totalCount: rows.length,
      }

      const slug = "functions" as FullSlug
      const [tree, file] = defaultProcessedContent({
        slug,
        filePath: "functions" as FilePath,
        relativePath: "functions" as FilePath,
        frontmatter: { title: "functions", tags: [] },
        description:
          "the complete catalogue of spreadsheet functions documented on sheets.wiki, grouped by category.",
        text: "",
      })
      file.data.functionsPayload = payload

      const externalResources = pageResources(pathToRoot(slug), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: file.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      yield write({
        ctx,
        content: renderPage(cfg, slug, componentData, opts, externalResources),
        slug,
        ext: ".html",
      })

      // engines column carries only available-engine names; functions.json holds the
      // rich engineStatus (status + via DV id) for consumers that need it.
      const tsvHeader =
        "# schema v3: name, slug, category, engines, syntax, description\nname\tslug\tcategory\tengines\tsyntax\tdescription\n"
      const tsvBody = rows
        .map(
          (r) =>
            `${sanitizeTsv(r.name)}\t${sanitizeTsv(r.slug)}\t${sanitizeTsv(r.category)}\t${sanitizeTsv(r.engines.join(","))}\t${sanitizeTsv(r.syntax)}\t${sanitizeTsv(r.description)}`,
        )
        .join("\n")
      const tsv = tsvHeader + tsvBody + "\n"

      yield write({
        ctx,
        content: tsv,
        slug,
        ext: ".tsv",
      })

      const json = JSON.stringify(
        {
          _schema_version: 3,
          generatedAt: new Date().toISOString(),
          baseUrl: cfg.baseUrl,
          functions: rows.map((r) => ({
            name: r.name,
            slug: r.slug,
            category: r.category,
            engineStatus: r.engineStatus,
            engines: r.engines,
            ...(r.coverage ? { coverage: r.coverage } : {}),
            syntax: r.syntax,
            description: r.description,
          })),
        },
        null,
        2,
      )

      yield write({
        ctx,
        content: json,
        slug,
        ext: ".json",
      })
    },
  }
}
