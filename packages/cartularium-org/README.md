# @cartularium/cartularium-org

The home page at [cartularium.org](https://cartularium.org). A small static index of the four cartularium projects (sheets.wiki, assay, formulary, lattice), styled like a publisher's catalogue. Plain HTML and CSS.

## What's in here

```
packages/cartularium-org/
  src/
    index.html        page template (mustache-subset)
    styles.scss       page-specific styles, imports brand tokens + chrome
  scripts-build/
    build.mjs         render template, count real numbers, compile SCSS
    serve.mjs         tiny dev server over the build output
  public/             build output (gitignored)
```

The page imports `@cartularium/brand` for tokens and fonts, and `@cartularium/chrome` for the cross-property top bar. The bespoke pieces (masthead, volume cards, colophon strip, engine grid, activity ledger, footer) live in this package because they're specific to the home page.

## Volume counts

Counts in the colophon strip and the volume stat lines are read from sibling packages at build time:

- sheets.wiki function pages: count of `packages/sheets-wiki/content/function/*.md`
- assay divergences: count of `packages/assay/divergences/DV-*.yaml`

Other counts (test fixtures, formulary packages, lattice stdlib functions) are stubbed with em-dashes until those sources expose authoritative numbers.

## Develop

```sh
pnpm install
pnpm --filter @cartularium/cartularium-org build      # writes public/
pnpm --filter @cartularium/cartularium-org serve      # build + http server on :8090
```
