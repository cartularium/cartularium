# libreoffice recording gap — methodological note for the reconciler

**Batch:** math-core · **Applies to:** every fork in the math, operator, and parser work-lists · **Confidence:** high

## The observation

In the math, operator, and parser suites, the **libreoffice** fixture records a blank cell (`[[null]]`) for **every** case:

| suite    | libreoffice results | all `[[null]]`? |
| -------- | ------------------- | --------------- |
| math     | 65                  | yes (65/65)     |
| operator | 115                 | yes (115/115)   |
| parser   | 34                  | yes (34/34)     |

This is inconsistent with genuine LibreOffice evaluation — LibreOffice computes ABS, ROUND, MOD, CONVERT, comparison operators, etc. natively — so the uniform blank is a **recording-harness gap for these three suites**, not a LibreOffice semantic result. It is corroborated by the fact that libreoffice _does_ carry real, non-blank results in other suites (e.g. DV-0007 records libreoffice `#NAME?` for BITAND/… missing functions, DV-0051 records a libreoffice shape difference for FREQUENCY). So libreoffice was recorded meaningfully elsewhere; these suites specifically were not populated.

## Why it matters for reconciliation

- Roughly every fork in this batch has a `libreoffice = blank` branch. **Do not** treat these as evidence that "LibreOffice returns blank for SUM / UNIQUE / CONVERT / ...". They are the same artifact repeated.
- In `annotations.json`, the 36 math cases whose _only_ divergence is this blank are grouped under one annotation (cause `TODO`). For all other forks, the blank branch is mentioned in-line but the substantive mechanism (pycel operator artifact, missing functions, case-sensitivity, precision, boolean ordering) is the real story.
- The fix is a **fixture regeneration** for libreoffice on these suites, after which most of these forks should collapse to agreement. This is an assay data-hygiene task, not a portability finding.

## Wiki-facing notes

- Nothing should reach the wiki from the libreoffice-blank branch. LibreOffice compatibility claims for these functions need a real recording first.

## Open questions

- Why were libreoffice/math, /operator, /parser recorded as all-blank while other suites have real data? (harness/driver question — a human/assay-maintainer item, no live probe applies since LibreOffice cannot be run in this environment.)
