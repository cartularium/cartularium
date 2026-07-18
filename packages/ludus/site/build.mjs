// Static site for ludus: index + one page per problem, rendered from
// problems/*.yaml. Only sample cases are published — hidden cases never
// reach the build output. Pattern cloned from cartularium-org.
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "yaml"
import * as sass from "sass"
import {
  DRAWER_TEMPLATE,
  FOOTER_TEMPLATE,
  TOPBAR_TEMPLATE,
  crossPropertyUrls,
  imprintsExcluding,
  render,
} from "@cartularium/chrome"

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..")
const REPO = join(PKG, "..", "..")
export const SRC = join(PKG, "site")
export const OUT = join(PKG, "public")
const PROBLEMS = join(PKG, "problems")
const HOST = "ludus.sheets.wiki"
const ASSET_VERSION = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "dev"
// judge service base URL; unset → submit box renders as a disabled stub
const SERVICE_URL = process.env.LUDUS_SERVICE_URL ?? null

const require = createRequire(import.meta.url)
const LAYOUT = readFileSync(join(SRC, "templates", "layout.html"), "utf8")

const esc = (s) =>
  String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")

// banded display of the open-ended grade: blocks cap at ten, overflow marks
const difficultyMeter = (d) => {
  const blocks = Math.min(d, 10)
  return `${d} › ${"█".repeat(blocks)}${"░".repeat(10 - blocks)}${d > 10 ? "⁺" : ""}`
}

function chromeParts(root) {
  const urls = crossPropertyUrls()
  const nav = {
    items: [
      { href: `${root}/#problems`, label: "problems" },
      { href: `${root}/#about`, label: "about" },
    ],
  }
  return {
    topbar: render(TOPBAR_TEMPLATE, {
      wordmark: { href: `${root}/`, label: "ludus" },
      nav,
      theme: { icon: "☾" },
      mobile: true,
    }),
    drawer: render(DRAWER_TEMPLATE, {
      nav,
      imprints: imprintsExcluding(HOST),
      theme: { icon: "☾" },
    }),
    footer: render(FOOTER_TEMPLATE, {
      imprint: { href: urls.home, label: "cartularium" },
      links: [
        { href: urls.wiki, label: "sheets.wiki" },
        { href: urls.assay, label: "assay" },
      ],
    }),
  }
}

function page({ root, title, description, body }) {
  return render(LAYOUT, {
    root,
    title,
    description,
    assetVersion: ASSET_VERSION,
    body,
    ...chromeParts(root),
  })
}

function gridTable(rows, { headers } = {}) {
  const head = headers
    ? `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`
    : ""
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map((v) => {
            if (v === null || v === undefined || v === "") return "<td></td>"
            const cls = typeof v === "number" ? ' class="num"' : ""
            return `<td${cls}>${esc(v)}</td>`
          })
          .join("")}</tr>`,
    )
    .join("\n")
  return `<div class="grid-scroll"><table class="grid">${head}${body}</table></div>`
}

function statementHtml(statement) {
  return statement
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.replace(/\s*\n\s*/g, " "))}</p>`)
    .join("\n")
}

