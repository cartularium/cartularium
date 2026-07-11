# CHISQ.TEST / CHITEST — cross-engine deep dive

**Batch:** stat-distributions · **Refs:** CHISQ.TEST/chisq-test-2x3-contingency, CHITEST/chitest-2x3-contingency, CHITEST/chitest-small-table · **Confidence:** high

## Behavior summary

`CHISQ.TEST(observed_range, expected_range)` (and its pre-2010 alias `CHITEST`) returns the
_p-value_ of Pearson's chi-square test of independence. Internally it computes the test statistic
`chi2 = Σ (observed − expected)² / expected` over the two ranges, then returns the upper-tail
probability `CHISQ.DIST.RT(chi2, df)`. The whole result hinges on the degrees of freedom `df`,
and that is exactly where lattice diverges from everyone else.

For a rectangular contingency table with `r` rows and `c` columns, **Excel's rule is
`df = (r − 1)·(c − 1)`**. excel, formulas, gsheets, hyperformula, and ironcalc all follow it and
agree to floating-point last-place rounding. **lattice instead uses `df = r·c − 1`** (the number
of cells minus one) — i.e. it treats the two ranges as flat lists of `n` values and applies the
one-dimensional `n − 1` rule. Because `r·c − 1 > (r−1)(c−1)` for any table, lattice's df is always
larger, so its p-value is always larger (further from significance).

## Divergences

### 2×3 contingency table — `=CHISQ.TEST(A1:C2, A4:C5)` and `=CHITEST(A1:C2, A4:C5)`

Grid (observed A1:C2 = `58,11,10 / 35,25,23`; expected A4:C5 = `45.35,17.56,16.09 / 47.65,18.44,16.91`).

| engine             | result                        | df used             |
| ------------------ | ----------------------------- | ------------------- |
| excel              | 0.00030819201700830936        | (2−1)(3−1) = 2      |
| formulas           | 0.0003081920170083095         | 2                   |
| gsheets            | 0.0003081920170082686         | 2                   |
| hyperformula       | 0.00030819201701              | 2                   |
| ironcalc           | 0.000308192 (CHISQ.TEST only) | 2                   |
| **lattice**        | **0.0063762422150260845**     | **2·3 − 1 = 5**     |
| ironcalc (CHITEST) | #NAME?                        | legacy alias absent |
| pycel              | #NAME?                        | not implemented     |
| libreoffice        | (blank)                       | recording gap       |

### 2×2 table — `=CHITEST(A1:B2, A4:B5)` (`chitest-small-table`)

Grid (observed `30,20 / 25,25`; expected `27.5,22.5 / 27.5,22.5`).

| engine                                    | result                      | df used             |
| ----------------------------------------- | --------------------------- | ------------------- |
| excel / formulas / gsheets / hyperformula | 0.31487864133641985 (± ULP) | (2−1)(2−1) = 1      |
| **lattice**                               | **0.798807828845659**       | **2·2 − 1 = 3**     |
| ironcalc, pycel                           | #NAME?                      | legacy alias absent |
| libreoffice                               | (blank)                     | recording gap       |

**Cause bucket:** `arg-semantics` (degrees-of-freedom interpretation) — a genuine algorithmic
divergence, not floating-point noise.

## Edges explored beyond the corpus

I confirmed the mechanism on the pure-engine harness by back-solving the chi-square statistic from
the Excel p-value on hyperformula and re-evaluating the tail at each candidate df
(`scratch/stat-distributions-probe2.mts`):

```
chi2 (2x3 table) = CHISQ.INV.RT(0.00030819201700830936, 2) = 16.169575075
  CHISQ.DIST.RT(16.169575075, 2) = 0.00030819201698   <- Excel/gsheets/… (df=2)
  CHISQ.DIST.RT(16.169575075, 5) = 0.0063762422145     <- lattice recorded 0.0063762422150  ✓
  CHISQ.DIST.RT(16.169575075, 4) = 0.002799858995      (ruled out)

chi2 (2x2 table) = CHISQ.INV.RT(0.31487864133641985, 1) = 1.0101010101
  CHISQ.DIST.RT(1.0101010101, 1) = 0.31487864134       <- Excel/… (df=1)
  CHISQ.DIST.RT(1.0101010101, 3) = 0.79880782885       <- lattice recorded 0.798807828845659  ✓
```

Both lattice values reproduce to full recorded precision under `df = r·c − 1`. The chi-square
_statistic_ is identical across engines — only the df feeding the tail probability differs.

## Wiki-facing notes

- `CHISQ.TEST`/`CHITEST` are **not portable to lattice** for any table with more than one row and
  more than one column: lattice reports a materially different (larger) p-value because it uses
  `df = cells − 1` instead of Excel's contingency-table `df = (rows−1)(cols−1)`. For the sample
  2×3 table the difference is 0.00031 vs 0.0064 — the difference between "highly significant" and
  "not significant at the 0.5% level". This is a correctness bug in lattice's df computation.
- `CHITEST` is the legacy alias; **ironcalc does not implement it** (`#NAME?`), though ironcalc
  does implement the modern `CHISQ.TEST`. Prefer `CHISQ.TEST` for portability.
- pycel implements neither.

## Open questions

- Excel's df rule for a **degenerate table** (a single row or single column, where it should fall
  back to `df = max(r,c) − 1`) is not exercised by the corpus — see probe request
  `stat-distributions-001`. Worth confirming whether lattice's flat `n − 1` happens to coincide
  with Excel there.
- lattice cannot be run on this harness; the df bug should be filed with the lattice maintainer.
