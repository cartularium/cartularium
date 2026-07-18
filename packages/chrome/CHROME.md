# Chrome Design — cartularium imprint

> Cross-property chrome (top bar, navigation, ToC, related-content drawer, page-level affordances). Specializes [BRAND.md](../brand/BRAND.md) and constrains the per-property [DESIGN.md](../sheets-wiki/DESIGN.md). Where a decision applies to one property only it's marked.
>
> v2 — incorporates first-pass review feedback. v1 in git history.

## Purpose

The chrome surfaces — top bar, navigation, table of contents, related-content drawer, footer attribution — were ported into sheets.wiki as direct equivalents of Quartz's defaults rather than designed. This doc resolves the chrome as a coherent system across the cartularium imprint *before* a code overhaul, so the package boundaries and runtime coupling are settled before churn lands across multiple repos.

## Properties governed

| Property | Status | Stack |
|---|---|---|
| sheets.wiki | live | Quartz fork → preact |
| assay.sheets.wiki | live | Python + Jinja + vanilla JS |
| cartularium.org | near-future | TBD |
| formulary.dev | near-future | TBD |
| latlang.org (lattice docs) | near-future | TBD — language-doc scope, broader than function reference |
| lattice (IDE chrome) | excluded | medium-appropriate exception per BRAND.md |

The chrome system has to work for the property-stack heterogeneity above without forcing every property onto one frontend framework.

## Package shape — `@cartularium/chrome`

A new package, sibling to `@cartularium/brand`. Distributes **primitives** rather than framework components:

```
packages/chrome/
  package.json
  README.md
  templates/
    topbar.html           # markup template, mustache-style placeholders
    drawer.html           # mobile drawer markup
    related.html          # related-content drawer markup
    toc-rail.html         # right-rail ToC (function/concept content)
    toc-gutter.html       # left-gutter ToC + sidenote scaffold (blog/guide content)
    toc-fab.html          # mobile floating action button + bottom-sheet
    error-404.html        # 404 page chrome (see Known follow-ups)
  styles/
    chrome.scss           # all chrome SCSS, imports brand tokens
    print.scss            # print stylesheet (see Known follow-ups)
  scripts/
    chrome.js             # vanilla JS: theme, drawer, dropdown, IO for ToC active state, FAB toggle
    sidenotes.js          # blog/guide marginalia footnote system
  data/
    imprints.json         # cross-property registry (host → property metadata)
  scripts-build/
    sync-to-assay.sh      # vendored-copy sync for non-Node consumers
  index.ts                # exports template strings, JSON registries, script URLs
```

### Why primitives, not preact components

Each property's templating layer renders the template string using its own substitution mechanism (Jinja for assay, a thin preact wrapper for sheets-wiki, whatever for cartularium.org / formulary.dev). The SCSS and JS are imported once per property; the markup is the only thing the property's templating layer touches.

This keeps `@cartularium/brand` zero-runtime (tokens + fonts only) and avoids forcing a JS framework on assay's Python pipeline. The primitives package is upgradeable to a web component later (`<cartularium-topbar>`) without changing the consumer API — the props become attributes.

### Template substitution contract

Templates use a **mustache subset** — `{{key}}`, `{{#section}}…{{/section}}`, `{{^empty}}…{{/empty}}`, no partials, no functions. This subset is renderable in both Jinja (via `pystache`) and preact (via a 30-line render function). Escaping is the consumer's responsibility — templates use `{{{raw}}}` for already-escaped HTML and `{{escaped}}` otherwise; consumer renderers map these to their native escape rules.

**Templates do not embed nav HTML.** Nav items are passed as data and the template iterates:

```html
<!-- topbar.html (excerpt) -->
<header class="cartularium-topbar">
  <a class="wordmark" href="{{wordmark.href}}">{{wordmark.label}}</a>
  <span class="spacer"></span>
  <nav class="topbar-nav">
    {{#nav.items}}
    <a href="{{href}}" {{#active}}class="active"{{/active}}>{{label}}</a>
    {{^last}}<span class="sep">·</span>{{/last}}
    {{/nav.items}}
  </nav>
  <button class="search-btn" data-search-trigger>
    {{search.label}} <span class="key">{{search.key}}</span>
  </button>
  <button class="theme-btn" data-theme-toggle aria-label="toggle theme">{{theme.icon}}</button>
</header>
```

**Worked Jinja consumer (assay)**:

```python
# in assay's build pipeline
import pystache
from cartularium_chrome import TOPBAR_TEMPLATE  # vendored

context = {
    "wordmark": {"href": "/", "label": "assay"},
    "nav": {"items": [
        {"href": "/divergences", "label": "divergences", "active": current_section == "div"},
        {"href": "/tests",       "label": "tests",       "active": current_section == "tests"},
        ...
    ]},
    "search": {"label": "search", "key": "⌘K"},
    "theme": {"icon": "☾"},
}
# mark last item to suppress trailing separator
context["nav"]["items"][-1]["last"] = True
topbar_html = pystache.render(TOPBAR_TEMPLATE, context)
```

