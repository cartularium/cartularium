# Cartularium

> Works for spreadsheet practitioners. References, catalogues, registries, and tools.

Cartularium is an umbrella for community spreadsheet projects. This monorepo holds sheets.wiki, assay (the engine-divergence catalogue), and ludus (judged spreadsheet practice), plus their shared infrastructure. [Lattice](https://github.com/cartularium/lattice) and [formulary](https://github.com/Astral1119/formulary) are siblings in their own repos; a registry to go with formulary is planned.

## Properties

| Package                                                 | Domain                                         | Description                                                   |
| ------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| [`packages/cartularium-org`](packages/cartularium-org/) | [cartularium.org](https://cartularium.org)     | Imprint home                                                  |
| [`packages/sheets-wiki`](packages/sheets-wiki/)         | [sheets.wiki](https://sheets.wiki)             | Wiki / encyclopaedia for spreadsheet practice                 |
| [`packages/assay`](packages/assay/)                     | [assay.sheets.wiki](https://assay.sheets.wiki) | Divergence catalogue across spreadsheet engines               |
| [`packages/ludus`](packages/ludus/)                     | [ludus.sheets.wiki](https://ludus.sheets.wiki) | Practice problems with automated Google Sheets judging        |
| [`packages/interleaf`](packages/interleaf/)             | —                                              | Formula text transpiler for spreadsheet dialects              |
| [`packages/formula-syntax`](packages/formula-syntax/)   | —                                              | Lossless formula rewriting with dialect-selected tokenization |
| [`packages/chrome`](packages/chrome/)                   | —                                              | Cross-property primitives (top bar, drawer, footer, ToC)      |
| [`packages/brand`](packages/brand/)                     | —                                              | Shared visual identity (typography, color tokens, registries) |

## Development

> For local-dev setup, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Layout

```
packages/
  brand/                # tokens, fonts, registries (engines.json, properties.json)
  chrome/               # cross-property primitives (templates, scripts, styles)
  cartularium-org/      # imprint home
  sheets-wiki/          # wiki (forked Quartz)
  assay/                # divergence catalogue
  ludus/                # judged spreadsheet practice
  interleaf/            # formula text transpiler
  formula-syntax/       # lossless, dialect-selected formula rewriting
```

Per-package workflows live in each package's README.

## License

MIT. See [LICENSE](LICENSE).
