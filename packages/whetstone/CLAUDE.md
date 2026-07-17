# whetstone

Practice problems for spreadsheets with automated judging ("LeetCode for spreadsheets").
Working name, pre-alpha. Spec: `internal/specs/whetstone/product-and-judge.md` (DRAFT —
decisions there are pending maintainer approval; don't treat them as settled).

Currently only the W0 rehydration-fidelity spike exists (`spike/`): extract a sheet's
entered values, rehydrate into a fresh spreadsheet, diff computed outputs. See README.

- Uses assay's exported `getAccessToken` (per assay's boundary rule: ad-hoc probes use
  exported surfaces). Requires `assay login` / `~/.assayrc.json`.
- Run: `pnpm --filter @cartularium/whetstone gnarly | roundtrip <id-or-url>`.
- Typecheck: `pnpm --filter @cartularium/whetstone check`.
- `results/` is gitignored evidence output.
