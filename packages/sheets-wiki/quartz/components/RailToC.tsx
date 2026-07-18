import { TOC_RAIL_TEMPLATE, render } from "@cartularium/chrome"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { flatToNested } from "./util/tocTree"

const RailToC: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const toc = fileData.toc
  if (!toc || toc.length < 2) return null
  const entries = flatToNested(toc)
  if (entries.length === 0) return null
  const html = render(TOC_RAIL_TEMPLATE, { entries })
  return (
    <div
      class={classNames(displayClass, "rail-toc-host")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default (() => RailToC) satisfies QuartzComponentConstructor
