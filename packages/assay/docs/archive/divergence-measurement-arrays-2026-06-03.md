# Divergence measurement — arrays & shapes (Excel ↔ Sheets), 2026-06-03

Third measurement pass, after the [pilot](./divergence-measurement-2026-06-03.md) and
[breadth](./divergence-measurement-breadth-2026-06-03.md). Targets formula *structure* (where
the breadth pass said divergence should live, vs. the value layer). Three families, 11 probes,
both engines 100% ok, all inputs numeric/literal (no ingestion confound). **All divergences
spot-checked — all real, no artifacts.**

## Results

| family | result | finding |
|---|---|---|
| `feature:spill` | **AGREES_EVERYWHERE** (4/4) | SEQUENCE / TRANSPOSE / SORT / UNIQUE agree on shape *and* values |
| `lit:array` | **EXPLICIT_BRIDGE** (content) | array-literal contents diverge — syntactic |
| `feature:array-op` | **EXPLICIT_BRIDGE** (context) | element-wise spill needs ARRAYFORMULA on Sheets — syntactic |

### Array-literal contents (the known item, confirmed)

Excel array constants are **literals-only**; Sheets allows functions / refs / expressions inside `{…}`:

| probe | Excel | Sheets |
|---|---|---|
| `={1,2,3}` | `[1,2,3]` | `[1,2,3]` (agree) |
| `={1,2;3,4}` | `[1,2;3,4]` | `[1,2;3,4]` (agree) |
| `={1,2,D1}` (D1=5) | rejected | `[1,2,5]` |
| `={1,2,SUM(D1:D2)}` | rejected | `[1,2,11]` |
| `={1,2,1+1}` | rejected | `[1,2,2]` |

Statically detectable (a non-constant token inside `{}`) → **EXPLICIT_BRIDGE**. The fix is a real
rewrite, not a wrap: Excel cannot express a computed array literal, so a bridge must lift it
(e.g. compute into helper cells / use `CHOOSE`/`HSTACK`) or flag. (Excel's rejection captured as a
blank/null here rather than a clean `#VALUE!` — a driver-fidelity nuance, not load-bearing.)

### Element-wise array op (the ARRAYFORMULA wrapping item, confirmed)

`=D1:D3*2` (D1:D3 = 1,2,3): Excel spills `[2;4;6]`; Sheets bare returns scalar `[2]`. Wrapping the
Sheets side in `ARRAYFORMULA(…)` makes both `[2;4;6]`. Captured as a per-platform `context` axis →
**EXPLICIT_BRIDGE** (wrap on the Sheets side). This is the same mechanism as VLOOKUP's array
col-index; here it's isolated cleanly.

### Spill functions agree

SEQUENCE/TRANSPOSE/SORT/UNIQUE produce identical shapes and values on both engines — inherently-array
functions spill the same way. Shape semantics are portable.

## Read

**Array/shape divergence is syntactic, not data-borne.** Unlike the value layer (ingestion, coercion
— irreducible/representation), every array divergence here is statically locatable and **explicit-
bridge-able**: detect a non-constant inside `{}` (rewrite), or wrap element-wise ops in ARRAYFORMULA
for Sheets (mechanical). No author-flag needed. This continues the emerging shape of the whole
surface:

> **Running aggregate (16 families):** portable — MATCH, MOD, op:+, op:=, LEN, N, ISNUMBER, IF,
> spill (9). EXPLICIT_BRIDGE (syntactic, carve-able) — DATE leap, array literals, array-op/ARRAYFORMULA
> (3). IRREDUCIBLE-guardable — POWER base-0 (1). IRREDUCIBLE-author-flag — VLOOKUP found-ness/oob (1).
> Representation artifacts — op:&, T (2).

So the genuine Excel↔Sheets divergence is **mostly syntactic (statically bridgeable) + a thin
value-layer (ingestion/blank) + one numeric edge + one lookup author-flag.** Very little is
irreducible. This keeps strengthening the case that translation-as-bridging is viable and that the
heavier problem is value/type fidelity, not formula semantics.

## Caveats & next

- 11 probes, en-US locale (array separators `,`/`;` agree; locale-variant separators `\` deferred —
  an Environment axis). Dynamic-array mode. Test-not-prove; reproducible via committed artifacts.
- Excel's rejection of computed array literals captured imprecisely (blank vs `#VALUE!`) — a driver
  fidelity item, not affecting the verdict.
- **Next: lambdas** — LAMBDA/MAP/REDUCE/BYROW/BYCOL, lambdas-in-arrays, helper-function availability
  Excel vs Sheets (likely the first place we see UNIMPLEMENTED outcomes). Author with type-faithful
  seeding + array_context awareness.
