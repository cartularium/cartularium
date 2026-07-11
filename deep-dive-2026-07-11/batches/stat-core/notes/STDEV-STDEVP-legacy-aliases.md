# STDEV / STDEVP (legacy aliases) — cross-engine deep dive

**Batch:** stat-core · **Refs:** STDEV/stdev-sample-1-5, STDEV/stdev-two-values, STDEVP/stdevp-population-1-5 · **Confidence:** high (live-confirmed on ironcalc/pycel/hyperformula)

## Behavior summary

`STDEV` (sample) and `STDEVP` (population) are the pre-2010 names for what Excel 2010 renamed to `STDEV.S` and `STDEV.P`. Excel keeps both spellings for backward compatibility. The engines split on whether they carry the **legacy alias** — the computation is identical everywhere it exists.

## Divergences

### `=STDEV(A1:A5)` of `{1..5}`, `=STDEV(1,3)`, `=STDEVP(A1:A5)` of `{1..5}`

| Engine       | STDEV(1..5)        | STDEV(1,3)         | STDEVP(1..5)       |
| ------------ | ------------------ | ------------------ | ------------------ |
| excel        | 1.5811388300841898 | 1.4142135623730951 | 1.4142135623730951 |
| formulas     | 1.5811388301       | 1.4142135624       | 1.4142135624       |
| gsheets      | 1.581138830        | 1.414213562        | 1.414213562        |
| hyperformula | 1.5811388301       | 1.4142135624       | 1.4142135624       |
| lattice      | (agrees)           | (agrees)           | (agrees)           |
| ironcalc     | `#NAME?`           | `#NAME?`           | `#NAME?`           |
| pycel        | `#NAME?`           | `#NAME?`           | `#NAME?`           |
| libreoffice  | blank              | blank              | blank              |

**Mechanism (cause: `missing-function`, alias-coverage flavor).** ironcalc and pycel do not register the legacy no-dot names `STDEV`/`STDEVP` and return `#NAME?`. Critically, **ironcalc does implement the modern dotted forms** — live-confirmed, `=STDEV.S(1,2,3,4,5)` → 1.58113883 and `=STDEV.P(1,2,3,4,5)` → 1.414213562 both compute on ironcalc, while `=STDEV(...)`/`=STDEVP(...)` return `#NAME?`. So this is purely a missing-alias gap, not a missing statistic. excel, formulas, gsheets, hyperformula and lattice carry both spellings.

Contrast with the neighbouring `STDEV.S`/`STDEV.P` refs (covered in the pycel-missing-function annotation), where ironcalc is in the agreeing class — that is the exact evidence that ironcalc has the function under its dotted name only.

## Edges explored beyond the corpus

Live probe (`scratch/stat-core-probe1.mts` + `-probe2.mts`):

```
ironcalc  STDEV(1,3)   -> #NAME?     STDEV.S(1..5) -> 1.58113883   (dotted OK, legacy missing)
ironcalc  STDEVP(1..5) -> #NAME?     STDEV.P(1..5) -> 1.414213562
pycel     STDEV / STDEVP / STDEV.S / STDEV.P -> #NAME? (all absent)
```

pycel lacks _both_ the legacy and dotted forms; ironcalc lacks only the legacy form.

## Wiki-facing notes

- On the `STDEV` and `STDEVP` pages: **IronCalc does not recognize the legacy names `STDEV`/`STDEVP`; use `STDEV.S`/`STDEV.P` instead** (IronCalc implements those). **pycel implements neither the legacy nor the dotted forms.**
- General portability guidance for standard deviation: prefer the dotted `STDEV.S` / `STDEV.P` spellings for the widest coverage. The legacy names are safe on Excel, Google Sheets, HyperFormula, LibreOffice and the `formulas` engine, but not IronCalc.
- Where the function exists, the numeric result is identical across engines (differences are display-precision only).

## Open questions

- None blocking. The legacy-vs-dotted coverage was confirmed directly on the two engines that fail. VAR/VARP (the variance legacy aliases) likely follow the same IronCalc pattern; worth a confirming sweep if those functions appear in another batch.
