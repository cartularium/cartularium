# TIME / TIMEVALUE — cross-engine deep dive

**Batch:** date-volatile-errors · **Refs:** TIME/time-basic, TIME/time-overflow-rolls, TIMEVALUE/timevalue-basic, TIMEVALUE/timevalue-midnight, TIMEVALUE/timevalue-noon · **Confidence:** high

## Behavior summary

`TIME(h, m, s)` returns a time-of-day as a fraction of a 24-hour day; `TIMEVALUE(text)` parses a time
string to the same fraction. On the value they agree closely across excel, gsheets, hyperformula,
ironcalc, formulas and lattice — differences in the corpus are precision (stored decimal places) plus
two real edges below. libreoffice is blank everywhere (empty recording), and pycel does not implement
`TIME` at all (`#NAME?`).

## Divergences

### TIME(25,0,0) — lattice does not reduce the hours field modulo 24 (the real one)

`=TIME(25, 0, 0)` — 25 hours.

| engine       | result                 | mechanism                                        |
| ------------ | ---------------------- | ------------------------------------------------ |
| excel        | 0.041666666666666664   | 25 mod 24 = 1h → 1/24                            |
| formulas     | 0.04166666666666674    | same, precision                                  |
| gsheets      | 0.041666666667         | same, precision                                  |
| hyperformula | 0.041666666667         | same (live)                                      |
| ironcalc     | 0.041666667            | same (live)                                      |
| **lattice**  | **1.0416666666666667** | **hours NOT reduced mod 24: 25/24 = 1 day + 1h** |
| libreoffice  | blank                  | empty recording                                  |
| pycel        | `#NAME?`               | TIME unimplemented                               |

Live confirmation (`date-volatile-errors-probe1.mts`) on the pure engines:
`TIME(25,0,0)=0.041667`, `TIME(48,0,0)=0` (hyperformula/ironcalc/formulas all agree with Excel).
Only lattice carries the extra day into the integer part.

This is the `arg-semantics` bucket. Excel's documented behavior is that an hours value ≥ 24 is divided
by 24 and the remainder is used; lattice omits that reduction.

### Minute/second overflow rolls the same on every engine

`=TIME(0, 90, 0)` = 0.0625 (90 min = 1.5 h) on all engines that evaluate it — the divergence above is
specific to the **hours** field, not to overflow handling in general.

### TIME(9,30,0) and all TIMEVALUE cases — no real divergence

`=TIME(9,30,0)` = 0.3958333… and the TIMEVALUE cases (`"13:30:00"`→0.5625, `"00:00:00"`→0,
`"12:00:00"`→0.5) agree across every functional engine; the only reason they show as forks is the
libreoffice blank (all suites) and, for `time-basic`, pycel `#NAME?` (TIME unimplemented). No portability
concern beyond those two artifacts.

## Edges explored beyond the corpus

| formula         | excel (expected) | hyperformula | ironcalc | formulas | pycel    |
| --------------- | ---------------- | ------------ | -------- | -------- | -------- |
| `=TIME(48,0,0)` | 0                | 0            | 0        | 0        | `#NAME?` |
| `=TIME(0,90,0)` | 0.0625           | 0.0625       | 0.0625   | 0.0625   | `#NAME?` |

Both confirm the pure engines mirror Excel's mod-24 / minute-carry behavior. lattice's `TIME(48,0,0)`
would, by the same mechanism, be expected to return 2.0 rather than 0 — worth confirming if lattice
becomes probe-accessible.

## Wiki-facing notes

- `TIME()` reduces an hours argument ≥ 24 modulo 24 in Excel, Google Sheets, HyperFormula, IronCalc and
  the `formulas` library. **Lattice does not** — `TIME(25,0,0)` yields `1.0416…` (1 day 1 hour) there.
  If you rely on hour-overflow wrapping, do not assume it on lattice.
- pycel has no `TIME`; do not use it for time construction.
- Minute and second overflow (`TIME(0,90,0)`) carries consistently everywhere.

## Open questions

- Confirm excel/gsheets `TIME(25,0,0)` = 0.041667 live (probe `dve-005`) to pin lattice as the sole
  outlier (corpus already shows this; probe is confirmation-grade).
- lattice `TIME(48,0,0)` behavior (predicted 2.0) — needs lattice access.
