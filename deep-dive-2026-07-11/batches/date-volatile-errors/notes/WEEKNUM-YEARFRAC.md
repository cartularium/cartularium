# WEEKNUM / YEARFRAC — text-date coercion cross-engine deep dive

**Batch:** date-volatile-errors · **Refs:** WEEKNUM/weeknum-iso-system, YEARFRAC/yearfrac-actual-360 · **Confidence:** high

## Behavior summary

Both functions take date arguments. In the corpus they are authored with **text** dates
(`"2023-01-01"`, `"2025-01-01"`). Whether an engine accepts a text date — coercing an ISO-8601 string
to a date serial — is the whole story here. excel, gsheets, ironcalc, formulas and lattice coerce and
compute; HyperFormula (and pycel, for YEARFRAC) refuse the text form and return `#VALUE!`.

## Divergences

### WEEKNUM("2023-01-01", 21) — ISO week-numbering, type 21

| engine                                          | result        | mechanism                                                                     |
| ----------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| excel / formulas / gsheets / ironcalc / lattice | 52            | coerce text→serial; ISO week 52 (2023-01-01 is a Sunday, ISO week 52 of 2022) |
| **hyperformula**                                | **`#VALUE!`** | does not coerce the text date argument                                        |
| libreoffice                                     | blank         | empty recording                                                               |
| pycel                                           | `#NAME?`      | WEEKNUM unimplemented                                                         |

**The split is coercion, not the return-type argument.** Confirmed live
(`date-volatile-errors-probe5.mts`): HyperFormula returns `#VALUE!` for the text form regardless of
type, but computes correctly the moment the argument is a real date:

| formula (hyperformula)         | result    |
| ------------------------------ | --------- |
| `=WEEKNUM("2023-01-01", 21)`   | `#VALUE!` |
| `=WEEKNUM(DATE(2023,1,1), 21)` | 52        |
| `=WEEKNUM(44927, 21)` (serial) | 52        |
| `=WEEKNUM(DATE(2023,1,1), 1)`  | 1         |
| `=ISOWEEKNUM(DATE(2023,1,1))`  | 52        |

So HyperFormula fully supports WEEKNUM type 21 and ISOWEEKNUM — it just will not parse a date string.

### YEARFRAC("2025-01-01","2026-01-01",2) — actual/360 basis

| engine                                          | result        | mechanism                                              |
| ----------------------------------------------- | ------------- | ------------------------------------------------------ |
| excel / formulas / gsheets / ironcalc / lattice | 1.0138888888… | coerce text→serial; 365/360 = 1.01389                  |
| **hyperformula**                                | **`#VALUE!`** | no text-date coercion                                  |
| **pycel**                                       | **`#VALUE!`** | no text-date coercion (YEARFRAC itself IS implemented) |
| libreoffice                                     | blank         | empty recording                                        |

Confirmed live: both hyperformula and pycel return `#VALUE!` for the text form but `1.0138888889` with
`DATE()`/serial arguments (`=YEARFRAC(DATE(2025,1,1),DATE(2026,1,1),2)` and
`=YEARFRAC(45658,46023,2)`). The `#VALUE!` here is **not** about basis 2 — hyperformula returned
`#VALUE!` for bases 0, 1, 2 and 3 on the text form, and the correct value on all of them with real
dates.

Note pycel's `#VALUE!` (not `#NAME?`) is the tell that pycel _has_ YEARFRAC and is rejecting the
argument type, distinct from its many genuinely-missing functions.

## Edges explored beyond the corpus

- HyperFormula `YEARFRAC` text form across bases: `#VALUE!` for b0/b1/b2/b3; `DATE()` form gives the
  right fraction for each. The refusal is uniform, so any corpus date function authored with string
  dates will fork HyperFormula off the pack the same way.

## Wiki-facing notes

- **Portability caveat for date functions:** HyperFormula does not coerce ISO-8601 date _strings_ to
  serials. `WEEKNUM("2023-01-01", …)`, `ISOWEEKNUM("2023-01-01")`, `YEARFRAC("2025-01-01", …)` all give
  `#VALUE!` there. Wrap literals in `DATE(y,m,d)` (or pass a cell holding a real date) for portable
  formulas. pycel has the same restriction for YEARFRAC.
- WEEKNUM type 21 (ISO) is supported by excel, gsheets, ironcalc, formulas, lattice and HyperFormula
  (with a real-date argument); pycel lacks WEEKNUM entirely.

## Open questions

- Confirm excel/gsheets return 52 and 1.013889 for the text-argument forms (probes `dve-002`,
  `dve-003`) — corpus already records these; probes are confirmation-grade for the coercion claim.
