# LibreOffice blank-cell artifact — recalc-on-load (2026-07-11)

Worktree `assay-floor`, branch `feat/assay-floor-hardening`. Investigation of the
suspected libreoffice driver artifact where its recorded fixture value is a blank cell
while every other engine computes a value.

## Verdict: CONFIRMED — driver never forced recalc; blanks are seed-infidelity, not observations

The libreoffice driver (`packages/drivers/python/libreoffice_driver.py`) evaluates by:

1. `openpyxl` writes the formula string into cell `AA1` of an xlsx. **openpyxl does not
   compute formulas** — it writes the formula text with *no cached result*.
2. `soffice --headless --convert-to xlsx` loads that xlsx and re-saves it.
3. `openpyxl` reads the re-saved file with `data_only=True`, i.e. it reads the *cached*
   value of each cell.

The cached value only gets populated if LibreOffice **recalculates while loading**. The
default "Recalculation on File Load" mode for OOXML (and ODF) documents is *prompt*, which
in headless mode is a silent no-op. So soffice re-saved the file with the formula intact but
**no computed result**, and step 3 read back `None`. The driver had no `calculateAll`, no
recalc filter, and no profile setting forcing recalc — the code path had nothing that would
ever compute a formula.

### Evidence

- **`=SIN(1)` records as blank** in `fixtures/math-longtail/libreoffice.json`. That is
  genuinely `0.841…`, not zero — a null-vs-zero explanation is impossible.
- **Literal grid inputs survive; formula results never do.** The *only* 4 non-blank entries
  in all of libreoffice's fixtures are 4 `spill-edge` cases, and their sole non-null cell is
  the literal string `"blocker"` — a spill-blocker *input* cell the seed places in the grid,
  which round-trips through openpyxl untouched. The formula result (`=SEQUENCE(...)`) beside
  it is still null. Literal cells pass through; computed cells are uniformly empty. This is
  the signature of "loaded and re-saved without recalculating."
- Fixture schema note (incidental): `libreoffice.json` is on the *old* fixture format
  (`entry.result` = raw grid), generated `2026-05-11`; the other engines are on the newer
  `entry.outcome` `{kind, grid, extent}` format. Cross-engine comparison below accounts for
  both.

## Blast radius

Counting `fixtures/*/libreoffice.json` entries where libreoffice is blank **and** ≥2 other
engines have a genuine (valued-or-error) observation for the same key:

**1844 of 1921 libreoffice fixture entries** are blank-with-other-engines-valued. In practice
**every formula result across every suite is blank** — the per-suite blank count equals the
suite's total almost everywhere. The 77-entry gap between 1844 and the ~1921 blanks is cases
where fewer than 2 *other* engines had a value either (genuinely-empty everywhere: volatiles
like `NOW`/`RAND`, external references, some errors), so they don't count as false forks.

Per-suite (suspect = blank-lo with ≥2 other engines valued / total lo entries):

| suite | suspect | lo blank | lo total |
|---|---|---|---|
| math-longtail | 187 | 190 | 190 |
| statistical-descriptive | 180 | 180 | 180 |
| engineering | 147 | 147 | 147 |
| statistical-distributions | 137 | 137 | 137 |
| operator | 115 | 115 | 115 |
| text-longtail | 97 | 104 | 104 |
| date | 87 | 89 | 89 |
| info | 85 | 93 | 93 |
| financial-timevalue | 76 | 76 | 76 |
| broadcasting | 66 | 66 | 66 |
| array-longtail | 65 | 65 | 65 |
| math | 65 | 65 | 65 |
| financial-securities | 60 | 60 | 60 |
| statistical-analytics | 53 | 53 | 53 |
| type-coercion | 52 | 53 | 53 |
| error-handling | 45 | 45 | 45 |
| lookup-longtail | 45 | 55 | 55 |
| database | 38 | 38 | 38 |
| text | 37 | 37 | 37 |
| parser | 34 | 34 | 34 |
| logical | 32 | 32 | 32 |
| lambda | 24 | 24 | 24 |
| regex | 21 | 21 | 21 |
| statistical | 21 | 21 | 21 |
| lookup | 17 | 17 | 17 |
| spill-edge | 16 | 17 | 21 |
| divergences | 8 | 8 | 8 |
| external | 8 | 25 | 25 |
| arrays | 7 | 7 | 7 |
| spill | 7 | 15 | 15 |
| arithmetic | 6 | 6 | 6 |
| volatile | 6 | 22 | 22 |
| **TOTAL** | **1844** | — | **1921** |

