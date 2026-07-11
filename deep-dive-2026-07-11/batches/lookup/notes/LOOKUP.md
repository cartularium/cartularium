# LOOKUP — cross-engine deep dive

**Batch:** lookup · **Refs:** LOOKUP/lookup-array-form · **Confidence:** high

## Behavior summary

LOOKUP has two syntaxes. The _vector form_ `LOOKUP(value, lookup_vector, [result_vector])` searches a
one-dimensional vector (assumed sorted ascending) for the largest value `<=` the search key and returns
the aligned element of the result vector. The _array form_ `LOOKUP(value, array)` takes a single
two-dimensional array and infers orientation from its shape: if the array is wider than (or as wide as)
it is tall it is treated as **horizontal** — search the first row, return the corresponding cell of the
**last** row; otherwise it is **vertical** — search the first column, return the last column. The vector
form is broadly portable; the array form is where engines split.

## Divergences

### `=LOOKUP(2, {1,2,3;"a","b","c"})` — array form (LOOKUP/lookup-array-form)

The array is 3 columns × 2 rows, so it is horizontal: search first row `{1,2,3}` for the largest value
`<= 2` (position 2), return the last row `{"a","b","c"}` at position 2 → `"b"`.

| engine       | result   | mechanism                                                                                                     |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| excel        | `"b"`    | array form, horizontal orientation (reference)                                                                |
| gsheets      | `"b"`    | array form, horizontal orientation                                                                            |
| lattice      | `"b"`    | array form, horizontal orientation                                                                            |
| pycel        | `"b"`    | array form correct for non-square arrays                                                                      |
| formulas     | `2`      | **mis-implements array form** — returns the matched _key_ (search-axis value) instead of the result-row value |
| hyperformula | `#NAME?` | LOOKUP not implemented at all (see DV-0006)                                                                   |
| ironcalc     | `#N/A`   | LOOKUP implemented but array form / this orientation not resolved                                             |
| libreoffice  | _blank_  | suite-wide recording artifact — see notes/RECORDING-ARTIFACT-libreoffice-blank.md                             |

Cause bucket: **array-orientation** (with a missing-function branch for hyperformula and an
error-on-array-form branch for ironcalc).

## Edges explored beyond the corpus

Live probe on the pure engines (`scratch/lookup-probe2.mts`) across three array shapes:

| formula                                        | pycel | formulas | hyperformula | ironcalc |
| ---------------------------------------------- | ----- | -------- | ------------ | -------- |
| `=LOOKUP(2, {1,2,3;"a","b","c"})` (horizontal) | `"b"` | `2`      | `#NAME?`     | `#N/A`   |
| `=LOOKUP(2, {1,"a";2,"b";3,"c"})` (vertical)   | `"b"` | `2`      | `#NAME?`     | `#N/A`   |
| `=LOOKUP(2, {1,2;3,4})` (square)               | `2`   | `2`      | `#NAME?`     | `#N/A`   |

Two surprises:

- **pycel** returns the correct result-axis value `"b"` for both non-square orientations but flips to the
  search key `2` on a square array, where orientation is ambiguous — a genuine edge worth a wiki caveat.
- **formulas** returns the search key `2` for _every_ orientation. Its array-form LOOKUP never reads the
  result axis; treat `formulas` array-form LOOKUP output as unreliable.

## Wiki-facing notes

- The **vector form** of LOOKUP (`LOOKUP(v, lookup, result)`) is portable across excel, gsheets, lattice,
  ironcalc, formulas, pycel; only hyperformula lacks LOOKUP entirely (`#NAME?`).
- The **array form** `LOOKUP(v, array)` is a portability trap. Only excel, gsheets, lattice, and pycel
  return the documented result. `formulas` returns the wrong axis, `ironcalc` returns `#N/A`,
  `hyperformula` errors. Recommend authors prefer INDEX/MATCH or XLOOKUP over array-form LOOKUP.
- Square arrays are ambiguous even in engines that otherwise implement the array form (pycel returns the
  key). Avoid square arrays with the array form.

## Open questions

- Confirm on live Excel the square-array case `=LOOKUP(2, {1,2;3,4})` (probe lookup-006) — does Excel
  return the key or the result-axis value? This pins whether pycel's square-array behavior matches Excel.
