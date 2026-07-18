---
tags:
  - datatype
  - number
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

Two spreadsheet engines can compute the same [[Number|number]] and still disagree on the digits they hand back. The disagreement is almost never in the arithmetic; it is in how many significant figures the engine **stores**, **renders**, or **captures** on read-back. Because these differences land in the last few digits, they are invisible in ordinary use and fatal to any cross-engine comparison that tests for exact equality.

### Significant-figure limits

Google Sheets stores a numeric result to at most **15 significant figures**. Excel does the same for the values it renders. The open engines split into two families:

- **Capped at 15 significant figures:** Google Sheets, Excel, IronCalc.
- **Full IEEE-754 double (16–17 significant figures):** HyperFormula, `formulas`, Lattice.

`=CONVERT(1, "m", "ft")` shows the split on a plain number. Google Sheets returns `3.28083989501312` (15 significant figures; live probe, 2026-07-11), while Excel exposes the full double `3.2808398950131235`. The conversion factor is identical — the engines diverge only at the 15th digit (assay: CONVERT/convert-meters-to-feet). An exact string comparison of these two "equal" results fails.

> [!INFO]
> A recorded Google Sheets `CONVERT` value of `3.280839895` (~9 decimals) is a read/serialization artifact — the formatted display value captured instead of the stored value — not the number Google Sheets actually holds. The live stored value carries 15 significant figures.

### Complex-number strings

The complex-number functions ([[IMCOS]], [[IMSIN]], [[IMEXP]], [[IMLOG2]], and the rest of the `IM` family) return their result as a **formatted [[String|string]]**, not a number. The formatter, not the math, decides the digits, and the same two families reappear:

| formula | Google Sheets / Excel / IronCalc (15-digit) | `formulas` / HyperFormula / Lattice (full) |
| --- | --- | --- |
| `=IMCOS("1+1i")` | `0.833730025131149-0.988897705762865i` | `0.8337300251311491-0.9888977057628651i` |
| `=IMSIN("1+1i")` | `1.29845758141598+0.634963914784736i` | `1.2984575814159773+0.6349639147847361i` |
| `=IMEXP("1")` | `2.71828182845905` | `2.718281828459045` |

(assay: IMCOS/imcos-complex, IMSIN/imsin-complex, IMEXP/imexp-real; live probe, 2026-07-11.)

Because the matcher compares these strings byte-for-byte, every rendering difference — down to the last unit in the last place — registers as a distinct result. The full-precision engines do not always even agree with each other: `=IMCOT("1+1i")` produces three different strings and `=IMCSC("1+1i")` produces four, all differing only in trailing digits, because the underlying libraries decompose the complex arithmetic differently and accumulate rounding differently (assay: IMCOT/imcot-complex, IMCSC/imcsc-complex).

A pure display artifact makes the point vivid: `=IMLOG2("8")` is mathematically exactly 3, and most engines print `"3"`, but `formulas` prints `"2.9999999999999996"` because it computes `ln(8)/ln(2)` in double precision, lands one unit low, and round-trips that raw double to text (assay: IMLOG2/imlog2-of-8; live probe, 2026-07-11).

### Display read-back

**Display read-back** is a distinct mechanism: an engine (or its driver) captures a value at its *formatted display precision* rather than at its full stored double, so the value looks divergent when only its rendering is. IronCalc exhibits this across the financial suites — it computes the same value as everyone else but reports fewer digits, and the number of digits it keeps varies with magnitude:

| formula | IronCalc (read-back) | full-precision peers |
| --- | --- | --- |
| `=PMT(0.06/12, 360, 0, 1000000)` | `-995.51` | `-995.505251527523` |
| `=CUMIPMT(0.05/12, 360, 100000, 1, 12, 0)` | `-4966.49` | `-4966.494130578189` |
| `=NPV(0.1, -1000, 300, 300, 300, 300, 300)` | `124.76` | `124.76002802048566` |
| `=IPMT(0.05/12, 360, 360, -200000)` | `4.454951228` | `4.454951228316506` |

(assay: IPMT/ipmt-last-period-mortgage; live probe, 2026-07-11.) An IronCalc-alone class that equals its peers to the precision IronCalc kept should be read as agreement at reduced precision, not as a computed divergence.

### Algorithmic precision offsets

A few functions diverge in the math itself, not just the rendering — but still far below any tolerance that matters. These are reproducible offsets, not floating-point dust.

The inverse-normal quantile functions ([[NORMINV]], [[NORMSINV]], [[NORM.INV]], [[NORM.S.INV]]) carry engine-specific approximations. For `p = 0.975` the Excel/`formulas` value is `1.9599639845400536`; Google Sheets returns `1.959963986120195`, an offset of order 1e-9 at the 9th significant figure, consistent across every inverse-normal case; HyperFormula returns a coarser `1.9599639845` (assay: NORM.S.INV/norm-s-inv-at-0-975, NORMSINV/normsinv-at-0-025; live probe, 2026-07-11). The offset propagates through round-trips: `=LOGINV(LOGNORMDIST(2,0,1),0,1)` yields Google Sheets `1.999999999701634` against `2.0000000000000004` elsewhere. `=GAMMA(0.5)` (= √π = `1.7724538509055159`) agrees everywhere except HyperFormula, which returns `1.7724538559` — off at the 8th significant figure and the least accurate engine for special/inverse functions generally (assay: GAMMA/gamma-at-0-5).

Iterative root-finders ([[IRR]], [[RATE]], [[MIRR]]) converge to slightly different roots, differing from Excel at the 1e-8 to 1e-11 level. A computed IRR "of zero" is especially treacherous: it reads back not as `0` but as assorted residuals — exact `0` in Google Sheets, `1.28e-17`, `2.93e-17`, up to Excel's `1.95e-12` (live probe, 2026-07-11). Treat `|IRR| < 1e-9` as zero.

### Comparing numbers across engines

The rule that follows from all of the above: **compare parsed numbers with a tolerance, never compare the rendered strings.** A consumer that string-compares or hashes numeric — and especially complex-string — results will see spurious mismatches wherever two engines agree on the value but not on the formatting. The tolerance must be generous enough to absorb the coarsest capture in play, which for IronCalc's display read-back can be as wide as two decimal places, and for the algorithmic offsets is order 1e-9.

### Engine compatibility

The portable core is the arithmetic itself: every implementing engine computes the same value to about 15 significant figures. What is *not* portable is the exact digit string, which depends on the engine's storage cap, its formatter, and — for the `IM` family — the fact that the result is a string in the first place.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Stores numbers to 15 significant figures; caps complex-string components at 15; carries a distinct inverse-normal approximation (~1e-9). |
| Excel | Renders numbers to 15 significant figures for display but exposes the full double for plain numbers; caps complex-string components at 15. |
| HyperFormula | Full-double complex strings; coarser special/inverse-function approximations (GAMMA, inverse-normal good to ~8 significant figures). |
| IronCalc | 15-significant-figure complex strings; captured at reduced display precision on read-back for many numeric results. |
| formulas | Full-double rendering throughout; occasional last-ULP string artifacts (`IMLOG2("8")` → `2.9999999999999996`). |
| Lattice | Full-double rendering family (per recorded fixtures). |

### See Also

- [[Number]] — the numeric data type.
- [[Type coercion]] — how values move between types.
- [[Error code portability]] — the parallel cross-engine story for error sentinels.
- [[Number Format Patterns]] — controlling displayed precision.
