#!/usr/bin/env -S npx tsx
// frontmatter normalization for content/function/*.md.
// schema v3: engines + coverage are absent for pages covered by lattice or the
// assay manifest; only true outliers (absent from both data layers) carry a
// hand-authored engines: block. see packages/sheets-wiki/NORMALIZATION.md.
// dry-run by default; pass --write to mutate.

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname, resolve, basename } from "node:path"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"
import matter from "gray-matter"
import yaml from "js-yaml"
import { parseTsv, type CoverageMarker, type EnginesMap } from "../quartz/util/functionData"
import { assertSupportedManifestVersion } from "@cartularium/contracts"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, "../../..")
const FN_DIR = join(REPO_ROOT, "packages/sheets-wiki/content/function")
const REPORT_PATH = join(REPO_ROOT, "internal/normalization-dryrun.md")
const LATTICE_PATH =
  process.env.CARTULARIUM_LATTICE ?? resolve(homedir(), "sandbox/current/lattice")
const MANIFEST_PATH =
  process.env.CARTULARIUM_ASSAY_MANIFEST ??
  join(REPO_ROOT, "packages/assay/build/site/manifest.json")

const META_TAGS = new Set(["function", "generated", "modified", "unknown"])
// only "excel" is a pure engine marker. "google" is also a category in Google's vocab
// (the bucket for Sheets-only functions like QUERY, SPARKLINE), so it flows through
// to category derivation rather than getting stripped.
const ENGINE_TAGS = new Set(["excel"])
// quartz tag-parser misreads spreadsheet error literals (#VALUE!, #NUM! etc.) as #tags
const ERROR_NOISE_TAGS = new Set(["NUM", "VALUE", "REF", "NAME", "DIV", "NULL", "N/A", "ERROR"])
// semantic markers — preserved in tags: but never promoted to category. these encode
// orthogonal claims (volatility, undocumented status) that don't fit Google's category vocab.
const SEMANTIC_TAGS = new Set(["volatile", "undocumented"])

// hand-curated overrides for pages absent from lattice TSVs and (for engines) the
// assay manifest. unified so a single edit per outlier covers both axes.
//
// coverage:
//   pending-assay — real function awaiting test fixtures; manifest will eventually win
//   out-of-scope — joke/easter-egg/meta pages, no manifest entry expected
interface OutlierEntry {
  category?: string
  engines?: EnginesMap
  coverage?: CoverageMarker
}

const G_ONLY: EnginesMap = { gsheets: { status: "available" } }
const X_AND_G: EnginesMap = { excel: { status: "available" }, gsheets: { status: "available" } }

// prettier-ignore
const OUTLIER_PAGES: Record<string, OutlierEntry> = {
  // pending assay coverage — both category override (lattice gap) and engines override
  "BAHTTEXT":         { category: "text",        engines: X_AND_G, coverage: "pending-assay" },
  "BINOM.DIST.RANGE": { category: "statistical", engines: X_AND_G, coverage: "pending-assay" },
  "PERCENTIF":        { category: "math",        engines: G_ONLY,  coverage: "pending-assay" },
  "COUNTUNIQUEIFS":   { category: "math",        engines: G_ONLY,  coverage: "pending-assay" },
  "ARRAY_LITERAL":    {                          engines: G_ONLY,  coverage: "pending-assay" },
  "ARRAY_ROW":        {                          engines: G_ONLY,  coverage: "pending-assay" },
  // out-of-scope (joke / wiki-original / meta)
  "AI":               { category: "google",      engines: G_ONLY,  coverage: "out-of-scope" },
  "COINFLIP":         { category: "math",        engines: G_ONLY,  coverage: "out-of-scope" },
  "WHATTHEFOXSAY":    { category: "math",        engines: G_ONLY,  coverage: "out-of-scope" },
  "CURSORPARK":       {                          engines: G_ONLY,  coverage: "out-of-scope" },
  "DUCKHUNT":         {                          engines: G_ONLY,  coverage: "out-of-scope" },
  "RITZCODERZ":       {                          engines: G_ONLY,  coverage: "out-of-scope" },
  "TRIXTERNS":        {                          engines: G_ONLY,  coverage: "out-of-scope" },
  // category-only override (covered by manifest for engines)
  "SINGLE":           { category: "array" },
}

interface OldFM {
  tags?: unknown
  description?: unknown
  title?: unknown
  [k: string]: unknown
}