**Worked preact consumer (sheets-wiki)**:

```tsx
// quartz/components/TopBar.tsx
import { TOPBAR_TEMPLATE } from "@cartularium/chrome"
import { renderMustache } from "@cartularium/chrome/render-preact"

export const TopBar = ({ currentSection }) => {
  const html = renderMustache(TOPBAR_TEMPLATE, {
    wordmark: { href: "/", label: "sheets.wiki" },
    nav: { items: NAV_ITEMS.map((it, i, all) => ({
      ...it,
      active: it.section === currentSection,
      last: i === all.length - 1,
    })) },
    search: { label: "search", key: "⌘K" },
    theme: { icon: "☾" },
  })
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
```

Both renderers produce identical markup; the SCSS and `chrome.js` are loaded once and operate on that markup unchanged. `data-*` attributes are the JS hookup points, never class names — class names are styling only.

## Top bar

### Structure

```
[wordmark]   …spacer…   [nav]   [search]   [theme]
```

Single row, hairline rule below, lives at the top of every page on every property. **No top-bar property pill** — imprint attribution lives in the footer (per BRAND.md's existing pattern), and cross-property navigation is exposed via the mobile drawer's "other cartularium volumes" section and via inline link decoration. The top bar stays focused on the current property.

- **Wordmark.** Property name in Fraunces 480, opsz 36, lowercase. Links to property home.
- **Nav.** Property-specific link set. For sheets-wiki: `functions · concepts · guides · blog · projects`. Five primary destinations only; utility links (`about`, `github ↗`) live in the footer. Monospace, lowercase, dot separators between items. Active item gets accent color + hairline underline.
- **Search.** Trigger button (hairline border). Click opens the property's search overlay. On mobile, search collapses into the drawer.
- **Theme toggle.** Sun/moon, hairline button. Adopted from assay verbatim.

### DOM placement

The chrome top bar is a direct child of `.page` (the editorial-width container), not a child of `.center` (the article column). This makes its width invariant across content kinds: function pages with no sidebars and blog pages with sidebars both have the same top-bar width, equal to `.page`'s width. Without this lift, `.center` contracts when sidebars are populated and the top bar would visibly shift between page kinds.

### Mobile (< 720px)

Wordmark stays left. Nav, search, theme collapse behind a hamburger; tapping reveals a right-side drawer with:

- Search field at top (full-width, autofocus).
- Nav links as a stacked list, eyebrow-styled.
- "Other cartularium volumes" section: list of imprint properties (sourced from `imprints.json`).
- Theme toggle pinned to the bottom.

The drawer is `position: fixed`, paper background, hairline left rule, 280px wide. Closes on link tap, scrim tap, escape key. Body scroll is locked while drawer is open via `overflow: hidden` on `<html>`.

### Mobile breakpoint

720px (not 1024px) because the desktop nav fits comfortably down to ~720px before wrapping. The right-rail ToC has its own (higher) breakpoint at 1124px — see ToC section.

## Cross-property linking

Cross-property links are styled differently in different contexts to match what the reader is doing.

### Inline prose

A link to a different cartularium property in the body of an article gets the same treatment as any external link: `↗` arrow at the end, `title` attribute disclosing the imprint. **No pill.** Pills in the middle of paragraphs were trialed in v1 and read as noise — most readers don't care about imprint structure mid-sentence; they care about whether the link is on-site or off-site, and `↗` already says that.

### Structural contexts (gets the pill)

The cross-property pill is reserved for contexts where the imprint distinction is informational:

- **Related-content drawer entries.** Each DV / test entry is identifiably an assay record, not a sheets.wiki one.
- **Engine-badge anchors** (when they go to assay).
- **See-also lists** in article bodies (the structural list, not inline prose).
- **Mobile drawer's "other cartularium volumes" list.**
- **Footer attribution line** (`part of cartularium ↗`).

In these contexts the pill is small monospace, hairline border, takes the property color from `imprints.json`. It's a structural label, not a decoration.

### Registry: `imprints.json`

```json
{
  "version": 1,
  "imprints": {
    "cartularium.org":   { "label": "cartularium",  "slug": "cartularium" },
    "sheets.wiki":       { "label": "sheets.wiki",  "slug": "sheets-wiki" },
    "assay.sheets.wiki": { "label": "assay",        "slug": "assay" },
    "formulary.dev":     { "label": "formulary",    "slug": "formulary" },
    "latlang.org":       { "label": "latlang",      "slug": "latlang" }
  }
}
```

Hosts match exact (no wildcard).

### Distributing the registry to non-Node consumers

`@cartularium/chrome` is a Node package; assay is Python. Three options:

| Option | Description | Drift risk |
|---|---|---|
| Vendored copy + sync script | Assay checks in a copy of `imprints.json`; CI runs `sync-to-assay.sh` (which copies from the Node package) on chrome version bumps | low if CI enforces |
| HTTP fetch at build | Assay fetches from the published chrome package URL | medium — manifest fetches fail |
| Sibling Python package | `cartularium-chrome-py` mirrors the Node package | high — maintenance overhead |

**Recommendation: vendored copy + sync script.** CI step (`tools/sync-imprints.sh`) copies `packages/chrome/data/imprints.json` to `packages/assay/cartularium_chrome/imprints.json` on every chrome version bump; CI fails if the vendored copy is stale relative to the package version. Assay reads its vendored copy at build time. Drift is detected, not silently tolerated.

This pattern generalizes — when `engines.json` or any other registry is added to chrome, the same sync step copies it.

### Rehype rewriter (sheets-wiki side)

Quartz emits relative anchors (`/QUERY`, `concept/Array`, resolved wikilinks). Rehype HAST anchor nodes carry the raw `href` string, not a parsed URL. The rewriter resolves relative hrefs against a **config-injected origin**:

```ts
// quartz.config.ts
export default {
  ...,
  cartulariumChrome: {
    canonicalOrigin: "https://sheets.wiki",
    imprintsPath: "node_modules/@cartularium/chrome/data/imprints.json",
  },
}

// in the rewriter plugin
const url = new URL(anchor.properties.href, ctx.canonicalOrigin)
if (url.host !== currentHost && imprints[url.host]) {
  // structural-context check — see "Where to apply"
  decorateWithPill(anchor, imprints[url.host])
}
```

The plugin emits a build warning when a link points to a non-imprint host with a `*.cartularium.*` pattern (`*.sheets.wiki` other than the registered ones, etc.) — useful catch for unregistered new properties.

### Where to apply

The rewriter only decorates links inside structural-context CSS selectors: `.related-drawer a`, `.engine-badges a`, `.see-also a`, `.mobile-drawer .imprint-list a`. Inline prose links are skipped — they get the sigil treatment described below.

### Sigil convention — `→` vs `↗`

Two arrows do different work and should not be conflated:

| Sigil | Meaning | Used for |
|---|---|---|
| `→` | "next door, same imprint" | links that cross to another cartularium property (assay, formulary, latlang, cartularium.org) |
| `↗` | "leaving the building" | links that go to a fully external host (Google docs, Microsoft docs, GitHub repos, blog posts on third-party sites) |

The diagonal arrow says "off the imprint"; the right arrow says "still in cartularium, just another volume." The cost of disambiguation is small (one glyph swap); the signal is real for readers who care whether they're staying inside the publisher's series.

**Implementation:** the rehype rewriter uses `imprints.json` to decide which sigil applies. `link.host in imprints && link.host !== currentHost` → emit `<span class="sigil-int"></span>`. Otherwise (and the link has `host && host !== currentHost`) → emit `<span class="sigil-ext"></span>`. Same-host links emit nothing.

**Visual normalisation.** IBM Plex Sans renders `→` (U+2192) noticeably heavier than `↗` (U+2197) — the difference reads as inconsistent typographic weight rather than meaningful contrast. `chrome.scss` normalises both via:

```scss
.sigil-int, .sigil-ext {
  display: inline-block;
  font-size: 0.85em;
  opacity: 0.6;
  margin-left: 0.2em;
}
.sigil-int::before { content: "→"; }
.sigil-ext::before { content: "↗"; }
a:hover .sigil-int, a:hover .sigil-ext { opacity: 0.9; }
```

The 85% size + 60% opacity pulls both sigils visually behind the link text — they're chrome, not content.

When the cartularium logomark is commissioned (BRAND.md known follow-up), the within-imprint sigil swaps from `→` to a tiny logomark glyph. The CSS rule's `content:` is the one place to change.

### Adding a new imprint

Add to `imprints.json` → bump chrome version → properties pull updated dep → CI's sync-script enforces vendored copies are up-to-date. Cost is small; benefit is the imprint set is a single source of truth.

## Table of contents — three presentations by content kind and viewport

The v1 doc had one ToC pattern. Reality: function/concept pages need *navigation* (jump to a specific section), blog/guide pages need *reading flow with optional reference*. Different patterns serve each.

### Function / concept pages

**Desktop (≥ 1124px): floating right-rail.** Right of the 800px content column, in the otherwise-empty viewport space.

```scss
.article-host {
  display: grid;
  grid-template-columns:
    minmax(1rem, 1fr)        // left margin
    minmax(0, 800px)         // content
    minmax(240px, 280px)     // toc rail
    minmax(1rem, 1fr);       // right margin
}
@media (max-width: 1123px) {
  .article-host { grid-template-columns: 1fr minmax(0, 800px) 1fr; }
  .col-toc { display: none; }  // inline + FAB take over
}
```

The `minmax` on the rail prevents the 1024–1124px dead zone where the rail would render too narrow to be readable. ToC vanishes entirely below 1124px and inline + mobile FAB take over.

```scss
.rail-toc {
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;       // scrolls within itself for long ToCs
  border-left: 1px solid var(--rule);
  padding-left: 1rem;
}
```

Active section highlighted via IntersectionObserver (in `chrome.js`). Active entry: accent color + hairline left-border + tinted background.

**Narrow / mobile (< 1124px): inline collapsed + mobile FAB.**

- **Inline at top of article**, default state by ToC length:
  - 0–2 headings: suppressed.
  - 3–8 headings: expanded.
  - 9+ headings: collapsed.
- **Mobile FAB** (≤ 720px): floating "contents ▾" pill at bottom-right, monospace eyebrow style, hairline border, paper background. Hidden until article-title scrolls out of viewport (IO trigger). Tap opens a bottom-sheet with the full ToC. Pattern matches MDN mobile docs — the user can navigate mid-article without scrolling back to the top.

The FAB closes on entry tap, scrim tap, or swipe-down.

### Blog / guide pages

**Left-gutter ToC + scroll indicator + sidenote footnotes.** Pattern is LessWrong's reading-mode chrome, faithfully adapted (not a popout — the gutter is *always present in the layout*):

- The gutter occupies its own grid track on the left of the content column. A vertical hairline plus a subtle tick at each heading position. The current scroll position is rendered as a small accent block on the line, *always visible*.
- **Section labels render to the right of each tick**, positioned at the heading's actual y-position in the article. Default state: low opacity (~0.35). The whole gutter (line + ticks + labels) fades up to full opacity when the cursor enters the gutter region.
- 220ms ease in; 500ms grace + 320ms ease out so brief cursor passes don't trigger.
- Active section (the one currently in view, per IntersectionObserver) keeps its label at full opacity even when the gutter is otherwise faded — orientation cue persists.
- **Sidenote footnotes** (Tufte/Distill pattern): footnote numbers in body text are anchors. On wide viewports (≥ 1124px), footnotes render as right-margin sidenotes anchored at the citation line. **Bidirectional hover linking**: hovering an anchor tints both the anchor and its sidenote with `--accent-pale`; hovering the sidenote does the reverse. Implemented via paired `data-fn-id` attributes plus a small JS handler.
- Narrow viewports collapse sidenotes to inline tap-popovers below the citation line.

Prior art beyond LessWrong: gwern.net (link-preview-on-hover, cross-reference popups), Distill.pub (academic-marginalia + bidirectional hover), Tufte CSS (canonical sidenote pattern). Lifting LW's gutter and Distill's hover-link. Quartz already ships link-preview-on-hover natively (popovers via Quartz's `Popover` component) — that gwern affordance comes free, no implementation effort needed.

This pattern fits prose because:
- Long-form prose is read top-to-bottom, not jumped around in.
- The ToC is reference, not primary navigation.
- Sidenotes preserve reading flow vs. "scroll to bottom for footnote, lose place".

`chrome.js` handles the gutter fade state and IO active-section tracking; `sidenotes.js` handles the marginalia layout and hover-link pairing.

### About / people / project pages

No ToC. These are short pages; the ToC is noise.

### Suppression rules

- `frontmatter.toc: false` → suppress all presentations.
- Listing/index pages → suppress (these have their own structure, not a meta-list).
- Headings count = h2 + h3 (not h4+); h3-only articles are valid (rare) but still get ToC if ≥ 3.

## Engine-badge tier model

Sheets.wiki documents three primary engines: **Google Sheets**, **Excel**, and **Lattice** (the latter at expanded scope on `latlang.org`). Other engines (ironcalc, hyperformula, libreoffice, formulas, pycel) are **comparison targets in assay** — tested for divergence, not first-class documented in sheets.wiki.

### No "canonical" engine

A v2-era framing assumed gsheets was canonical and other engines deviated from it. **That framing is wrong for the common case.** Most divergences between Excel and Google Sheets are *mutual partial* — both implement the function, both mostly agree, both diverge from each other in specific edge cases. Neither is the reference; the divergence is the topic, not a unilateral deviation.

Implication for badge state: a function with a Sheets ↔ Excel divergence renders **both** chips as `partial`, with the in-page engine sections documenting the divergence symmetrically. The reader sees "these two engines disagree about this function," not "Excel deviates from Google's reference." Engine-only functions (BAHTTEXT in Excel, QUERY in Sheets) are the exception — there *is* a canonical engine in those cases, and the others render `missing`.

### Two tiers

| Tier | Engines | Where surfaced |
|---|---|---|
| primary | gsheets, excel, lattice | sheets.wiki badge row, in-page engine sections |
| comparison | ironcalc, hyperformula, libreoffice, formulas, pycel | assay's per-function divergence views |

Tier metadata lives in `engines.json` (in `@cartularium/brand`) — single source of truth.

### `engines.json` registry

```json
{
  "version": 1,
  "engines": {
    "gsheets":      { "label": "Google Sheets", "tier": "primary",    "order": 1 },
    "excel":        { "label": "Excel",         "tier": "primary",    "order": 2 },
    "lattice":      { "label": "Lattice",       "tier": "primary",    "order": 3 },
    "ironcalc":     { "label": "IronCalc",      "tier": "comparison", "order": 4 },
    "hyperformula": { "label": "HyperFormula",  "tier": "comparison", "order": 5 },
    "libreoffice":  { "label": "LibreOffice",   "tier": "comparison", "order": 6 },
    "formulas":     { "label": "formulas",      "tier": "comparison", "order": 7 },
    "pycel":        { "label": "pycel",         "tier": "comparison", "order": 8 }
  }
}
```

Color tokens stay in `tokens.scss` (CSS-domain). The list/order/tier comes from `engines.json`. `EngineBadges.tsx` reads both. Adding/removing engines: update JSON + add/remove token, bump brand version. The vendored-copy sync (same mechanism as `imprints.json`) carries this to assay.

### Badge row — sheets.wiki

Renders **primary tier only**. A page lists exactly the primary engines the page documents (most pages: all three; engine-only functions: just one).

### Click semantics

| Engine state | Badge | Click |
|---|---|---|
| primary, available, no divergence | `<a>` to `#engine-name` (passive) | scroll to in-page section |
| primary, partial (mutual divergence with another primary) | `<a>` with `↘` indicator, tinted background | scroll to in-page `#engine-name` section |
| primary, partial (engine-specific quirk) | `<a>` with `↘` indicator, tinted background | scroll to in-page `#engine-name` section |
| primary, missing (engine-only function) | `<a>`, struck-through, faded | scroll to in-page section (which says "no support" + links to assay) |

Click sends the reader to **the in-page engine-specific section**, not directly to assay. Two-step: stay in sheets.wiki where the documentation lives, follow through to assay if the reader wants test specifics. The in-page section is the natural carrier of "what's different and why" prose; the assay link in that section is for the reader who wants the test matrix.

The `↘` glyph (down-right arrow) is used instead of `↗` for in-page navigation — it suggests "go down the page" rather than "leave the site," reinforcing that the click stays in sheets.wiki.

### Anchor vs span — preventing baseline shift

Mixing `<span>` and `<a>` in the same row creates baseline-alignment issues (UA `<a>` defaults bring underlining + focus rings, `<span>` doesn't). All chips render `<a>` when the page links them — but always with `text-decoration: none`, `display: inline-flex; align-items: baseline`, and an explicit focus ring matching `--accent`. The non-clickable variant uses `<a href="#engine-name">` to the in-page section *anyway* (passive reader can scroll to it), so the row is uniformly `<a>` with consistent baseline.

### Comparison-tier coverage

Lives in assay's per-function divergence view, not sheets.wiki. Sheets.wiki function pages may *link* to that assay view via the related drawer ("diverges" section) but don't render the comparison-tier coverage themselves. This is the right division of labor: sheets.wiki documents primary-engine practice; assay tests the long tail.

### Primary engine colors

The three primary engines: gsheets (`#2f7a3f` light, `#6ec57b` dark — Google green), excel (`#1d4e8a` light, `#6a9bd6` dark — Microsoft blue), lattice (`#8a2840` light, `#d87a92` dark — wine red).

Lattice's color was shifted from teal (`#277076` / `#5fc0c5`) to wine red in v5 of this doc. The previous teal blurred against gsheets-green at small dot sizes and read as ambiguous. Wine red sits cleanly outside both green and blue. The shape-mark intervention briefly considered in v3-v4 (per-engine circle/square/diamond) was reverted because the diamond was visually unbalanced and broke the brand rule that dots are circles.

Supporting affordances on `/functions`:

- A persistent legend at the top of the page acts as the key. Readers don't have to hover individual dots to orient.
- Dots always render in fixed `gsheets, excel, lattice` order. Position is the secondary disambiguator.
- `title` attributes disclose engine name and status on hover/focus.

The change is recorded in `packages/brand/tokens.scss` and the `--eng-lattice` variable is the single point of control. Cross-property: assay's existing lattice colorings update with the brand bump.

## Related-content drawer

Replaces the bare backlinks block at the bottom of articles. A unified panel with up to four sections; empty sections suppressed.

### Layout — inline records with engine pills

v1 used `justify-content: space-between` which created a punishing gap between primary text and metadata. v2 inlined metadata as dot-separated text. **v3 replaces the engine-list text with miniature engine chips** — diverges and tested-by rows surface engines visually, matching the badge-row treatment elsewhere on the page. Tested-by rows carry per-engine pass/fail state on the chip itself:

```
diverges
  DV-0042 · QUERY ignores empty trailing args   [excel] [ironcalc]  → assay
  DV-0118 · second-arg coercion mismatch        [excel] [pycel]     → assay
  DV-0203 · pivot clause unsupported            [lattice]           → assay

tested by
  test/query/basic-select.gse                   [✓gsheets] [✓excel] [✓lattice]  → assay
  test/query/empty-trailing-args.gse            [✓gsheets] [✗excel] [✗ironcalc] → assay
  test/query/pivot-clause.gse                   [✓gsheets] [✗lattice]           → assay
```

Engine chips here are smaller than the page-header badges (0.65rem, hairline border, engine color text) — distinct enough to scan, light enough not to compete with the row's primary text. Tested-by chips carry a `✓` or `✗` glyph indicating per-engine status.

The cross-property pill (replaced by `→` for within-imprint, see "Cross-property linking § Sigil convention") sits at the end of each row.

```html
<!-- related.html (excerpt) -->
<li>
  <a href="{{href}}">
    {{title}}
    <span class="verdict {{verdict.kind}}">{{verdict.text}}</span>
    <span class="cp-pill">{{imprint.label}}</span>
  </a>
</li>
```

The whole record is one anchor. The pill rewriter is not invoked here because the markup already includes the pill; structural-context pills are template-emitted, not post-processed.

### Sections (in order)

| Section | Source | Status |
|---|---|---|
| mentioned in | Quartz backlinks index | live |
| diverges | `cartulariumData` (assay manifest) | live (manifest pending) |
| tested by | `cartulariumData` (assay manifest) | live (manifest pending) |
| used in | inverted index of wikilinks/codeblocks → function references | post-MVP |

### Manifest fetch failure handling

The manifest fetch can fail (offline build, network timeout, assay outage). Behavior:

1. **Cache hit, fresh** (mtime within `staleAfter`): use cache. Default `staleAfter: 24h`.
2. **Cache hit, stale, fetch succeeds**: refresh cache, use new.
3. **Cache hit, stale, fetch fails**: use stale cache, emit build warning. Page still has divergences/tests, just possibly out of date.
4. **No cache, fetch fails**: emit build warning, render related-drawer without `diverges` and `tested by` sections (they degrade gracefully — the section is suppressed if data is empty).

The `cartulariumData` transformer already implements (3) at the disk-cache level. (1) and (2) need explicit `staleAfter` config; (4) needs the section-suppression logic to handle the empty-array case (already does, via "empty sections suppressed").

## Functions discoverability — `/functions`

A dedicated discovery page, linked from the top bar nav. Replaces "search is the only function-finding affordance".

### Page structure

- **Top: editorial dek** — one paragraph, sub-160 chars, scope summary.
- **Data-export line** — `data: tsv · json · permalink`, monospace eyebrow.
- **Engine legend** — single line directly under the data line: `engines: ● gsheets · ● excel · ● lattice · ○ missing · ◐ partial`. Persistent, low-chrome. Solves the dot-color-similarity ambiguity by giving readers a one-line key without hover-discovery. Color blindness fallback: dot shape + position both encode (filled = available, ring = missing, half-fill = partial).
- **Sticky category bar** — anchors to category sections below. Style: monospace, lowercase, dot-separated-feeling (no actual dots — hairline border bottom on active).
- **Per-category sections** — each is a `<table>` (not CSS grid) for IMPORTHTML compatibility (see "Machine-readable export").

### Per-row columns

```
| name | syntax | description | engines |
```

- **name**: monospace, bold-ish (wght 500), links to function page.
- **syntax**: monospace, smaller, abbreviated where long (e.g., `SUM(value1, [value2, ...])`).
- **description**: body sans, ink-3 color, single line truncated with `text-overflow: ellipsis`.
- **engines**: primary-tier dots only (3 dots: gsheets, excel, lattice). Filled = available, hairline ring = missing, half-filled = partial.

Each dot has a `title` attribute disclosing the engine name and status (`Excel: missing — see DV-0042`). Hover tooltip; tap on mobile shows tooltip as a small popover.

### Sticky-stack with top bar

The category bar is sticky. The page top bar is *not* sticky (only the category bar is). On scroll, the top bar leaves the viewport and the category bar replaces it. This avoids the double-stack issue from v1.

If the top bar later becomes sticky (TBD per Open Questions), the category bar's `top` offset matches the top bar height (`top: var(--topbar-height)`).

### Machine-readable export

Two formats generated at build:

- **`/functions.tsv`** — tab-separated, columns: `name, category, syntax, description, gsheets, excel, lattice`. Header row included.
- **`/functions.json`** — JSON, same fields per record, plus `aliases` and `divergences` (DV ids).

Linked at the top of `/functions` as monospace eyebrow: `data: tsv · json`.

The HTML page uses `<table>` markup so `IMPORTHTML(url, "table", index)` works. Each category section is one table; users can import a single category or scrape all of them. This serves the actual practitioners who use sheets.wiki — they want to wire the data into their own sheets.

### Why a page, not a flyout

Flyouts don't work on mobile, overload the top bar, and don't scale to 500 functions. A page is keyboard-navigable, deep-linkable, indexable, and importable. Search still handles the "I know the name" flow.

### Position in nav

`functions` is the first item after the wordmark. It's the primary discovery surface for the 80%+ of corpus that's function pages.

## Mobile — first-class for sheets-wiki

Per BRAND.md, sheets.wiki is read on mobile substantially. Assay matrices are wide and stay desktop-leaning — that exception is documented.

### Concrete spec

- **Top bar < 720px**: hamburger → drawer (see Top bar > Mobile).
- **ToC < 1124px**: inline + FAB (see ToC > Function/concept).
- **Engine badges**: chip row wraps. Tap-to-expand tooltip — tap once shows tooltip as inline panel below the chip row, tap outside dismisses. Hover doesn't exist on touch.
- **Related drawer**: stacks naturally — same component, no special-case.
- **Tables**: `overflow-x: auto` on wrapping `<div>`. Function-page tables especially.
- **Code blocks**: `overflow-x: auto`, no soft-wrap. Verify on the live site after the chrome port — Quartz's default `pre` styling may not include `overflow-x` on narrow viewports, in which case long formulas break the layout.
- **Sidenote footnotes** (blog/guide): collapse to inline tap-popovers (no margin space available).

### Body scroll lock

When mobile drawer or FAB bottom-sheet is open, `<html>` gets `overflow: hidden` so background doesn't scroll under the modal. Scroll position is preserved (`position: fixed; top: -<scrollY>` pattern) and restored on close.

## Footer

Single footer markup, shared across all properties via the chrome primitives (`templates/footer.html`).

### Structure

```
[imprint attribution] · [about] · [contributing] · [github ↗] · [license] · [feed]
```

- **`part of cartularium ↗`** — monospace eyebrow, links to cartularium.org imprint home.
- **about** — property-meta entry (style guide, roadmap, etc.).
- **contributing** — meta link, property-specific (`/about/contributing` for sheets.wiki).
- **github ↗** — source repository.
- **license** — content + code license, property-specific (omitted from sheets.wiki footer until a `License.md` lands).
- **feed** — RSS link if the property has one (sheets.wiki has `/index.xml`).

### Deduplication with header

Header nav and footer must not overlap. Rule:

- **Header nav** = primary property destinations: `functions · concepts · guides · blog · projects`. Five items, no utility links.
- **Footer** = imprint attribution + meta-links: `part of cartularium ↗ · about · contributing · github ↗ · license · feed`.

`about` and `github ↗` were demoted from the header to the footer once `functions` was added — seven items in the header was wrapping at typical laptop widths, and `about`/`github ↗` are utility links, not destinations. The footer is now a single line of meta-links, which is the conventional location for utilities (Anthropic, OpenAI, Cloudflare, Stripe all do the same).

## Style guide split

- **`content/about/Style Guide.md`** (the existing wiki page, extended) — contributor-facing wiki style guide. Voice, anti-patterns, per-content-kind tone (reference / academic / catalogue / instructional / opinion), before/after rewrites. PR reviewers cite this. Already a published wiki page accessible at `/about/Style-Guide`; community contributors discover it via the site itself. The existing formatting/citation rules stay; voice/tone sections were added in the same pass that resolved the off-tone `_index.md` pages.
- **`packages/brand/BRAND.md` § "Chrome strings"** — short section appended to existing BRAND.md, scoped to *chrome strings*: top-bar labels, footer attribution, button text, error pages. Single tone (terse editorial, lowercase monospace). Doesn't compete with the wiki guide; sigil conventions live here too.

This split places each doc where its readers actually look. Wiki contributors find voice rules on the wiki itself (where they're already navigating); brand-level chrome-string voice lives with the rest of brand kernel material.

## Implementation order

Each step independently shippable.

1. **Create `@cartularium/chrome` package.** Templates, SCSS, JS, registries (`imprints.json`, `engines.json`), README. No consumers yet.
2. **Vendored-copy sync infrastructure.** `tools/sync-imprints.sh` and CI step that fails on stale vendored copies.
3. **Voice rules.** Extend `content/about/Style Guide.md` with voice/tone sections (per-content-kind register, anti-patterns, rewrite examples). Append "Chrome strings" section to `BRAND.md`. Rewrite the seven `_index.md`s as the first conformance pass.
4. **Sheets-wiki TopBar component.** New `TopBar.tsx` that renders the chrome template; replaces `SiteWordmark` + `KernelNav` in `quartz.layout.ts`. Hooks Quartz's existing search; replaces hand-rolled Darkmode wiring with `chrome.js`.
5. **Right-rail ToC for desktop, inline + FAB for mobile.** New `TableOfContents.tsx` that emits sticky right-rail at ≥1124px and inline collapsed below; FAB toggle managed by `chrome.js`. IntersectionObserver for active-section state.
6. **Related drawer.** New `Related.tsx` consolidating backlinks + divergences + tests using inline-record layout. Replaces `Backlinks.tsx`.
7. **Functions discoverability page.** New `/functions` route. Render category-grouped tables from frontmatter `category` field. Generate `/functions.tsv` and `/functions.json` at build.
8. **Cross-property pill (structural contexts only).** Template-emitted in related-drawer / engine-badge / see-also templates. No rehype rewriter for inline prose — inline links stay plain `↗`.
9. **Engine badges tier upgrade.** Modify `EngineBadges.tsx` to read `engines.json`, render primary tier only, emit `<a>` to in-page sections.
10. **Blog/guide left-gutter ToC + sidenotes.** New `TocGutter.tsx` + `Sidenote.tsx` for `blog`/`guide` content kinds. `chrome.js` extension for gutter hover, `sidenotes.js` for marginalia.

Per-step expected size: 1–4 hours of focused work. Steps 5 and 10 are biggest because of the JS state machines (IntersectionObserver, gutter hover, sidenote layout).

## Open questions

These are deliberately undecided.

1. **Is the page top bar sticky?** Trade-off: sticky helps long pages (search always reachable) but stacks awkwardly with the sticky category bar on `/functions`. Recommendation: not sticky, but reconsider once we have analytics.
2. **Sidenotes on blog/guide narrow viewports — inline expand or compressed footnote-list at bottom?** Inline expand preserves position; bottom-list is what print/feed readers expect.

(v1 had seven open questions; the rest were latent decisions, now resolved in the body.)

## Known follow-ups (deferred to v3 / later)

Not in scope for the chrome implementation pass, but tracked here so they don't get forgotten.

- **404 / error / offline page chrome.** New `error-404.html` template in chrome package. Property-specific copy, but shared chrome.
- **OG / social cards.** Per-property variant rule, branded as cartularium volumes. Token reservation in BRAND.md.
- **RSS / Atom feeds.** sheets.wiki blog feed; cartularium imprint master feed (cross-property). Link-rel discovery from each property home.
- **Print stylesheet.** `chrome.scss` companion `print.scss`. Suppress sticky elements; render ToC inline; collapse sidenotes to footnote-list.
- **Cross-property dark-mode persistence.** Currently each property reads its own `localStorage`; crossing from sheets.wiki to assay loses theme. Either cookie scoped to the imprint domain (`Domain=.sheets.wiki`) or document the drift as expected.
- **Cross-property search.** Per-property search only for now. "Search all of cartularium" is a possible v3 affordance.
- **Skip-link / landmark structure.** Chrome primitives ship with `<main>`, `<nav>`, `<aside>` landmarks and a "skip to content" link in the topbar template (visually hidden until focused).
- **Footer as primitive.** Currently footer is property-side; should become a chrome primitive too (`templates/footer.html` is already drafted in the package layout above). Move when #4 lands.
- **Chrome SemVer policy.** Major: breaking template-data shape changes. Minor: new template, new registry entry. Patch: CSS / JS bugfixes. Documented in chrome package README.
- **Wordmark slot reservation.** When a logomark arrives (BRAND.md "Logomark family — to design"), the topbar template needs a mark slot left of the wordmark. Reserve `{{wordmark.mark}}` placeholder now (renders empty until populated) so the eventual mark drop-in doesn't require re-templating consumers.
- **Assay search via Pagefind.** Assay (Python/Jinja) currently has no search. Pagefind is SSG-agnostic — generates a static index at build time, ships a small JS UI, no server. Recommend adopting on assay; sheets-wiki could migrate from Quartz's FlexSearch to Pagefind for cross-property consistency, separable.
- **SSG monorepo convergence.** sheets-wiki uses Quartz (Node/preact); assay uses Python/Jinja. Not blocking chrome (primitives are stack-agnostic by design) but a real friction point for cross-property tooling. Eventual convergence on Astro or 11ty (or another stack-agnostic SSG) would simplify; separate design exercise.

## Files this doc supersedes/amends

- **DESIGN.md § "Specialization to the brand kernel"** — "drops Quartz's flat explorer for a category-grouped sidebar" is reframed as the `/functions` page (a route, not a sidebar). Sidebar dropped entirely.
- **DESIGN.md § "Implementation roadmap"** — step 4 ("Design port") and the implicit chrome work fold into the more granular implementation order above.
- **STATUS.md § "Open items > Highest visible impact > 2"** — this doc *is* the resolution of that open item; STATUS should now point at this doc.
