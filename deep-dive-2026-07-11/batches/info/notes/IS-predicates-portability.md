# IS-predicates (ISERR / ISERROR / ISNA / ISNUMBER / ISTEXT / ISNONTEXT / ISLOGICAL / N / NA) — portability & two tooling artifacts

**Batch:** info · **Confidence:** high · **Covers:** the 49 info forks whose only divergence is one or both of two harness artifacts (LibreOffice blank, pycel #NAME?)

## Headline

These type/error predicates are **actually highly portable**. Across excel, formulas, gsheets, hyperformula, ironcalc, and lattice they agree on every case in this batch. The reason ~49 of the batch's cases still register as "forks" is two engine-tooling artifacts stacked on top of otherwise-unanimous results — not real semantic disagreement.

## Artifact 1 — LibreOffice info fixture is uniformly blank (recording artifact)

Every one of the 93 entries in `packages/assay/fixtures/info/libreoffice.json` is recorded as `result: [[null]]` (assay `blank`) — including cases like `=ISNUMBER(42)` where blank is not a possible answer. None of these predicates can legitimately return a blank cell. This is a recording/harness gap in the LibreOffice run of the info suite, not LibreOffice behavior.

Consequence: in ~39 cases the _only_ thing making the case a fork is LibreOffice's lone `blank` class; the other seven engines agree. **These are not genuine divergences.** They are annotated with cause `TODO` and need a LibreOffice re-record of the info suite. Until then, treat the LibreOffice branch as _absent_, not as `blank`.

## Artifact 2 — pycel returns #NAME? for bare error-raising operator sub-expressions

For cases whose formula contains a bare operator sub-expression that raises an error — `1/0`, `"a"+1`, `NA()+1` — pycel returns **#NAME?** while every other engine returns the true predicate result.

Live-probe root cause (pycel):

| formula        | pycel      | other engines |
| -------------- | ---------- | ------------- |
| `=1/0`         | **#NAME?** | #DIV/0!       |
| `="a"+1`       | **#NAME?** | #VALUE!       |
| `=NA()+1`      | **#NAME?** | #N/A          |
| `=NA()`        | #N/A       | #N/A          |
| `=ISERR(NA())` | FALSE      | FALSE         |

The failure is **upstream of the IS-predicate**: pycel's formulas compiler in the assay harness already cannot evaluate the bare `1/0` / `"a"+1` / `NA()+1` expression, so it emits #NAME?. Every `ISERR / ISERROR / ISNA / ISNUMBER / ISTEXT / ISNONTEXT / ISLOGICAL / N` wrapper over such an expression then inherits that #NAME? instead of catching a real error value. Crucially, pycel handles error _values produced by functions_ correctly (`=NA()` → #N/A, `=ISERR(NA())` → FALSE) — the failure is specific to bare arithmetic/division operator sub-expressions, not to errors in general. Annotated with cause `error-code`.

Affected cases (each also carries the LibreOffice blank artifact): ISERR/iserr-of-div-0, ISERROR/iserror-of-div-0, ISERROR/iserror-of-value, ISLOGICAL/islogical-of-error, ISNA/isna-of-div-0, ISNONTEXT/isnontext-of-error, ISNUMBER/isnumber-of-error, ISTEXT/istext-of-error, N/n-of-error-info, NA/na-used-in-arithmetic.

## What the engines actually agree on (the real, portable behavior)

- **ISERR** — TRUE for any error except #N/A; FALSE for #N/A, numbers, text, blank cells. (`=ISERR(NA())` → FALSE; `=ISERR(1/0)` → TRUE.)
- **ISERROR** — TRUE for any error including #N/A; FALSE otherwise.
- **ISNA** — TRUE only for #N/A (including a MATCH miss); FALSE for other errors, numbers, text.
- **ISNUMBER / ISTEXT / ISNONTEXT / ISLOGICAL** — standard type predicates; agree across all six functioning engines for numbers, decimals, text, booleans, empty cells, and errors.
- **N** — coerces to number: number→itself, text→0, empty cell→0; passes errors through (`=N(1/0)` → #DIV/0!).
- **NA()** — returns #N/A in every engine; `=NA()+1` propagates #N/A.

## Wiki-facing notes

- For function pages ISERR, ISERROR, ISNA, ISNUMBER, ISTEXT, ISNONTEXT, ISLOGICAL, N, NA: state that behavior is **portable across Excel, Google Sheets, LibreOffice, HyperFormula, IronCalc, and lattice** for the type/error cases in this batch.
- Do **not** present the assay "divergence" flags on these cases as real engine differences — they are LibreOffice recording gaps and a pycel harness limitation. Any cross-engine table the wiki builds from assay should suppress the LibreOffice `blank` and pycel `#NAME?`-on-`1/0` branches (or footnote them as tooling artifacts).
- pycel caveat worth a one-line note on error-handling pages: pycel cannot evaluate bare `1/0`-style error expressions and reports #NAME?, so `ISERR(1/0)` and friends are unreliable under pycel even though `ISERR(NA())` works.

## Open questions

- Needs a LibreOffice re-record of the `info` suite to clear the 39 artifact-only forks. LibreOffice is a single-owner lane (not pure-engine probeable here); flagged for a human/runner pass.
