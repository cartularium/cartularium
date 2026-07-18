# Divergence measurement — pilot: VLOOKUP (Excel ↔ Sheets), 2026-06-03

The first run of the `assay measure` harness (the §7 "unconditional next step" from
[`bridge-translation-2026-06-02.md`](./bridge-translation-2026-06-02.md)). Sweep a
function across a structured input space, run the *real* foreign engines, and classify
**portability** by *where the divergence's discriminator lives* (§6: syntactic /
environment / data-borne).

## Method

1. **Probe family** (`src/measure/families/vlookup.ts`) declares VLOOKUP's input space as
   axes, each tagged with a **locus**. Axes: `range_lookup` arg-form (FALSE/0/TRUE/omitted),
   `key_encoding` (literal/ref), `key_type` (number/string/blank), `key_present`
   (present/absent), `range_sorted` (sorted/unsorted), `col_index_form` (in-bounds /
   out-of-bounds / array `{2,3}`), `gsheets_null_kind` (untouched / `""` / `=IF(,,)`),
   `array_mode` (dynamic — pinned).
2. **Expand → generate** (the unchanged pipeline): `assay measure gen vlookup` wrote a
   112-probe `schemaVersion:3` suite (864 cartesian → 752 pruned by constraints → 112 kept,
   0 collisions). Each probe is an ordinary `status: observed` TestCase carrying its
   axis-assignment in `ax:*` tags. Engines run via plain `assay generate -p excel,gsheets`.
3. **Analyze** (`assay measure analyze vlookup`): partition Excel-vs-Sheets per probe, then
   a **Rough-Set reduct** — the minimal axis sets the outcome depends on (subset search, so
   it catches interactions) — then a portability verdict keyed on the reduct's loci.

**Run provenance (test, not prove — §3):**
- Excel: local xlwings, `excel.json` generated 2026-06-04T05:13:47Z, **112/112 ok, 0 driver issues**.
- Sheets: Sheets API against a scratch spreadsheet created via the local token
  (`1V8ehnjv1clfd-QGOE6QUGWCPbu70P5oy6B2K3pgbAVY`), `gsheets.json` generated
  2026-06-04T05:16:23Z, **112/112 ok**.
- Tolerance 1e-10. `array_mode` pinned to **dynamic** (the live drivers fix it: Excel enters
  via `Range.formula2`; Sheets is always dynamic). Verdict is therefore **provisional** —
  it holds for dynamic-array mode and the swept input shapes only.

## Result

**112 probes · 76 agree · 36 differ · 0 incomplete · 0 precision-class.**

**Verdict: IRREDUCIBLE** (option: author-flag).
- **Reduct** (sole minimal, = core): `[range_lookup, key_type, key_present, col_index_form]`.
- **Static narrowing** (carve-able): `range_lookup`, `col_index_form` (syntactic).
- **Residual data-borne**: `key_type`, `key_present` — the wall: a static rewrite cannot
  decide portability because it cannot see, at transpile time, the runtime *type* of a
  referenced key or whether the key will be *found*.

### The three underlying incompatibility mechanisms

The 12 raw trigger-regions decompose into **three distinct mechanisms** (the count is
inflated by `range_lookup` × found-ness cross-terms — see the interaction below):

| mechanism | example | Excel | Sheets | locus |
|---|---|---|---|---|
| **array col-index** `{2,3}` | `=VLOOKUP(2, A1:C3, {2,3}, FALSE)` | `[b, y]` (spills) | `[b]` (scalar) | syntactic, data-gated |
| **out-of-bounds error precedence** | `=VLOOKUP(9, A1:C3, 5, FALSE)` | `#N/A` (not-found wins) | `#REF!` (bad-index wins) | syntactic, data-gated |
| **string↔number key coercion** | `=VLOOKUP(E1, …)`, `E1="2"` | `#N/A` (no coerce) | `b` (coerces "2"→2) | **data-borne** |

Control (`=VLOOKUP(2, A1:C3, 2, FALSE)`) agrees (`b = b`), confirming the harness isn't
manufacturing divergence.

