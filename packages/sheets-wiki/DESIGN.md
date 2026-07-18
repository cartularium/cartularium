# sheets.wiki Design

> Sheets.wiki specializes the [Cartularium Brand Kernel](../brand/BRAND.md). Read that first.

## Identity

Sheets.wiki is the wiki / encyclopaedia volume in the cartularium imprint. It documents spreadsheet practice — functions, concepts, techniques, opinion — for practitioners. Currently Google-Sheets-canonical, with engine-aware infrastructure ready for Excel, Lattice, and additional engines as content arrives.

## URL scheme

One privileged content type, one rule for everything else.

| Pattern | Example | Content type |
|---|---|---|
| `/{FUNC}` | `/QUERY`, `/SUM`, `/VLOOKUP` | Function reference |
| `/concept/{slug}` | `/concept/Array`, `/concept/Type-coercion` | Concept reference |
| `/guide/{slug}` | `/guide/array-patterns` | Long-form guide |
| `/blog/{slug}` | `/blog/bad-practice` | Essay |
| `/project/{name}` | `/project/anduin` | Project landing |
| `/people/{slug}` | `/people/astral` | Contributor bio |
| `/about/{slug}` | `/about/contributing` | Site meta |
| `/{engine}/{FUNC}` | `/excel/XLOOKUP` | Engine-specific override (rare) |

Functions get the bare URL because (1) they're SHOUTY_CASE and inherently namespaced, (2) they're the URL form pasted in help fora, and (3) they're 80%+ of the corpus. Everything else takes a typed prefix — consistent rule, no per-collision discretion.

Old `/docs/{slug}` URLs redirect to canonical via Quartz's `AliasRedirects` plugin.

## Folder layout

```
content/
  function/           # 500+ function pages → /<FUNC>
  concept/            # ~30 concept pages → /concept/<slug>
  guide/              # long-form guides → /guide/<slug>
  blog/               # essays → /blog/<slug>
  project/            # projects → /project/<name>
  people/             # contributor bios → /people/<slug>
  about/              # site meta → /about/<slug>
  _sources/           # not routed; raw imported upstream
    function/
      gsheets/        # last-imported Google docs snapshots
      excel/          # last-imported Microsoft docs snapshots
      community/      # community contributions, pre-merge
  _index.md           # /
```

Editorial folder structure can stay deep — e.g. `function/excel/XLOOKUP.md` for a rare engine-override page — without affecting URLs. Slug rewriting handles flatness.

`archive/` and `misc/` are gone. The single archived page (Classic LAMBDA UDTs) is re-homed under `concept/` with an `archived` tag. `misc/` becomes `about/`.

## Function page: single-file model

Most functions get exactly one file → one URL → one page. Engine differences live as anchored sections inside that page, not as separate files.

