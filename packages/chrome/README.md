# @cartularium/chrome

Cross-property chrome primitives for cartularium: top bar, mobile drawer, table of contents, related-content drawer, and footer attribution. Ships markup templates, SCSS, and vanilla JS instead of framework components, so a Python/Jinja consumer (assay) and a preact consumer (sheets-wiki) can render the same templates.

See [CHROME.md](CHROME.md) for the design rationale.

## What's in here

```
packages/chrome/
  templates/          mustache-subset HTML templates
    topbar.html         single-row chrome at the top of every page
    drawer.html         right-side mobile drawer (search + nav + imprint volumes)
    footer.html         imprint attribution + meta links
    related.html        replaces bare backlinks with a consolidated panel
    toc-rail.html       desktop right-rail ToC for function/concept pages
    toc-gutter.html     desktop left-gutter ToC + sidenote scaffold for blog/guide
    toc-fab.html        mobile floating action button + bottom-sheet ToC
    error-404.html      404 page chrome
  styles/
    chrome.scss         all chrome SCSS, imports brand tokens
    print.scss          print stylesheet companion
  scripts/
    chrome.js           theme toggle, drawer, dropdown, IO for ToC active state, FAB
    sidenotes.js        bidirectional hover linking for blog/guide sidenotes
    render.js           ~50-line mustache-subset renderer (used by JS consumers)
  data/
    imprints.json       cross-property registry: host -> {label, slug}
  index.js              re-exports template strings, JSON, render fn
```

`engines.json` (canonical engine registry) and `properties.json` (canonical cross-property URLs) live in `@cartularium/brand/data/` since they're identity data, not chrome primitives. Chrome re-exports `ENGINES` from there for convenience.

## Consuming from a Node consumer (e.g., sheets-wiki)

```ts
import { TOPBAR_TEMPLATE, IMPRINTS, ENGINES, render } from "@cartularium/chrome"

const html = render(TOPBAR_TEMPLATE, {
  wordmark: { href: "/", label: "sheets.wiki" },
  nav: { items: [
    { href: "/functions", label: "functions", active: true },
    { href: "/concepts", label: "concepts" },
    // ...
  ]},
  search: { label: "search", key: "⌘K" },
  theme: { icon: "☾" },
})
```

SCSS:

```scss
@use "@cartularium/chrome/styles/chrome.scss";
```

JS (in the page's main bundle, after DOM ready):

```js
import "@cartularium/chrome/scripts/chrome.js"
```

## Consuming from a Python/Jinja consumer (e.g., assay)

Assay's catalogue site is currently TypeScript and consumes chrome's data through the Node module rather than via a vendored copy. A vendored-data flow for Python consumers is sketched in [CHROME.md](CHROME.md) but deferred until a real Python consumer materializes.

Templates are renderable via [pystache](https://github.com/defunkt/pystache) using the same template strings.

Compiled CSS for non-Sass consumers ships as `styles/chrome.css` (build step: `pnpm --filter @cartularium/chrome build`). Until a build pipeline is set up, consumers can compile the SCSS themselves.

## Template substitution scheme

Mustache subset: `{{key}}`, `{{#section}}…{{/section}}`, `{{^empty}}…{{/empty}}`, `{{{raw}}}` (unescaped), dotted access (`{{user.name}}`). No partials, no helpers, no functions. The subset is intentionally conservative so any consumer's template engine can render the same string.

Escaping is consumer-controlled: `{{key}}` is HTML-escaped by the renderer; `{{{key}}}` is not. The default `render.js` follows this convention. Jinja consumers configure pystache with the same rule.

## Versioning

- Major: breaking template-data shape changes (e.g., renaming `wordmark.label` to `wordmark.text`).
- Minor: new template, new registry entry, new exposed JS API.
- Patch: CSS / JS bugfixes, copy edits.

`data/imprints.json` and `data/engines.json` carry their own `version` fields — those bump independently when the registry shape (not just contents) changes.
