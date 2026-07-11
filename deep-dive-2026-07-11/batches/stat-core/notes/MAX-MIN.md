# MAX / MIN — cross-engine deep dive (pycel inline-negative parse bug)

**Batch:** stat-core · **Refs:** MAX/max-inline-negatives, MIN/min-inline-negatives (plus the many MAX/MIN cases where only libreoffice diverges) · **Confidence:** high (live-confirmed on pycel)

## Behavior summary

MAX and MIN are the most universally-implemented functions in this batch — every engine computes them correctly for ranges, positive inline literals, empty ranges (→0), and text-in-range (ignored). Almost all MAX/MIN forks in the work-list are the libreoffice all-null artifact only. The single real divergence is a **pycel parser bug on inline negative literals.**

## Divergences

### `=MAX(-3, -1, -7)` and `=MIN(-3, -1, -7)`

| Engine                                                         | MAX result | MIN result |
| -------------------------------------------------------------- | ---------- | ---------- |
| excel / formulas / gsheets / hyperformula / ironcalc / lattice | -1         | -7         |
| pycel                                                          | `#NAME?`   | `#NAME?`   |
| libreoffice                                                    | blank      | blank      |

**Mechanism (cause: `unimplemented-edge`).** pycel returns `#NAME?` specifically when MAX/MIN are given **inline negative numeric literals**. It is not a missing function and not a problem with negative numbers per se — pycel handles the same functions correctly when the arguments are positive inline literals or come from cells (including negative cell values). The trigger is the unary-minus literal inside an inline argument list, which pycel's formula parser mis-resolves (surfacing as a name-resolution error).

Live probe (`scratch/stat-core-probe1.mts`) isolates it:

```
pycel  MAX(-3,-1,-7)      -> #NAME?     (inline negative literals: FAILS)
pycel  MIN(-3,-1,-7)      -> #NAME?     (inline negative literals: FAILS)
pycel  MAX(1,5,3,2,4)     -> 5          (inline positive literals: OK)
pycel  MAX(A1:A3={10,30,20}) -> 30      (cell range: OK)
```

So the failure is not "MAX is missing" (it works twice above) and not "negatives are unsupported" (a MAXA test elsewhere in the suite, `=MAXA(A1:A3)` with `A1=-5, A3=-10`, uses negative _cell_ values). It is narrowly the inline `-n` literal in the argument list.

## Edges explored beyond the corpus

- Confirmed the same trigger fires for both MAX and MIN, indicating a shared argument-parsing path rather than a per-function issue.
- The positive-inline and range forms succeeding on the _same pycel session_ rules out a session/setup problem — it is deterministic and input-shape-specific.

## Wiki-facing notes

- On the MAX and MIN pages, add a pycel compatibility caveat: **pycel raises `#NAME?` for `MAX`/`MIN` (and likely other aggregates) called with inline negative number literals such as `=MAX(-3,-1,-7)`.** Workaround: put the negatives in cells and pass a range, or wrap them (e.g. `=MAX(0-3,0-1,0-7)` avoids the leading unary minus). This is a pycel formula-parser limitation, not a semantic difference — every other engine returns the mathematically expected value.
- All non-negative-literal MAX/MIN behavior (ranges, empty range → 0, text ignored, positive inline) is fully portable across all eight engines (libreoffice recordings excepted; those are the stale all-null fixture).

## Open questions

- Whether the pycel parse bug extends to other aggregates (SUM, AVERAGE, etc.) with inline negative literals is untested here but plausible; a follow-up pure-engine sweep could map its full extent. Not required for the MAX/MIN annotation.
