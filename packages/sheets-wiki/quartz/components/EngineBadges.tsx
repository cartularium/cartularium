import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { enginesByTier } from "@cartularium/chrome"
import { classNames } from "../util/lang"
import { isEnginesMap } from "../util/functionData"

const PRIMARY = enginesByTier("primary")

const EngineBadges: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const engines = fileData.frontmatter?.engines
  if (!isEnginesMap(engines)) return null

  const entries = PRIMARY.filter((e) => engines[e.name])
  if (entries.length === 0) return null

  return (
    <div class={classNames(displayClass, "engine-badges")}>
      {entries.map((e) => {
        const rec = engines[e.name]
        const cls = `chip eng-${e.name} status-${rec.status}`
        const title = rec.via
          ? `${e.label}: ${rec.status} (${rec.via})`
          : `${e.label}: ${rec.status}`
        return (
          <a class={cls} href={`#${e.name}`} title={title}>
            {e.name}
          </a>
        )
      })}
    </div>
  )
}

export default (() => EngineBadges) satisfies QuartzComponentConstructor
