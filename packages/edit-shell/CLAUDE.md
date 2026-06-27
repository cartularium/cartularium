# @cartularium/edit-shell

Cloudflare Worker that powers the inline contribution flow for sheets.wiki and assay.sheets.wiki. The product state machine and API surface for contribution. Deployed at `sheets.wiki/api/edit/*` and `assay.sheets.wiki/api/edit/*`.

## Build & test

- **Agent-friendly dev path** (recommended): `pnpm dev:edit` from repo root — runs editor + edit-shell only (not the full 5-process stack), and the `predev` hook auto-applies D1 migrations. First time on a fresh worktree: `pnpm setup:dev` first to symlink `.dev.vars` to the shared file at `~/.config/cartularium/dev/edit-shell.dev.vars`. Full local-dev story (OAuth, ports, tunnel-to-volunteer-runner, known limitations) lives in `DEVELOPMENT.md` at the repo root.
- `pnpm --filter @cartularium/edit-shell dev` — `wrangler dev` (this package only; doesn't auto-apply migrations)
- `pnpm --filter @cartularium/edit-shell deploy` — `wrangler deploy`
- `pnpm --filter @cartularium/edit-shell test` — `vitest run` (uses `@cloudflare/vitest-pool-workers`)
- `pnpm --filter @cartularium/edit-shell typecheck` — `tsc --noEmit`
- **Gotcha:** `wrangler` is per-package, not workspace-root. Don't `pnpm wrangler` from repo root — it fails. Use `pnpm --filter @cartularium/edit-shell <cmd>` or cd into the package.

## Key files

- `src/index.ts` — Hono app entry
- `src/routes/` — endpoint handlers (auth, contents, drafts, pr, assets, assay-preview lane)
- `src/auth/` — GitHub App OAuth and session management (D1-backed)
- `src/github/` — Octokit integration
- `src/assay-preview/config.ts` — submitted-case and version-discovery DTOs (transitional; awaiting contracts migration)
- `src/middleware/` — auth middleware, rate limits, etc.
- `src/env.ts` — typed env bindings

## Boundaries

- **Assay owns engine execution; edit-shell owns lifecycle, storage, and API.** Don't blur these. The submitted-case state machine (draft → submitted → accepted/rejected, queueing, acceptance materialization, PR materialization) lives here. Engine evaluation lives in assay.
- **Imports `@cartularium/contracts`** (since the fork-annotation store, 2026-06-26) — the shared `AssayForkAnnotation*` DTO + `ALL_CAUSES`/`ALL_PLATFORMS` for request validation. This is a **runtime** edge, so build-before-consume applies: every contracts-consuming script (`dev`/`deploy`/`test`/`typecheck`) is prefixed with `pnpm --filter @cartularium/contracts run build`, and a `check` script brings edit-shell under the root `pnpm check`. Runtime deps: Hono, Octokit, valibot, @cartularium/contracts. When adding cross-package DTOs, land them in contracts (not a new per-package duplicate).
- **`/api/edit/assay/*` lane consumes assay's evolving case format.** Don't build new consumers of this lane while assay's case format is in flux. Pin to a specific contract version explicitly (submitted-case v1, preview-result v1).
- **Don't add ad-hoc fields to submitted-case v1.** Richer cases get new contract versions plus runner capability negotiation.
- **Default review lane: excel + gsheets.** HyperFormula is available for explicit smoke jobs and hosts not ready for Excel/GSheets, but not the default.
- **SPA fallback uses Pages Function** (`functions/edit/[[catchall]].js`) at the cartularium repo root, NOT `_redirects` — CF Pages rejects self-loops in `_redirects`.
- For the full cross-cutting picture (when available): see `internal/architecture/edit-shell.md`.

## Local conventions

- Storage stack: D1 for sessions, submitted-cases, preview jobs, results; R2 for case payloads and result payloads; KV for rate limits.
- A thorough audit of the route surface is deferred work — the surface grew quickly. Flag refinements rather than silently changing endpoint shapes.