interface NewFM {
  name: string
  category: string
  // engines + coverage are present only for outlier pages (data layers don't
  // cover them); everything else omits both, letting build-time merge fill in.
  engines?: EnginesMap
  coverage?: CoverageMarker
  syntax?: string
  status: "imported" | "modified"
  description: string
  aliases?: string[]
  tags: string[]
}

type EngineSource = "automatic" | "manual-override" | "uncovered-fallback"

interface Diff {
  filename: string
  rawBefore: string
  after: NewFM
  notes: string[]
  flags: {
    uncategorized: boolean
    noSyntax: boolean
    noDescription: boolean
    errorNoise: boolean
    multiTag: boolean
    status: "imported" | "modified"
    hasInfoCallout: boolean
    inLatticeGsheets: boolean
    inLatticeExcel: boolean
    inManifest: boolean
    categorySource: "lattice" | "tag" | "override" | "uncategorized"
    engineSource: EngineSource
    coverage: CoverageMarker | null
  }
}

// authoritative engine + category map keyed by function name, sourced from
// lattice's spec/reference TSVs. absent entries fall back to tag-derived heuristics.
interface LatticeEntry {
  category?: string
  inGsheets: boolean
  inExcel: boolean
}

function loadManifestNames(): Set<string> {
  if (!existsSync(MANIFEST_PATH)) {
    console.warn(`warning: assay manifest not found at ${MANIFEST_PATH}`)
    console.warn(
      `         outlier classification will be conservative (more pages will get manual overrides).`,
    )
    console.warn(
      `         run \`assay manifest --output ${MANIFEST_PATH}\` first for accurate coverage.`,
    )
    return new Set()
  }
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8")) as {
    version?: unknown
    functions?: Record<string, unknown>
  }
  assertSupportedManifestVersion(raw.version, MANIFEST_PATH)
  return new Set(Object.keys(raw.functions ?? {}))
}

function loadLatticeData(): Map<string, LatticeEntry> {
  const map = new Map<string, LatticeEntry>()
  const ingest = (path: string, key: "inGsheets" | "inExcel") => {
    if (!existsSync(path)) return
    const rows = parseTsv(readFileSync(path, "utf-8"))
    if (rows.length === 0) return
    const [header, ...records] = rows
    const typeIdx = header.indexOf("Type")
    const nameIdx = header.indexOf("Name")
    if (nameIdx < 0) return
    for (const row of records) {
      const name = (row[nameIdx] ?? "").trim()
      if (!name) continue
      const category = typeIdx >= 0 ? (row[typeIdx] ?? "").trim().toLowerCase() : undefined
      // lattice's excel_functions.tsv carries some Google-only rows (QUERY, ARRAYFORMULA
      // etc.) tagged Type=Google; those don't actually exist in Excel and shouldn't claim
      // excel-engine support. drop them on ingest.
      if (key === "inExcel" && category === "google") continue
      const entry = map.get(name) ?? { inGsheets: false, inExcel: false }
      entry[key] = true
      // gsheets is canonical for category since the wiki documents Google's vocabulary
      if (key === "inGsheets" && category) entry.category = category
      map.set(name, entry)
    }
  }
  ingest(join(LATTICE_PATH, "spec/reference/gsheets_functions.tsv"), "inGsheets")
  ingest(join(LATTICE_PATH, "spec/reference/excel_functions.tsv"), "inExcel")
  return map
}

function coerceTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === "string" && v.trim()) return [v.trim()]
  return []
}

