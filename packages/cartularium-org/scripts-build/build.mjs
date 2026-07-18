// cartularium.org build. renders the chrome topbar into the page template,
// counts real numbers from sibling packages, compiles the page SCSS to css,
// writes everything to public/.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { TOPBAR_TEMPLATE, render, crossPropertyUrls } from "@cartularium/chrome"
import * as sass from "sass"

const HERE = dirname(fileURLToPath(import.meta.url))
export const PKG = resolve(HERE, "..")
export const REPO = resolve(PKG, "..", "..")
export const SRC = join(PKG, "src")
export const OUT = join(PKG, "public")

function countMatching(dir, pred) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir).filter(pred).length
}

export function build() {
  mkdirSync(OUT, { recursive: true })

  const urls = crossPropertyUrls()
  const counts = {
    functions: countMatching(
      join(REPO, "packages", "sheets-wiki", "content", "function"),
      (n) => n.endsWith(".md") && n !== "_index.md",
    ),
    divergences: countMatching(join(REPO, "packages", "assay", "divergences"), (n) =>
      /^DV-\d+\.ya?ml$/.test(n),
    ),
    volumesPublished: 2,
  }

  const topbarHtml = render(TOPBAR_TEMPLATE, {
    wordmark: { href: "/", label: "cartularium" },
    nav: {
      items: [
        { href: "#volumes", label: "volumes" },
        { href: "#about", label: "about" },
        { href: "#activity", label: "activity" },
        { href: "#colophon", label: "colophon" },
        { href: "https://github.com/cartularium/cartularium", label: "github ↗" },
      ],
    },
    theme: { icon: "☾" },
  })

  // activity rows. hand-curated, reader-facing summaries of real changes.
  // replace with a generated feed once an aggregator pulls live entries
  // from each volume
  const activity = [
    {
      when: "2026-04-27",
      where: "cartularium",
      what: "The volumes now share a top bar, mobile drawer, table of contents, and footer line. Move between the wiki and the catalogue and the chrome reads the same.",
      ref: { href: "https://github.com/cartularium/cartularium", label: "repo" },
    },
    {
      when: "2026-04-26",
      where: "sheets.wiki",
      whereColor: "eng-gsheets",
      what: "Footnotes on long blog posts now float into the page gutter beside their paragraph instead of bouncing the reader to the foot of the page.",
      ref: { href: `${urls.wiki}/blog`, label: "blog" },
    },
    {
      when: "2026-04-22",
      where: "sheets.wiki",
      whereColor: "eng-gsheets",
      what: "<code>/functions</code> indexes every documented function on a single page. 527 entries across 19 categories, exported as html, tsv, and json for anyone who wants the data outside the wiki.",
      ref: { href: `${urls.wiki}/functions`, label: "/functions" },
    },
  ]

  const lastPublished = activity[0].when

  const tpl = readFileSync(join(SRC, "index.html"), "utf8")
  const html = render(tpl, { topbar: topbarHtml, counts, activity, lastPublished, urls })
  writeFileSync(join(OUT, "index.html"), html)

  const cssResult = sass.compile(join(SRC, "styles.scss"), {
    loadPaths: [join(REPO, "node_modules"), join(PKG, "node_modules")],
    style: "compressed",
  })
  writeFileSync(join(OUT, "styles.css"), cssResult.css)

  return { counts }
}

// run as a script
if (import.meta.url === `file://${process.argv[1]}`) {
  const { counts } = build()
  console.log(
    `built cartularium.org\n  functions: ${counts.functions}\n  divergences: ${counts.divergences}\n  out: ${OUT}`,
  )
}
