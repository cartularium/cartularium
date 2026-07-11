# Statistical distribution functions — coverage & error-code landscape

**Batch:** stat-distributions · **Refs:** the bulk of the batch (clusters A–E, ~86 refs across
BETA.DIST/BETADIST, BINOM.DIST/BINOMDIST, CHISQ.DIST(.RT)/CHIDIST, CHISQ.INV(.RT)/CHIINV,
EXPON.DIST/EXPONDIST, F.DIST(.RT)/FDIST, F.INV(.RT)/FINV, GAMMA.DIST/GAMMADIST, GAMMA.INV/GAMMAINV,
HYPGEOM.DIST/HYPGEOMDIST, LOGNORM.DIST/LOGNORMDIST, LOGNORM.INV/LOGINV, NEGBINOM.DIST/NEGBINOMDIST,
NORM.DIST/NORMDIST, NORM.S.DIST, NORM.INV/NORMINV, NORM.S.INV/NORMSINV/NORMSDIST, POISSON.DIST/POISSON,
T.DIST(.RT)/TDIST, T.INV/TINV, WEIBULL.DIST/WEIBULL, CONFIDENCE.NORM, FISHER, GAUSS, PHI, BETA.INV/BETAINV)
· **Confidence:** high

## Behavior summary

For every function in this suite the engines that implement it **agree on the value** — the
distribution math itself is portable. The corpus forks are almost entirely a _coverage_ map: which
engine registers which function name, and how absence is surfaced. There are two naming eras:

- **Modern (2010+) dotted names:** `NORM.DIST`, `BETA.DIST`, `CHISQ.DIST.RT`, `T.INV.2T`, etc.
- **Legacy (pre-2010) dotless aliases:** `NORMDIST`, `BETADIST`, `CHIDIST`, `TINV`, etc.

The numeric agreement classes that appear inside each fork are floating-point last-place rounding
(relative gaps ≤ ~1e-9) plus reduced-precision _recording_ by some engines (lattice frequently
records ~9–10 significant digits, e.g. `0.050000589` for `0.05000058909139811`; ironcalc similar).
None of that is semantic disagreement.

## Divergences — the coverage matrix

Confirmed live on the pure-engine harness (`scratch/stat-distributions-probe1.mts`):

| engine                | modern dotted names                   | legacy dotless aliases | how absence shows                               |
| --------------------- | ------------------------------------- | ---------------------- | ----------------------------------------------- |
| **excel**             | all                                   | all                    | —                                               |
| **formulas** (JS lib) | all                                   | all                    | — (full coverage of both eras)                  |
| **gsheets**           | all                                   | all                    | —                                               |
| **lattice**           | all **except** `T.DIST.2T`/`T.INV.2T` | all                    | `#PARSE!` for the `.2T` names (see T-DIST note) |
| **ironcalc**          | all                                   | **none**               | `#NAME?` on every legacy alias                  |
| **hyperformula**      | **partial**                           | **partial**            | `#NAME?` or `#N/A` (see below)                  |
| **pycel**             | none (except `GAMMA`)                 | none                   | `#NAME?`                                        |
| **libreoffice**       | (blank across the whole suite)        | (blank)                | recording/harness gap, not engine behavior      |

### ironcalc: modern-only

ironcalc implements the modern dotted names but **none of the legacy aliases**. Live:
`=BETA.DIST(0.5,2,2,TRUE,0,1)` → `0.5`, but `=BETADIST(0.5,2,2)` → `#NAME?`;
`=NORM.DIST(1,0,1,TRUE)` → `0.841344746`, but `=NORMDIST(...)` → `#NAME?`. This drives clusters C,
D, E on the ironcalc branch. Portability implication: **on ironcalc you must use the modern name.**

### hyperformula: patchy coverage across both eras + a #N/A / #NUM! quirk

hyperformula is the most irregular. It implements:

- Modern: the right-tail/inverse family and a few specials — `CHISQ.DIST.RT`, `CHISQ.INV.RT`,
  `CHISQ.INV`, `F.DIST.RT`, `F.INV.RT`, `F.INV`, `BETA.INV`, `CONFIDENCE.NORM`, `GAMMA.INV`,
  `GAUSS`, `PHI`, `FISHER`, `NORM.INV`, `NORM.S.INV`, `T.DIST.RT`, `T.DIST.2T`, `T.INV.2T`.
