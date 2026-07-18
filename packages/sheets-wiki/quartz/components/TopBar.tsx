import { TOPBAR_TEMPLATE, DRAWER_TEMPLATE, imprintsExcluding, render } from "@cartularium/chrome"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot, joinSegments } from "../util/path"
// @ts-ignore
import topbarScript from "./scripts/topbar.inline"
import topbarStyles from "./styles/topbar.scss"

interface NavLink {
  label: string
  href: string
  external?: boolean
  // path segment that, when present in fileData.slug, marks this link active
  match?: string
}

const NAV_LINKS: NavLink[] = [
  { label: "functions", href: "functions", match: "functions" },
  { label: "concepts", href: "concept", match: "concept" },
  { label: "guides", href: "guide", match: "guide" },
  { label: "blog", href: "blog", match: "blog" },
  { label: "projects", href: "project", match: "project" },
]

const TopBar: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const root = pathToRoot(fileData.slug!)
  const slug = fileData.slug ?? ""

  const items = NAV_LINKS.map((link) => ({
    label: link.label,
    href: link.external ? link.href : joinSegments(root, link.href),
    active: link.match ? slug.startsWith(link.match) : false,
  }))

  const data = {
    wordmark: { href: root || "/", label: cfg.pageTitle },
    nav: { items },
    search: { label: "search", key: "⌘K", placeholder: "search" },
    theme: { icon: "☾" },
    mobile: true,
    imprints: imprintsExcluding(cfg.baseUrl ?? ""),
  }

  const html = render(TOPBAR_TEMPLATE, data) + render(DRAWER_TEMPLATE, data)

  return (
    <div
      class={classNames(displayClass, "topbar-host")}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

TopBar.beforeDOMLoaded = topbarScript
TopBar.css = topbarStyles

export default (() => TopBar) satisfies QuartzComponentConstructor
