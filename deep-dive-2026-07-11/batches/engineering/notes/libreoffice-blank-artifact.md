# LibreOffice blank across the engineering suite — recording artifact (cross-cutting)

**Batch:** engineering · **Scope:** every fork in the engineering work-list has LibreOffice as a lone class returning a blank cell · **Confidence:** high

## Finding

The 2026-05-11 LibreOffice engineering fixture (`fixtures/engineering/libreoffice.json`) records a blank (`null`) result for **all 147** engineering cases — verified by counting: 147 results, 0 non-null. This is not a semantic result. LibreOffice Calc supports the full engineering function family (base conversions, ERF/ERF.PRECISE, and the IM\* complex functions, mostly via its Analysis add-in), so a uniform blank across the entire suite is a harness/recording failure — the LibreOffice runner emitted empty cells for that whole generation pass.

## Why we are confident it is an artifact, not real behavior

1. **Uniformity.** A real engine does not return blank for _every_ function in a category, including trivially-supported ones like `BIN2DEC("0")`=0 and `DEC2HEX(255)`="FF". Genuine unsupported-function behavior in LibreOffice is `#NAME?`; genuine domain errors are `#VALUE!`.
2. **Earlier fixtures had real output.** `DV-0008` (seeded 2026-04-25) records LibreOffice returning `#VALUE!` for domain-error base-conversion cases (`bin2dec-too-long`, `dec2bin-out-of-range`, …), and `DV-0017` records LibreOffice returning `#NAME?` for `ERF.PRECISE`. So LibreOffice's harness _did_ produce real values and error codes for these subjects before the 2026-05-11 regen; the all-blank state is a regression in that specific run.
3. **Cause bucket.** Recorded as `version-skew` in the annotations — the fixture diverges from both its own earlier recording and the engine's real behavior.

## Consequence for the annotations

Because LibreOffice is its own agreement class in essentially every engineering fork, it inflates the fork count. Each engineering annotation notes the LibreOffice-blank branch as an artifact rather than describing it as a semantic divergence. The substantive cross-engine stories in this batch (pycel negative-domain rejection, the transcendental-IM precision split, the Excel-absent IMLOG/IMCOTH/IMTANH family, the IMDIV error-code split, ERF/ERF.PRECISE support gaps) are all independent of the LibreOffice issue.

## What to do

- **Harness action (not a live probe):** re-run the LibreOffice engineering suite to replace the all-blank fixture. LibreOffice is not one of the four live-probeable pure engines in this workflow, so this cannot be resolved from the analyst side.
- **Wiki caution:** do not infer "LibreOffice does not support function X" from the current engineering corpus. That conclusion would be wrong for the entire suite.
- If the reconciling pass wants a single fork-suppression rule: "LibreOffice == blank AND all other engines form a single non-blank class" is almost certainly the artifact and can be down-weighted pending a re-run.