function extractSyntax(body: string): { syntax: string | null; via: string } {
  // 1. preferred: ```gse fenced block under ### Syntax
  const gseFence = body.match(/### Syntax\s*\n+```gse\s*\n([\s\S]*?)\n```/m)
  if (gseFence) {
    const first = gseFence[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)[0]
    if (first) return { syntax: first, via: "gse-fence" }
  }
  // 2. any fenced block under ### Syntax (no language)
  const anyFence = body.match(/### Syntax\s*\n+```[a-zA-Z]*\s*\n([\s\S]*?)\n```/m)
  if (anyFence) {
    const first = anyFence[1]
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)[0]
    if (first) return { syntax: first, via: "any-fence" }
  }
  // 3. fallback: first non-blank, non-list, non-table line after ### Syntax (handles broken backticks, bare text)
  const heading = body.match(/### Syntax\s*\n([\s\S]*?)(?=\n###|\n##|$)/m)
  if (heading) {
    for (const line of heading[1].split("\n")) {
      const t = line.trim().replace(/^`+|`+$/g, "") // strip stray backticks
      if (!t) continue
      if (t.startsWith("-") || t.startsWith("*") || t.startsWith("|") || t.startsWith(">")) continue
      if (t.match(/^[A-Z_][A-Z_0-9.]*\s*\(/)) return { syntax: t, via: "first-line" }
    }
  }
  return { syntax: null, via: "none" }
}

function extractInfoUrl(body: string): string | null {
  // > [!INFO] ... [text](URL) — first URL inside the INFO callout block
  const block = body.match(/>\s*\[!INFO\][^\n]*(\n>[^\n]*)*/)
  if (!block) return null
  const url = block[0].match(/\]\(([^)]+)\)/)
  return url?.[1] ?? null
}

function stripInfoCallout(body: string): string {
  return body.replace(/>\s*\[!INFO\][^\n]*(\n>[^\n]*)*\n*/g, "")
}

function extractFirstParagraph(body: string): string | null {
  const stripped = stripInfoCallout(body)
  for (const para of stripped.split(/\n\s*\n/)) {
    const t = para.trim()
    if (!t) continue
    if (t.startsWith("#") || t.startsWith(">") || t.startsWith("```") || t.startsWith("!["))
      continue
    return t.replace(/\s*\n\s*/g, " ").trim()
  }
  return null
}

type EngineDerivation =
  | { source: "automatic" }
  | { source: "manual-override"; engines: EnginesMap; coverage: CoverageMarker }
  | { source: "uncovered-fallback"; engines: EnginesMap; coverage: CoverageMarker }

// engines flow from the data layer when ANY source covers the page; only outliers
// absent from both lattice and manifest persist a hand-authored engines: block.
function deriveEngines(
  name: string,
  inLattice: boolean,
  inManifest: boolean,
  tags: string[],
  infoUrl: string | null,
): EngineDerivation {
  if (inLattice || inManifest) return { source: "automatic" }
  const outlier = OUTLIER_PAGES[name]
  if (outlier?.engines && outlier.coverage) {
    return { source: "manual-override", engines: outlier.engines, coverage: outlier.coverage }
  }
  // safety net — surfaces loudly so any new uncovered page can be added to OUTLIER_PAGES
  const engines: EnginesMap = {}
  if (tags.includes("excel") || infoUrl?.includes("support.microsoft.com")) {
    engines.excel = { status: "available" }
  }
  if (
    tags.includes("google") ||
    infoUrl?.includes("support.google.com") ||
    Object.keys(engines).length === 0
  ) {
    engines.gsheets = { status: "available" }
  }
  return { source: "uncovered-fallback", engines, coverage: "pending-assay" }
}

function deriveCategory(
  name: string,
  tags: string[],
  lattice?: LatticeEntry,
): {
  category: string
  extras: string[]
  source: "lattice" | "tag" | "override" | "uncategorized"
} {
  // semantic tags survive into extras across all paths; they never get promoted to category.
  const stripDrops = (t: string) =>
    !META_TAGS.has(t) && !ENGINE_TAGS.has(t) && !ERROR_NOISE_TAGS.has(t)

  // 1. lattice TSV is authoritative
  if (lattice?.category) {
    const remaining = tags.filter((t) => stripDrops(t) && t.toLowerCase() !== lattice.category)
    return { category: lattice.category, extras: remaining, source: "lattice" }
  }
  // 2. manual overrides for lattice-absent functions
  const outlier = OUTLIER_PAGES[name]
  if (outlier?.category) {
    const cat = outlier.category
    const remaining = tags.filter((t) => stripDrops(t) && t.toLowerCase() !== cat)
    return { category: cat, extras: remaining, source: "override" }
  }
  // 3. tag-derived fallback — only category-eligible tags can promote
  const all = tags.filter(stripDrops)
  const eligible = all.filter((t) => !SEMANTIC_TAGS.has(t))
  if (eligible.length === 0) {
    // semantic tags survive into extras even when no category was inferred
    return { category: "uncategorized", extras: all, source: "uncategorized" }
  }
  const cat = eligible[0].toLowerCase()
  const extras = all.filter((t) => t !== eligible[0])
  return { category: cat, extras, source: "tag" }
}

function processFile(
  filename: string,
  content: string,
  lattice: Map<string, LatticeEntry>,
  manifest: Set<string>,
): Diff {
  const parsed = matter(content)
  const before = parsed.data as OldFM
  const body = parsed.content
  const oldTags = coerceTags(before.tags)
  const name = basename(filename, ".md")
  const latticeEntry = lattice.get(name)
  const inLattice = !!(latticeEntry?.inGsheets || latticeEntry?.inExcel)
  const inManifest = manifest.has(name)

  const errorNoise = oldTags.filter((t) => ERROR_NOISE_TAGS.has(t))
  const unknownDropped = oldTags.includes("unknown")
  const { category, extras, source: categorySource } = deriveCategory(name, oldTags, latticeEntry)
  const { syntax, via: syntaxVia } = extractSyntax(body)
  const infoUrl = extractInfoUrl(body)
  const engineDerivation = deriveEngines(name, inLattice, inManifest, oldTags, infoUrl)
  const status = oldTags.includes("modified") ? ("modified" as const) : ("imported" as const)
  const existingDesc = typeof before.description === "string" ? before.description.trim() : ""
  const description = existingDesc || extractFirstParagraph(body) || ""
  const existingAliases = Array.isArray(before.aliases)
    ? (before.aliases as unknown[]).map(String)
    : []

  const after: NewFM = {
    name,
    category,
    ...(engineDerivation.source !== "automatic"
      ? { engines: engineDerivation.engines, coverage: engineDerivation.coverage }
      : {}),
    ...(syntax ? { syntax } : {}),
    status,
    description,
    ...(existingAliases.length ? { aliases: existingAliases } : {}),
    tags: extras,
  }

  const notes: string[] = []
  const dropped = oldTags.filter((t) => !extras.includes(t))
  if (dropped.length) notes.push(`dropped tags: [${dropped.join(", ")}]`)
  if (errorNoise.length) {
    notes.push(
      `error-noise tags removed (parser quirk on spreadsheet errors): [${errorNoise.join(", ")}]`,
    )
  }
  if (unknownDropped) notes.push(`"unknown" tag treated as meta-marker, not a category`)
  if (syntax) {
    if (syntaxVia !== "gse-fence")
      notes.push(
        `syntax extracted via fallback (${syntaxVia}) — source has broken/missing code fence`,
      )
  } else {
    notes.push(`no syntax extracted — needs manual review`)
  }
  if (!existingDesc && description) notes.push(`description derived from first body paragraph`)
  if (!description) notes.push(`no description (extraction failed) — needs manual entry`)
  if (extras.length > 0) {
    notes.push(
      `multi-category source: kept "${category}" as primary; remainder → tags: [${extras.join(", ")}]`,
    )
  }
  if (existingAliases.length)
    notes.push(`preserved existing aliases: [${existingAliases.join(", ")}]`)
  if (!infoUrl) notes.push(`no INFO-callout upstream URL (likely wiki-original)`)
  if (categorySource === "lattice") notes.push(`category from lattice gsheets TSV`)
  else if (categorySource === "override")
    notes.push(`category from manual override (not in lattice TSV)`)
  else if (categorySource === "uncategorized") notes.push(`uncategorized — needs hand-curation`)
  if (engineDerivation.source === "automatic") {
    const sources: string[] = []
    if (latticeEntry?.inGsheets) sources.push("lattice/gsheets")
    if (latticeEntry?.inExcel) sources.push("lattice/excel")
    if (inManifest) sources.push("assay manifest")
    notes.push(`engines: omitted from source — covered by data layer (${sources.join(", ")})`)
  } else if (engineDerivation.source === "manual-override") {
    notes.push(
      `engines: manual override (coverage=${engineDerivation.coverage}) — not in lattice or manifest`,
    )
  } else {
    notes.push(
      `engines: UNCOVERED FALLBACK (coverage=${engineDerivation.coverage}) — add to OUTLIER_PAGES in script`,
    )
  }

  // raw frontmatter for review (preserves original ordering / formatting)
  const rawBefore = parsed.matter || "(no frontmatter)"

  return {
    filename,
    rawBefore,
    after,
    notes,
    flags: {
      uncategorized: category === "uncategorized",
      noSyntax: !syntax,
      noDescription: !description,
      errorNoise: errorNoise.length > 0,
      multiTag: extras.length > 0,
      status,
      hasInfoCallout: !!infoUrl,
      inLatticeGsheets: !!latticeEntry?.inGsheets,
      inLatticeExcel: !!latticeEntry?.inExcel,
      inManifest,
      categorySource,
      engineSource: engineDerivation.source,
      coverage: engineDerivation.source === "automatic" ? null : engineDerivation.coverage,
    },
  }
}

function formatNewFm(fm: NewFM): string {
  return yaml.dump(fm, { lineWidth: 200, noRefs: true, sortKeys: false }).trimEnd()
}

function renderDiff(d: Diff): string {
  return [
    `### \`${d.filename}\``,
    ``,
    `**before:**`,
    "```yaml",
    d.rawBefore,
    "```",
    ``,
    `**after:**`,
    "```yaml",
    formatNewFm(d.after),
    "```",
    ``,
    ...(d.notes.length ? ["**notes:**", ...d.notes.map((n) => `- ${n}`), ``] : []),
  ].join("\n")
}

function pickSamples(diffs: Diff[]): Diff[] {
  const want = [
    "SUM.md",
    "VLOOKUP.md",
    "QUERY.md",
    "ARRAYFORMULA.md",
    "LAMBDA.md",
    "IMABS.md",
    "BAHTTEXT.md",
  ]
  const out: Diff[] = []
  for (const w of want) {
    const d = diffs.find((d) => d.filename === w)
    if (d) out.push(d)
  }
  const firstUncat = diffs.find((d) => d.flags.uncategorized && !out.includes(d))
  const firstErrNoise = diffs.find((d) => d.flags.errorNoise && !out.includes(d))
  const firstNoSyntax = diffs.find((d) => d.flags.noSyntax && !out.includes(d))
  for (const x of [firstUncat, firstErrNoise, firstNoSyntax]) if (x) out.push(x)
  return out
}

function main() {
  const writeMode = process.argv.includes("--write")
  const lattice = loadLatticeData()
  const manifest = loadManifestNames()
  const files = readdirSync(FN_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
  const sources = new Map<string, string>()
  for (const f of files) sources.set(f, readFileSync(join(FN_DIR, f), "utf-8"))
  const diffs = files.map((f) => processFile(f, sources.get(f)!, lattice, manifest))

  const stats = {
    total: diffs.length,
    uncategorized: diffs.filter((d) => d.flags.uncategorized).length,
    noSyntax: diffs.filter((d) => d.flags.noSyntax).length,
    syntaxFallback: diffs.filter((d) =>
      d.notes.some((n) => n.startsWith("syntax extracted via fallback")),
    ).length,
    noDescription: diffs.filter((d) => d.flags.noDescription).length,
    errorNoise: diffs.filter((d) => d.flags.errorNoise).length,
    multiTag: diffs.filter((d) => d.flags.multiTag).length,
    statusModified: diffs.filter((d) => d.flags.status === "modified").length,
    statusImported: diffs.filter((d) => d.flags.status === "imported").length,
    hasInfoCallout: diffs.filter((d) => d.flags.hasInfoCallout).length,
    aliasesPreserved: diffs.filter((d) => d.after.aliases?.length).length,
    inLatticeGsheets: diffs.filter((d) => d.flags.inLatticeGsheets).length,
    inLatticeExcel: diffs.filter((d) => d.flags.inLatticeExcel).length,
    inManifest: diffs.filter((d) => d.flags.inManifest).length,
    categoryFromLattice: diffs.filter((d) => d.flags.categorySource === "lattice").length,
    categoryFromTag: diffs.filter((d) => d.flags.categorySource === "tag").length,
    categoryFromOverride: diffs.filter((d) => d.flags.categorySource === "override").length,
    enginesAutomatic: diffs.filter((d) => d.flags.engineSource === "automatic").length,
    enginesManualPendingAssay: diffs.filter(
      (d) => d.flags.engineSource === "manual-override" && d.flags.coverage === "pending-assay",
    ).length,
    enginesManualOutOfScope: diffs.filter(
      (d) => d.flags.engineSource === "manual-override" && d.flags.coverage === "out-of-scope",
    ).length,
    enginesUncoveredFallback: diffs.filter((d) => d.flags.engineSource === "uncovered-fallback")
      .length,
  }

  const catHist = new Map<string, number>()
  for (const d of diffs) catHist.set(d.after.category, (catHist.get(d.after.category) ?? 0) + 1)
  const sortedCats = [...catHist.entries()].sort((a, b) => b[1] - a[1])

  const samples = pickSamples(diffs)

  const lines: string[] = []
  lines.push(`# Frontmatter normalization — dry run (phase 1)`)
  lines.push(``)
  lines.push(
    `Generated by \`packages/sheets-wiki/scripts-build/normalize-frontmatter-dryrun.ts\`. Read-only — no \`content/\` files were modified.`,
  )
  lines.push(``)
  lines.push(
    `Schema emitted (v3): \`name\`, \`category\`, \`syntax\` (when extractable), \`status\`, \`description\`, \`tags\`. \`engines\` + \`coverage\` are present only on outlier pages absent from both lattice TSVs and the assay manifest; standard pages omit these fields and let the build-time merge layer populate them. Phase 2 will add \`sources[]\` with upstream-hash population.`,
  )
  lines.push(``)
  lines.push(`## Stats`)
  lines.push(``)
  lines.push(`| signal | count | of total |`)
  lines.push(`|---|---:|---:|`)
  for (const [k, v] of Object.entries(stats)) {
    const pct = k === "total" ? "" : `${((v / stats.total) * 100).toFixed(1)}%`
    lines.push(`| ${k} | ${v} | ${pct} |`)
  }
  lines.push(``)
  lines.push(`## Category histogram`)
  lines.push(``)
  for (const [c, n] of sortedCats) lines.push(`- \`${c}\`: ${n}`)
  lines.push(``)
  lines.push(`## Spot-check samples`)
  lines.push(``)
  for (const d of samples) lines.push(renderDiff(d))
  lines.push(``)
  lines.push(`## Edge-case lists`)
  lines.push(``)
  const listOrEmpty = (xs: Diff[]) =>
    xs.length ? xs.map((d) => `- ${d.filename}`).join("\n") : "(none)"
  lines.push(`### Uncategorized (${stats.uncategorized})`)
  lines.push(listOrEmpty(diffs.filter((d) => d.flags.uncategorized)))
  lines.push(``)
  lines.push(`### No syntax extracted (${stats.noSyntax})`)
  lines.push(listOrEmpty(diffs.filter((d) => d.flags.noSyntax)))
  lines.push(``)
  lines.push(`### No description after derivation (${stats.noDescription})`)
  lines.push(listOrEmpty(diffs.filter((d) => d.flags.noDescription)))
  lines.push(``)
  lines.push(`### Error-noise tags dropped (${stats.errorNoise})`)
  lines.push(listOrEmpty(diffs.filter((d) => d.flags.errorNoise)))
  lines.push(``)
  lines.push(`### Multi-tag (extras kept) (${stats.multiTag})`)
  lines.push(listOrEmpty(diffs.filter((d) => d.flags.multiTag)))
  lines.push(``)
  lines.push(`### Manual engine overrides — pending-assay (${stats.enginesManualPendingAssay})`)
  lines.push(
    listOrEmpty(
      diffs.filter(
        (d) => d.flags.engineSource === "manual-override" && d.flags.coverage === "pending-assay",
      ),
    ),
  )
  lines.push(``)
  lines.push(`### Manual engine overrides — out-of-scope (${stats.enginesManualOutOfScope})`)
  lines.push(
    listOrEmpty(
      diffs.filter(
        (d) => d.flags.engineSource === "manual-override" && d.flags.coverage === "out-of-scope",
      ),
    ),
  )
  lines.push(``)
  lines.push(
    `### Uncovered fallback — needs OUTLIER_PAGES entry (${stats.enginesUncoveredFallback})`,
  )
  lines.push(listOrEmpty(diffs.filter((d) => d.flags.engineSource === "uncovered-fallback")))
  lines.push(``)
  lines.push(`## All proposed diffs`)
  lines.push(``)
  lines.push(`<details><summary>${stats.total} files (collapsed by default)</summary>`)
  lines.push(``)
  for (const d of diffs) lines.push(renderDiff(d))
  lines.push(``)
  lines.push(`</details>`)
  lines.push(``)

  mkdirSync(dirname(REPORT_PATH), { recursive: true })
  writeFileSync(REPORT_PATH, lines.join("\n"))

  console.log(`wrote ${REPORT_PATH}`)
  console.log(`stats: ${JSON.stringify(stats, null, 2)}`)

  if (writeMode) {
    let written = 0
    for (const d of diffs) {
      const original = sources.get(d.filename)!
      const body = matter(original).content
      // js-yaml emits trailing \n; matter format expects ---\n<yaml>---\n<body>
      const fmYaml = formatNewFm(d.after)
      const next = `---\n${fmYaml}\n---\n${body}`
      const path = join(FN_DIR, d.filename)
      if (next !== original) {
        writeFileSync(path, next)
        written++
      }
    }
    console.log(`--write: rewrote ${written} of ${diffs.length} files`)
  } else {
    console.log(`(read-only — pass --write to mutate content/function/*.md)`)
  }
}

main()