- Modern it LACKS (`#NAME?`): the pdf/cdf `.DIST` bodies and discrete distributions —
  `BETA.DIST`, `BINOM.DIST`, `CHISQ.DIST`, `EXPON.DIST`, `F.DIST`, `GAMMA.DIST`, `HYPGEOM.DIST`,
  `LOGNORM.DIST`, `LOGNORM.INV`, `NEGBINOM.DIST`, `NORM.DIST`, `NORM.S.DIST`, `POISSON.DIST`,
  `T.DIST`, `T.INV`, `WEIBULL.DIST`.
- Legacy it HAS: `BETAINV`, `CHIDIST`, `CHIINV`, `FDIST`, `FINV`, `GAMMAINV`, `NORMINV`,
  `NORMSINV`, `TDIST`, `TINV`.
- Legacy it LACKS with plain `#NAME?`: `BINOMDIST`, `EXPONDIST`, `GAMMADIST`, `NORMDIST`,
  `POISSON`, `WEIBULL`.
- **Legacy it LACKS but reports `#N/A` (not `#NAME?`):** `BETADIST`, `HYPGEOMDIST`,
  `LOGNORMDIST`, `NEGBINOMDIST`, `NORMSDIST`, `LOGINV`. These names are _registered_ in
  hyperformula's grammar but have no working implementation, so evaluation reaches the function
  and returns `#N/A` rather than failing name resolution. This is the distinguishing feature of
  annotation cluster E, and it extends DV-0072 (same behavior recorded there for other test cases).
- **Special sub-case — `#NUM!`:** `=BETADIST(5,2,3,0,10)` (BETADIST with explicit lower/upper
  bounds) returns `#NUM!` on hyperformula, not `#N/A`. hyperformula evaluates the 5-argument form
  and rejects it numerically. Confirmed live.

### pycel: whole family absent except GAMMA

pycel returns `#NAME?` for every function here except `=GAMMA(0.5)`, which it computes
(`1.7724538509055159`). See the GAMMA/precision note.

### libreoffice: suite-wide blank = recording gap

libreoffice recorded a **blank cell for all 106 cases**. libreoffice is a mature engine that
certainly implements `NORM.DIST` et al., and a sibling `CHISQ.TEST` case in DV-0004 shows
libreoffice emitting `#NAME?` (not blank) — so the blank is a gap in _this suite's libreoffice
fixture recording_, not an engine result. Treat libreoffice's branch here as "unrecorded", and
re-run the libreoffice driver over `statistical-distributions` to repopulate it.

## Wiki-facing notes

- **Value math is portable; names are not.** When authoring for cross-engine use, prefer the
  modern dotted names (`NORM.DIST`, `BETA.DIST`, …): ironcalc requires them, and gsheets/Excel
  accept both. But note hyperformula's modern coverage is _incomplete_ — it has the `.RT`/`.INV`
  variants but not the plain `.DIST` bodies — so neither era is universally safe on hyperformula.
- **hyperformula is the weakest engine for this family.** For pdf/cdf evaluation
  (`NORM.DIST`, `BETA.DIST`, `POISSON.DIST`, `WEIBULL.DIST`, …) hyperformula returns an error.
  Applications targeting hyperformula should not rely on the distribution `.DIST` family.
- A `#N/A` from hyperformula on a distribution name (e.g. `BETADIST`) means "recognized-but-not-
  implemented", not a data/lookup error — a debugging gotcha worth documenting.
- Every function in this batch is unavailable in pycel (except `GAMMA`).

## Open questions

- The libreoffice fixture for `statistical-distributions` needs re-recording (currently all
  blank). Its real behavior for these legacy names (`#NAME?` per DV-0004, or computed?) should be
  captured directly, not inferred.
- hyperformula's `#N/A`-vs-`#NAME?` split among legacy names is a hyperformula internal-registry
  fact; worth confirming it is stable across hyperformula versions (possible version-skew).