````markdown
---
title: SUM
category: math
description: Returns the sum of a series of numbers and/or cells.
engines:
  gsheets: { available: true, source: https://support.google.com/docs/answer/3093669 }
  excel:   { available: true, source: https://support.microsoft.com/... }
  lattice: { available: true }
divergences: [DV-0103]
---

# SUM

[engine-support badge row, generated from frontmatter]

Returns the sum of a series of numbers and/or cells.

## Sample usage

{{assay SUM/sum-range}}

```gse
=SUM(A2:A100)
```

## Syntax

`SUM(value1, [value2, ...])`

## Notes
...

## Engine-specific behavior

### Google Sheets {#gsheets}
Accepts any number of args (max 30 per spec, no enforced limit).

### Excel {#excel}
Accepts up to 255 args.
````

URLs: `/SUM`, `/SUM#gsheets`, `/SUM#excel` — all from one file.

**Two files for one function only when** the same name has fundamentally different signatures or semantics across engines. Decision rule: if you'd need to write separate "Sample usage" and "Syntax" sections without any unification, split. Otherwise one page. Expect <20 of ~500 to require splitting. When split, the canonical lives at `/XLOOKUP`, the override at `/excel/XLOOKUP`, and both link each other in the engine-badge row.

**Engine-only functions** (BAHTTEXT in Excel, QUERY in Sheets) stay one file at the bare URL with `available: false` for the missing engines.

## Frontmatter schema

```yaml
---
title: <FUNC>                       # required
category: math|logical|lookup|text|date|financial|engineering|array|database|parser|web
description: <one-liner>            # used in OG meta and search snippets
engines:
  <engine>:
    available: true | false
    source: <url to upstream docs>
    behaviorMatches: canonical | <DV-####>
divergences: [DV-####]              # cross-link to assay catalogue
tags: [function, generated, ...]    # existing tag system continues
---
```

Existing 500 pages default to `engines: { gsheets: { available: true } }` and don't get touched. Cross-engine annotations are added page-by-page as Excel/Lattice content actually arrives.

## Source sidecar

Raw imported upstream content lives in `_sources/`, not routed. Tooling can:

- Diff `_sources/function/gsheets/SUM.md` against canonical `function/SUM.md` to surface "upstream changed; here's what" so an editor decides whether to re-merge.
- Re-import without touching authored content.
- Cite a permalinked snapshot from the canonical page.

If `_sources/` becomes too noisy in-repo, lift to a sibling `sheets-wiki-sources` repo with no other change to the public site.

## Assay integration

Sheets.wiki and assay are sibling reference works in the cartularium imprint. They share the engine palette, the design language, and ideally the data — function-availability, divergences, and verified examples flow from assay into sheets.wiki at build time.

### Data flow: manifest, not submodule

Assay emits a v4 manifest at `assay.sheets.wiki/manifest.json` with function entries plus public test refs:

```json
{
  "version": 4,
  "generatedAt": "2026-04-25T12:00:00Z",
  "tests": {
    "SUM/sum-range": {
      "ref": "SUM/sum-range",
      "subject": "SUM",
      "subjectRef": "SUM",
      "name": "sum-range",
      "suite": "math",
      "hash": "sha256:...",
      "url": "/test/SUM/sum-range/",
      "engines": { "gsheets": "match", "excel": "match" }
    }
  },
  "aliases": {},
  "tombstones": {},
  "hashes": { "sha256:...": "SUM/sum-range" },
  "functions": {
    "SUM": {
      "engines": {
        "gsheets": { "status": "available" },
        "excel": { "status": "available" },
        "lattice": { "status": "available" },
        "pycel": { "status": "missing", "via": "DV-0001" }
      },
      "divergences": [],
      "tests": ["SUM/sum-range", "SUM/literal-args"]
    },
    "BAHTTEXT": {
      "engines": { "excel": { "status": "available" }, "gsheets": { "status": "missing" } }
    }
  }
}
```

Sheets.wiki's build step fetches this with on-disk cache + offline fallback and uses it to:

1. Override or supplement frontmatter `engines:` blocks with assay's authoritative data.
2. Generate divergence backlinks at the bottom of each function page.
3. Resolve explicit `{{assay REF}}` evidence links (next section).

**Why manifest, not submodule.** A submodule pulls assay's full build chain into sheets.wiki, which is heavy and makes the build brittle for content-only contributors. The manifest is a few hundred KB, cacheable, and lets sheets.wiki build offline. If we later need stronger coupling — e.g. shared test sources for the spreadsheet-data fence — upgrade to a submodule of an exported `assay/published/` subdirectory rather than the whole repo.

### Linkable test examples

Function pages can cite assay evidence inline:

````markdown
{{assay SUM/sum-range}}

```gse
=SUM(A2:A100)
```
````

At build time the assay-ref transformer resolves the public ref or alias through Manifest v4 and emits a link using the manifest-provided URL, for example `https://assay.sheets.wiki/test/SUM/sum-range/`. Public builds fail on unknown refs, preview refs, tombstoned refs, or manifest load failures.

### Bidirectional linking

- Sheets.wiki function pages link out to `assay.sheets.wiki/dv/DV-####` for any divergence affecting the function.
- Assay's DV pages and (forthcoming) test pages link back to `sheets.wiki/<FUNC>` for each subject. Subject pills already partially do this; only the URL pattern needs updating.

### Coordinated changes (assay side)

Three additions on assay, in priority order. Each lands incrementally; sheets.wiki uses what's available and degrades gracefully.

1. **Manifest emit**: `assay manifest` command, included as part of the catalogue site build.
2. **Per-test pages**: `assay catalogue` emits `/test/<subjectRef>/<name>/` for every test, with the formula, fixtures per engine, and any owning DVs.
3. **Bidirectional subject links**: DV and test pages link to `sheets.wiki/<FUNC>` for each subject.

## Specialization to the brand kernel

Inherits everything from `BRAND.md`. Adds sheets.wiki-specific elements:

- **Function-page layout.** Signature in mono at top, engine-support row immediately under title, params as a definition list (`<dl>`), examples in spreadsheet-data fence, then notes / engine-specific behavior / see-also.
- **Spreadsheet-data fence** (```` ```sheet ````). Renders an actual gridded cell view with column letters and row numbers; used in examples instead of plain markdown tables. Custom remark/rehype plugin to be built. Designed forward-compatible for live in-browser evaluation via Lattice WASM later.
- **Subtle spreadsheet-grammar accent.** Section dividers in long pages may use a single mono eyebrow with a column-letter motif — `§ A · examples`, `§ B · troubleshooting`. Restrained, ≤1 per page. The only place we let the spreadsheet metaphor leak into chrome.
- **Drops Quartz's graph view.** It does not earn its keep on a 500+ page reference; reads as Obsidian-vault, not publisher-press.
- **Replaces Quartz's flat explorer** with a category-grouped sidebar for function pages (math / logical / lookup / text / date / financial / engineering / array / database / parser / web), plus flat lists for everything else.
- **Adopts assay's theme-toggle** verbatim (sun/moon, hairline border).

## Implementation roadmap

In order, each independently shippable.

1. **URL slug rewrite + redirects.** ✅ `SheetsWikiSlugs` transformer + `computeUrlMapping` util. Old `/docs/<FUNC>` redirects to `/<FUNC>`; concept/guide/about pages get typed prefixes; INDEX uses folder-URL form to avoid case collision with the homepage on case-insensitive filesystems.
2. **Folder reorganization.** ✅ `content/docs/` → `function/` + `concept/`; `guides/` → `guide/`; `misc/` → `about/`; `archive/` folded into `concept/`.
3. **Cartularium data aggregator.** ✅ `CartulariumData` transformer reads lattice's TSVs (categories + gsheets/excel availability) and assay's raw divergences/tests at build time, merges into each function page's frontmatter without overriding explicit page-level values. Swapping in assay's manifest later is a one-call change in `loadFunctionData`. Replaces the originally planned static frontmatter migration.
4. **Design port.** Replace `quartz/styles/{base,custom,variables}.scss` with the kernel-derived stylesheet. Port engine and cause tokens. Update layout components. Drop graph view; replace flat explorer with category-grouped sidebar for function pages.
5. **Spreadsheet-data fence plugin.** Custom remark/rehype plugin for ```` ```sheet ```` blocks.
6. **Function-page template normalization.** Apply canonical structure across function pages — consolidate redundant Syntax sections, strip Google Help artifacts (the `w800` image URLs, the duplicated parameter lists, etc.).
7. **Assay manifest fetch.** Once assay emits `manifest.json` (see [`@cartularium/contracts/ASSAY-INTEGRATION.md`](../contracts/ASSAY-INTEGRATION.md)), point `CARTULARIUM_ASSAY_MANIFEST` at the published URL with on-disk cache. The aggregator already supports this path; only config changes.
8. **Assay evidence refs.** `{{assay <public-ref>}}` resolves through Manifest v4 to inline evidence links using manifest-provided URLs.
