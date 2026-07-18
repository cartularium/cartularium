# sheets-wiki

The wiki / encyclopaedia at sheets.wiki. Functions, concepts, guides, essays. Built on a Quartz v4 fork. Live and load-bearing.

## Build & test

- `pnpm --filter sheets-wiki build` — builds `@cartularium/contracts` + `@cartularium/sheets-wiki-editor` first, then runs Quartz build, then copies editor build via `scripts-build/copy-editor.mjs`
- `pnpm --filter sheets-wiki serve` — builds contracts, then Quartz dev server at port 8081
- `pnpm --filter sheets-wiki check` — builds contracts, then `tsc --noEmit` + `prettier --check`
- `pnpm --filter sheets-wiki test` — `tsx --test` (bare filename works — vitest packages take bare names; this one uses node's test runner with tsx)
- `pnpm --filter sheets-wiki docs` — Quartz dev server pointed at `docs/`
- **Gotcha:** Contracts must be built before sheets-wiki's build/check works. The scripts handle this.

## Key files

- `content/` — wiki content (markdown)
- `quartz/` — Quartz fork (vendored)
- `quartz.config.ts` — Quartz configuration; includes the sibling Lattice checkout path
- `quartz/util/functionData.ts` — reads Lattice TSVs at build time (category, syntax, baseline gsheets/excel availability)
- `quartz/plugins/transformers/cartulariumData.ts` — merges assay/Lattice data into function-page frontmatter
- `quartz/plugins/transformers/assayRefs.ts` — resolves assay refs with strict/degraded modes
- `quartz/plugins/emitters/editIndex.tsx` — emits `public/edit/edit-index.json` (consumed by sheets-wiki-editor)
- `scripts-build/copy-editor.mjs` — copies the editor SPA build into `public/edit/*` while preserving edit-index.json
- `DESIGN.md` — design + URL scheme

## Boundaries

- **Content vocabulary is owned here.** New syntaxes (footnote/citation/embed) originate in this package's content model, then the editor and contracts catch up. The one in-flight syntax is **assay citations** — they don't have an obvious markdown precedent and need design.
- **`public/edit/edit-index.json` is a contract** between sheets-wiki and the editor. Schema changes break the editor; coordinate.
- **Lattice TSVs at build time are transitional + compatibility-adjacent.** They seed category, syntax, AND baseline gsheets/excel availability (per `quartz/util/functionData.ts:136`). Assay's manifest overlays evidence on top. Don't conflate the two paths, but don't pretend TSV reads are purely neutral metadata either.
- **Don't bypass Quartz config** to add render-time behavior — plugin shape is the supported extension point.
- **Don't fork brand/chrome tokens.**
- **When a content syntax needs an assay reference**, point at assay's stable IDs (divergence IDs, function IDs), not file paths or fixture hashes.
- For the full cross-cutting picture (when available): see `internal/architecture/sheets-wiki.md`.

## Local conventions

- This is one of four chrome-template consumers (alongside sheets-wiki-editor, assay, cartularium-org). Chrome template context changes coordinate across all four.
- Assay-ref resolution has strict and degraded modes — see `assayRefs.ts` and the `CARTULARIUM_ASSAY_REF_MODE` env var (default `degraded` in `pnpm dev`).
