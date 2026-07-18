# @cartularium/brand

Brand kernel: typography, color tokens, layout grammar. Source of truth for cross-property identity. Also home to canonical registries: `engines.json` (the 8-engine list) and `properties.json` (cross-property URLs).

## Build & test

No build step. No tests. Static assets only.

## Key files

- `tokens.scss` — source-of-truth CSS custom properties (typography, paper-ink palette, engine palette, layout rhythm). Light + dark variants.
- `tokens.css` — plain-CSS sibling of `tokens.scss`. Keep in sync.
- `fonts.css` — Google Fonts import for Fraunces + IBM Plex
- `data/engines.json` — canonical engine registry (8 engines)
- `data/properties.json` — canonical cross-property URLs
- `BRAND.md` — the full identity spec

## Boundaries

- **Source of truth for tokens.** Consumers (sheets-wiki, assay, sheets-wiki-editor, cartularium-org, chrome) import `@cartularium/brand/tokens.scss` directly. Don't fork tokens into a property.
- **Source of truth for `engines.json` and `properties.json`.** These are identity data, not chrome. Don't duplicate them into chrome or any consumer.
- **Mutable in principle.** Changes to color, typography, or registries propagate to all consumers — that's the point. No backwards-compatibility shims for visual changes.
- For the full cross-cutting picture (when available): see `internal/architecture/brand.md`.

## Local conventions

- Cross-property additions (e.g., cause/verdict palettes, spreadsheet-grid CSS) go here when 2+ properties need them. Single-consumer styles stay in the consumer.
