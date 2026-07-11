# Error handling in aggregates & IS-predicates — cross-engine deep dive

**Batch:** date-volatile-errors · **Refs:** SUM/{sum-of-range-with-error-cell, sum-with-one-div-0, sum-with-one-n-a}, AVERAGE/average-with-one-error, MAX/max-with-error, MIN/min-with-error, COUNT/count-ignores-errors, COUNTA/counta-counts-errors, ISERR/{iserr-excludes-n-a, iserr-on-div-0}, ISERROR/{iserror-on-clean-value, iserror-on-div-0, iserror-on-n-a}, ISNA/{isna-on-div-0, isna-on-n-a}, SQRT/num-error · **Confidence:** high (one medium: the SUM seed case)

## Behavior summary

Two portable rules hold across all six functional engines:

1. **Errors propagate through math aggregates.** `SUM`, `AVERAGE`, `MAX`, `MIN` return the first error
   they meet: `=SUM(1,#N/A,3)` → `#N/A`, `=SUM(1,1/0,3)` → `#DIV/0!`, `=AVERAGE(1,#VALUE!,3)` →
   `#VALUE!`, `=MAX(1,#N/A,3)` → `#N/A`, `=MIN(1,#VALUE!,3)` → `#VALUE!`.
2. **COUNT ignores errors; COUNTA counts them.** `=COUNT(1,#N/A,3,#DIV/0!)` → 2 (only the two
   numbers); `=COUNTA(1,#N/A,3,#DIV/0!)` → 4 (every non-empty argument, errors included).

The IS-predicates are also uniform, and they encode the standard `#N/A`-vs-other distinction:

| formula          | functional engines | point                       |
| ---------------- | ------------------ | --------------------------- |
| `=ISERR(1/0)`    | TRUE               | ISERR catches errors…       |
| `=ISERR(#N/A)`   | FALSE              | …except `#N/A`              |
| `=ISERROR(1/0)`  | TRUE               | ISERROR catches everything… |
| `=ISERROR(#N/A)` | TRUE               | …including `#N/A`           |
| `=ISERROR(42)`   | FALSE              | clean value                 |
| `=ISNA(#N/A)`    | TRUE               | ISNA catches only `#N/A`    |
| `=ISNA(1/0)`     | FALSE              | not `#N/A`                  |
| `=SQRT(-1)`      | `#NUM!`            | domain error                |

None of these is a real cross-engine divergence — they fork in the corpus only because of the
libreoffice blank (all rows) and pycel artifacts (see below).

## Divergences

### SUM over a range containing a formula-seeded error cell (the one genuine, unresolved fork)

`=SUM(A1:A3)` with grid seed `A1=1, A2==1/0, A3=3`:

| engine                                    | result        | mechanism                                          |
| ----------------------------------------- | ------------- | -------------------------------------------------- |
| excel, gsheets                            | **4**         | A2 contributes nothing → 1 + 3                     |
| formulas, hyperformula, ironcalc, lattice | **`#DIV/0!`** | A2 evaluates to a live `#DIV/0!` and propagates    |
| libreoffice                               | blank         | empty recording                                    |
| pycel                                     | `#NAME?`      | the seed cell `=1/0` trips the operator limitation |

The pure engines evaluate the formula-valued seed `=1/0` into a real error inside the range and
propagate it (confirmed live). excel/gsheets returning 4 means A2 was **not** a live `#DIV/0!` in their
recording — most likely a grid-seeding fidelity difference: a formula-valued seed that the excel/gsheets
lane writes as text or as an un-recalculated value would be skipped by SUM (text is ignored), giving
`1+3=4`. This is the one case in the batch that needs live excel/gsheets confirmation of how a
formula-valued grid seed is ingested (probe `dve-001`). Marked `cause: TODO`, medium confidence, because
I cannot run excel/gsheets to distinguish "SUM tolerates the error" from "the seed never became an
error."

Contrast with the inline form `=SUM(1, 1/0, 3)`, which every functional engine returns as `#DIV/0!` —
there the error is unambiguously present in the argument list, and excel/gsheets propagate it. That
strongly implies the range case's `4` is about the _seed_, not about SUM's error tolerance.

### pycel artifacts across this suite

- Operator-bearing formulas → `#NAME?`: `=SUM(1,1/0,3)`, `=ISERR(1/0)`, `=ISERROR(1/0)`,
  `=ISNA(1/0)`, `=SQRT(-1)` (unary minus). Not coverage gaps — see `pycel-driver-artifacts.md`.
- `=COUNTA(1,#N/A,3,#DIV/0!)` → `#NAME?`: COUNTA genuinely missing in pycel (DV-0001).
- Where pycel has no operator and the function exists it agrees with the pack: `=ISERR(#N/A)` FALSE,
  `=ISERROR(#N/A)` TRUE, `=ISNA(#N/A)` TRUE, `=ISERROR(42)` FALSE, `=SUM(1,#N/A,3)` `#N/A`,
  `=AVERAGE(1,#VALUE!,3)` `#VALUE!`, `=MAX(1,#N/A,3)` `#N/A`, `=COUNT(...)` 2.

## Wiki-facing notes

- Error propagation through SUM/AVERAGE/MAX/MIN and the COUNT-ignores / COUNTA-counts split are
  portable across all six functional engines.
- ISERR vs ISERROR vs ISNA: ISERR excludes `#N/A`; ISERROR includes it; ISNA is `#N/A`-only. Uniform.
- Open compatibility question: whether SUM over a **range** that contains an error cell propagates the
  error depends on the cell actually being a live error; a text-valued "=1/0" is silently ignored.
  Verify with real error cells, not seeded formula strings.

## Open questions

- probe `dve-001`: does excel/gsheets seed `A2==1/0` as a live `#DIV/0!` (→ SUM = `#DIV/0!`) or as
  text / value (→ 4)? Resolves the SUM/sum-of-range-with-error-cell fork.
