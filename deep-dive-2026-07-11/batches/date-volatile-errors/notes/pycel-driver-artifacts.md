# pycel — driver artifacts vs real coverage (cross-cutting)

**Batch:** date-volatile-errors · **Refs:** touches ~20 forks across volatile + error-handling + date · **Confidence:** high

This note isolates what pycel's `#NAME?` results actually mean in the corpus, because pycel `#NAME?`
is the single most common outlier across my three suites and it conflates _four distinct causes_.
Getting this right prevents the wiki from telling readers "pycel doesn't support X" when it does.

## The big one: pycel returns #NAME? for any formula containing an operator

The assay pycel driver returns `#NAME?` for **any** formula that contains a binary or unary operator
(`+ - * / ^ &`, the comparisons `> >= < <= = <>`, or a leading unary minus), while formulas built
only from function calls, cell references and literals evaluate normally.

Confirmed live (`date-volatile-errors-probe4.mts`), and matches the recorded corpus exactly:

| Formula                 | pycel result | Note                          |
| ----------------------- | ------------ | ----------------------------- |
| `=1+1`                  | `#NAME?`     | pure operator, no error       |
| `=2*3`                  | `#NAME?`     |                               |
| `=5>3`                  | `#NAME?`     | comparison operator           |
| `=5=5`                  | `#NAME?`     |                               |
| `=ABS(-5)`              | `#NAME?`     | unary minus inside a function |
| `=SUM(ABS(-5),1)`       | `#NAME?`     | nested unary minus            |
| `=SUM(1,2,3)`           | `6`          | pure function call — works    |
| `=ISNUMBER(5)`          | `TRUE`       | works                         |
| `=CONCATENATE("a","b")` | `"ab"`       | works (no `&` operator)       |

The corpus arithmetic fixture confirms it independently: `=1+1`, `=10/3`, `=2+3*4`,
`="hello"&"world"` are all recorded as `#NAME?` for pycel.

**Implication:** any pycel `#NAME?` in the catalogue whose formula contains an operator is a
driver-integration limitation, **not** a statement about the pycel library. This is why
`=NOW()>=TODAY()`, `=RAND()>=0`, `=IFERROR(1/0,"err")`, `=SQRT(-1)`, `=SUM(1,1/0,3)` all show pycel
`#NAME?` — every one of them carries an operator (the `>=`, the `/`, the unary `-`).

## NOW() and TODAY() actually work in pycel

Directly relevant to the volatile suite: `=NOW()` returns `46214.066` and `=TODAY()` returns `46214`
on the current pycel build. The forks `=NOW()>=TODAY()`, `=NOW()>0`, `=TODAY()>0` fail **only**
because of the comparison operator, not because NOW/TODAY are missing.

## Genuinely missing functions

Separately, some functions are truly absent (they return `#NAME?` even with no operator present):

- `RAND` — `=ISNUMBER(RAND())` → `#NAME?` (no operator)
- `RANDBETWEEN` — `=RANDBETWEEN(5,5)` → `#NAME?`
- `RANDARRAY` — `=RANDARRAY(1,3,1,10,TRUE)` → `#NAME?`
- `TIME`, `COUNTA`, and ~78 others already catalogued in `DV-0001`.

## Version-skew: pycel gained IFERROR/IFNA since the corpus was recorded

The recorded pycel fixtures (generatedAt 2026-06-17) show `#NAME?` for `=IFERROR(#N/A,"fallback")`,
`=IFERROR(42,"err")`, `=IFNA(#N/A,"caught")`, `=IFNA(42,"caught")`. The **currently installed** pycel
evaluates all of these correctly (`"fallback"`, `42`, `"caught"`, `42`) — confirmed live
(`date-volatile-errors-probe3.mts`), isolated and batched. So those recorded forks are version-skew:
IFERROR/IFNA were absent at record time and are present now. (Cases where the IFERROR/IFNA argument
is a computed error like `1/0` stay `#NAME?` even now — that is the operator limitation, not coverage.)

## How error _literals_ vs _computed_ errors behave in pycel

pycel propagates error **literals** correctly: `=SUM(1,#N/A,3)` → `#N/A`, `=AVERAGE(1,#VALUE!,3)` →
`#VALUE!`, `=ISERROR(NA())` → `TRUE`, `=ISERR(NA())` → `FALSE`. It is only **computed** errors that
disappear into `#NAME?`, and only because producing them requires an operator (`1/0`) or unary minus
(`SQRT(-1)` → the domain error never even computes because `-1` trips the operator gate).

## Wiki-facing notes

- Never surface "pycel does not support `<function>`" purely from a corpus `#NAME?`. Check whether the
  test formula contains an operator first. If it does, the `#NAME?` is a harness artifact.
- pycel is only safely comparable in the corpus on operator-free, function-call formulas. Treat its
  operator-bearing rows as "not measured," not as "unsupported."
- pycel's genuine gaps for this batch: RAND, RANDBETWEEN, RANDARRAY, TIME, WEEKNUM, COUNTA.

## Open questions

- The operator limitation looks like a fixable driver bug (pycel-the-library evaluates `=1+1`; the
  assay integration does not). Worth a driver-team ticket, but out of scope for the wiki. No live
  excel/gsheets probe needed — this is entirely a pure-engine finding.
