# BIN2DEC / BIN2HEX / BIN2OCT / DEC2BIN / DEC2HEX / DEC2OCT / HEX2BIN / HEX2DEC / HEX2OCT / OCT2BIN / OCT2DEC / OCT2HEX — cross-engine deep dive

**Batch:** engineering · **Refs:** all BIN2*, DEC2*, HEX2*, OCT2* forks in the work-list (43 refs across the 12 base-conversion functions) · **Confidence:** high

## Behavior summary

The twelve base-conversion functions convert between binary, octal, decimal, and hexadecimal string representations of a signed integer. All engines that compute a result agree on the arithmetic, including the signed two's-complement convention: the operand is a fixed-width signed field (10 binary digits, 10 octal digits, or 10 hex digits), the most significant bit is the sign bit, and negative numbers are the two's-complement fill. Concretely, across Excel, Google Sheets, HyperFormula, IronCalc, Lattice, formulas, and (for non-negative inputs) pycel:

- `BIN2DEC("1111111111")` = -1, `BIN2DEC("1111111110")` = -2 (two's complement)
- `DEC2OCT(-1)` = "7777777777", `DEC2HEX(-1)` = "FFFFFFFFFF", `DEC2BIN(-2)` = "1111111110"
- `HEX2DEC("FFFFFFFFFF")` = -1, `OCT2DEC("7777777777")` = -1
- Places padding: `DEC2BIN(10, 8)` = "00001010", `OCT2HEX("17", 4)` = "000F"

The corpus forks here are **not** disagreements about these values. Every fork is produced by one or two engines that step outside the computing consensus, described below.

## Divergences

### 1. LibreOffice blank across the entire suite (recording artifact)

Every base-conversion case in the work-list has LibreOffice as a lone agreement class returning a blank cell. This is systemic: **all 147 results in the 2026-05-11 LibreOffice engineering fixture are `null`.** LibreOffice Calc supports these functions (they are standard ODF/Analysis-ToolPak functions), and earlier LibreOffice fixtures returned real output — `DV-0008` records LibreOffice returning `#VALUE!` for domain-error base-conversion cases (`bin2dec-too-long`, `dec2bin-out-of-range`, etc.) as of 2026-04-25. So the uniform blank is a harness/recording regression in the 2026-05-11 run, not a semantic result. **Cause bucket: version-skew.**

| formula                  | excel / gsheets / hyperformula / ironcalc / lattice / formulas / pycel | libreoffice |
| ------------------------ | ---------------------------------------------------------------------- | ----------- |
| `=BIN2DEC("1010")`       | 10                                                                     | _(blank)_   |
| `=DEC2OCT(-1)`           | "7777777777"                                                           | _(blank)_   |
| `=HEX2DEC("FFFFFFFFFF")` | -1                                                                     | _(blank)_   |

### 2. pycel rejects negative arguments to DEC2\* and ERF (#NAME?)

pycel implements `DEC2BIN`/`DEC2HEX`/`DEC2OCT` only over the non-negative domain. A negative argument raises inside its Python implementation and the runner maps that to `#NAME?`. This is a within-function split, confirmed live on the pure pycel driver:

| formula         | pycel      | all other computing engines |
| --------------- | ---------- | --------------------------- |
| `=DEC2BIN(10)`  | "1010"     | "1010"                      |
| `=DEC2BIN(-2)`  | **#NAME?** | "1111111110"                |
| `=DEC2HEX(255)` | "FF"       | "FF"                        |
| `=DEC2HEX(-1)`  | **#NAME?** | "FFFFFFFFFF"                |
| `=DEC2OCT(8)`   | "10"       | "10"                        |
| `=DEC2OCT(-1)`  | **#NAME?** | "7777777777"                |

The `BIN2*`, `HEX2*`, and `OCT2*` directions do **not** show this — pycel returns the correct two's-complement value there (e.g. `HEX2DEC("FFFFFFFFFF")` = -1, `BIN2DEC("1111111111")` = -1) because the _input_ string already encodes the sign and no negative numeric argument is passed. The rejection is specifically about a **negative numeric first argument** to a DEC2-style converter. **Cause bucket: unimplemented-edge.** Note this is the same mechanism as pycel's rejection of `ERF(-1)` — see `notes/ERF.md`.

## Edges explored beyond the corpus

Live pure-engine probe (`scratch/engineering-probe1.mts`) over HyperFormula, IronCalc, formulas, and pycel:

- HyperFormula, IronCalc, and formulas all compute `DEC2BIN(-2)`="1111111110", `DEC2OCT(-1)`="7777777777", `DEC2HEX(-1)`="FFFFFFFFFF" — confirming the negative two's-complement forms are portable across the JS/Rust engines.
- pycel: `DEC2BIN(-2)`, `DEC2HEX(-1)`, `DEC2OCT(-1)` all `#NAME?`; the non-negative calls succeed. The negative-domain rejection is reproducible and isolated to pycel.

## Wiki-facing notes

- The signed two's-complement behavior (10-digit fixed field, MSB = sign bit) is **fully portable** across Excel, Google Sheets, and the open engines. The wiki pages can state the `-512..511` (BIN), `-2^39..2^39-1` (HEX/OCT 10-digit) ranges as universal.
- Portability caveat for pycel consumers: `DEC2BIN`/`DEC2HEX`/`DEC2OCT` do not accept negative arguments on pycel (returns `#NAME?`). The reverse conversions (`BIN2DEC`, etc.) with a two's-complement string are fine.
- The places/padding second argument (`DEC2BIN(10, 8)`="00001010") is portable for non-negative results. For a negative result the two's-complement form already fills the field; whether the padding argument is ignored on Excel/gsheets is pending probe `engineering-004`.
- LibreOffice compatibility for these functions is real; do not infer "LibreOffice does not support BIN2DEC" from the assay corpus — that is a stale fixture.

## Open questions

- LibreOffice needs a fresh engineering-suite run to replace the all-blank 2026-05-11 fixture (harness issue, not a probe request — LibreOffice is not a live-probeable pure engine here).
- `engineering-004`: does Excel/gsheets ignore the places argument for a negative `DEC2HEX(-1, 4)`?
