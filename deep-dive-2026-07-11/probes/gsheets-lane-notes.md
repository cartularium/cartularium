# gsheets probe lane — notes (2026-07-11)

**Scratch spreadsheet id (needs manual cleanup — no drive scope to delete):**
`1W7avHwot1cP3cyFSa4lv41A1kld6kt77mLfFp_GAgJI` (title "assay-deep-dive-2026-07-11").

## Counts

- 78 gsheets-targeted probe requests gathered across all 14 batches; all 78 ran in a single
  `evaluateBatch` (the driver chunked internally). No host wedge, no crash, no quota error — no D4
  recovery was triggered.
- Outcome kinds: **78 `value`** (every request returned an engine-attributable value/error grid;
  zero `skipped`/`infra`/`crashed`/`unclassified`).
- Verdicts vs hypothesis: **74 confirmed, 3 contradicted, 1 unclear.**

## Headline contradictions (3)

1. **dve-007 — `=IFERROR(10/{1,0,2}, -1)`.** Hypothesis said gsheets broadcasts element-wise and
   spills `{10,-1,5}`. gsheets actually returned a **single scalar `10`** (extent 1×1). Without an
   `ARRAYFORMULA` wrapper, gsheets does not map `IFERROR` over the array argument — the error branch
   (`-1`) never surfaces and only the first element is emitted. The spill/broadcast claim is false
   for gsheets here.

2. **spill-broadcast-004 — `={1,2,3}+{10,20}`.** Hypothesis said both engines pad the
   non-overlapping cell with `#N/A` → `[11,22,#N/A]`. gsheets returned a **single scalar `11`**
   (extent 1×1). For two mismatched-length **row** vectors gsheets does _not_ spill-with-padding; it
   returns only the first element. This is a sharp, non-obvious contrast with **spill-broadcast-002**
   (`={1,2,3}+{10;20;30}`, row + **column** vector) which _does_ broadcast to a full 3×3 outer-product
   grid. So gsheets' array-arithmetic spill behaviour depends on orientation: row×column broadcasts;
   row+row of unequal length collapses to a scalar.

3. **math-core-004 — `=CONVERT(1,"m","ft")`.** Hypothesis said gsheets rounds to ~9 decimals
   (`3.280839895`). Live gsheets returned **`3.28083989501312`** — ~15 significant digits, diverging
   from Excel's `3.2808398950131235` only at the ~15th digit. This is gsheets' well-known 15-sig-fig
   storage cap, **not** a 9-decimal rounding. If the recorded fixture showed `3.280839895`, that was a
   read/serialization artifact (formattedValue vs effectiveValue), not gsheets' stored value. The
   divergence from Excel is real but is a last-digit precision difference, not a decimal-place round.

## Unclear (1)

- **lookup-002 — `=FORMULATEXT(A1)` with `grid={A1:42}`.** Returned `#N/A`, which only reconfirms
  that FORMULATEXT of a **value** cell is `#N/A`. The hypothesis's actual question — does gsheets
  return the formula _text_ when A1 holds a **live formula** — was not tested: a numeric grid seed
  cannot create a live-formula cell (see the seeding note below). Needs a probe that seeds A1 as a
  live formula (a `{formula: ...}` seed object), which the current probe-request schema's scalar
  `grid` does not express.

## Methodological finding: how string grid seeds are stored (RAW / literal text)

The gsheets driver classifies a **plain-string** grid seed as `text` and writes it via
`valueInputOption: RAW` (`packages/drivers/src/drivers/contract/seed.ts:70` `classifySeed`;
`gsheets.ts` `partitionSeeds`). RAW means gsheets stores the literal characters — a leading `=` is
**not** parsed as a formula. Consequences observed:

- **dve-001** (`=SUM(A1:A3)`, `A2="=1/0"`): A2 is stored as the literal text `=1/0`, never a live
  `#DIV/0!`. SUM ignores the text cell → `1+3=4`. This is the mechanism behind the fixture's `4`.
- **info-002b** (`A1='=""'`): stored as literal text, not a live formula, so the intended
  "live-formula-yields-empty-string vs typed-empty-string" disambiguation was not exercised
  (result `FALSE` matched anyway — both are ISBLANK-false in gsheets).
- To seed a genuinely live formula, use a `{formula: "..."}` seed object (classified as `formula`,
  written USER_ENTERED). Only `{error: "#..."}` and `{formula: ...}` object seeds hit USER_ENTERED;
  the target formula-under-test always does.

## Corroborated cross-cutting gsheets behaviours worth carrying to the wiki

- **Empty string is a value, not a blank.** `ISBLANK("")=FALSE` (info-002), and both COUNTA _and_
  COUNTBLANK count a `""` cell (`COUNTA=3`, `COUNTBLANK=1` for one `""` among three cells,
  stat-core-001). Excel treats the same `""` as blank in COUNTA.
- **Booleans/quoted-numbers in an array literal are skipped, not coerced.** `SUM({TRUE,FALSE,TRUE})=0`,
  `PRODUCT({"2","3","4"})=0`, `SUM(A1:A3)=0` for text-typed `"1","2","3"`. Same rule Excel follows.
- **Boolean > number in cross-type comparison.** `GT(TRUE,0)=TRUE`, `GT(2,TRUE)=FALSE`
  (ordering number < text < boolean).
- **SORT/SORTBY signature.** gsheets' 3rd SORT arg is `is_ascending` (so `-1` → truthy → ascending),
  the opposite of Excel's `sort_order` (`-1` → descending). SORTBY is `#NAME?` (not exposed).
- **15-sig-fig rendering cap** shows up across the IM-family and CONVERT: IMEXP, IMLN, IMPOWER all
  render components at ~15 sig figs; the IMPOWER `i^2` uppercase-E residue `-1+1.22...E-16i` is kept.
- **UNIQUE is case-sensitive** in gsheets (spills Apple/apple/APPLE), case-insensitive in Excel.
- **Error-code idiosyncrasies** (gsheets side): RRI(nper=0)=`#DIV/0!`, IMDIV(/0)=`#DIV/0!`,
  CHOOSE(out-of-range)=`#NUM!`, INDEX(out-of-bounds)=`#NUM!`, MUNIT(0)=`#NUM!`, CHAR(0)=`#NUM!`.
  Several of these are the gsheets branch of a documented Excel-vs-Sheets error-code split.
- **XIRR coerces text dates but XNPV rejects them** (financial-002 computes 0.0638; financial-001
  is `#VALUE!`) — an internal asymmetry within the same engine on the same seed shape.

## No quota issues

Single batched call, ~78 tasks. The driver's internal chunking handled sheet creation/teardown; no
`RESOURCE_EXHAUSTED` or rate-limit errors surfaced. The only cleanup debt is the one scratch
spreadsheet noted at the top (D4 orphan behaviour — we lack `drive.file` scope to delete it).
