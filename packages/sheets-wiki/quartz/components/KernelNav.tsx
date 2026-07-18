import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot, joinSegments } from "../util/path"

interface NavLink {
  label: string
  href: string
  external?: boolean
}

const links: NavLink[] = [
  { label: "concepts", href: "concept" },
  { label: "guides", href: "guide" },
  { label: "blog", href: "blog" },
  { label: "projects", href: "project" },
  { label: "about", href: "about" },
  { label: "github ↗", href: "https://github.com/cartularium/cartularium", external: true },
]

const KernelNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const root = pathToRoot(fileData.slug!)
  return (
    <nav class={classNames(displayClass, "kernel-nav")}>
      {links.map((link, i) => (
        <>
          {i > 0 ? <span class="nav-sep">·</span> : null}
          <a href={link.external ? link.href : joinSegments(root, link.href)}>{link.label}</a>
        </>
      ))}
    </nav>
  )
}

KernelNav.css = `
.kernel-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono, var(--codeFont));
  font-size: 0.78rem;
  letter-spacing: 0.02em;
}
.kernel-nav a {
  color: var(--ink-3);
  text-decoration: none;
  white-space: nowrap;
}
.kernel-nav a:hover {
  color: var(--accent);
}
.kernel-nav .nav-sep {
  color: var(--ink-4);
  user-select: none;
}
@media (max-width: 800px) {
  .kernel-nav {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
`

export default (() => KernelNav) satisfies QuartzComponentConstructor
