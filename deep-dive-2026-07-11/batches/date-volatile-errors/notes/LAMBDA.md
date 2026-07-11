# LAMBDA (immediate invocation) — cross-engine deep dive

**Batch:** date-volatile-errors · **Refs:** LAMBDA/lambda-named-function-inline-cost · **Confidence:** high (medium on excel/gsheets/lattice — corpus-only, not live-runnable here)

## Behavior summary

`=LAMBDA(x, x+1)(5)` defines an anonymous single-argument function and immediately invokes it with 5,
expecting 6. This exercises both LAMBDA definition and the immediate-invocation `(...)` call syntax.
Support is sharply tiered across the catalogue.

## Divergences

| engine       | result    | tier / mechanism                                                          |
| ------------ | --------- | ------------------------------------------------------------------------- |
| excel        | 6         | full LAMBDA + immediate invocation                                        |
| gsheets      | 6         | full LAMBDA + immediate invocation                                        |
| lattice      | 6         | full LAMBDA + immediate invocation                                        |
| formulas     | `#VALUE!` | recognizes LAMBDA token but cannot evaluate the immediate-invocation form |
| hyperformula | `#ERROR!` | parse/evaluation failure on the form                                      |
| ironcalc     | `#NAME?`  | LAMBDA not implemented                                                    |
| pycel        | `#NAME?`  | LAMBDA not implemented                                                    |
| libreoffice  | blank     | empty recording                                                           |

Three distinct failure modes among the non-supporting engines: a value error (`formulas`), a
parser/engine error (`hyperformula`), and unrecognized-name (`ironcalc`, `pycel`). This is the
`missing-function` bucket dominantly, with `formulas`/`hyperformula` being the "recognizes but can't
evaluate the invocation" sub-case.

## Wiki-facing notes

- LAMBDA with immediate invocation is a **modern-Excel / Google-Sheets / lattice** feature. It is not
  available on the calculation-library engines (`formulas`, HyperFormula, IronCalc, pycel), each of
  which fails with a different error code.
- Portability advice: LAMBDA (and the LET / lambda-helper family — MAP, REDUCE, SCAN, BYROW, BYCOL) is
  not safe to assume outside Excel/Sheets/lattice. Prefer explicit formulas or named ranges for
  cross-engine documents.

## Open questions

- Confirm excel/gsheets return 6 for `=LAMBDA(x,x+1)(5)` (probe `dve-006`) — corpus records this;
  probe is confirmation-grade. lattice = 6 is corpus-only (lattice not runnable in this batch).
- Whether the `formulas`/`hyperformula` engines support LAMBDA when _named_ via LET / defined-name
  (vs immediate invocation) is a separate question worth a follow-up test.
