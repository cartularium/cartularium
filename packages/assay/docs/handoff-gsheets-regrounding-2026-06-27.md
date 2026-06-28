# Handoff — gsheets divergence re-grounding (2026-06-27)

A gsheets-SME spot-check of the divergence catalogue against **live** Google Sheets.
Branched off the CP3 thread; produces source-of-truth corpus fixes that the CP3
re-founding (verdict-free agreement matrix) will regenerate from.

## What this session did

Live-probed 4 gsheets-only DV clusters and fixed the two defective ones at SOURCE:

- **DV-0020** — was `cause: missing-function`, two real defects:
  - **IMPORT\* + IMAGE (×6)** — the `#REF!` is the **per-sheet external-access toggle**
    artifact, *not* a divergence (already diagnosed: Probe 8, `docs/gsheets-celldata-gap.md`;
    see memory `assay-external-io-import-image`). **Fix shipped:** stripped the stale
    `overrides.gsheets {missing-function / #REF!}` from `tests/external.yaml`; they stay
    `supportLevel: design-pending` / `features:[external-io]` / `skip-reason:network`.
  - **REGEXMATCH (×6)** — real divergence: gsheets RE2 rejects `\p{L}` + lookbehind/lookahead
    (probe: `#REF!` "not a valid regular expression"). **Fix shipped:** relabeled
    `tests/regex.yaml` `missing-function → missing-arg-form` (recorded `#REF!` kept — correct).
- **DV-0023** — 6/7 are genuine gsheets arity `#N/A` (API-message-backed). **NORM.S.DIST now
  returns `0.5`** (agrees) — stale; drops automatically under the fixture-based re-founding.
- **DV-0117/0118** — QUERY returns the correct grid (gsheets-native); already `status: vanished`.

Uncommitted diff: `tests/external.yaml`, `tests/regex.yaml` (both parse; tests untouched-green).

## The proven harness (reuse it)

Isolated live probe — kills tiling-artifact confusion (one formula per call, no co-tenancy):

- creds: `ASSAY_GOOGLE_CREDENTIALS_PATH=/Users/jaegun/personal/cartularium/packages/assay/credentials.json`
  (installed-app OAuth; the worktree lacks the file). Token in `~/.assayrc.json` (auto-refreshes).
- run a vitest probe gated on `RUN_LIVE_GSHEETS=1`, `ASSAY_TILE_FACTOR=1`; `new GSheetsDriver({spreadsheetId, accessToken})`,
  one task per `evaluateBatch([task])`. Self-provisions a scratch sheet (trash after).
- **Gold for cause classification:** a direct `values:batchUpdate` + `spreadsheets.get?fields=...effectiveValue`
  read returns the raw `errorValue.{type,message}` — that message is what distinguishes a real
  divergence (`"Expected 2 arguments, but got 3"`) from an environment artifact (`"use a desktop web browser…"`).

## Next task (scoped)

**Finish the gsheets re-grounding + sweep the external-access artifact.**

1. **Live-reprobe the 8 remaining gsheets-only DVs** and confirm/correct at source:
   DV-0056 SORTN (value looked right), DV-0071 **MID/PERMUTATIONA** (MID likely `#VALUE!`, not
   `#NUM!` → split the cluster), DV-0120/0121/0123 DDB (FP-precision, real), DV-0152 **PPMT**
   (recorded == expected to 2dp → likely a bad authored `expect`, not `arg-semantics`),
   DV-0210/0212 spill-block (`#REF!` real; cause was mislabeled `missing-function`),
   DV-0221 GEOMEAN (FP-precision, real).
2. **External-access artifact sweep.** `tests/external.yaml` carries many other Google/web fns
   (GOOGLEFINANCE, GOOGLETRANSLATE, DETECTLANGUAGE, SPARKLINE, FLATTEN, …) with
   `cause: missing-function`. Audit which record a gsheets **toggle-artifact `#REF!`** vs a genuine
   result, and apply the DV-0020 treatment. Per `assay-external-io-import-image`.
3. *(Optional, larger)* the 37 **multi-engine** gsheets-touching DVs — spot-check the gsheets side.

**Acceptance:** every gsheets DV either confirmed-real (correct cause at source) or corrected in
`tests/*.yaml`; a findings list; `tests/*.yaml` parse + `vitest run` green.

**Do NOT** run `matrix --seed-catalogue` to "regen" — it reads **authored** causes and ignores the
fixtures (reproduces the bugs, reshapes IDs). The real regen is the CP3 verdict-free agreement
matrix, which retires the cause/override layer wholesale; these source fixes feed it.

