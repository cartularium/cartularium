# @cartularium/contracts

Cross-property contracts: schemas and types that cross package boundaries. Conservative schema spine of the monorepo.

## Build & test

- `pnpm --filter @cartularium/contracts build` — `tsc`
- `pnpm --filter @cartularium/contracts test` — `node --test --import tsx ./src/*.test.ts` (note: needs full path; `tsx --test` alone won't find tests)
- `pnpm --filter @cartularium/contracts check` — `tsc --noEmit`

## Key files

- `src/index.ts` — entry point; manifest schema lives here
- `src/assay-preview.ts` — assay-preview-result inspection helpers (+ `assay-preview.test.ts`)
- `src/edit-index.ts` — edit-index schema (+ test)
- `src/locked-fields.ts` — locked-fields semantics (+ test)
- `src/platform.ts` — engine/host identifiers
- `src/manifest-v4.test.ts` — tests for the manifest schema in `index.ts` (note: there is **no** `manifest-v4.ts`)

## Boundaries

- **Conservative spine.** Don't add types or runtime here speculatively. Let consumer needs pull them in.
- **Runtime imports require a build.** Consumers must `pnpm --filter @cartularium/contracts run build` before importing runtime exports. Types alone don't trigger a rebuild — editor tests will see stale runtime if you skip this.
- **Formula IR (AST/printer surface) does NOT live here.** It churns faster than web/data contracts. The provisional IR lives in `packages/interleaf/src/ir/`; eventual extraction is `@cartularium/formula-ir`. The Interleaf compatibility *feed* schema (a compact projection of assay evidence) is appropriate here — currently branch-local in the sheets-excel-transpiler worktree, not yet in main.
- **Several DTOs are split across packages today** (transitional):
  - Preview input/result types → `packages/assay/src/preview/types.ts`
  - Submitted-case / version discovery → `packages/edit-shell/src/assay-preview/config.ts`
  - Editor DTOs duplicated in `packages/sheets-wiki-editor/src/lib/edit-shell.ts`
  - edit-shell does NOT currently import from contracts.
  Migrating these here is open work; not a prerequisite. When adding new DTOs, prefer landing them here directly rather than adding to the per-package locations.
- **Breaking changes need version bumps.** Each contract crossing major surfaces is versioned (manifest v4, submitted-case v1, preview-result v1). Don't break the surface without coordinating across consumers.
- For the full cross-cutting picture (when available): see `internal/architecture/contracts.md`.

## Local conventions

- Tests use `node --test --import tsx` rather than vitest. Stick with this pattern; don't add vitest unless there's a reason.
