# @cartularium/brand

Brand kernel for cartularium properties. Typography, color tokens, layout grammar.

The full identity spec lives in [`BRAND.md`](BRAND.md).

## Usage

For a property using SCSS:

```scss
@use "@cartularium/brand/tokens.scss";
```

For plain CSS:

```css
@import "@cartularium/brand/tokens.css";
```

For the canonical font loader (Fraunces + IBM Plex):

```css
@import "@cartularium/brand/fonts.css";
```

## What's here

| File | What |
|-|-|
| `tokens.scss` | Source of truth: CSS custom properties for typography, paper-ink palette, engine palette, layout rhythm. Light + dark variants. |
| `tokens.css` | Plain-CSS sibling of `tokens.scss`. Keep in sync. |
| `fonts.css` | Google Fonts import for the canonical type stack. |
| `BRAND.md` | The full identity spec: typography, color, layout grammar, voice, attribution. |

## What's NOT here yet

- Logomark assets. To be commissioned; see `BRAND.md`.
- Component primitives (theme toggle, footer attribution, engine chip). Per-property for now; lift when a second consumer needs them.
- Satori OG image template. If/when assay grows OG cards.

## Adding tokens

If a token is genuinely cross-property (used or plausibly-used by 2+ properties), add it here. If it's specific to one property, keep it there. Cross-property additions: cause/verdict palettes (assay-specific today, but in scope), spreadsheet-grid CSS (sheets.wiki today, possibly assay later).
