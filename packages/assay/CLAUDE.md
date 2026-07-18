# assay

The engine-divergence catalogue. Runs the same formulas across 8 spreadsheet engines (excel, formulas, gsheets, hyperformula, ironcalc, lattice, libreoffice, pycel) and records where they diverge. Evidence anchor for cartularium's compatibility data — other projects refer to assay for "what works on what."

## Build & test

- `pnpm --filter assay build` — builds `@cartularium/drivers` (which builds `@cartularium/contracts`) first, then tsc + copy-assets
- `pnpm --filter assay test` — `vitest run`
- `pnpm --filter assay serve` — builds + serves catalogue at `:8082`
- **Gotcha:** `@cartularium/contracts` and `@cartularium/drivers` must be built before assay's runtime imports work. The `build` script handles this; if running individual commands, build them first (drivers' build pulls in contracts).

## Key files

- `src/cli.ts` — CLI entry (`assay` command)
- `src/index.ts` — library exports (re-exports the drivers + createDriver from `@cartularium/drivers`)
- `src/runner.ts` — the generation layer (`evaluateTasks`, the single batch-vs-single dispatch) + the run/divergence pipeline
- `src/format/{catalogue,match,equality,capabilities}.ts` — catalogue vocabulary, matcher, divergence equality, the capability ADAPTERS (rewrite half)
- `src/format/values.ts` — re-export hub: value spine ← `@cartularium/contracts`, driver-I/O ← `@cartularium/drivers`
- `src/catalogue-site/` — catalogue site builder
- **The drivers themselves live in `@cartularium/drivers`** (`packages/drivers/`) — the 8 driver classes, `Driver`/capability contracts, `createDriver`, the batch model (`contract/*`), the python toolchain, the capability `*.json`.

## Boundaries

- **Compatibility evidence is owned here.** Don't hardcode compat tables in consumers (interleaf, formulary, sheets-wiki) — they query assay's manifest or (when landed) the exported compatibility feed schema.
- **Drivers extracted to `@cartularium/drivers` (roadmap Step 4, 2026-06-16).** The execution + capability contracts, the 8 drivers + `createDriver`, the driver-I/O vocab, the batch model, the python toolchain, and the report-only capability DATA live there; the generation layer (`evaluateTasks`), catalogue, matcher, manifest, and capability ADAPTERS stay in assay. Dependency direction: assay → drivers → contracts (never the reverse).
- **Ad-hoc probes** use the exported `Driver` interface / `createDriver` / concrete driver classes from `@cartularium/drivers` (re-exported via assay's `src/index.ts`). **Persisted compatibility claims** go through the case-file/manifest pipeline.
- **Preview pipeline subset:** only `gsheets`, `excel`, and `hyperformula` are implemented for preview (per `src/preview/types.ts`); the full evidence corpus is all 8.
- Case-file format and fixture shapes are in flux — don't depend on stability.
- For the full cross-cutting picture (when available): see `internal/architecture/assay.md`.

## Local conventions

- Driver `lattice.ts` integrates the sibling Lattice repo at `/Users/astral/sandbox/current/lattice/`. The integration is a controlled boundary; runtime imports from Lattice into other cartularium packages are out of bounds.
- The volunteer Mac mini preview runner polls `/api/edit/assay-runner/*` on edit-shell; it's the proof harness that materializes preview jobs.
