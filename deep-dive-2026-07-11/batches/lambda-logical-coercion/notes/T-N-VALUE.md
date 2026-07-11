# T / N / VALUE — coercion functions — cross-engine deep dive

**Batch:** lambda-logical-coercion · **Refs:** T/t-of-string, T/t-of-boolean, N/n-of-error-type-coercion, N/n-of-number-type-coercion, N/n-of-string, VALUE/value-of-boolean-string, VALUE/value-of-non-numeric-string, VALUE/value-of-numeric-string · **Confidence:** high

## Behavior summary

`T` returns its argument if it is text and empty text otherwise. `N` converts a value to a number (numbers pass through, text → 0, errors propagate). `VALUE` parses a numeric string to a number and errors on non-numeric strings. On the substantive semantics all real engines agree; the interesting content is (a) one value-model split in `T`, (b) pycel's missing `T`, and (c) that `N` and `VALUE` are fully portable and only libreoffice's recording gap makes them look like forks.

All pure-engine results confirmed by live probe.

## Divergences

### T of a non-text value — blank vs empty string

`=T(TRUE)`

| engine                     | result            | representation                                     |
| -------------------------- | ----------------- | -------------------------------------------------- |
| excel, formulas            | blank cell (null) | empty result as a genuinely empty cell             |
| gsheets, ironcalc, lattice | `""`              | empty result as a zero-length string               |
| hyperformula, pycel        | `#NAME?`          | T not implemented                                  |
| libreoffice                | blank             | recording gap (coincides with excel/formulas here) |

Cause: **null-vs-zero** (here specifically blank-cell vs empty-string). The semantic result of `T` on a boolean is empty text; engines just represent "empty text" two ways. This matters to the value model — a downstream `ISBLANK` or `=T(TRUE)=""` test would disagree across engines — but not to a human reading the cell. Live probe: `formulas` `T(TRUE)` → blank, `ironcalc` `T(TRUE)` → `""`.

### T of text — pycel missing function

`=T("hello")`

| engine                                                    | result                       |
| --------------------------------------------------------- | ---------------------------- |
| excel, formulas, gsheets, hyperformula, ironcalc, lattice | `"hello"`                    |
| pycel                                                     | `#NAME?` (T not implemented) |
| libreoffice                                               | blank (recording gap)        |

Cause: **missing-function**. Note this pycel `#NAME?` is a _genuine missing function_ (confirmed live: `=T("x")` → `#NAME?`, with no operator argument involved), distinct from pycel's operator-argument limitation that produces `#NAME?` elsewhere (see `engine-artifacts.md`). Also note hyperformula computes `T("hello")` = "hello" but fails `T(TRUE)` with `#NAME?` — its T handling is uneven across argument types.

### N and VALUE — portable; libreoffice-gap-only "forks"

`=N(#VALUE!)` → `#VALUE!` · `=N(42)` → `42` · `=N("hello")` → `0` · `=VALUE("TRUE")` → `#VALUE!` · `=VALUE("abc")` → `#VALUE!` · `=VALUE("123.45")` → `123.45`

For all six of these, **every engine except libreoffice agrees** on the value shown above (confirmed live on the pure engines). The only reason they appear in the fork work-list is libreoffice's blank, which is the corpus-wide recording gap (0/~2000 non-null across all suites), not a computed value. These are effectively non-divergences. Cause bucket recorded as `TODO` (libreoffice recording gap) in the annotations — see `engine-artifacts.md`.

Worth recording as portable facts: `N` propagates errors (`N(#VALUE!)`=`#VALUE!`), passes numbers through, and maps non-numeric text to 0; `VALUE` errors on non-numeric and boolean-looking strings (`"TRUE"` is NOT parsed to a boolean/number — it is a `#VALUE!` error) and parses `"123.45"` to 123.45.

## Edges explored beyond the corpus

- `=N(1)` → 1 on pycel (N is implemented); contrasts with pycel's missing T/PRODUCT.
- ironcalc `T(TRUE)` → `""` and `T("hello")` → "hello" — ironcalc implements T fully and picks the empty-string representation.

## Wiki-facing notes

- **T.md** should note: (1) `T` of a non-text value yields empty text, represented as a **blank cell in Excel** but an **empty string `""` in Google Sheets / ironcalc / lattice** — relevant if you chain `ISBLANK`/`LEN` on the result; (2) pycel does not implement `T`, and hyperformula only handles `T` of text.
- **VALUE.md** should note `VALUE("TRUE")` is a `#VALUE!` error (it does not parse boolean-looking text), portable across all engines.
- **N.md** — behavior is portable; safe to describe error-propagation and text→0 without engine caveats (other than the libreoffice recording gap, which is not real behavior).

## Open questions

- `lambda-logical-coercion-005` (excel/gsheets): confirm `T(TRUE)` = blank (excel) vs `""` (gsheets) — pins the value-model split on the two hosted engines.
