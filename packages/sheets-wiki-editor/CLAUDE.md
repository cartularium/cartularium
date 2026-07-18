# @cartularium/sheets-wiki-editor

Contributor editor SPA mounted at `/edit/*` on sheets.wiki. Preact + CodeMirror. The browser-side counterpart to edit-shell.

## Build & test

- **Agent-friendly dev path** (recommended): `pnpm dev:edit` from repo root — runs this editor + edit-shell together with D1 migrations auto-applied. See `DEVELOPMENT.md` for first-time setup (`pnpm setup:dev`).
- `pnpm --filter @cartularium/sheets-wiki-editor dev` — `vite` (this package only; no edit-shell)
- `pnpm --filter @cartularium/sheets-wiki-editor build` — `vite build`
- `pnpm --filter @cartularium/sheets-wiki-editor preview` — `vite preview`
- `pnpm --filter @cartularium/sheets-wiki-editor test` — `vitest run` (uses jsdom + @testing-library/preact)
- `pnpm --filter @cartularium/sheets-wiki-editor check` — `tsc --noEmit`

## Key files

- `src/main.tsx` — Vite entry
- `src/App.tsx`, `src/Chrome.tsx` — top-level app + chrome
- `src/routes/` — route components
- `src/editor/` — CodeMirror editor surface
- `src/components/`, `src/hooks/` — UI primitives + hooks
- `src/lib/edit-shell.ts` — edit-shell API client + **locally-duplicated DTOs** (transitional)

## Boundaries

- **Don't expand ambition past mature edit-shell endpoints.** The "edit shell was over-ambitious" trap is this editor + the `/api/edit/assay/*` lane wanting full assay case authoring with previews while assay's case format is in flux. If the editor wants a feature, the upstream contract must be stable first.
- **Don't bypass edit-shell.** Never talk to GitHub directly from the browser.
- **Don't fork brand/chrome tokens.**
- **Don't add content-syntax authoring (footnote insertion, assay-citation pickers, etc.) until the syntax is defined in sheets-wiki.** The editor consumes content syntaxes, never coins them.
- **Don't add new locally-duplicated DTOs** to `src/lib/edit-shell.ts` without flagging. The existing duplication is technical debt awaiting the contracts migration; new duplication compounds it.
- **Watch the closeBrackets vs `[[` autocomplete conflict** (`[[array<tab>` becomes `[[array]]]]`). Fix requires peek-aware autocomplete apply.
- For the full cross-cutting picture (when available): see `internal/architecture/sheets-wiki-editor.md`.

## Local conventions

- Preact + CodeMirror 6, vim mode optional via `@replit/codemirror-vim`.
- Build output is consumed by sheets-wiki's build via `scripts-build/copy-editor.mjs` (which preserves the emitted `edit-index.json`).
- This is one of four chrome-template consumers — chrome template context changes coordinate across all four.