## Parked (larger, separate)

- **external-fetch build** — implement `features: external-io → external-fetch` + driver verifies
  the per-sheet "allow external sites" toggle at init, then re-measure IMPORT\* on a **toggle-enabled**
  probe spreadsheet (turns the skips into real evidence). IMAGE likely stays unseedable headless
  (charter caveat). Needs the maintainer to flip the toggle on a probe sheet.

## Completed (2026-06-27, continued)

Next-task items 1 + 2 done (item 3, the 37 multi-engine spot-checks, left for later).
Same proven harness — one gold probe (direct `values:batchUpdate` +
`spreadsheets.get` reading `effectiveValue.errorValue.{type,message}`), all 11
formulas in spaced columns on one scratch sheet.

**Item 1 — 8 gsheets-only DVs reprobed (commit `1d7ff3ed`).** 4 cause relabels at
source; the rest confirmed value-faithful:
- DV-0071 `permutationa-zero-pick`: gsheets `#NUM!` "param 2 value is 0, must be
  >=1" where Excel returns 1 → `error-code` → **`arg-semantics`** (errors on an arg
  domain Excel accepts; not a both-error code clash).
- DV-0071 `mid-start-0`: gsheets `#NUM!` (handoff guessed `#VALUE!` — it is `#NUM!`,
  same domain message). Excel is `#VALUE!`, so both-error → `error-code` **stands**.
  The cluster's real split: PERMUTATIONA (value-vs-error) vs MID (error-vs-error).
- DV-0152 `ppmt-ipmt-plus-ppmt-equals-pmt`: every engine returns ~1073.6432; the
  authored `expect` (1073.64) is rounded to 2dp → the spread is pure FP, no arg
  interpretation. `arg-semantics` → **`precision`** (all 6 value engines).
- DV-0210/0212 spill-block: gsheets `#REF!` "Array result was not expanded because
  it would overwrite data" — a real spill-block (SEQUENCE works), mirror of Excel's
  `#VALUE!`. `missing-function` → **`error-code`**.
- Confirmed unchanged: DV-0056 SORTN ×2 = `[[1],[2],[4]]` (value correct; cause
  "shape" imperfect but retires under CP3); DV-0120/0121/0123 DDB + DV-0221 GEOMEAN
  FP-precision exact.

**Item 2 — external-access sweep (commit `d9f9c4cc`).** No toggle-artifact `#REF!`
remains in `external.yaml` (prior commit stripped IMPORT*/IMAGE; the Google-fetch
fns carry no gsheets override, all `skip-reason:network`). One consistency gap:
DETECTLANGUAGE lacked `features:[external-io]` its 8 siblings declare → added.
FLATTEN (array-longtail.yaml) untouched — its `missing-function` overrides are the
Excel-family engines that genuinely lack it; not an external-fetch fn.

Open follow-ups (noted, not done): item 3 (37 multi-engine gsheets-touching DVs);
the parked external-fetch build.

**DV-0152 — DO NOT chase an `expect` edit.** Archaeology (2026-06-27): per the
ratified CP2 contract (`comparison-output-contract-2026-06-17.md`), `expect:` is
**lens sugar, not canon** — an out-of-band (A) self-check assertion, not the oracle.
Under the verdict-free regen the partition is computed from the **recorded cross-engine
values**, not from `expect`. PPMT's engines all return ~1073.6432 ⇒ **uniform (no
fork)**; the old "divergence" was an artifact of scoring full-precision results against
a 2-dp `expect`. So the rounded `expect` self-dissolves when the matrix stops being
scored against it — no manual edit needed. (The authoring-schema migration that moves
`expect`→lens sidecar + retires `override` is DESIGNED but NOT built — a named CP3 cost,
see §3 of that doc; today `catalogue.ts` still carries `expect`/`overrides`/`status`
with their old canon semantics.)

166 assay tests green. 3 commits on `integrate/assay-onto-main` (LOCAL, not pushed):
`56eb16bf` (prior fixes) · `1d7ff3ed` (item 1) · `d9f9c4cc` (item 2).

## Cleanup

- Trash the scratch sheets (assay token is sheets-scope only — can't delete via API):
  - `https://docs.google.com/spreadsheets/d/1Si5d6lwYC4FxGMA-wlUbhSqwh0SYG8N0z6McWI6v8d8` (prior session)
  - `https://docs.google.com/spreadsheets/d/1LHeyeY9U7clGjhqXMmpYQpEH8mYtjpKRP5PP_Roqw3w` (this session's probe)
- Temp probe test removed.
