# MODE.MULT — cross-engine deep dive

**Batch:** stat-core · **Refs:** MODE.MULT/mode-mult-no-repeats, MODE.MULT/mode-mult-single-mode, MODE.MULT/mode-mult-tied-dataset · **Confidence:** high (live-confirmed on pure engines)

## Behavior summary

`MODE.MULT` (Excel 2010+) is a dynamic-array function: it returns _all_ values tied for most-frequent as a vertical spill, and `#N/A` when no value repeats. It is the one function in this batch that exercises array spilling, and the engines diverge on three independent axes: (a) whether the function exists at all, (b) how a multi-value array result is represented, and (c) the no-mode case.

## Divergences

### Single mode: `=MODE.MULT(1, 2, 2, 3, 4)`

| Engine       | Result   | Kind                                  |
| ------------ | -------- | ------------------------------------- |
| excel        | 2        | number (1×1 spill)                    |
| gsheets      | 2        | number                                |
| lattice      | 2        | number                                |
| formulas     | `"[2]"`  | **string** (array serialized as text) |
| hyperformula | `#NAME?` | not implemented                       |
| ironcalc     | `#NAME?` | not implemented                       |
| pycel        | `#NAME?` | not implemented                       |
| libreoffice  | blank    | stale all-null fixture (artifact)     |

### Tied dataset: `=MODE.MULT(B1:B5)` with `B={1,2,2,3,3}` (two modes)

| Engine                          | Result                              |
| ------------------------------- | ----------------------------------- |
| excel / gsheets / lattice       | vertical array `[2; 3]` (two cells) |
| formulas                        | `"[2, 3]"` (**string**)             |
| hyperformula / ironcalc / pycel | `#NAME?`                            |
| libreoffice                     | blank                               |

### No repeats: `=MODE.MULT(1, 2, 3)`

| Engine                               | Result                     |
| ------------------------------------ | -------------------------- |
| excel / formulas / gsheets / lattice | `#N/A` (no mode exists)    |
| hyperformula / ironcalc / pycel      | `#NAME?` (function absent) |
| libreoffice                          | blank                      |

**Mechanism (cause: `array-handling`, with `missing-function` for the three absent engines):**

1. **hyperformula, ironcalc, pycel** do not implement `MODE.MULT` → `#NAME?` in all three cases.
2. **formulas** (the JS `formulas` engine) computes the modes but **serializes the result array as a string** — `"[2]"`, `"[2, 3]"` — instead of spilling a grid. This is a rendering/array-handling artifact of how the `formulas` driver returns array-valued results: the divergence is representational, not numeric (the mode values 2 and 2,3 are correct). Notably formulas _does_ return a real `#N/A` for the no-mode case, so its array-as-string only shows up when there is at least one mode.
3. **excel, gsheets, lattice** spill a genuine array: a 1×1 spill for one mode, a 2×1 vertical array for two modes.

Live probe (`scratch/stat-core-probe1.mts`):

```
formulas       single->"[2]"   tied->"[2, 3]"   no-repeat->#N/A
hyperformula   #NAME?          #NAME?           #NAME?
ironcalc       #NAME?          #NAME?           #NAME?
pycel          #NAME?          #NAME?           #NAME?
```

## Edges explored beyond the corpus

- The `formulas` string-serialization is specific to multi-cell array results. Scalar-returning statistical functions on the same engine (MEDIAN, AVERAGE, the legacy `MODE`/`MODE.SNGL`) return proper numbers — so this is an array-spill representation gap, not a general type problem.
- The three absent engines fail uniformly regardless of dataset, confirming it is a flat capability gap rather than a data-dependent error.

## Wiki-facing notes

- **MODE.MULT is low-portability.** Only Excel, Google Sheets and Lattice implement it as a true spilling array. HyperFormula, IronCalc and pycel do not implement it (`#NAME?`).
- The `formulas` JS engine returns the modes as a **string** like `"[2, 3]"` rather than an array — consumers must not treat its MODE.MULT output as a numeric spill.
- Portable alternative when a single mode suffices: `MODE.SNGL` (or legacy `MODE`) has broader engine coverage; MODE.MULT should be reserved for workbooks that only target Excel/Sheets/Lattice.
- The `#N/A` on a no-repeat dataset is the correct/shared behavior among implementers; a `#NAME?` there just means the engine lacks the function.

## Open questions

- None blocking. All pure-engine branches reproduced live; excel/gsheets/lattice spill behavior is from recorded fixtures and consistent with documented MODE.MULT semantics. (A future probe could confirm whether gsheets spills downward vs into adjacent columns, but that is orientation detail, not correctness.)
