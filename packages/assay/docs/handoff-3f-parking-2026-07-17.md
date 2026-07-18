# Parking note — 3f review deferred behind charter initiative (2026-07-17)

> **Review completed 2026-07-18** via the re-founding walkthrough
> (`internal/research/assay/design-grounding-2026-07-18.md` and the
> `internal/decisions/2026-07-18-assay-*` records), which served as the
> charter conformance check this parking anticipated.

3f is COMPLETE and awaiting maintainer review; the review is deliberately parked until the
larger cartularium charter initiative lands, so it can double as the first conformance check
against the new charter. This note records the verified parked state and the review re-entry
path, written while context was still warm.

## Verified parked state (2026-07-17)

- **Zero drift vs origin/main**: branch contains origin/main entirely (0 behind); main has not
  moved since merge-base `907e77c4` (2026-06-15). No rebase was needed. If main moves during
  the charter work, re-check with
  `git rev-list --left-right --count feat/assay-floor-hardening...origin/main`.
- **Vitest green**: `pnpm --filter assay check` + `pnpm --filter assay test` → 176 passed,
  4 skipped (skips = live gsheets + excel-corpus-validation, expected). Matches the handoff's
  stated gate.
- **Fixture verification (`node build/cli.js run tests/*.yaml`)**: 1955 tests, 5733 passed,
  105 failed, 3864 recorded, 947 forked — **bit-for-bit identical to the branch point**
  (`64eaaf8d`, verified by running the same command in the `assay-batch-model` worktree).
  The 105 failures are pre-existing missing-fixture gaps (126 lattice platform-checks, then
  gsheets/excel live-only cases: volatile NOW/RAND, external I/O QUERY/IMPORT*/IMAGE, regex
  lookaround, CELL/info) plus 4 value mismatches — all baseline, none introduced by 3f.

## Review re-entry (ground-up)

- **Scope**: 14 commits, `64eaaf8d..HEAD` (`a15e9b37..7477d986`). The branch base
  `integrate/assay-onto-main` (@`64eaaf8d`) is itself unmerged — the `assay-batch-model`
  worktree paused at "RESUME — 3f" on that branch; **coordinate before merging either**.
- **Read order** (per handoff-3f-2026-07-11.md): `reclassify-policy-2026-07-11.md` (D-3f-1..7,
  PROPOSED — the review should ratify or amend these) → `handoff-3f-2026-07-11.md` →
  `libreoffice-recalc-2026-07-11.md` → this note.
- **The load-bearing claims to review**:
  1. Manifest universe widening (D-3f-4): V4-era `isFunctionName` gate removal — 88 non-function
     subjects restored; forks 1822→1908, danglings 17→0.
  2. 3f.5 authorship fan-out: 124 annotations (DV-0258..DV-0381) authored from evidence by a
     48-agent workflow; subjectIn claims strictly verified (3 of 10 accepted).
  3. LibreOffice recalc artifact: CONFIRMED (1844/1921 lo fixtures were fabricated blanks),
     driver fixed (`32607044`), all 32 suites regenerated (`bf61e5cf`) → coverage 100%.
     The 258 quarantined refs were re-processed post-regen.
  4. HEAD commit `7477d986`: community-classification design is **PROPOSED, not reviewed** —
     a design doc, not code; review separately from the code review.
- **Session-scoped artifacts are gone** (scratchpad packets, workflow scripts, quarantine
  bucket). Regeneration recipes are in handoff-3f-2026-07-11.md; the committed YAML/fixtures
  are the durable outputs — review those, not the scaffolding.
