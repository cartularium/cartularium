# Wiki contribution brief — cross-engine upgrade from the 2026-07-11 deep dive

You are one agent in a fan-out contributing to **sheets.wiki** (packages/sheets-wiki/content/).
The maintainer reviews everything after the fact — write publishable drafts, not memos.

## Worktrees (two — don't mix them up)

- **THIS worktree (write here):** `/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-contrib/`
  — wiki content lives at `packages/sheets-wiki/content/{concept,function,guide}/`.
- **SOURCE worktree (read-only evidence):** `/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/`
  — `deep-dive-2026-07-11/` (START: SYNTHESIS.md; then batches/_/notes/_.md, batches/_/annotations.json,
  probes/excel-lane-notes.md, probes/gsheets-lane-notes.md, probes/_-results.json) and the assay
  corpus (`packages/assay/{tests,fixtures,divergences}`).

## Read before writing (in this order)

1. `packages/sheets-wiki/content/about/Style Guide.md` and `about/Unofficial terminology.md` (THIS worktree)
2. 2–3 existing pages of the kind you'll touch (e.g. `concept/Type coercion.md`, `function/SEQUENCE.md`)
3. Your assigned deep-dive material (SOURCE worktree)

## Content rules

- **Ground every claim.** Only state what the deep-dive notes / probe results / assay fixtures
  support, or what an existing wiki page already says. Cite assay evidence inline in plain text,
  e.g. `(assay: ISBLANK/isblank-empty-string)` or `(live probe, 2026-07-11)`. Do NOT invent a
  citation syntax. Claims about LibreOffice/Lattice rest on recorded fixtures only — several
  LibreOffice suites are known blank-capture artifacts (SYNTHESIS.md) — so avoid LibreOffice
  claims sourced from suites flagged as artifacts.
- **Voice:** the wiki's primary audience is Google Sheets users, but these upgrades exist to make
  it cross-engine. Keep gsheets as the default voice of a page; add cross-engine truth in a
  dedicated section (below). Editorial verdicts are allowed ("this is a known HyperFormula gap").
- **The standard cross-engine section** — use exactly this heading on function pages:
  `### Engine compatibility`, containing (a) a short prose statement of where the portable core
  ends, and (b) a table `| Engine | Behavior |` (rows: Google Sheets, Excel, then open engines
  where data exists: HyperFormula, IronCalc, formulas, pycel, LibreOffice, Lattice — omit rows
  with no data rather than guessing).
- **Frontmatter:** preserve ALL existing frontmatter keys on existing pages (name/category/
  syntax/status/description/tags). You may append tags. New concept pages get the same
  frontmatter shape as existing concept pages (`tags:` list). Build tooling reads function-page
  frontmatter — do not restructure it.
- **Wiki syntax:** `[[wikilinks]]` (link generously — concepts, functions), `gse` code blocks,
  callouts (`> [!WARNING]`, `> [!INFO]`, `> [!NOTE]`), markdown tables.
- **Terminology license:** where no term exists for a behavior, coin one. Requirements: check
  `concept/` and `about/Unofficial terminology.md` for an existing term first; put the
  unofficial-terminology WARNING callout on any page that leans on a coined term (match how
  `concept/Data type.md` does it); and log EVERY coined or redefined term in
  `TERMINOLOGY-PROPOSALS-<your-agent-name>.md` at THIS worktree's root — one line per term:
  the term, where used, one-sentence definition, one-line rationale. The maintainer reviews these.
- **Corrections:** when you correct an existing statement, correct it in place (no strikethrough
  archaeology) — but log each correction in your terminology-proposals file under a
  `## Corrections` heading (page, was → now, evidence).

## Live probing (optional, pure engines ONLY)

The SOURCE worktree's assay package is built. From
`/Users/jaegun/personal/cartularium/.claude/worktrees/wiki-deep-dive/packages/assay`:
write `scratch/wiki-<your-agent-name>-*.mts`, then `npx tsx scratch/wiki-<...>.mts`:

```ts
import { createDriver } from "@cartularium/drivers"
const d = createDriver("hyperformula") // hyperformula | ironcalc | formulas | pycel — NOTHING ELSE
await d.init()
console.log(
  JSON.stringify(
    await d.evaluateBatch([{ formula: "=..." }, { formula: "=A1+1", grid: { A1: 3 } }]),
    null,
    1,
  ),
)
```

**NEVER** excel / gsheets / libreoffice / lattice. If a claim needs Excel/gsheets confirmation
you don't have, state it with the hedge the evidence supports or leave it out.

## Hard rules

- Write ONLY: your assigned pages (listed in your task message), new pages within your assigned
  scope, and your own `TERMINOLOGY-PROPOSALS-<agent>.md`. Never touch another agent's pages.
- Never `git add` / `git commit`. Never edit anything outside `packages/sheets-wiki/content/`
  in THIS worktree (except your terminology file at the root).
- Prettier formats this repo — don't fight it; plain clean markdown.

## Final message back

Counts (pages edited, pages created, terms coined, corrections made) + a one-line description of
each NEW page and each significant correction.
