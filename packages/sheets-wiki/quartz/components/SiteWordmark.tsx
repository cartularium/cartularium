import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot } from "../util/path"

const SiteWordmark: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const home = pathToRoot(fileData.slug!)
  return (
    <a class={classNames(displayClass, "site-wordmark")} href={home}>
      {cfg.pageTitle}
    </a>
  )
}

SiteWordmark.css = `
.site-wordmark {
  font-family: var(--font-display, var(--titleFont));
  font-variation-settings: "opsz" 36, "wght" 480, "SOFT" 0;
  font-size: 1.1rem;
  font-weight: 480;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
}
.site-wordmark:hover {
  color: var(--accent);
}
`

export default (() => SiteWordmark) satisfies QuartzComponentConstructor
