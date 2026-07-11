# math-longtail — batch summary

**Suite:** math-longtail · **Forks in work-list:** 116 (41 subjects) · **All 116 covered, 0 skipped.**

## Counts

- **Annotations written:** 9 (one per mechanism cluster; 116 refs scoped, 0 duplicates)
- **Work-list refs:** 116 covered / 0 skipped (`skipped.json` empty)
- **Notes files:** 6 — `ACOT-ACOTH.md`, `IMLN-IMPOWER-IMSQRT.md`, `pycel-name-error-artifact.md`, `libreoffice-blank-artifact.md`, `MUNIT-RAND-RANDBETWEEN.md`, `trig-hyperbolic-coverage.md`
- **Probe requests emitted:** 9 (Excel/Google Sheets ground-truth + 1 libreoffice re-record flag)
- **Live probes run:** all 116 formulas across the 4 pure engines (pycel, hyperformula, ironcalc, formulas) + 2 targeted pycel characterization probes. Live results matched the recorded fixtures exactly — fixtures are current.

## Headline findings

1. **LibreOffice blank is a recording artifact, not behaviour.** 114/116 forks have LibreOffice
   returning a blank cell — including `=SIN(0)`, `=GCD(12,18)`, `=COUNTIFS(...)`. The libreoffice
   fixture is 190/190 blank here, and arithmetic (6/6) and date (89/89) show the same all-blank
   pattern → the read-back failed for the whole run. This single artifact is the dominant fork
   driver (57 cases are forks _only_ because of it). Tagged `TODO`; needs a LibreOffice re-record.

2. **pycel `#NAME?` has three distinct roots** (live-confirmed) — the sentinel is misleading.
   (a) _Genuine missing function_: ACOT/ACOTH/COT/COTH/CSC/CSCH/SEC/SECH/SQRTPI/GAMMALN(.PRECISE)/
   IM-family/MUNIT/RAND/RANDBETWEEN. (b) _Domain error mis-attributed_: `=ACOS(2)`/`=ASIN(2)`/
   `=LN(0)` → `#NAME?` where others give `#NUM!`. (c) _Operator parse artifact_: the assay pycel
   driver returns `#NAME?` for **any** formula with an arithmetic operator — `=1+1`, `=-1`,
   `=SUM(-1,2)`, `=ACOS(-1)` all fail while `=SIN(1)`/`=SQRT(2)` succeed. Root (c) alone accounts
   for 19 refs. Consequence: a pycel `#NAME?` is not reliable evidence of missing coverage.

3. **The one genuine engine-semantics fork: ACOT negative-argument branch cut.** `=ACOT(-1)` →
   Excel/formulas/IronCalc/lattice = 3π/4 (range (0,π), Excel's documented convention) vs
   Google Sheets/HyperFormula = -π/4 (they compute `ATAN(1/x)`, range (-π/2,π/2)). Agree for x≥0,
   differ by π for x<0. The `ACOT.md` wiki page contradicts itself — its Notes claim range 0..π
   but its own sample table shows `ACOT(-4) = -0.245` (the gsheets branch). Flagged for wiki fix.

4. **Complex rendering (IMLN/IMPOWER/IMSQRT) is format-only divergence.** Same underlying value,
   different strings: Excel/gsheets/IronCalc ~15 sig figs vs formulas/HyperFormula/lattice full
   float64; `=IMPOWER("i",2)` (true value -1) renders **5 different ways** across engines
   (uppercase-E residue, lowercase-e, fixed-notation, or clean `-1`). IM-output strings aren't
   portable — use IMREAL/IMAGINARY instead of string-matching.

5. **Two coverage gaps + one engine bug.** HyperFormula lacks `ERFC.PRECISE` (has `ERFC`); MUNIT
   is absent in HyperFormula/IronCalc/pycel and its invalid-size error splits `#VALUE!`
   (excel/formulas/lattice) vs `#NUM!` (gsheets). The `formulas` engine returns a **non-integer**
   from `=RANDBETWEEN(1,10)` (3.535) — a genuine defect; all other engines return integers.

## Mechanism clusters (annotation scopes)

| Cluster                                         | refs | cause              |
| ----------------------------------------------- | ---- | ------------------ |
| libre-only (blank artifact only)                | 57   | TODO               |
| pycel operator-parse artifact                   | 19   | unimplemented-edge |
| pycel missing-function                          | 23   | missing-function   |
| pycel domain-error mis-attribution              | 2    | error-attribution  |
| ACOT branch cut                                 | 1    | arg-semantics      |
| ERFC.PRECISE missing (hyperformula+pycel)       | 2    | missing-function   |
| complex rendering (IM-family)                   | 9    | format-rendering   |
| MUNIT error codes                               | 1    | error-code         |
| RAND/RANDBETWEEN non-determinism + formulas bug | 2    | recalc-semantics   |

## What needs Excel / Google Sheets confirmation

9 probe requests in `probe-requests.json`:

- **ACOT branch cut** — `=ACOT(-0.5)`, `=ACOT(-100)`, `=ACOT(0)` baseline (`math-longtail-acot-branch`, `-branch-large`, `-zero`).
- **Complex rendering** — `=IMLN("2+3i")` digit count, `=IMPOWER("i",2)` residue form (`math-longtail-improper-complex-digits`, `-improper-i-residue`).
- **Contracts** — `=MUNIT(0)` error split, `=ISNUMBER(RANDBETWEEN(1,10))` integer contract (`math-longtail-munit-zero`, `-formulas-randbetween`).
- **Beyond corpus** — `=ACOTH(0.5)` domain error (`math-longtail-acoth-domain`).
- **LibreOffice re-record** flagged (`math-longtail-libre-rerun`) — not answerable by probe lanes; needs a harness pass.

## Skipped / limits

Nothing skipped. Excel/gsheets/lattice values grounded by present, current fixtures; probes seek
edges beyond the corpus. Within-class float-precision spread is documented as background in
`trig-hyperbolic-coverage.md` (matched-equal, not a fork).