> **Correction (post-review, 2026-06-03).** The **array col-index** row is *not* a semantic
> incompatibility — it is a **known** ARRAYFORMULA-wrapping difference: gsheets needs
> `=ARRAYFORMULA(VLOOKUP(2, A1:C3, {2,3}, FALSE))` to spill the array, whereas Excel spills
> natively under dynamic arrays. So it is a clean **EXPLICIT_BRIDGE** (syntactic rewrite:
> wrap on the gsheets side), not part of the irreducible surface. This is precisely the
> `array_context` axis ({bare, force-scalar, ARRAYFORMULA-wrap}) that was **dropped to bound
> the pilot** — that omission caused the mislabel. Add it back in the next sweep; with it,
> the array mechanism resolves to EXPLICIT_BRIDGE. **Genuine residual surface:** the oob
> error-precedence (syntactic, data-gated) and the string→number key coercion (data-borne).
> The overall verdict stays **IRREDUCIBLE** (driven by the coercion + found-ness), but the
> incompatibility surface is narrower than the raw 36/112 suggests.

### The interaction (why `range_lookup` is load-bearing)

`range_lookup` (exact vs approx) flips the outcome in conjunction with `key_present` and
`col_index_form`, by determining *whether the lookup finds a value*:

- `number · absent · oob`: **exact → differ** (`#N/A` vs `#REF!`), **approx → agree**.
  Under approx the absent key still matches the largest ≤ key, so the not-found path that
  exposes the error-precedence conflict is never reached.
- `number · absent · arr`: **exact → agree** (both `#N/A`, nothing to spill),
  **approx → differ** (approx finds row 3 → Excel spills `[c,z]`, Sheets returns `[c]`).

This is exactly the conjunction §6 predicted; a single-axis analysis would have missed it.

### Surprises (empirical, against prior)

- **`range_sorted` does NOT discriminate.** Excel and Sheets agree regardless of sortedness,
  including approx-match on unsorted data. The prior ("approx-on-unsorted diverges") was
  wrong for this pair.
- **approx + absent agrees** (`=VLOOKUP(9, A1:C3, 2, TRUE)` → `c` on both).
- **No precision-class divergences** — no float-noise disagreements.

## Portability implication

VLOOKUP Excel↔Sheets is **not unconditionally portable**: ~32% of probed inputs diverge.
Two mechanisms (array col-index, oob error-precedence) are **syntactically locatable** — a
bridge *could* detect `{…}` col-index or an out-of-bounds literal — but both are **data-gated**
(they only matter when a value is/ isn't found), and the third (string-coercion) is purely
data-borne. So the honest bridge move is an **author diagnostic** (`TranspileDiagnostic`):
"portable unless the key is a numeric-looking string, or the lookup may miss; array col-index
and out-of-bounds index behave differently across engines." A runtime guard could cover the
input-shape parts (array col-index, literal index bounds) but not the found/not-found or
coercion outcomes.

## Limitations & next

- **Provisional axes (unexplored):** legacy-CSE `array_mode`; numeric-approx `1`;
  boolean/error key types; `@`/`ARRAYFORMULA` force-scalar context. Each is a future sweep.
- **Surface over-count:** the 12-region DNF over-counts vs. the 3 mechanisms; a DNF-minimization
  pass (collapse range_lookup cross-terms) would report the surface more honestly.
- **Reproducibility:** `measure/suites/vlookup.yaml` + `measure/fixtures/vlookup/*.json` +
  `measure/vlookup.report.json` are committed as evidence. Re-run = `assay measure gen vlookup`
  → `assay generate … -p excel,gsheets` → `assay measure analyze vlookup`.
- **Generalize:** more families (lookup siblings, coercion-heavy text/math) to start
  accumulating the cross-function incompatibility surface; later, seed `DV-####` from sweeps
  via the existing `seedCatalogue` (same cluster key).
- The scratch Sheet (link-owned by the token account) can be deleted; it is empty (the driver
  cleans its temp tabs).
