# sheets-wiki

The wiki / encyclopaedia at [sheets.wiki](https://sheets.wiki). Functions, concepts, guides, and essays for spreadsheet practitioners.

Built on a fork of [Quartz v4](https://quartz.jzhao.xyz/). Content lives in [`content/`](content/); the design and URL scheme are in [`DESIGN.md`](DESIGN.md).

## Develop

```sh
pnpm install
pnpm --filter sheets-wiki serve   # http://localhost:8081
pnpm --filter sheets-wiki build   # writes public/
```

Per-property registries (engines, properties, imprints) come from `@cartularium/brand` and `@cartularium/chrome`. Per-function engine support and divergence cross-links come from assay's manifest at build time. See [`@cartularium/contracts`](../contracts/) for the schema.

## Contributing

Articles and function-page edits are welcome. The on-site [Contributing guide](https://sheets.wiki/about/Contributing) covers the editorial side; the [Style Guide](https://sheets.wiki/about/Style-Guide) is the voice/tone reference.

## License

MIT. See [LICENSE.txt](LICENSE.txt).
