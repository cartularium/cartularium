# assay roadmap

The strategic map for assay, framed by the maintainer (2026-05-30). Guiding
principle: **finish the base interactions with the ground before structuring
them for testing** — i.e. nail reading and generating before over-investing in
comparison semantics.

assay is fundamentally a pipeline over a spreadsheet engine: **read the
ground → generate fixtures from it → compare fixtures → surface to consumers.**
The three foundational milestones follow that pipeline.

## Milestone 1 — Reading truth from a sheet  ·  *models in place; reading done*

The cell/value model: what a driver reads back from an engine and the shape it
takes. This was the main work of the 2026-05 sessions.

- **Shipped:** the `RichCellValue` contract (`@cartularium/contracts`),
  excel + gsheets native rich emission, D8.β gsheets blank/null disambiguation,
  the matcher's structural-subset rich path.
- **State + gaps:** see
  [`cell-value-schema-review-2026-05-30.md`](./cell-value-schema-review-2026-05-30.md)
  (rich for 2 of 8 engines; rich data largely diagnostic-only; dead fields) and
  [`cell-value-fidelity-roadmap.md`](./cell-value-fidelity-roadmap.md) (the
  design forks).
- **Remaining (deferred):** per-engine capture ceiling for the 6 stub engines,
  Windows Surface B verification, structured types (Linked Data Types / Smart
  Chips). The 6 stubs cap how high later fidelity comparisons can resolve.

This milestone is substantially complete — the models are settled and reading
works for the primaries. Note the distinction from M2: **M1 is *what* we read
(the value model); M2 is *how* we drive the engine to read it reliably at
scale.**

## Milestone 2 — Fixture generation  ·  *NEXT; needs ground-up design*

How cases become fixtures: the orchestration around reading. This needs the
same from-first-principles design treatment the cell model got — it has been
accreted, not designed. Concerns to think through from the ground up:

- **Capabilities / feature-gating** — what an engine *can* do vs what a case
  *requires* (and how that interacts with Coverage in M3).
- **Batching** — chunking, the per-engine batch models (gsheets sheet-per-test
  + chunked API, Excel xlwings sheet-per-formula, etc.).
- **Test isolation** — temp-sheet/scratch hygiene, orphan cleanup, cross-test
  contamination.
- **Timeouts / failure handling** — per-platform setup isolation, partial
  failures, the abort-vs-continue policy.
- **Volatility** — per-cell volatility flagging (forced by the M3 "green =
  drift-free" model; we already hand-filter volatile drift today).
- **Missing-function capture** — emit an explicit not-implemented signal where
  the engine exposes it (makes M3 Coverage derivable).
- **Runner infrastructure** — builds on the existing Mac mini runner,
  Terminal-bridge, preview-worker job queue, OAuth (see
  [`runner-ops.md`](./runner-ops.md), [`preview-runner.md`](./preview-runner.md)).

This is the recommended focus for the next working session.

## Milestone 3 — Comparing fixtures  ·  *design started; needs more work*

How fixtures are compared, what "green" means, and how correctness is expressed.
A substantial whiteboard pass happened (2026-05-30) but it is **design
exploration, not built**, and the maintainer considers comparison a separate
conversation from reading/generation.

- Captured in
  [`comparison-model-design-2026-05-30.md`](./comparison-model-design-2026-05-30.md):
  fidelity as **capability / circulating / terminal** (renamed from Coverage /
  Behavior / Evidence); **green = relationship
  stability** (descriptive, oracle-free; drift is the N=1 case); **canon as a
  set of typed reference nodes** (universal / origin-engine / spec / consensus)
  where truth is unambiguous; `cause` → mostly-derived annotation.
- Linchpin open question: where the **function→origin map** lives (sheets.wiki
  function metadata?), which gates the whole canon layer.

## Future milestones

- **sheets.wiki integration** — surfacing the catalogue as reader-facing compat
  data (progressive-disclosure fidelity control).
- **assay.sheets.wiki** — the authoring/editor experience (capture evidence +
  annotate divergences).
- **Informing other packages** — interleaf / formulary consume assay's
  compatibility evidence (don't hardcode compat tables; query assay).
- **Site displays** — the catalogue site, per-function pages, divergence views.

## Note

The maintainer flags this roadmap may be missing items and invites reframing.
It captures direction as of 2026-05-30, end of the cell-model sessions.
