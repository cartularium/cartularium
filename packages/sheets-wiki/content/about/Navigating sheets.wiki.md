sheets.wiki is organized into five top-level sections plus this `about/` namespace for site policy.

| Section | URL | What |
| --- | --- | --- |
| Functions | `/<FUNC>` | Function reference, one page per Sheets function. Examples: [QUERY](../QUERY), [VLOOKUP](../VLOOKUP), [SUMIFS](../SUMIFS), [INDEX](../INDEX/). |
| Concepts | `/concept/` | Mental-model pages: [Array](../concept/Array), [Type coercion](../concept/Type-coercion), [Cell references](../concept/Cell-references), and ~40 others. |
| Guides | `/guide/` | Long-form how-tos: [Advanced Array Patterns](../guide/Advanced-Array-Patterns), [Formula Techniques](../guide/Formula-Techniques), [Web Scraping Guide](../guide/Web-Scraping-Guide). |
| Blog | `/blog/` | Opinion and essays. Anti-patterns, history, theory. |
| Projects | `/project/` | Community libraries: [Anduin](../project/anduin/), [Formulary](../project/Formulary), [FLOOKUP](../project/FLOOKUP), and others. |

## How to find things

- **Function name?** Type it directly in the URL: `sheets.wiki/SUMIFS`, `sheets.wiki/QUERY`. Function names are uppercase; URLs are case-sensitive on production.
- **Concept or term?** Search via the search bar (Cmd-K / Ctrl-K), or browse the [concepts index](../concept/).
- **A specific guide or essay?** Browse [guides](../guide/) or [blog](../blog/).
- **A community project?** Browse [projects](../project/).

## Engine support

Each function page shows which spreadsheet engines support it via the badge row right under the title. Currently covered: Google Sheets, Excel, Lattice, IronCalc, HyperFormula, LibreOffice, the Python `formulas` library, pycel. Hover a badge for status; engines with documented divergences link to [assay.sheets.wiki](https://assay.sheets.wiki).

## Contributing

See [[Contributing]]. You don't need to know much TypeScript or Quartz to add or fix a page; most pages are markdown.