(Reproduce with `node /tmp/scope2.mjs` — the script is in the session scratchpad; it walks
`fixtures/*/`, treats libreoffice's `result` grid and other engines' `outcome.grid` per their
respective formats.)

## The fix (committed)

`packages/drivers/python/libreoffice_driver.py`:

- Added `_seed_recalc_profile(profile_dir)` + `_RECALC_PROFILE_XCU`. It writes a
  `registrymodifications.xcu` into a fresh LibreOffice user profile setting
  `/org.openoffice.Office.Calc/Formula/Load` → `ODFRecalcMode=0` **and** `OOXMLRecalcMode=0`
  (mode 0 = *always recalculate on load*; 1=never, 2=prompt).
- `recalc_with_libreoffice` now seeds that profile under the temp dir and passes
  `-env:UserInstallation=file://<profile>` to soffice as the first argument. `UserInstallation`
  is platform-independent (the HOME-derived profile path differs macOS vs Linux), so the
  seeded `.xcu` is found deterministically.
- Docstrings in the python driver and `src/drivers/libreoffice.ts` updated to record why the
  profile seeding exists.

With recalc-on-load forced to *always*, the `--convert-to` load pass computes every formula
result before re-saving, so `data_only=True` reads real values instead of `None`.

Verified locally (no soffice needed): the helper writes a well-formed `.xcu` and returns a
correct `file://` UserInstallation URL (`uv run` unit check passed).

## What remains for the maintainer

- **LIVE VERIFICATION REQUIRED.** No `soffice` on this dev box (`which soffice` empty, no
  `/Applications/LibreOffice.app`), so the end-to-end recalc was not exercised. On a machine
  with LibreOffice, run the driver on e.g. `=ACOS(0)`, `=GCD(12,18)`, `=SIN(1)` and confirm
  values come back non-null. The registrymodifications.xcu + recalc-on-load approach is the
  canonical fix for exactly this "headless --convert-to ships blank formula cells" symptom, so
  I'm confident, but it needs one real run to close.
  - Fallback if a given LibreOffice build still ships blanks: replace `--convert-to` with a
    headless Basic/UNO macro that opens the doc, calls `ThisComponent.calculateAll()`, then
    stores it. More invasive; only reach for it if the profile setting proves insufficient.

- **Regenerate libreoffice fixtures.** Not done here (no soffice). Per `docs/runner-ops.md`
  the regen command per suite is:

  ```sh
  cd packages/assay
  node build/cli.js generate tests/<suite>.yaml --platform libreoffice
  ```

  Run it wherever LibreOffice is installed (rebuild `@cartularium/drivers` first so the python
  change ships). Start with `tests/math-longtail.yaml` to confirm blanks become values, then
  fan out to the rest. All 32 suites listed above carry the artifact.

- **Downstream self-heals on regen.** These blanks currently fabricate "forks" where
  libreoffice sits alone in a blank-value equivalence class. The 3f annotations that read them
  as recalc-semantics / null-vs-zero dissolve once the fixtures carry real values — no manual
  annotation cleanup needed beyond a re-seed/rebuild. See `handoff-3f-2026-07-11.md`. The DV
  YAML (`packages/assay/divergences`) was left untouched per instructions (parallel 3f pass
  owns it).

- **Optional:** add an env-gated live driver test (`RUN_LIVE_LIBREOFFICE=1`) mirroring
  `excel-live.test.ts`, asserting `=SIN(1)` ≈ 0.841. Not added here because it can't be run/
  verified without soffice.
