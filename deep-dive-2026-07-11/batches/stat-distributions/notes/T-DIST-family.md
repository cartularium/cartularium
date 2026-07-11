# T.DIST family — cross-engine deep dive (the lattice `.2T` parse failure)

**Batch:** stat-distributions · **Refs:** T.DIST.2T/t-dist-2t-central, T.DIST.2T/t-dist-2t-df-10,
T.INV.2T/t-inv-2t-95-df-10, T.INV.2T/t-inv-2t-roundtrip (plus context: T.DIST/_, T.DIST.RT/_,
T.INV/_, TDIST/_, TINV/\*) · **Confidence:** high for the recorded facts, medium for the lattice
tokenizer explanation (lattice is not runnable on this harness)

## Behavior summary

The Student-t functions come in five name shapes. All engines that implement a given shape agree
on the value to floating-point last-place rounding. The one structural fork is that **lattice
fails to parse the two-tailed `.2T` names**, returning `#PARSE!` — an error at the formula-parser
level, distinct from a missing-function `#NAME?`.

| name                | meaning             | lattice       | hyperformula             | ironcalc | pycel    |
| ------------------- | ------------------- | ------------- | ------------------------ | -------- | -------- |
| `T.DIST(x,df,cum)`  | left-tail cdf / pdf | computes      | `#NAME?`                 | computes | `#NAME?` |
| `T.DIST.RT(x,df)`   | right-tail          | computes      | computes                 | computes | `#NAME?` |
| `T.DIST.2T(x,df)`   | two-tailed          | **`#PARSE!`** | computes                 | computes | `#NAME?` |
| `T.INV(p,df)`       | inverse left-tail   | computes      | `#NAME?`                 | computes | `#NAME?` |
| `T.INV.2T(p,df)`    | inverse two-tailed  | **`#PARSE!`** | computes                 | computes | `#NAME?` |
| `TDIST(x,df,tails)` | legacy              | computes      | computes (low precision) | `#NAME?` | `#NAME?` |
| `TINV(p,df)`        | legacy two-tailed   | computes      | computes (low precision) | `#NAME?` | `#NAME?` |

lattice computes `T.DIST`, `T.DIST.RT`, `T.INV`, `TDIST`, `TINV` fine — so the failure is specific
to the `.2T` name form. The most likely mechanism is that lattice's tokenizer mishandles a
function-name segment that begins with a digit after a dot (`.2T`), so the name never resolves and
the parser aborts with `#PARSE!` rather than reaching name lookup. (I could not reproduce this
directly — lattice is not one of the pure engines runnable here.)

## Divergences

### `=T.DIST.2T(0.5, 10)` (`t-dist-2t-central`)

| engine                                               | result                                                 |
| ---------------------------------------------------- | ------------------------------------------------------ |
| excel / formulas / gsheets / hyperformula / ironcalc | 0.6278936057429729 (± ULP; hyperformula 0.62789360574) |
| lattice                                              | **#PARSE!**                                            |
| pycel                                                | #NAME?                                                 |
| libreoffice                                          | (blank — recording gap)                                |

### `=T.INV.2T(0.05, 10)` (`t-inv-2t-95-df-10`)

| engine                                | result                                             |
| ------------------------------------- | -------------------------------------------------- |
| excel / formulas / gsheets / ironcalc | 2.2281388519862744 (± ULP)                         |
| hyperformula                          | 2.2281388425 (lower-accuracy algorithm, ~1e-8 rel) |
| lattice                               | **#PARSE!**                                        |
| pycel                                 | #NAME?                                             |
| libreoffice                           | (blank)                                            |

Note the legacy `TDIST`/`TINV` show hyperformula at reduced accuracy too: `=TDIST(1.812,10,1)` →
hyperformula `0.050037630918` vs `0.05003763103292367` (excel); `=TINV(0.05,10)` → hyperformula
`2.2281388425` vs `2.2281388519862744`. hyperformula's t-quantile / t-tail uses a coarser
approximation than the other engines — still correct to ~8 significant figures.

**Cause bucket:** `missing-function` (lattice `.2T` name not resolvable; surfaced as `#PARSE!`).

## Edges explored beyond the corpus

Confirmed live that hyperformula rejects `T.DIST`/`T.INV` (the non-`.RT`, non-`.2T` forms) with
`#NAME?` while accepting `T.DIST.RT`, `TDIST`, `TINV` — consistent with hyperformula implementing
the tail/inverse variants but not the plain left-tail cdf. ironcalc accepts every modern `T.*`
name including `.2T` but no legacy `TDIST`/`TINV`.

## Wiki-facing notes

- **`T.DIST.2T` and `T.INV.2T` do not work on lattice** (`#PARSE!`). A portable alternative for
  the two-tailed probability is `2 * T.DIST.RT(ABS(x), df)`, and for its inverse
  `T.INV(1 - p/2, df)` — both use names lattice can parse.
- On hyperformula, the two-tailed names _do_ work, but the plain `T.DIST(x,df,cumulative)` and
  `T.INV(p,df)` do **not** (`#NAME?`); use `T.DIST.RT`/`T.DIST.2T` or the legacy `TDIST`/`TINV`.
- hyperformula's `TDIST`/`TINV`/`T.INV.2T` results are correct to ~8 significant figures but not
  to full double precision — fine for display, flag if bit-exact reproducibility matters.

## Open questions

- The lattice `#PARSE!` needs confirmation and a fix from the lattice maintainer; it cannot be
  probed on Excel/gsheets (their recorded values are already the reference). Not an Excel/gsheets
  probe request — a lattice-side bug report.
