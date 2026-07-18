# Divergence measurement — synthesis (17 families, Excel ↔ Sheets), 2026-06-03

> **Update (post-review):** the "highly portable" headline below was **sampling-biased toward
> value-producing functions** and is qualified by the
> [structural pass](./divergence-measurement-structural-2026-06-03.md): a real divergence class —
> **Excel-only reference/intersection operators (`@`, space-∩, union) and divergent argument
> semantics (SORT's 3rd arg, a *silent* wrong result)** — was missed by the first arrays/lambdas
> pass. Also a 5th method artifact (Excel batch contamination) means **prior batched Excel results
> need isolated re-confirmation.** Read conclusion #1 with that caveat.

Capstone over the pilot + breadth + arrays + lambdas passes
([pilot](./divergence-measurement-2026-06-03.md) ·
[breadth](./divergence-measurement-breadth-2026-06-03.md) ·
[arrays](./divergence-measurement-arrays-2026-06-03.md)). **17 families, ~360 probes, both
engines 100% ok, every divergence spot-checked against real engine output.**

## The full aggregate

| verdict | families |
|---|---|
| **AGREES_EVERYWHERE** (portable) | MATCH, MOD, op:+, op:=, LEN, N, ISNUMBER, IF, spill (SEQUENCE/TRANSPOSE/SORT/UNIQUE), **LAMBDA (MAP/REDUCE/SCAN/BYROW/MAKEARRAY)** — 10 |
| **EXPLICIT_BRIDGE** (syntactic, statically carve-able) | DATE (1900 leap bug), lit:array (computed array literals), feature:array-op (ARRAYFORMULA wrap) — 3 |
| **IRREDUCIBLE — runtime-guardable** | POWER (base-0: `0^0`→#NUM!/1, `0^-1`→#DIV/0!/#NUM!) — 1 |
| **IRREDUCIBLE — author-flag** | VLOOKUP (out-of-bounds-col error precedence, found-ness-gated) — 1 |
| **representation artifact** (not a real engine divergence) | op:& / T (blank vs `""`) — 2 |

## Three conclusions

1. **Formula-evaluation semantics are remarkably portable Excel↔Sheets.** 10 of 17 families
   agree completely — including higher-order/lambda and inherently-array (spill) functions, which
   were a priori the likeliest to diverge. The genuine formula divergence is a handful of specific
   edges, and **only ~2 families have any *data-borne* (truly-irreducible) residual** (POWER base-0,
   guardable; VLOOKUP one author-flag edge). This is a strong argument that a heavy translation
   **hub/IR is unjustified** — a thin bridge covers the surface.

2. **The genuine formula divergence is mostly *syntactic* — statically detectable and bridgeable.**
   Array literals (constants-only on Excel; functions/refs on Sheets), the ARRAYFORMULA wrapping
   convention, and the DATE 1900 leap bug are all visible in the formula/structure and fixable by
   rewrite or config. No human-in-the-loop needed for these.

3. **The real cross-platform divergence lives in the VALUE layer, not the formula layer.** The
   single largest "divergence" the sweeps surfaced — string↔number — turned out to be **value-type
   ingestion** (a `"3"` is a number on Sheets, text on Excel), plus blank-vs-empty representation.
   These are value/provenance facts, not formula semantics. **The bridge problem is therefore
   primarily one of value/type fidelity** — i.e. the
   [value-model thread](./value-model-foundations-2026-05-30.md), not a transpiler.

## Method lessons (the measurement's main risk)

Three artifacts had to be caught and corrected — all the same root cause, **incomplete axis/seed
modeling**, not engine behavior:
- **array_context** (VLOOKUP array col-index looked irreducible; was ARRAYFORMULA wrapping).
- **type-faithful seeding** (numeric-string seeds stored as different types per platform → fake
  "coercion divergence"; the biggest one — it inverted the breadth headline until fixed).
- **blank vs empty-string** (driver-fidelity representation, not engine divergence).

So the harness's honesty depends on a **known-bridges / type-faithful-seed pre-filter**: apply the
known syntactic bridges (ARRAYFORMULA, computed-literal rewrite) and faithful seeding *before*
declaring divergence, so a sweep reports the *residual* surface. This is the highest-value next
infrastructure investment. (Type-faithful numeric-string seeding already landed.)

## Recommended next

1. **Build the known-bridges / type-faithful-seed pre-filter** into the harness.
2. **Measure the value layer deliberately** — a value-ingestion/type-fidelity probe (typed-literal
   storage, numeric strings, blank vs "", date serials), since that's where the divergence is.
3. **Prototype the thin bridge** the data implies: a few syntactic rewrites (computed array literals,
   ARRAYFORMULA wrap), a couple of runtime guards (POWER base-0), one author-flag (lookup found-ness),
   and a value-type normalization pass. Then *certify* it by re-running these sweeps through it and
   confirming the residual surface → 0.

## Reproduce / caveats

`assay measure gen <family>` → `assay generate measure/suites/<family>.yaml -s <sheet> -p excel,gsheets`
→ `assay measure analyze <family>`. Families: vlookup, match, mod, power, concat, add, eq, len, n, t,
isnumber, if, date, arraylit, spill, arrayop, lambda. Caveats unchanged: Excel↔Sheets only, en-US
locale, dynamic-array mode, **test-not-prove** (engine versions/timestamps recorded in each report).
