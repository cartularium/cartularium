# Inverse-normal precision & GAMMA — cross-engine deep dive

**Batch:** stat-distributions · **Refs:** NORMINV/norminv-at-0-95, NORMSINV/normsinv-at-0-025,
NORM.INV/norm-inv-at-0-975, NORM.S.INV/norm-s-inv-at-0-975, LOGINV/loginv-roundtrip,
LOGNORM.INV/lognorm-inv-roundtrip, NORM.INV/norm-inv-roundtrip, GAMMA/gamma-at-0-5 · **Confidence:** high

This note collects the cases where the interesting axis is _numerical precision_ rather than
coverage — the inverse-CDF quantile functions and GAMMA. In every case the engines agree on the
answer; they differ only in the last handful of significant digits, and the pattern is worth
recording because it identifies which engines carry a distinct (slightly less accurate) algorithm.

## The inverse-normal quantile: gsheets and hyperformula each carry a distinct approximation

`NORM.S.INV(p)` / `NORMSINV(p)` (and `NORM.INV` / `NORMINV`) invert the standard normal CDF. The
reference (excel, formulas) value for `p = 0.975` is `1.9599639845400536`. Two engines drift:

| formula              | excel / formulas    | gsheets                | hyperformula  | lattice            |
| -------------------- | ------------------- | ---------------------- | ------------- | ------------------ |
| `=NORM.S.INV(0.975)` | 1.9599639845400536  | **1.959963986120195**  | 1.9599639845  | 1.959963984539396  |
| `=NORMSINV(0.025)`   | −1.9599639845400538 | **−1.959963986120195** | −1.9599639845 | −1.959963984539396 |
| `=NORMINV(0.95,0,1)` | 1.6448536269514715  | **1.644853625133699**  | 1.644853627   | 1.6448536269514715 |

- **gsheets** diverges at the ~9th significant digit (`…986120195` vs `…9845400536`, a ~1.6e-9
  absolute gap). This is consistent across all inverse-normal cases and is gsheets using a
  different rational approximation for the normal quantile than Excel. It is _not_ ULP noise —
  it is a reproducible algorithmic offset of order 1e-9.
- **hyperformula** returns fewer digits and a small offset (`1.644853627` vs `1.6448536269514715`)
  — again a coarser approximation, ~1e-9.
- Downstream this shows up in round-trips: `=LOGINV(LOGNORMDIST(2,0,1),0,1)` gives gsheets
  `1.999999999701634` vs `2.0000000000000004` on excel/formulas/lattice — the ~3e-10 shortfall is
  the gsheets inverse-normal offset propagating through the lognormal round-trip. Same for
  `NORM.INV/norm-inv-roundtrip` (lattice lands `1.5000000013626391`, a ~1.4e-9 round-trip residual).

All of these are far below any tolerance that matters for statistics; they are catalogued as
`precision` divergences, not correctness issues. (Coverage on these same refs still forks the usual
way: ironcalc/pycel `#NAME?` on the legacy `NORMINV`/`NORMSINV`/`LOGINV`; libreoffice blank.)

## GAMMA — pycel's one implemented function, and hyperformula's least-accurate result

`=GAMMA(0.5)` = √π ≈ `1.7724538509055159`.

| engine                                                      | result                                                    | note                                                               |
| ----------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| excel / formulas / gsheets / ironcalc / lattice / **pycel** | 1.7724538509055159 (± ULP; lattice records `1.772453851`) | agree to ~1e-15                                                    |
| **hyperformula**                                            | **1.7724538559**                                          | off in the 8th significant digit (~5e-9 absolute) — least accurate |
| libreoffice                                                 | (blank)                                                   | recording gap                                                      |

Two things make this case notable:

1. **pycel implements `GAMMA`** even though it implements _none_ of the rest of the distribution
   family (everything else in this batch is `#NAME?` on pycel). Confirmed live:
   `=GAMMA(0.5)` → `1.7724538509055159` on pycel.
2. **hyperformula's `GAMMA` is the least accurate engine** here (`…8559` vs `…8509`), the same
   coarse-approximation signature seen in its inverse-normal and t-quantile results.

DV-0225 already records a gsheets/lattice `GAMMA` precision divergence on a _different_ argument
(`GAMMA(5)`), so this extends an established GAMMA precision story to the `GAMMA(0.5)` case and
adds the hyperformula/pycel observations.

## Wiki-facing notes

- **Do not expect bit-exact inverse-normal results across engines.** gsheets and hyperformula each
  carry a normal-quantile approximation that differs from Excel at the ~1e-9 level; round-trips
  through `LOGINV`/`LOGNORM.INV`/`NORM.INV` inherit the offset. Compare with a tolerance.
- hyperformula is consistently the lowest-precision engine for special/inverse functions
  (`GAMMA`, `NORMINV`, `TINV`, `FINV`) — good to ~8 significant figures, not to full double.
- pycel supports `GAMMA` but not the `.DIST`/`.INV` distribution family.

## Open questions

- Whether gsheets' inverse-normal offset is stable across time (Google updates silently) — a
  low-priority re-confirmation, see probe request `stat-distributions-004`.
