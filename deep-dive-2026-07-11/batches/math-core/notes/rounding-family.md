# Rounding & core-math family — cross-engine deep dive

**Batch:** math-core · **Subjects:** ABS, CEILING, EVEN, EXP, FACT, FLOOR, INT, LOG, LOG10, MOD, POWER, ROUND, ROUNDDOWN, ROUNDUP, SIGN, SQRT, TRUNC · **Confidence:** high

## Behavior summary

The headline finding for this whole family is **agreement**. Across excel, formulas, gsheets, hyperformula, ironcalc, and lattice, every case in the math work-list produces the identical numeric or error result. The functions are fully portable at these inputs. The two divergent branches present in the fixtures are both **artifacts**, not semantics:

1. **libreoffice = blank** on every case (suite-wide recording gap — see libreoffice-recording-gap.md).
2. **pycel = `#NAME?`** on exactly the cases whose formula contains a negative literal / arithmetic operator (see pycel-arithmetic-operator-artifact.md). pycel agrees with everyone on the operator-free cases.

So once those two artifacts are set aside, there is no genuine cross-engine divergence in this family within the corpus.

## Divergences

All work-list cases resolve to "genuine engines agree; libreoffice blank; pycel `#NAME?` iff a negative literal is present." Representative rows:

| formula               | genuine engines agree on | pycel                  | libreoffice |
| --------------------- | ------------------------ | ---------------------- | ----------- |
| `=ABS(-3.4)`          | `3.4`                    | `#NAME?` (neg literal) | blank       |
| `=ABS(3)` / `=ABS(0)` | `3` / `0`                | `3` / `0`              | blank       |
| `=CEILING(-2.5, -2)`  | `-4`                     | `#NAME?`               | blank       |
| `=CEILING(-2.5, 2)`   | `-2`                     | `#NAME?`               | blank       |
| `=FLOOR(-2.5, -2)`    | `-2`                     | `#NAME?`               | blank       |
| `=FLOOR(3.7, 2)`      | `2`                      | `2`                    | blank       |
| `=EVEN(-1)`           | `-2`                     | `#NAME?`               | blank       |
| `=POWER(2, -3)`       | `0.125`                  | `#NAME?`               | blank       |
| `=ROUND(1234, -2)`    | `1200`                   | `#NAME?`               | blank       |
| `=ROUND(1.25, 1)`     | `1.3`                    | `1.3`                  | blank       |
| `=SIGN(-10)`          | `-1`                     | `#NAME?`               | blank       |
| `=MOD(5, 0)`          | `#DIV/0!`                | `#DIV/0!`              | blank       |
| `=LOG(8, 2)`          | `3`                      | `3`                    | blank       |

Cause buckets: the negative-literal rows → `unimplemented-edge` (pycel artifact) + `TODO` (libreoffice); the operator-free rows → `TODO` (libreoffice only).

## Semantics worth recording (all engines agree — good portability facts)

These are agreements, not divergences, but they are the substantive per-function truths the wiki should carry:

- **CEILING / FLOOR with signed significance.** `CEILING(-2.5, -2) = -4` and `CEILING(-2.5, 2) = -2`; `FLOOR(-2.5, -2) = -2`. The legacy CEILING/FLOOR round toward/away from zero based on the sign of the significance argument, and every genuine engine follows the same convention here. (Note: the corpus tests the legacy 2-arg CEILING/FLOOR; the newer CEILING.MATH / FLOOR.MATH with a mode argument are separate subjects, some engines missing them — see DV-0007.)
- **ROUND is half-away-from-zero:** `ROUND(1.25, 1) = 1.3`, `ROUND(0.6, 0) = 1`, `ROUND(1234, -2) = 1200` (negative digits round to the left of the decimal). Uniform across engines.
- **EVEN rounds away from zero to the next even integer:** `EVEN(1.5) = 2`, `EVEN(3) = 4`, `EVEN(-1) = -2`. Uniform.
- **MOD(5, 0) = `#DIV/0!`** everywhere (division-by-zero, not a special value).
- **FACT(0) = 1**, **EXP(0) = 1**, **SIGN(0) = 0**, **LOG(10) = 1** (base-10 default), **LOG10(100000) = 5**, **SQRT(4) = 2**, **TRUNC(10.22, 1) = 10.2**, **INT(8.9) = 8** — all unanimous.

## Edges explored beyond the corpus

The pycel operator boundary was probed in depth (see pycel-arithmetic-operator-artifact.md): `=ABS(A1)` with A1 = -3.4 returns `3.4`, so the negative-literal `#NAME?` is a source-tokenization artifact, and the underlying ABS/ROUND/… semantics in pycel are not in question.

## Wiki-facing notes

- These functions are **safe, portable primitives** — no genuine cross-engine divergence at ordinary inputs. Function pages can state agreement confidently.
- Record the signed-significance CEILING/FLOOR convention and ROUND's half-away-from-zero rule as portable facts.
- Do **not** propagate the pycel `#NAME?` or libreoffice blank into per-function compatibility rows for this family — both are integration/recording artifacts (see the two dedicated notes).

## Open questions

None requiring Excel/gsheets — the family is settled on pure-engine + recorded evidence for these inputs.
