import { FOOTER_TEMPLATE, render, crossPropertyUrls } from "@cartularium/chrome"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface FooterLink {
  href: string
  label: string
}

interface FooterOptions {
  imprint: { href: string; label: string }
  links: FooterLink[]
  // resolver computes the per-page edit URL from props; return undefined to suppress
  editUrl?: (props: QuartzComponentProps) => string | undefined
}

export default ((opts?: FooterOptions) => {
  const Footer: QuartzComponent = (props: QuartzComponentProps) => {
    const { displayClass } = props
    const editUrl = opts?.editUrl?.(props)
    const data = {
      imprint: opts?.imprint ?? { href: crossPropertyUrls().home, label: "part of cartularium ↗" },
      links: opts?.links ?? [],
      ...(editUrl ? { editUrl } : {}),
    }
    const html = render(FOOTER_TEMPLATE, data)
    return (
      <div
        class={classNames(displayClass, "footer-host")}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }
  return Footer
}) satisfies QuartzComponentConstructor<FooterOptions>