function problemBody(problem) {
  const sample = problem.cases.find((c) => c.kind === "sample")
  const hiddenCount = problem.cases.filter((c) => c.kind === "hidden").length
  const copyUrl = problem.template.spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${problem.template.spreadsheetId}/copy`
    : null
  const chips = (problem.challenges ?? []).map((c) => `<span class="chip">${esc(c)}</span>`).join(" ")

  return `
<nav class="crumb"><a href="../../">← all problems</a></nav>
<header class="prob-head">
  <h1>${esc(problem.title)}</h1>
  <p class="meta-line">
    <span class="meter" title="difficulty ${problem.difficulty} (open scale, hand-graded)">${esc(difficultyMeter(problem.difficulty))}</span>
    <span class="sep">·</span>
    <span>${problem.tags.map(esc).join(", ")}</span>
    ${problem.requires?.length ? `<span class="sep">·</span> <span>requires: ${problem.requires.map(esc).join(", ")}</span>` : ""}
    ${chips ? `<span class="sep">·</span> ${chips}` : ""}
  </p>
</header>

<section class="statement">
${statementHtml(problem.statement)}
</section>

<section class="workflow">
  <h2>Work on it</h2>
  <ol>
    <li>${
      copyUrl
        ? `<a class="button" href="${esc(copyUrl)}" rel="noopener">Make a copy of the template</a> — it becomes your private sheet.`
        : `<em>Template not yet published.</em>`
    }</li>
    <li>Solve it however you like — helper columns and extra tabs are fair game. The one rule:
        the grader swaps <code>INPUT</code> for other datasets, so never put your own content
        inside <code>INPUT</code>.</li>
    <li>Check yourself against the expected sample output shown in your copy (and below).</li>
    ${
      SERVICE_URL
        ? `<li>Submit below — Share → "anyone with the link, Viewer", paste the link. Your sheet is
        graded against ${hiddenCount} hidden dataset${hiddenCount === 1 ? "" : "s"}, so hardcoded answers won't survive.</li>`
        : `<li class="muted">Submit — the judging service is under construction. It will grade your sheet
        against ${hiddenCount} hidden dataset${hiddenCount === 1 ? "" : "s"}, so hardcoded answers won't survive.</li>`
    }
  </ol>
  ${
    SERVICE_URL
      ? `<div class="submit-stub live" data-service="${esc(SERVICE_URL)}" data-problem="${esc(problem.id)}">
    <input type="url" placeholder="paste your sheet's share link">
    <button>Judge</button>
    <div class="verdict"></div>
  </div>`
      : `<div class="submit-stub">
    <input type="url" placeholder="paste your sheet's share link (coming soon)" disabled>
    <button disabled>Judge</button>
  </div>`
  }
</section>

<section class="sample">
  <h2>Sample</h2>
  <h3>Input <span class="muted">(${esc(problem.template.input)})</span></h3>
  ${gridTable(sample.input)}
  <h3>Expected output <span class="muted">(${esc(problem.template.output)})</span></h3>
  ${gridTable(sample.expected ?? [], { headers: problem.template.answerHeaders })}
</section>

${problem.attribution ? `<p class="attribution">${esc(problem.attribution)}</p>` : ""}
`
}

function indexBody(problems) {
  const cards = problems
    .map(
      (p) => `
  <a class="prob-card" href="./problems/${esc(p.id)}/">
    <span class="prob-title">${esc(p.title)}</span>
    <span class="meter">${esc(difficultyMeter(p.difficulty))}</span>
    <span class="prob-tags">${p.tags.map(esc).join(", ")}</span>
  </a>`,
    )
    .join("\n")

  return `
<section class="masthead">
  <h1>ludus</h1>
  <div class="dek-block">
    <p class="dek">Practice problems for spreadsheet formulas, solved in real Google Sheets.</p>
    <p class="meta-line">
      <span>pre-alpha</span>
      <span class="sep">·</span>
      <span>${problems.length} problems</span>
      <span class="sep">·</span>
      <span>working title</span>
    </p>
  </div>
</section>

<section id="problems" class="prob-list">
  <h2>Problems</h2>
${cards}
</section>

<section id="about" class="about">
  <h2>About</h2>
  <p>Each problem gives you a Google Sheets template with an <code>INPUT</code> range and an
     <code>OUTPUT</code> range. Copy it, build whatever gets the job done — one formula or a
     workshop of helper tabs — and check yourself against the sample. A judging service that
     grades sheets against hidden datasets is under construction.</p>
  <p>Problems adapted from the astral.cafe community practice sheet, and new ones.
     Part of <a href="https://cartularium.org">cartularium</a>.</p>
</section>
`
}

export function build() {
  mkdirSync(OUT, { recursive: true })
  mkdirSync(join(OUT, "assets"), { recursive: true })

  const problems = readdirSync(PROBLEMS)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => parse(readFileSync(join(PROBLEMS, f), "utf8")))
    .sort((a, b) => a.id.localeCompare(b.id))

  writeFileSync(
    join(OUT, "index.html"),
    page({
      root: ".",
      title: "ludus — spreadsheet practice problems",
      description: "Practice problems for spreadsheet formulas, solved in real Google Sheets.",
      body: indexBody(problems),
    }),
  )

  for (const problem of problems) {
    const dir = join(OUT, "problems", problem.id)
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, "index.html"),
      page({
        root: "../..",
        title: `${problem.title} — ludus`,
        description: `${problem.title}: a difficulty-${problem.difficulty} spreadsheet practice problem.`,
        body: problemBody(problem),
      }),
    )
  }

  const css = sass.compile(join(SRC, "styles.scss"), {
    loadPaths: [join(REPO, "node_modules"), join(PKG, "node_modules")],
    style: "compressed",
  }).css
  writeFileSync(join(OUT, "styles.css"), css)

  cpSync(require.resolve("@cartularium/chrome/scripts/chrome.js"), join(OUT, "assets", "chrome.js"))
  cpSync(join(SRC, "assets", "submit.js"), join(OUT, "assets", "submit.js"))

  return { counts: { problems: problems.length } }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { counts } = build()
  console.log(`built ${counts.problems} problem page(s) → ${OUT}`)
}
