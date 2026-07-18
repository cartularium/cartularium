import { TOC_GUTTER_TEMPLATE, render } from "@cartularium/chrome"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const GutterToC: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const toc = fileData.toc
  if (!toc) return null
  // gutter: top-level headings only (depth 0). prose toc is high-level
  const entries = toc.filter((e) => e.depth === 0).map((e) => ({ id: e.slug, label: e.text }))
  if (entries.length < 2) return null
  const html = render(TOC_GUTTER_TEMPLATE, { entries })
  return (
    <div
      class={classNames(displayClass, "gutter-toc-host")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default (() => GutterToC) satisfies QuartzComponentConstructor
