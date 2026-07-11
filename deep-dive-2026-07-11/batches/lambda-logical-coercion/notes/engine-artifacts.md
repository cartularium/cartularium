# Engine artifacts — cross-cutting method notes (libreoffice recording gap; pycel operator-argument limitation)

**Batch:** lambda-logical-coercion · **Confidence:** high

These two findings are not about any one function — they are engine/harness properties that shape how the fork data across this whole batch (and, for libreoffice, the entire corpus) should be read. Recording them here so the reconciler and the wiki do not mistake artifacts for genuine spec divergences.

## 1. libreoffice fixtures are a systematic recording gap (blank everywhere)

**Every fork in this batch (46/46) lists libreoffice as `blank`.** That is not libreoffice behavior — it is a recording gap. Evidence: across all 32 fixture suites, the libreoffice recordings contain **0 non-null results out of ~2000 cases** (the only exceptions are 4 cells in `spill-edge`). Even trivially-correct formulas record as blank, e.g. `=IF(TRUE,1,2)` → `null` in `fixtures/logical/libreoffice.json`.

Per-suite non-null counts (spot sample): arithmetic 0/6, logical 0/32, type-coercion 0/53, lambda 0/24, math-longtail 0/190, engineering 0/147, statistical-descriptive 0/180 … `spill-edge 4/21` is the lone exception.

**Implication for this batch:** in 11 of my 46 refs the _only_ divergence is libreoffice's blank; every real engine agrees. Those are effectively non-forks (annotation cluster A7, cause `TODO` = libreoffice recording gap). In the remaining 35 refs, libreoffice's blank is a co-branch that should be discounted — the substantive story is always among the other seven engines. No cause vocabulary term fits a recording artifact cleanly; I used `TODO` for the libreoffice-only cluster and called it out inline in every other annotation.

**Recommendation:** the libreoffice column should be treated as "not recorded" rather than "returned blank." If the catalogue surfaces libreoffice at all, it should show a distinct "no data" state, or the libreoffice driver needs re-running — otherwise it manufactures 800+ phantom forks corpus-wide. This is worth a human decision; it is out of scope to fix from an analyst batch.

## 2. pycel returns #NAME? for any operator expression used as a function argument

pycel produces `#NAME?` on a class of formulas that every other engine evaluates fine, and it is easy to misread as "pycel is missing IF/IFERROR." It is not. Live probing isolates the trigger to **an operator node in argument position**.

Reproductions (all pycel, live probe):

| formula                  | pycel    | note                  |
| ------------------------ | -------- | --------------------- |
| `=IF(TRUE, 1, 2)`        | `1`      | literal args → OK     |
| `=IFERROR(1, 2)`         | `1`      | literal args → OK     |
| `=IF(1>2, 1, 2)`         | `#NAME?` | comparison `>` in arg |
| `=IFERROR(1/0, 2)`       | `#NAME?` | division `/` in arg   |
| `=SUM(1/2)`              | `#NAME?` | `/` in arg            |
| `=ABS(1-2)`              | `#NAME?` | `-` in arg            |
| `=SUM(1+1, 2)`           | `#NAME?` | `+` in arg            |
| `=IF(A1>2, 1, 2)` (A1=5) | `#NAME?` | `>` with a cell ref   |

The trigger is independent of the operator (`>`, `/`, `-`, `+`) and the enclosing function; it is the presence of an operator sub-expression as an argument. This is a pycel front-end / assay-harness limitation (pycel compiles Excel formulas into a Python graph; operator-in-argument nodes appear not to bind), not a spec-level behavior.

**Batch refs affected:** IF/if-nested (`1>2`, `3>2`), IF/if-two-args-false (`2>3`), IFERROR/iferror-with-error (`1/0`), IFERROR/iferror-nested (`1/0`). In each, pycel's `#NAME?` should be attributed to this limitation (cause `unimplemented-edge`), _not_ to a missing function. It is separate from pycel's genuine missing functions in this batch — `T`, `PRODUCT`, and the entire lambda/dynamic-array family — which also return `#NAME?` but for the ordinary missing-name reason.

**Recommendation:** flag pycel results as low-trust whenever the formula nests an operator inside a call. A large fraction of any realistic corpus will hit this, so pycel `#NAME?` should not be counted as evidence that a function is unsupported without checking the argument shape.

## Method footprint

- Live probes: `scratch/lambda-logical-coercion-probe1.mts` (28 formulas × 4 pure engines — full fixture reproduction), `probe2.mts` (pycel/hyperformula boundary), `probe3.mts` (formulas LET/LAMBDA edges + pycel operator confirmation).
- libreoffice gap quantified by scanning every `fixtures/*/libreoffice.json` for non-`[[null]]` results.
- Engines I could run: hyperformula, ironcalc, formulas, pycel. excel/gsheets/lattice/libreoffice branches are from recorded fixtures only; the eight probe requests target the excel/gsheets confirmations I could not run.
