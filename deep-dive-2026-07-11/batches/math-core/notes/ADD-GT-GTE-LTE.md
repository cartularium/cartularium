# ADD / GT / GTE / LTE — operator-named functions — cross-engine deep dive

**Batch:** math-core · **Refs:** ADD/add-non-numeric-string, GT/gt-boolean-vs-number, GTE/gte-boolean, LTE/lte-boolean · **Confidence:** high (missing-function branch, live-confirmed); medium (gsheets-vs-lattice ordering, from recorded fixtures)

## Behavior summary

`ADD`, `GT`, `GTE`, `LTE` are **Google Sheets function-name aliases** for the operators `+`, `>`, `>=`, `<=`. They are not part of the Excel function set. So **excel, formulas, hyperformula, ironcalc, pycel** all return `#NAME?` (unknown function). Only **gsheets** and **lattice** implement them. This matches the existing DV-0002 (missing-function for ADD/GT/GTE/LTE) — the work-list cases below extend it to argument shapes where the two _supporting_ engines diverge.

## Divergences

### ADD with a non-numeric string — `=ADD("abc", 1)`

| engine(s)                                      | result                                                |
| ---------------------------------------------- | ----------------------------------------------------- |
| excel, formulas, hyperformula, ironcalc, pycel | `#NAME?` (ADD not a known function)                   |
| gsheets, lattice                               | `#VALUE!` (ADD exists; "abc" cannot coerce to number) |
| libreoffice                                    | blank (recording gap)                                 |

Here the two supporters **agree** on the coercion error `#VALUE!`. Cause bucket: `missing-function` (the dominant split); the supporter branch shows the expected text-coercion `#VALUE!`. Live probe confirmed formulas/hyperformula/ironcalc/pycel → `#NAME?`.

### GT / GTE / LTE with boolean operands — boolean-vs-number ordering

| formula          | gsheets | lattice | excel-family | libreoffice |
| ---------------- | ------- | ------- | ------------ | ----------- |
| `=GT(TRUE, 0)`   | `TRUE`  | `FALSE` | `#NAME?`     | blank       |
| `=GTE(TRUE, 1)`  | `TRUE`  | `FALSE` | `#NAME?`     | blank       |
| `=LTE(FALSE, 0)` | `FALSE` | `TRUE`  | `#NAME?`     | blank       |

All three results are internally consistent with a single model per engine:

- **gsheets ranks booleans ABOVE all numbers** (the standard Excel/Sheets cross-type ordering: number < text < boolean). So any boolean is greater than any number: `TRUE > 0` true; `TRUE >= 1` true; `FALSE <= 0` is false because `FALSE`, as a boolean, is greater than `0`.
- **lattice ranks booleans BELOW numbers.** So any boolean is less than any number: `TRUE > 0` false; `TRUE >= 1` false; `FALSE <= 0` true.

Crucially, **neither engine is coercing** `TRUE→1` / `FALSE→0`: a numeric coercion would make `GTE(TRUE,1)` = `1>=1` = true in _both_, but lattice returns false. So the divergence is a genuine type-ranking-order difference, not a coercion difference. Cause bucket: `arg-semantics`. Live probe confirmed the `#NAME?` branch (formulas/hyperformula/ironcalc/pycel); the gsheets-vs-lattice values are from recorded fixtures.

## Edges explored beyond the corpus

- Confirmed on pure engines that GT/GTE/LTE/ADD are uniformly absent (all four testable pure engines → `#NAME?`), so the "supporter" set really is just gsheets + lattice.

## Wiki-facing notes

- ADD/GT/GTE/LTE (and the other operator-named functions like MINUS, MULTIPLY, DIVIDE, EQ, NE, LT, POW, UMINUS, UPLUS) are **Google-Sheets-only**. In Excel and every non-Sheets engine they are `#NAME?`. Advise using the operators (`+`, `>`, `>=`, `<=`) for portability.
- When a comparison mixes a boolean with a number, **the answer is engine-dependent**: Google Sheets treats booleans as greater than any number (Excel semantics), while lattice treats them as smaller. This affects `>`/`<`/`>=`/`<=` generally, not just the named-function aliases — worth a concept-page note on cross-type comparison ordering.

## Open questions

- Live gsheets confirmation that booleans rank above numbers, including the reversed argument order `=GT(2, TRUE)` → FALSE — probes **math-core-001** and **math-core-001b**.
- lattice is a single-owner engine (cannot be run here); its below-numbers ranking is from recorded fixtures and should be confirmed by whoever owns the lattice lane.
