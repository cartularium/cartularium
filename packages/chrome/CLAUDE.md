# @cartularium/chrome

Cross-property primitives: top bar, drawer, ToC, related-content drawer, footer. Framework-neutral by design — ships HTML templates + SCSS + vanilla JS so both Python/Jinja (assay) and Preact (sheets-wiki-editor) consumers render the same templates.

## Build & test

No build step. No tests (vanilla JS, HTML, SCSS shipped as-is).

## Key files

- `templates/{topbar,drawer,footer,related,toc-rail,toc-gutter,toc-fab,error-404}.html` — mustache-subset HTML templates
- `styles/{chrome,print}.scss` — all chrome SCSS; imports brand tokens
- `scripts/{chrome,sidenotes,render}.js` — theme toggle, drawer, dropdown, IO for ToC, sidenote linking, mustache-subset renderer
- `data/imprints.json` — cross-property registry (host → label, slug)
- `index.js` — re-exports template strings, JSON, render fn
- `CHROME.md` — design rationale

## Boundaries

- **Framework-neutral.** Don't add React components, Preact components, or any framework-specific code here. Templates + SCSS + vanilla JS only.
- **Template data context shape is a de-facto public API.** Four consumers hand-pass data to chrome templates: `packages/sheets-wiki/quartz/components/TopBar.tsx`, `packages/sheets-wiki-editor/src/Chrome.tsx`, `packages/assay/src/catalogue-site/chrome.ts`, `packages/cartularium-org/scripts-build/build.mjs`. **Changes to what a template expects are breaking changes for all four.** Coordinate before changing template context.
- **Don't duplicate chrome markup in a property.** Render the shared template via `render()`.
- If a primitive belongs in only one property today, keep it in that property until a second consumer materializes (the "lift when a second consumer needs them" rule).
- `engines.json` and `properties.json` are NOT chrome — they live in `@cartularium/brand` as identity data. Chrome re-exports `ENGINES` from brand for convenience.
- For the full cross-cutting picture (when available): see `internal/architecture/chrome.md`.

## Local conventions

- The render fn is ~50 lines of mustache-subset; don't pull in handlebars or mustache.js.
