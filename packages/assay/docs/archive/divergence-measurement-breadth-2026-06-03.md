# Divergence measurement — breadth pass (13 functions, Excel ↔ Sheets), 2026-06-03

Multi-function read on the **aggregate irreducible surface**, following the VLOOKUP pilot
([`divergence-measurement-2026-06-03.md`](./divergence-measurement-2026-06-03.md)). **289 probes
across 13 functions, both engines 100% ok.**

> **Methodology correction — read this first.** An earlier version of this pass reported
> *"string↔number coercion is the dominant cross-cutting divergence."* **That was wrong — a
> measurement artifact.** Seeding a numeric-looking string `"3"` into the grid stores it as
> *different types* on the two platforms: gsheets' `USER_ENTERED` write coerces `"3"` → number
> 3, while Excel/openpyxl preserves it as text `"3"`. Confirmed directly: `=ISNUMBER(A1)` with
> `A1="3"` → Excel `FALSE`, gsheets `TRUE` (and `=ISTEXT` the mirror); control `"abc"` agrees.
> So the "coercion divergences" were the two drivers feeding the formulas *different inputs*,
> not the engines evaluating differently. **Fix:** seed numeric strings via a formula (`="3"`),
> which forces genuine text on both engines. After the fix, every one of those divergences
> **disappeared** (the functions agree). The numbers below are post-fix.

## Corrected aggregate

| function | agree / total | verdict | note |
|---|---|---|---|
| MATCH | 30 / 30 | **AGREES_EVERYWHERE** | (coercion divergence was the seeding artifact) |
| MOD | 12 / 12 | **AGREES_EVERYWHERE** | |
| op:+ | 25 / 25 | **AGREES_EVERYWHERE** | |
| op:= | 25 / 25 | **AGREES_EVERYWHERE** | (was "IRREDUCIBLE coercion" — artifact) |
| LEN | 6 / 6 | **AGREES_EVERYWHERE** | |
| N | 6 / 6 | **AGREES_EVERYWHERE** | (was differ — artifact) |
| ISNUMBER | 6 / 6 | **AGREES_EVERYWHERE** | (was differ — artifact) |
| IF | 6 / 6 | **AGREES_EVERYWHERE** | (condition coercion agrees) |
| DATE | 5 / 6 | **EXPLICIT_BRIDGE** | 1900 leap-year bug (syntactic) |
| POWER | 20 / 24 | IRREDUCIBLE (guard) | base-0 error edges |
| op:& | 24 / 25 | (1 differ) | blank&blank — representation artifact |
| T | 3 / 6 | (3 differ) | non-text → ""; representation artifact |
| VLOOKUP | 80 / 112 | IRREDUCIBLE | oob error-precedence (8) + array col-idx (24, = ARRAYFORMULA) |

**8 of 13 functions are fully portable.** After removing artifacts, the genuine formula-semantics
divergence is ~13 probes / 289 (~4.5%), concentrated in three specific mechanisms.

## Genuine divergence mechanisms (real engine behavior, spot-checked)

1. **DATE 1900 leap-year bug** — `=DATE(1900,2,29)` → Excel `60`, Sheets `61`. Syntactic (literal
   args) → **EXPLICIT_BRIDGE**. All other DATE rollover cases agree.
2. **POWER base-0 edges** — `=0^0` → Excel `#NUM!`, Sheets `1`; `=0^-1` → Excel `#DIV/0!`, Sheets
   `#NUM!`. Data-borne (base value) but **runtime-guardable** (check `base==0`). `^` and `POWER`
   agree with each other; negative-base-fractional agrees.
3. **VLOOKUP out-of-bounds-col error precedence** — `=VLOOKUP(9, A1:C3, 5, FALSE)` → Excel `#N/A`
   (not-found wins), Sheets `#REF!` (bad-index wins). Gated by found-ness (data-borne), so it
   stays **IRREDUCIBLE** (author-flag), but narrow. VLOOKUP's other 24 "divergences" are the
   array col-index `{2,3}` case = the **known ARRAYFORMULA wrapping** difference (syntactic
   explicit-bridge), not irreducible.

### Artifacts (not real engine divergences)

- **Value-type ingestion asymmetry** (the big one): `"3"` is a number on Sheets, text on Excel.
  Drove every apparent coercion divergence. *Real and important as an interop fact* — but it lives
  in the **value/ingestion layer, not formula semantics**, and our measurement of it was a seeding
  artifact (it reflects the driver write paths, not necessarily how real data lands).
- **Blank vs empty-string** (`op:&` blank&blank, `T` of non-text): both engines compute `""`; the
  drivers capture empty-vs-null differently — the same wire-ambiguity the gsheets D8.β ISBLANK
  probe exists to resolve. Likely driver-fidelity, not engine divergence.

## Strategic read — the pivot

This pass **overturns** the earlier "coercion-dominant" story and lands somewhere more useful:

- **Formula evaluation semantics are highly portable Excel↔Sheets.** Of 13 common functions, 8
  agree completely and the rest diverge only at narrow, specific edges (a famous date bug, two
  zero-power cases, lookup out-of-bounds precedence, plus the ARRAYFORMULA wrapping convention).
  The formula-translation surface is *small* — which weakens the case for a heavy translation hub
  even further, and means a thin bridge (a few rewrites + guards + one author-flag) covers a lot.
- **The real cross-platform divergence is in the VALUE layer, not the formula layer.** What looked
  like formula divergence was value-type ingestion (string-vs-number) and blank-vs-empty
  representation. That reframes the bridge problem toward **value/type fidelity** — which is
  exactly the [value-model thread](./value-model-foundations-2026-05-30.md) (storable/expressible,
  the cell-value ontology), not the formula transpiler.
- **Method lesson, reinforced twice over:** axis/seed completeness is the measurement's main threat.
  Three artifacts now (array_context, blank/empty, and the big one — type-faithful seeding). The
  harness needs a **known-bridges / type-faithful-seed pre-filter** so sweeps report the *residual*
  surface. (Type-faithful seeding for numeric strings is now in the families.)

## Caveats

- 13 functions, Excel↔Sheets only, dynamic-array mode, **test-not-prove**. Reproducible via the
  committed suites/fixtures (`assay measure gen <f>` → `generate -s <sheet> -p excel,gsheets` →
  `measure analyze <f>`). Families: vlookup, match, mod, power, concat, add, eq, len, n, t,
  isnumber, if, date.
- AGREES_EVERYWHERE counts agreeing-on-errors (e.g. MOD ÷0 → `#DIV/0!` both) — real portable behavior.

## Next

- **Measure the value layer deliberately** — a value-ingestion / type-fidelity probe (how each
  platform stores a typed literal, blank vs "", date serials), since that's where the real
  divergence is. Ties into the value-model work.
- **Arrays & shapes** (the user's next frontier): array-literal syntax Excel `{1,2;3,4}` vs Sheets,
  functions/refs *inside* array literals (Excel disallows constants-only, Sheets allows), spill
  shapes, ARRAYFORMULA — author with type-faithful seeding from the start.
- **Lambdas** after: LAMBDA/MAP/REDUCE/BYROW, lambdas-in-arrays, helper-fn availability.
- Build the **type-faithful-seed + known-bridges pre-filter** into the harness so the surface
  number is honest by construction.
