# The libreoffice blank-recording artifact (cross-cutting) — deep dive

**Batch:** text-regex · **Refs:** all 60 forks in this batch carry a libreoffice=blank branch · **Confidence:** high

## What this is

Every single fork in the text, text-longtail, and regex suites includes a libreoffice branch recording a **blank cell** (`[[null]]`). This is **not** LibreOffice Calc behavior — it is an empty/failed recording.

Evidence (counted directly from `packages/assay/fixtures/*/libreoffice.json`, generated 2026-05-11):

| suite         | total entries | entries with a non-blank result |
| ------------- | ------------- | ------------------------------- |
| text          | 37            | 0                               |
| text-longtail | 104           | 0                               |
| regex         | 21            | 0                               |

Every entry is `{"result": [[null]], "formula-as-evaluated": "..."}`. That includes formulas LibreOffice unquestionably supports and computes, e.g. `=CONCAT("hello"," world")`, `=LEN("Phoenix, AZ")`, `=UPPER("total")`, `=VALUE("42")`. A real LibreOffice run would return `"hello world"`, `11`, `"TOTAL"`, `42` — not blank. So the libreoffice recording for these three suites captured **no formula results at all** (a harness/export artifact — most likely a headless conversion or read step that dropped computed values).

## Consequence for the corpus

For **25 of my 60 refs** (the mainstream text functions and VALUE — see the `artifact-libreoffice-blank` annotation), libreoffice=blank is the **only** thing that makes the case a fork: all seven other engines agree on the correct value. These forks are therefore **spurious** — artifacts of the empty recording, not real cross-engine divergence.

For the remaining 35 refs there is a genuine divergence among the other engines _as well_, but the libreoffice branch is still an artifact and should not be read as a real LibreOffice result (in several cases the blank happens to coincide with Excel's blank class — e.g. REPT(…,0), ROMAN(0) — which could mislead a reconciler into thinking LibreOffice "agrees with Excel").

## Recommendation

- **Re-record the libreoffice fixtures** for text / text-longtail / regex (and likely other suites — worth an audit across the whole `fixtures/` tree for `[[null]]`-only libreoffice files).
- Until then, treat the libreoffice branch in these suites as **absent/unknown**, not as `blank`. The 25 artifact-only forks would collapse to non-forks (full agreement) once libreoffice is either fixed or excluded.

## Probe / follow-up

- **text-regex-005:** flagged for a human — re-run the LibreOffice driver on these suites and confirm it returns real values (or diagnose why the 2026-05-11 recording produced all-`[[null]]`).
