# Cartularium Brand Kernel

> Visual and editorial identity shared across cartularium properties. Tokens live alongside this doc in [`tokens.scss`](tokens.scss) / [`tokens.css`](tokens.css); the Google Fonts loader is in [`fonts.css`](fonts.css). Properties consume this package via `@cartularium/brand`.

## Identity

Cartularium is a publisher of works for spreadsheet practitioners: references, catalogues, registries, and tools. The visual identity reads as a careful, opinionated, scholarly press: durable, dense with information, calm, and unmistakably not generic-AI.

Mental model: a small academic publisher that puts out reference volumes, with one or two appliances bearing the same imprint. Each property is a *volume* or an *instrument* in the same series.

Current properties:

- **assay** (assay.sheets.wiki): divergence catalogue across spreadsheet engines
- **sheets.wiki**: wiki / encyclopaedia for spreadsheet practice
- **formulary** (formulary.dev): package registry for Sheets named functions
- **lattice**: spreadsheet engine, IDE, and language

## Typography

Three faces, used the same way everywhere.

- **Display: Fraunces** (variable: opsz, wght, SOFT)
  - h1: opsz 144, wght 380, SOFT 30 (soft, editorial)
  - h2: opsz 36, wght 480, SOFT 0 (firmer)
  - Editorial italic pull-quotes: opsz 14, wght 380, SOFT 50
- **Body: IBM Plex Sans**: 15.5px base, neutral, large family
- **Mono: IBM Plex Mono**: for code, formulas, eyebrows, tabular figures

Universal rules:

- **Tabular numerals** (`font-feature-settings: "tnum"`) wherever a number sits in a column or counts something.
- **Lowercase monospace eyebrows** for section labels: 0.7rem, letter-spacing 0.06em.
- **Italic = editorial**, never emphasis-in-prose. Use sparingly.
- **No body weights below 400 or above 600.** Display goes lighter (380) on purpose.

## Color tokens

Paper-and-ink base. Light mode is warm cream paper / dark warm ink; dark mode is inverted, kept warm. Cool greys are explicitly off-brand.

| Token | Light | Dark |
|---|---|---|
| `--paper` | `#faf5e8` | `#161310` |
| `--paper-2` | `#f4eee0` | `#1f1b16` |
| `--paper-3` | `#ebe2cc` | `#2a241d` |
| `--ink` | `#1a1614` | `#f0e9d8` |
| `--ink-2` | `#3d3530` | `#c8c0ad` |
| `--ink-3` | `#6e655a` | `#948b78` |
| `--ink-4` | `#968b7c` | `#6d6557` |
| `--rule` | `#d8cdb6` | `#3a322a` |
| `--hairline` | `#e6dec9` | `#2a241d` |
| `--accent` | `#1f4040` | `#6ba0a0` |

### Engine palette (canonical across all properties)

