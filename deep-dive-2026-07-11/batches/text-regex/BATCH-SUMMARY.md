# Batch text-regex — summary

**Suites:** text (23), text-longtail (18), regex (19) = **60 uncovered forks**, all covered.

## Counts

- **Annotations written:** 13 mechanism clusters.
- **Work-list refs covered:** 60 / 60 (verified: each ref in exactly one annotation scope, no gaps, no duplicates).
- **Refs skipped:** 0.
- **Notes files:** 6 — `REGEXEXTRACT-REGEXREPLACE.md`, `DBCS-BYTE-FUNCTIONS.md`, `EMPTY-AND-ZERO-EDGES.md`, `DOLLAR-FIXED.md`, `libreoffice-blank-artifact.md`, `CORE-TEXT-FUNCTIONS.md`.
- **Probe requests emitted:** 6 (`text-regex-001`..`006`) — all for excel/gsheets/libreoffice ground truth not runnable here.
- **Live probe:** 1 script (`packages/assay/scratch/text-regex-probe1.mts`), 26 formulas × 4 pure engines (hyperformula, ironcalc, formulas, pycel).

## Headline findings

1. **The libreoffice branch is a recording artifact, not behavior.** Every entry in `fixtures/{text,text-longtail,regex}/libreoffice.json` (37+104+21) is `[[null]]`, including `=CONCAT("hello"," world")`. So **25 of 60 forks are spurious** — all seven other engines agree on the correct value; only libreoffice's empty recording makes them forks. These collapse to non-forks once libreoffice is re-recorded (probe text-regex-005). The other 35 carry a real divergence _plus_ this artifact. Cause `TODO`.
2. **REGEXEXTRACT capture-group semantics genuinely diverge Excel vs Google.** Excel returns the **full match** and ignores capture groups by default (groups via its `return_mode` arg); gsheets + lattice return the **capture groups** as a spilled array. Same formula, different result on migration — the sharpest portability trap here. Cause `arg-semantics`.
3. **REGEX\* support is narrow.** hyperformula/ironcalc/pycel implement neither REGEXEXTRACT nor REGEXREPLACE (`#NAME?`, live-confirmed). `formulas` implements REGEXREPLACE but **not** REGEXEXTRACT (blank), and **leaves `$N` backreferences unexpanded** (`"$3/$2/$1"` literal, live-confirmed).
4. **The DBCS `*B` family is locale-dependent and messy.** excel/formulas count each char as 1 unit (Western locale); lattice always counts CJK as 2 bytes; **gsheets is internally inconsistent** — 2-byte for LENB/LEFTB/RIGHTB/FINDB/SEARCHB but 1-unit for MIDB/REPLACEB. hf/ic/pycel lack the family. Cause `locale` (medium confidence on the gsheets inconsistency).
5. **Format-rendering splits:** `DOLLAR(-1234.5,2)` renders negatives three ways — Excel `($1,234.50)`, gsheets `-$1,234.50`, lattice `$-1,234.50`. `FIXED(1234.567,-1)` — lattice appends a spurious `.0` (`"1,230.0"` vs `"1,230"`).
6. **pycel's `#NAME?` is overloaded:** it means both "function missing" _and_ "argument error in an implemented function" — e.g. `MID("Romain",1,-1)` → pycel `#NAME?` while every other engine gives `#VALUE!`, though pycel implements MID. Cause `error-attribution`.
7. **Core text functions are fully portable.** CONCATENATE, FIND (case-sensitive), LEFT/RIGHT/MID (incl. count-past-end clamp, default count 1), LEN, LOWER/UPPER, SUBSTITUTE (all + nth), VALUE — identical across all seven recording engines.

## Cause-bucket distribution

TODO 1 (25 refs) · missing-function 3 · arg-semantics 2 · format-rendering 2 · null-vs-zero 1 · error-code 1 · error-attribution 1 · unimplemented-edge 1 · locale 1.

## What needs excel / gsheets (or libreoffice) confirmation

- **text-regex-001** (excel): REGEXEXTRACT `return_mode` behavior — default = full match, `,2` = capture groups; and gsheets returns groups by default. Grounds the #2 finding.
- **text-regex-002** (excel): the `*B` family collapses to single-unit on a Western-locale Excel (confirms the recording-locale assumption behind #4).
- **text-regex-003** (gsheets): the surprising MIDB/REPLACEB (char-based) vs LENB/FINDB (byte-based) inconsistency — verify not a fixture transcription error (only medium-confidence claim).
- **text-regex-004** (excel/gsheets): CHAR(0) error codes `#VALUE!` vs `#NUM!`.
- **text-regex-005** (libreoffice): re-record — real LibreOffice returns real values, not blank. Highest leverage; affects all 60 refs here and likely other suites.
- **text-regex-006** (excel/gsheets): DOLLAR negative rendering and whether it is locale/currency-format sensitive.

## Confidence

High on everything reproducible on pure engines (all `#NAME?` / formulas-backref / empty-vs-blank claims live-confirmed). Medium only on the gsheets DBCS inconsistency (recorded-fixture-only). All excel/gsheets values are recorded-fixture-derived; the 6 probe requests target the claims that most benefit from live confirmation.
