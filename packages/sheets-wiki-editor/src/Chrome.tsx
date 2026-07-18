import type { ComponentChildren } from "preact"
import { useEffect, useRef } from "preact/hooks"
import topbarTemplate from "@cartularium/chrome/templates/topbar.html?raw"
import footerTemplate from "@cartularium/chrome/templates/footer.html?raw"
import { render } from "@cartularium/chrome/scripts/render.js"

interface ChromeProps {
  account: { handle: string; initials: string }
  hasChanges: boolean
  onSubmitClick?: () => void
  children: ComponentChildren
}

const NAV_ITEMS = [
  { label: "functions", href: "/functions", active: false },
  { label: "concepts", href: "/concept", active: false },
  { label: "guides", href: "/guide", active: false },
  { label: "blog", href: "/blog", active: false },
  { label: "projects", href: "/project", active: false },
]

function navItemsWithLast() {
  return NAV_ITEMS.map((it, i, all) => ({ ...it, last: i === all.length - 1 }))
}

export function Chrome({ account, hasChanges, onSubmitClick, children }: ChromeProps) {
  const topbarRef = useRef<HTMLDivElement | null>(null)

  const topbarHtml = render(topbarTemplate, {
    wordmark: { href: "/", label: "sheets.wiki" },
    nav: { items: navItemsWithLast() },
    search: { label: "search", key: "⌘K" },
    theme: { icon: "☾" },
    editor: {
      account,
      submit: { enabled: hasChanges },
    },
  })

  const footerHtml = render(footerTemplate, {
    imprint: { href: "https://cartularium.org", label: "part of cartularium ↗" },
    links: [
      { href: "/about", label: "about" },
      { href: "/about/Contributing", label: "contributing" },
      { href: "https://github.com/cartularium/cartularium", label: "github ↗" },
    ],
  })

  // topbar/footer html comes from chrome templates via dangerouslySetInnerHTML, so submit click is event-delegated.
  useEffect(() => {
    if (!onSubmitClick) return
    const el = topbarRef.current
    if (!el) return
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      const btn = target?.closest("[data-editor-submit]") as HTMLButtonElement | null
      if (btn && !btn.disabled) {
        e.preventDefault()
        onSubmitClick?.()
      }
    }
    el.addEventListener("click", onClick)
    return () => el.removeEventListener("click", onClick)
  }, [onSubmitClick])

  return (
    <div class="editor-host">
      <div ref={topbarRef} dangerouslySetInnerHTML={{ __html: topbarHtml }} />
      <main class="editor-body">{children}</main>
      <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  )
}
