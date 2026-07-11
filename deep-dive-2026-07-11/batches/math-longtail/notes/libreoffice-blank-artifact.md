# LibreOffice blank — a suite-wide recording artifact

**Batch:** math-longtail · **Refs:** the libreoffice branch of 114 of the 116 forks (all except RAND/RANDBETWEEN) · **Confidence:** high

## The observation

In **every** math-longtail fork except the two volatile ones (RAND, RANDBETWEEN), LibreOffice's
recorded outcome is a **blank cell** (`[[null]]`), while every other engine agrees on a real
computed value. This includes results that are not in any doubt:

| Formula                 | all other engines | libreoffice |
| ----------------------- | ----------------- | ----------- |
| `=SIN(0)`               | 0                 | `BLANK`     |
| `=COS(0)`               | 1                 | `BLANK`     |
| `=GCD(12,18)`           | 6                 | `BLANK`     |
| `=COUNTIFS(A1:A4,">2")` | 2                 | `BLANK`     |
| `=ISODD(3)`             | TRUE              | `BLANK`     |

## Why it is an artifact, not behaviour

LibreOffice Calc unquestionably computes `SIN(0)=0`. The blank is uniform across the entire suite,
and the same pattern appears in other suites' LibreOffice fixtures:

- `fixtures/math-longtail/libreoffice.json` — **190/190** results are `[[null]]`.
- `fixtures/arithmetic/libreoffice.json` — **6/6** null.
- `fixtures/date/libreoffice.json` — **89/89** null.

Each entry still carries a `formula-as-evaluated` field (e.g. `"=SIN(0)"`), so the harness _did_
enumerate the formulas but read back empty cells for the whole run — the signature of a failed
read-back / recalc step in the LibreOffice recording harness (a "written ≠ value-readable"
condition), not a computation that produced blanks.

Contrast: DV-0007 records LibreOffice returning genuine `#NAME?` for BITAND/CEILING.MATH/etc. in
other suites, so the LibreOffice lane _can_ record real values and errors — this specific
math-longtail (and arithmetic, date) run did not populate.

## Consequence for the forks

The libreoffice-blank branch is the **dominant fork driver** in this batch: on its own it turns
57 otherwise-unanimous cases into forks (the `libre-only` cluster), and it adds a spurious extra
class to nearly every other fork. Because it is an artifact, it should not be read as a LibreOffice
compatibility signal.

## Recommended action

Cause is tagged **TODO** (needs harness attention, not an engine explanation). The actionable fix
is a **LibreOffice re-record** of the math-longtail, arithmetic and date suites. This cannot be
done from the pure-engine or Excel/Google-Sheets probe lanes (LibreOffice is a recorded-only engine
here), so it is flagged for a human/harness pass rather than a probe. `generatedAt` on the current
fixture is 2026-05-11.

## Wiki-facing notes

None directly — this is an assay data-quality issue. But downstream compatibility feeds must
**exclude or quarantine** the LibreOffice column for these suites until re-recorded, or they will
report LibreOffice as failing basic math (SIN, COS, GCD, COUNTIFS), which is false.
