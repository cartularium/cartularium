# @cartularium/drivers

The engine driver layer — "run any formula on any real spreadsheet engine and read back
what the official APIs hide." The 8 per-engine drivers (excel, gsheets, hyperformula,
ironcalc, lattice, libreoffice, formulas, pycel) behind one `Driver` contract, the
`createDriver` factory, the batch-execution model (placement / isolation / read), and the
report-only capability descriptors. Extracted from assay (roadmap Step 4, 2026-06-16).

## Build & test

- `pnpm --filter @cartularium/drivers build` — builds `@cartularium/contracts` first, then tsc
- `pnpm --filter @cartularium/drivers test` — `vitest run` (driver + batch-model unit tests)
- `uv sync` (in this package) — installs the python-driver deps (xlwings, ironcalc, formulas,
  pycel) into `.venv`. Five drivers shell out to `python/*.py`; `PROJECT_ROOT` resolves to
  this package root, so the python env + scripts live here.
- **LIVE tests are opt-in** (env-gated): `RUN_LIVE_EXCEL=1` (needs Excel + `uv sync`),
  `RUN_LIVE_GSHEETS=1` (needs `assay login` token + `credentials.json` via
  `ASSAY_GOOGLE_CREDENTIALS_PATH`). They never run in normal `vitest run`.

## Key files

- `src/drivers/driver.ts` — the `Driver` interface + `CapabilityDescriptor` (the contract)
- `src/drivers/create.ts` — `createDriver(platform, config?)`, the typed pure-vs-live asymmetry
- `src/drivers/{excel,gsheets,…}.ts` — the 8 drivers (5 shell out to `python/`)
- `src/drivers/contract/*` — the batch model: `layout` (coords), `cohost` (lump screen +
  `hasInput`), `packing` (the placement planner + spill-reach invariant), `read-model`,
  `probe`, `seed`, `contamination`
- `src/format/values.ts` — driver-I/O vocab (`DriverTask`/`DriverTaskResult`/§6.6 `Outcome`) +
  re-exports the value spine from `@cartularium/contracts`
- `src/format/capability-data.ts` — `loadCapability` / `capabilityDescriptorFor` + `capabilities/*.json`
- `python/` — the python drivers + `pyproject.toml`/`uv.lock` (the python toolchain)

## Boundaries

- **Depends only on `@cartularium/contracts`.** Never import from assay (the generation layer /
  catalogue / matcher / manifest) — that's the wrong direction. assay → drivers → contracts.
- **Capability is report-only** (`native | partial | absent`). The rewrite ADAPTERS
  (`reconcileFeatures`/`applyAdapter`) are a generation-layer concern and live in assay, not here.
- `lattice.ts` integrates the sibling Lattice repo at `/Users/astral/sandbox/current/lattice/`;
  a controlled boundary — runtime imports from Lattice into other cartularium packages are out of bounds.
- The batch model is wired into the tier-1 drivers (excel + gsheets dense-tile lumps); peripherals
  are fresh-per-task, isolated by construction.
