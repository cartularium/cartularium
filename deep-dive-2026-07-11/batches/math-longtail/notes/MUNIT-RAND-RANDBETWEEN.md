# MUNIT / RAND / RANDBETWEEN — cross-engine deep dive

**Batch:** math-longtail · **Refs:** MUNIT/munit-zero-error, RAND/rand-smoke, RANDBETWEEN/randbetween-smoke · **Confidence:** high (MUNIT), medium (RAND family)

## MUNIT(0) — error-code + missing-function fork

`=MUNIT(0)` asks for a 0×0 identity matrix, an invalid dimension. Engines disagree on how to fail.

| Engine       | `=MUNIT(0)` | Mechanism                                       |
| ------------ | ----------- | ----------------------------------------------- |
| excel        | `#VALUE!`   | implemented; rejects arg as invalid type/shape  |
| formulas     | `#VALUE!`   | implemented; same                               |
| lattice      | `#VALUE!`   | implemented; same                               |
| gsheets      | `#NUM!`     | implemented; rejects arg as out-of-range number |
| hyperformula | `#NAME?`    | MUNIT not implemented (live-confirmed)          |
| ironcalc     | `#NAME?`    | MUNIT not implemented (live-confirmed)          |
| pycel        | `#NAME?`    | MUNIT not implemented                           |
| libreoffice  | `BLANK`     | recording artifact                              |

Two mechanisms in one fork: an **error-code** divergence among the engines that implement MUNIT
(`#VALUE!` "wrong argument" vs gsheets `#NUM!` "number out of range"), plus a **missing-function**
branch (`#NAME?`) for the three that lack MUNIT entirely. Live probe confirmed hyperformula,
ironcalc, pycel all `#NAME?`, and formulas `#VALUE!`.

### Wiki-facing (MUNIT)

MUNIT is not universally available: it is absent in HyperFormula and IronCalc (and pycel). Where it
exists, an invalid size argument is not portably signalled — Excel/lattice say `#VALUE!`, Google
Sheets says `#NUM!`. Don't branch on the specific error code across engines.

## RAND / RANDBETWEEN — non-determinism, plus a `formulas` bug

`=RAND()` and `=RANDBETWEEN(1,10)` are **volatile**: each engine returns an independent
pseudo-random draw, so every engine lands in its own agreement class by construction. That is
expected non-determinism, not a computational disagreement, and there is no LibreOffice branch for
these two (they were not recorded blank; they simply have per-engine draws).

Two real distinctions surface underneath the noise:

| Engine       | `=RAND()` | `=RANDBETWEEN(1,10)` | Note                             |
| ------------ | --------- | -------------------- | -------------------------------- |
| excel        | 0.4488…   | 2                    | integer                          |
| gsheets      | 0.0733…   | 5                    | integer                          |
| hyperformula | 0.7326…   | 4                    | integer                          |
| ironcalc     | 0.6818…   | 5                    | integer                          |
| formulas     | 0.5053…   | **3.535053…**        | **non-integer — bug**            |
| pycel        | `#NAME?`  | `#NAME?`             | RAND/RANDBETWEEN not implemented |

1. **pycel** does not implement either function (`#NAME?`).
2. **formulas** returns a **non-integer** from `RANDBETWEEN(1,10)` (live-reproduced: 3.535). Per
   spec, RANDBETWEEN returns a whole number between the (inclusive) bounds; a fractional result is
   a genuine defect in the `formulas` engine. All other engines return integers.

### Wiki-facing (RAND family)

RAND/RANDBETWEEN cannot be compared value-for-value across engines (volatile). Portability caveats:
the `formulas` library returns non-integer RANDBETWEEN values (do not rely on it for integer draws);
RAND/RANDBETWEEN are unavailable in pycel.

## Open questions

- excel/gsheets: confirm `=ISNUMBER(RANDBETWEEN(1,10))` is TRUE and the value is always integer
  (probe `math-longtail-formulas-randbetween`) — establishes the reference contract the `formulas`
  engine violates.
- excel/gsheets: reconfirm the MUNIT(0) error split (`math-longtail-munit-zero`).
