import { RELATED_TEMPLATE, render, imprintFor, crossPropertyUrls } from "@cartularium/chrome"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, simplifySlug } from "../util/path"
import { classNames } from "../util/lang"
import { isEnginesMap, type TestMetaMap, type TestVerdictData } from "../util/functionData"
import type { ManifestDvEntry, ManifestV4TestEntry } from "@cartularium/contracts"

interface RelatedOptions {
  hideWhenEmpty: boolean
}

const defaultOptions: RelatedOptions = { hideWhenEmpty: true }

// imprintFor uses the production hostname as the canonical lookup key
// regardless of where assay is served, so the label resolution stays stable.
const ASSAY_HOST = "assay.sheets.wiki"
const ASSAY_BASE = crossPropertyUrls().assay
const ASSAY_IMPRINT = imprintFor(ASSAY_HOST)?.label ?? "assay"

function dvTitle(id: string, meta: ManifestDvEntry | undefined): string {
  return meta?.summary ? `${id} · ${meta.summary}` : id
}

function assayHref(url: string | undefined, testId: string): string {
  if (!url) {
    throw new Error(
      `[Related] missing v4 assay URL metadata for related test ${testId}; refusing to guess a /test/ URL`,
    )
  }
  if (/^https?:\/\//i.test(url)) return url
  return `${ASSAY_BASE.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`
}

export default ((opts?: Partial<RelatedOptions>) => {
  const options = { ...defaultOptions, ...opts }

  const Related: QuartzComponent = ({ fileData, allFiles, displayClass }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!)
    const backlinkFiles = allFiles.filter((f) => f.links?.includes(slug))

    const mentioned = {
      items: backlinkFiles.map((f) => ({
        href: resolveRelative(fileData.slug!, f.slug!),
        label: f.frontmatter?.title ?? f.slug,
      })),
    }

    const fm = fileData.frontmatter as Record<string, unknown> | undefined
    const dvs = Array.isArray(fm?.divergences) ? (fm.divergences as string[]) : []
    const tests = Array.isArray(fm?.tests) ? (fm.tests as string[]) : []
    const enginesRecord = isEnginesMap(fm?.engines) ? fm.engines : {}
    const dvMeta = (fm?.divergenceMeta ?? {}) as Record<string, ManifestDvEntry>
    const testVerdicts = (fm?.testVerdicts ?? {}) as TestVerdictData
    const testMeta = ((fm?.testMeta as TestMetaMap | undefined) ??
      testVerdicts.__meta ??
      {}) as Record<string, ManifestV4TestEntry>
    const enginesByDv = new Map<string, Array<{ engine: string }>>()
    for (const [engine, rec] of Object.entries(enginesRecord)) {
      if (!rec.via) continue
      const list = enginesByDv.get(rec.via) ?? []
      list.push({ engine })
      enginesByDv.set(rec.via, list)
    }
    const diverges = {
      items: dvs.map((dv) => ({
        href: `${ASSAY_BASE}/dv/${dv}/`,
        title: dvTitle(dv, dvMeta[dv]),
        engines: enginesByDv.get(dv) ?? [],
        imprint: ASSAY_IMPRINT,
      })),
    }
    const tested = {
      items: tests.map((tid) => ({
        href: assayHref(testMeta[tid]?.url, tid),
        title: tid,
        engines: Object.entries(testVerdicts[tid] ?? {}).map(([engine, verdict]) => ({
          engine,
          failed: verdict === "diverge",
        })),
        imprint: ASSAY_IMPRINT,
      })),
    }
    const usedIn = { items: [] as unknown[] }

    if (
      options.hideWhenEmpty &&
      mentioned.items.length === 0 &&
      diverges.items.length === 0 &&
      tested.items.length === 0 &&
      usedIn.items.length === 0
    ) {
      return null
    }

    const html = render(RELATED_TEMPLATE, { mentioned, diverges, tested, usedIn })
    return (
      <div
        class={classNames(displayClass, "related-host")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return Related
}) satisfies QuartzComponentConstructor
