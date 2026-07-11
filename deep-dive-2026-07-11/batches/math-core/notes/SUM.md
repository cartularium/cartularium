# SUM — cross-engine deep dive

**Batch:** math-core · **Refs:** SUM/sum-no-args, SUM/sum-2d-array, SUM/sum-array-literal-column, SUM/sum-array-literal-row, SUM/sum-scalars, SUM/sum-with-grid-range · **Confidence:** high (array cases), medium (no-args)

## Behavior summary

SUM is broadly portable. Scalar lists, 1-D and 2-D array literals, and cell-range references all produce the same total across every genuine engine (excel, formulas, gsheets, hyperformula, ironcalc, lattice, pycel). The only interesting case is the **degenerate zero-argument call** `=SUM()`, which fractures the engines five ways.

## Divergences

### `=SUM()` — five-way empty-argument split

| engine                | result    | reading                                                     |
| --------------------- | --------- | ----------------------------------------------------------- |
| lattice, pycel        | `0`       | empty sum = additive identity                               |
| gsheets, hyperformula | `#N/A`    | arity error, surfaced as #N/A                               |
| formulas              | `#VALUE!` | arity error, surfaced as #VALUE!                            |
| ironcalc              | `#ERROR!` | arity error, surfaced as #ERROR!                            |
| excel                 | _(blank)_ | Excel rejects `=SUM()` at entry — no value stored           |
| libreoffice           | _(blank)_ | suite-wide recording gap (see libreoffice-recording-gap.md) |

The substantive disagreement is whether a no-argument SUM is a **syntax/arity error** (and then _which_ error code to raise — engines split across #N/A, #VALUE!, #ERROR!) or a **well-defined empty aggregate equal to 0** (lattice, pycel). Excel's blank almost certainly reflects that its formula parser refuses `=SUM()` (SUM requires at least one argument), so nothing is captured — distinct from a computed blank. Cause bucket: `argument-arity`.

Note pycel returns `0` here, consistent with the operator artifact above: `=SUM()` contains no arithmetic operator, so pycel compiles and evaluates it.

### Array-literal and range cases (all agree)

| formula                         | all genuine engines | libreoffice |
| ------------------------------- | ------------------- | ----------- |
| `=SUM(1, 2, 3)`                 | `6`                 | blank       |
| `=SUM({1, 2, 3})`               | `6`                 | blank       |
| `=SUM({1; 2; 3})`               | `6`                 | blank       |
| `=SUM({1, 2; 3, 4; 5, 6})`      | `21`                | blank       |
| `=SUM(A1:A3)` (seeded 10,20,30) | `60`                | blank       |

These are forks only because of the libreoffice blank; every engine that evaluates agrees. Inline array literals with both `,` (column separator) and `;` (row separator) are handled uniformly.

## Edges explored beyond the corpus

None needed on pure engines — the array/range behavior is unanimous and the no-args case is fully characterized by the recorded partition. The one open item (Excel's blank) is an Excel-only question.

## Wiki-facing notes

- `=SUM()` with no arguments is **not portable**: it is `0` in some engines and an error (three different codes) in others, and Excel refuses the formula outright. Advise writing `=SUM(0)` or omitting the call.
- Inline array constant syntax `{a, b; c, d}` sums identically across engines — safe to use.
- SUM over an empty/blank range still returns `0` in engines that evaluate (contrast with the empty _argument-list_ case above).

## Open questions

- Excel: confirm whether `=SUM()` yields blank, an error, or is rejected at entry (probe **math-core-003**). This decides whether excel belongs in the "blank" branch for a semantic reason or purely as an entry-rejection artifact.
