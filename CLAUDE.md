# Cartularium

Umbrella for community spreadsheet projects. This monorepo holds sheets.wiki (the wiki), assay (the engine-divergence catalogue), the edit-shell and editor SPA that power inline contribution, plus the chrome and brand shared across properties. Lattice and formulary are siblings in their own repos.

## Architecture & boundaries

Before working in `packages/`, read the relevant per-package `CLAUDE.md` (it auto-loads when you open files in that subtree). Per-package CLAUDE.md files contain the essential rules inline; for the full cross-cutting picture, see `internal/architecture/<topic>.md` if present.

`internal/` is a **separate, nested git repository** for the user's working notes (specs, architecture docs, design mockups, archive). It is gitignored from this outer cartularium repo and may not exist on fresh clones. The per-package CLAUDE.md files must be self-contained — never rely on `internal/architecture/<topic>.md` being accessible.

## Global conventions

- Use `pnpm`, not npm. The monorepo is pnpm workspaces (see `pnpm-workspace.yaml`).
- Specs live in `internal/superpowers/specs/` (dated, in the inner internal repo). Plans live in `internal/superpowers/plans/`.
- Tests vary per package — check the package's `CLAUDE.md` for the right invocation (some use `vitest run`, some use `tsx --test`, some need full file paths).
- `@cartularium/contracts` must be built before consumers import its runtime exports (`pnpm --filter @cartularium/contracts run build`). Types alone don't trigger a rebuild.
- `wrangler` is per-package, not workspace-root. Use `pnpm --filter @cartularium/edit-shell <cmd>` or cd into the package.
- For local dev — first-time setup, daily scripts (`pnpm dev`, `pnpm dev:edit`, `pnpm dev:runner`, `pnpm setup:dev`), port map, OAuth flow, multi-worktree limitations — see [DEVELOPMENT.md](./DEVELOPMENT.md).
- Use `pnpm coord:status` to see active worktrees, WIP, stale candidates, and current decisions. Update your worktree's `.coord-status.md` (frontmatter schema documented in `internal/COORDINATION.md`) when starting/finishing work.
