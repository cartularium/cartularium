# AND / OR / CHOOSE / IF / IFERROR — logical functions — cross-engine deep dive

**Batch:** lambda-logical-coercion · **Refs:** AND/and-empty, AND/and-with-numbers, OR/or-with-numbers, CHOOSE/choose-first, CHOOSE/choose-third, CHOOSE/choose-out-of-range, IF/if-nested, IF/if-two-args-false, IFERROR/iferror-no-error, IFERROR/iferror-with-error, IFERROR/iferror-nested · **Confidence:** high (AND/and-empty: medium on the excel interpretation)

## Behavior summary

The core logical functions agree almost everywhere: `AND(1,1,0)`=FALSE, `OR(0,0,1)`=TRUE, `CHOOSE(1,…)`="a", `CHOOSE(3,…)`="c", `IF` selects the right branch, `IFERROR` catches errors. Most of these appear in the fork list only because of the libreoffice recording gap. The genuine divergences are concentrated in three edges: the empty `AND()` call, the out-of-range `CHOOSE`, and an omitted `IF` false-branch — plus a pycel front-end limitation that turns several agreeing cases into `#NAME?`.

All pure-engine results confirmed by live probe.

## Divergences

### 1. AND() with zero arguments — arity handled six ways

`=AND()`

| engine                | result                                            |
| --------------------- | ------------------------------------------------- |
| lattice               | `TRUE` (vacuous truth: AND over empty set = TRUE) |
| gsheets, hyperformula | `#N/A`                                            |
| formulas, pycel       | `#VALUE!`                                         |
| ironcalc              | `#ERROR!`                                         |
| excel                 | blank (likely entry-rejection — see below)        |
| libreoffice           | blank (recording gap)                             |

Cause: **argument-arity**. `AND` requires ≥1 logical argument; each engine resolves the empty call differently. lattice alone returns the mathematically-principled identity `TRUE`. Excel's recorded blank most plausibly reflects that Excel **rejects `=AND()` at formula entry** (too few arguments) rather than computing anything — but that interpretation is inferred, not directly observed here, hence medium confidence and probe request 003. Live probe confirmed the four pure engines: formulas `#VALUE!`, hyperformula `#N/A`, ironcalc `#ERROR!`, pycel `#VALUE!`.

`=AND(1,1,0)` and `=OR(0,0,1)`, by contrast, agree everywhere (FALSE / TRUE) except libreoffice — non-forks masked by the recording gap.

### 2. CHOOSE out of range — error-code split

`=CHOOSE(5, "a", "b", "c")`

| engine                                    | result                |
| ----------------------------------------- | --------------------- |
| excel, formulas, ironcalc, lattice, pycel | `#VALUE!`             |
| gsheets, hyperformula                     | `#NUM!`               |
| libreoffice                               | blank (recording gap) |

Cause: **error-code**. Every engine errors on the out-of-range index; they only disagree on the code — `#VALUE!` (index is an invalid value) vs `#NUM!` (index outside the numeric domain of choices). Both are defensible. `CHOOSE(1,…)` / `CHOOSE(3,…)` agree everywhere (in-range), fork-listed only for the libreoffice gap.

### 3. IF with an omitted false-branch — FALSE vs blank

`=IF(2>3, TRUE)`

| engine                                           | result                                             |
| ------------------------------------------------ | -------------------------------------------------- |
| excel, formulas, gsheets, hyperformula, ironcalc | `FALSE` (boolean)                                  |
| lattice                                          | blank cell                                         |
| pycel                                            | `#NAME?` (operator-argument limitation, see below) |
| libreoffice                                      | blank (recording gap)                              |

Cause: **null-vs-zero** (FALSE vs blank). When `value_if_false` is omitted and the condition is false, Excel's documented behavior is to return the boolean `FALSE`; five engines follow it. lattice returns an empty cell instead. Note lattice's blank is a _genuine computed_ blank, distinct from libreoffice's recording-gap blank. pycel's `#NAME?` here is not about the omitted argument — it is the operator-argument limitation firing on the `2>3` condition.

### 4. pycel operator-in-argument limitation — `#NAME?` where others agree

`=IF(1>2, "a", IF(3>2, "b", "c"))` → "b" · `=IFERROR(1/0, "error")` → "error" · `=IFERROR(IFERROR(1/0, 1/0), "both failed")` → "both failed"

| engine                                                    | result                |
| --------------------------------------------------------- | --------------------- |
| excel, formulas, gsheets, hyperformula, ironcalc, lattice | the value above       |
| pycel                                                     | `#NAME?`              |
| libreoffice                                               | blank (recording gap) |

Cause: **unimplemented-edge** (pycel front-end). Every real engine agrees on the value. pycel alone returns `#NAME?`, and live probing pins why: pycel's formula front-end fails whenever a **function argument is itself an operator expression**. Confirmed: `=IF(1>2,1,2)`, `=IFERROR(1/0,2)`, `=SUM(1/2)`, `=ABS(1-2)`, `=SUM(1+1,2)`, `=IF(A1>2,1,2)` all → `#NAME?`, while the literal-argument forms `=IF(TRUE,1,2)` → 1 and `=IFERROR(1,2)` → 1 succeed. Each of these three formulas embeds an operator (`1>2`, `3>2`, `1/0`) inside a call. This is a harness/compiler limitation, not a missing IF/IFERROR. See `engine-artifacts.md` for the full characterization.

`=IFERROR(1,"error")` (no operator, no error) agrees everywhere except libreoffice — a non-fork.

## Edges explored beyond the corpus

- pycel operator boundary mapped with `/`, `-`, `+`, `>`, and a cell-ref comparison `A1>2` — all trigger `#NAME?`; literal args always succeed. The trigger is the operator node in argument position, independent of the specific operator or function.
- ironcalc `AND()` → `#ERROR!` vs its `CHOOSE(5,…)` → `#VALUE!`: ironcalc uses `#ERROR!` for the arity failure but `#VALUE!` for the index failure — internally consistent with treating them as different error classes.

## Wiki-facing notes

- **AND.md / OR.md**: note that a zero-argument `AND()`/`OR()` is not portable — Excel rejects it, Google Sheets/hyperformula give `#N/A`, others give `#VALUE!`/`#ERROR!`, and lattice returns `TRUE`. Always pass at least one argument.
- **CHOOSE.md**: an out-of-range index returns `#VALUE!` in Excel/most engines but `#NUM!` in Google Sheets and hyperformula. Don't hard-depend on the specific error code.
- **IF.md**: `=IF(cond, x)` with the false-branch omitted returns `FALSE` when the condition is false in Excel/Sheets/most engines, but a blank cell in lattice. If you want blank, write `IF(cond, x, "")` explicitly.
- **IFERROR.md**: behavior is portable across the real engines; the only anomaly is pycel's harness limitation on operator arguments, which is an engine artifact rather than a spec difference.

## Open questions

- `lambda-logical-coercion-003` (excel/gsheets): confirm `=AND()` is entry-rejected in Excel (vs computed) and `#N/A` in Sheets — settles the medium-confidence excel-blank interpretation.
- `lambda-logical-coercion-004` (excel/gsheets): confirm `CHOOSE(5,…)` = `#VALUE!` (excel) vs `#NUM!` (gsheets).
