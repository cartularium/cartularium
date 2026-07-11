# IMLOG / IMCOTH / IMTANH — Google-Sheets-only complex functions — cross-engine deep dive

**Batch:** engineering · **Refs:** IMLOG/imlog-complex, IMLOG/imlog-natural-of-1, IMCOTH/imcoth-complex, IMCOTH/imcoth-real, IMTANH/imtanh-complex, IMTANH/imtanh-zero · **Confidence:** high

## Behavior summary

`IMLOG(value, base)`, `IMCOTH(number)` (hyperbolic cotangent of a complex number), and `IMTANH(number)` (hyperbolic tangent) are **Google Sheets extensions** to the complex-number function set. They are not part of Microsoft Excel's function library. Their sheets.wiki pages were imported from Google Sheets support documentation (support.google.com/docs), consistent with their gsheets-native origin. In the corpus, only **Google Sheets** and **Lattice** compute a value; everything else returns `#NAME?`.

## Divergences

### 1. Excel-absent → #NAME? on five engines

| formula           | excel / formulas / hyperformula / ironcalc / pycel | gsheets                                | lattice                                   | libreoffice |
| ----------------- | -------------------------------------------------- | -------------------------------------- | ----------------------------------------- | ----------- |
| `=IMLOG("1")`     | **#NAME?**                                         | "0"                                    | "0"                                       | _(blank)_   |
| `=IMLOG("3+4i")`  | **#NAME?**                                         | `0.698970004336019+0.402719196273373i` | `0.6989700043360187+0.4027191962733731i`  | _(blank)_   |
| `=IMCOTH("1")`    | **#NAME?**                                         | "1.31303528549933"                     | "1.3130352854993315"                      | _(blank)_   |
| `=IMCOTH("1+1i")` | **#NAME?**                                         | `0.868014142895925-0.217621561854403i` | `0.8680141428959249-0.21762156185440265i` | _(blank)_   |
| `=IMTANH("0")`    | **#NAME?**                                         | "0"                                    | "0"                                       | _(blank)_   |
| `=IMTANH("1+1i")` | **#NAME?**                                         | `1.08392332733869+0.271752585319512i`  | `1.0839233273386946+0.2717525853195117i`  | _(blank)_   |

Live probe confirms the `#NAME?` branch: HyperFormula, IronCalc, and formulas each return `#NAME?` for `IMLOG("1")`, `IMLOG("3+4i")`, `IMCOTH("1")`, `IMTANH("0")`, and `IMTANH("1+1i")`. pycel is `#NAME?` too (it lacks the whole IM-transcendental family). **Cause bucket: missing-function.**

Note the contrast with `IMLOG10`, `IMLOG2`, and `IMLN` (base-e), which **are** in Excel and which the JS/Rust engines implement — so `IMLOG` is specifically the general-base Google form. Excel users would write `IMLN`/`IMLOG10`/`IMLOG2` and lose the arbitrary-base convenience.

### 2. Where they do compute, gsheets and Lattice split on precision

The two implementing engines land in different rendering families (the same 15-digit-vs-full-double mechanism documented in `notes/IM-TRANSCENDENTAL.md`): Google Sheets renders 15 significant digits, Lattice renders full IEEE-754. So even the "supported" branch is a two-class fork for the complex-argument cases (`imcoth-complex`, `imtanh-complex`, `imlog-complex`). For the trivial cases (`IMLOG("1")`=0, `IMTANH("0")`=0) they agree on the short string "0".

### 3. LibreOffice blank (fixture artifact)

Systemic all-null 2026-05-11 engineering fixture; not a real result. (LibreOffice Calc does have `IMCOTH`/`IMTANH`/`IMLOG` via the Analysis add-in, so a fresh run should show values, not blanks.)

## Edges explored beyond the corpus

- Live: HyperFormula/IronCalc/formulas uniformly `#NAME?` for all three functions — no partial support, no alternate spelling accepted.
- The corpus only exercises single-argument `IMLOG`; the documented `IMLOG(value, base)` two-argument form is untested (probe `engineering-001`).

## Wiki-facing notes

- Flag prominently on the IMLOG, IMCOTH, and IMTANH pages: **Google Sheets and Lattice only; not available in Excel, HyperFormula, IronCalc, formulas, or pycel** (they return `#NAME?`). This is a portability landmine — a sheet using these functions will not open cleanly in Excel.
- Excel equivalents: `IMLOG` → use `IMLN`/`IMLOG10`/`IMLOG2` for base e/10/2; there is no built-in arbitrary-base complex log in Excel. `IMCOTH`/`IMTANH` have no Excel equivalent (would need `1/IMTANH`-style composition, which also doesn't exist).
- Where computed, the string result differs in precision between Google Sheets (15 sig figs) and Lattice (full double) — same caveat as the other complex functions.

## Open questions

- `engineering-001`: confirm `IMLOG("8", 2)` returns "3" on Google Sheets (two-arg base form) and `#NAME?` on Excel.
- `engineering-006`: confirm `IMTANH("0")` = "0" on Google Sheets and `#NAME?` on Excel (fixture already shows this; live re-confirmation of the Excel branch).