When an engine is named anywhere (sheets.wiki function badge, assay test row, formulary compatibility chip, lattice's about page), use these hex values. This is the strongest cross-property visible signal cartularium has.

| Engine | Light | Dark |
|---|---|---|
| `--eng-gsheets` | `#2f7a3f` | `#6ec57b` |
| `--eng-excel` | `#1d4e8a` | `#6a9bd6` |
| `--eng-lattice` | `#8a2840` | `#d87a92` |
| `--eng-ironcalc` | `#a8451c` | `#e88c5e` |
| `--eng-hyperformula` | `#5d2a8a` | `#b27ad8` |
| `--eng-libreoffice` | `#1f3475` | `#6e8edd` |
| `--eng-formulas` | `#107075` | `#5cb8bd` |
| `--eng-pycel` | `#8a5210` | `#d8a06a` |

Cause and verdict palettes (assay-specific) are defined in assay's stylesheet but originate in this kernel.

## Layout grammar

- **Hairlines, not cards.** 1px solid borders, color of `--rule`. No box-shadows on panels. Drop-shadow allowed only on dropdowns and popovers.
- **Sharp corners.** `border-radius: 0` everywhere. The only concession is 50% on dot indicators.
- **Paper grain.** SVG noise overlay, fixed-position, mix-blend-mode multiply on light / screen on dark, opacity ~0.4.
- **Vignette.** Radial gradients at top-left and bottom-right of the body, soft, for center-weight without a frame.
- **Max widths.** 64ch for prose; ~1340px for catalogue-style wide layouts.
- **Animations.** A single ~320ms `rise` + fade on first paint for major sections. Nothing else. Respect `prefers-reduced-motion`.

## Tone of voice

Direct, specific, substantive. Match assay's about-page register.

- Avoid: *powerful, seamless, intuitive, effortless, blazing-fast, modern, the future of...*
- Prefer: nouns and verbs that describe what the thing actually does. *"A reference of where spreadsheet engines diverge"* is the model.
- **Lowercase eyebrows; titlecase headings; sentence-case in body.**
- Editorial **deks** (subtitle paragraph under h1) on landing pages: short, declarative, sub-160 chars.
- Plain dot separators (` · `) for inline metadata; not pipes or slashes.

### Chrome strings

Chrome strings (top-bar labels, footer attribution, button text, error pages, drawer headings) are the most-seen, least-noticed text. They run extremely terse and are always lowercase monospace. Canonical examples: `search`, `theme`, `contents`, `part of cartularium`, `other cartularium volumes`, `data: tsv · json`. No title case anywhere in chrome.

Avoid the second person and avoid marketing. `search` not "Search the wiki". `theme` not "Toggle dark mode". Footer attribution is `part of cartularium ↗`, not "Made with care by the cartularium imprint." Verbs and nouns; never a slogan.

Error pages state the error and the resolution. Model: `404 not found. try search, or browse from the home page.` Not "Oops! Looks like the page you were looking for doesn't exist."

The sigil convention is `→` for cross-imprint links (still in cartularium) and `↗` for fully external links. CHROME.md has the implementation rule.

When in doubt about a button label or section eyebrow on any cartularium property, model on the existing chrome. For wiki content (function pages, concept pages, blog posts), the wiki's own [Style Guide](https://sheets.wiki/about/Style-Guide) is the authoritative source. It covers voice and tone with allowances per content kind.

## Logomark family

To design. When commissioned: a small geometric mark + Fraunces wordmark, parameterized so each property gets a sibling variant of the same mark; cartularium itself gets the mother mark. Sharp corners, rectilinear glyph. Do not ship a literal grid icon for sheets.wiki; let typography signal the spreadsheet domain.

Until commissioned: wordmark only, set in Fraunces 480, opsz 36, lowercase property name (`cartularium`, `assay`, `sheets.wiki`, `formulary`, `lattice`).

## Attribution pattern

Every cartularium property's footer carries one small monospace-eyebrow line:

```
part of cartularium ↗
```

Linking to cartularium.org once live. Cartularium's own home will index the imprint with consistent treatment for each property.

## What's invariant vs specializable

| Invariant (kernel) | Specializable (per property) |
|---|---|
| Typography stack (Fraunces / Plex Sans / Plex Mono) | Body font size, line-height for medium |
| Paper-ink palette (light + dark) | Accent color (assay teal; sheets.wiki same; lattice may differ) |
| Engine color tokens | Whether engine badges appear at all |
| Sharp corners, hairline rules | Layout density, panel structure |
| Tabular nums, monospace eyebrows | Section taxonomy |
| Voice and tone | Subject matter, vocabulary |
| Footer attribution pattern | Footer details (links, version) |

**Lattice may break visual continuity.** It's an instrument, not a publication, and dark-default IDE chrome is medium-appropriate. Lattice keeps the typographic posture (tabular nums, no rounded corners), the engine tokens, the footer attribution, and the tone. It does not keep the paper-ink palette. Making this explicit so it isn't a violation.
