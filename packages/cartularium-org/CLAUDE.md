# @cartularium/cartularium-org

Imprint home at cartularium.org. Small static index of the four cartularium projects (sheets.wiki, assay, formulary, lattice), styled like a publisher's catalogue.

## Build & test

- `pnpm --filter @cartularium/cartularium-org build` — renders template, counts real numbers, compiles SCSS → `public/`
- `pnpm --filter @cartularium/cartularium-org serve` — build + tiny dev server (port 8080 in `pnpm dev`, or 8090 standalone)
- `pnpm --filter @cartularium/cartularium-org check` — `prettier --check`
- No tests.

## Key files

- `src/index.html` — page template (mustache-subset)
- `src/styles.scss` — page-specific styles; imports brand tokens + chrome
- `scripts-build/build.mjs` — renders template, reads sibling counts at build time, compiles SCSS
- `scripts-build/serve.mjs` — tiny dev server over the build output

## Boundaries

- **Don't hardcode counts.** `build.mjs` reads counts at build time from siblings:
  - sheets.wiki function pages: count of `packages/sheets-wiki/content/function/*.md`
  - assay divergences: count of `packages/assay/divergences/DV-*.yaml`
- **Don't fork brand or chrome.** Consume `@cartularium/brand` and `@cartularium/chrome` directly.
- **This package is one of four chrome-template consumers** (the others are sheets-wiki, sheets-wiki-editor, assay). Chrome template context shape is a de-facto public API — if you change what a chrome template expects, coordinate across all four.
- For the full cross-cutting picture (when available): see `internal/architecture/cartularium-org.md`.

## Local conventions

- Counts not yet sourced from siblings render as em-dashes; don't make up numbers.
