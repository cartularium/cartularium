import { crossPropertyUrls } from "@cartularium/chrome"
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { PageKind, pageKind } from "./quartz/util/pageKind"

const URLS = crossPropertyUrls()

// Search stays mounted for its overlay; topbar.scss bridges chrome's [data-search-trigger] to it
const topBar = [Component.TopBar(), Component.Search()]

const DOCS_KINDS: PageKind[] = ["function", "concept"]
const PROSE_KINDS: PageKind[] = ["blog", "guide"]
const isDocsKind = (p: any) => DOCS_KINDS.includes(pageKind(p.fileData))
const isProseKind = (p: any) => PROSE_KINDS.includes(pageKind(p.fileData))
const hasToc = (p: any) => isDocsKind(p) || isProseKind(p)

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: topBar,
  afterBody: [],
  footer: Component.Footer({
    imprint: { href: URLS.home, label: "part of cartularium ↗" },
    links: [
      { href: "/about", label: "about" },
      { href: "/about/Contributing", label: "contributing" },
      { href: "https://github.com/cartularium/cartularium", label: "github ↗" },
      { href: "/index.xml", label: "feed" },
    ],
    editUrl: (props) => {
      const slug = props.fileData?.slug
      if (!slug || slug === "index" || slug === "404") return undefined
      return "/edit/" + slug
    },
  }),
}

// per-kind toc variants. chrome.scss viewport-gates them so only one shows at a time
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.EngineBadges(),
    Component.TagList(),
    Component.ConditionalRender({ component: Component.TableOfContents(), condition: hasToc }),
    Component.ConditionalRender({ component: Component.TocFab(), condition: hasToc }),
  ],
  afterBody: [Component.Related()],
  left: [Component.ConditionalRender({ component: Component.GutterToC(), condition: isProseKind })],
  right: [Component.ConditionalRender({ component: Component.RailToC(), condition: isDocsKind })],
}

// list/folder/tag pages: editorial frame, no rails. EngineBadges no-ops without frontmatter engines
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.EngineBadges(),
  ],
  left: [],
  right: [],
}
