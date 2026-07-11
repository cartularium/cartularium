# REGEXEXTRACT / REGEXREPLACE — cross-engine deep dive

**Batch:** text-regex · **Refs:** all 19 regex forks (10 REGEXEXTRACT, 9 REGEXREPLACE) · **Confidence:** high

## Behavior summary

`REGEXEXTRACT(text, pattern)` returns the first regex match; `REGEXREPLACE(text, pattern, replacement)` globally replaces every match. These are **Google Sheets functions** that Microsoft added to Excel (Microsoft 365, rolled out 2024). Only **excel, gsheets, lattice, and (for REGEXREPLACE only) formulas** implement them at all. Support is the dominant story: three of the eight engines lack them entirely.

Engine support matrix (from live probe + recorded fixtures):

| Engine       | REGEXEXTRACT                 | REGEXREPLACE                      |
| ------------ | ---------------------------- | --------------------------------- |
| excel        | yes (full-match default)     | yes (with backrefs)               |
| gsheets      | yes (returns capture groups) | yes (with backrefs)               |
| lattice      | yes (returns capture groups) | yes (with backrefs)               |
| formulas     | **no** → blank cell          | yes, but **no backref expansion** |
| hyperformula | no → `#NAME?`                | no → `#NAME?`                     |
| ironcalc     | no → `#NAME?`                | no → `#NAME?`                     |
| pycel        | no → `#NAME?`                | no → `#NAME?`                     |
| libreoffice  | (blank — recording artifact) | (blank — recording artifact)      |

The hyperformula/ironcalc/pycel `#NAME?` and the formulas blank/backref behaviors were all **confirmed live** (`scratch/text-regex-probe1.mts`).

## Divergences

### 1. Capture groups: Excel returns the full match; Google/lattice return the groups

This is the sharpest real semantic divergence. `REGEXEXTRACT(text, pattern)` with parenthesized groups:

| Formula                                                 | excel          | gsheets / lattice          | formulas | hyperformula/ironcalc/pycel |
| ------------------------------------------------------- | -------------- | -------------------------- | -------- | --------------------------- |
| `=REGEXEXTRACT("2025-03-01","(\d{4})-(\d{2})-(\d{2})")` | `"2025-03-01"` | spill `["2025","03","01"]` | blank    | `#NAME?`                    |
| `=REGEXEXTRACT("Price: $100","\$(\d+)")`                | `"$100"`       | `"100"`                    | blank    | `#NAME?`                    |
| `=REGEXEXTRACT("foo bar baz","(\w+)\s+(\w+)")`          | `"foo bar"`    | spill `["foo","bar"]`      | blank    | `#NAME?`                    |

**Mechanism (arg-semantics):** Excel's `REGEXEXTRACT` returns the **entire match** by default and ignores capture-group parentheses; it exposes group extraction only through its optional third `return_mode` argument. Google Sheets (and lattice, which follows Google semantics) return the **capture groups by default**, spilling multiple groups into a horizontal array. When a pattern has no groups, or the single group equals the full match, the two families coincide — which is why the other 7 REGEXEXTRACT cases below agree.

### 2. Cases where the three implementers agree (fork = non-implementers only)

For patterns with no groups (or group == full match) and for no-match cases, excel/gsheets/lattice agree; the fork is purely formulas-blank + hyperformula/ironcalc/pycel `#NAME?` + libreoffice artifact:

| Formula                                      | excel/gsheets/lattice |
| -------------------------------------------- | --------------------- |
| `=REGEXEXTRACT("Hello World","(?i)(\w+)")`   | `"Hello"`             |
| `=REGEXEXTRACT("one 1 two 2 three 3","\d+")` | `"1"` (first match)   |
| `=REGEXEXTRACT("Price: $100","\$\d+")`       | `"$100"`              |
| `=REGEXEXTRACT("abc 123 def","\d+")`         | `"123"`               |
| `=REGEXEXTRACT("résumé template","résumé")`  | `"résumé"`            |
| `=REGEXEXTRACT("","\d+")`                    | `#N/A` (no match)     |
| `=REGEXEXTRACT("hello","\d+")`               | `#N/A` (no match)     |

The inline `(?i)` case-insensitivity flag and non-ASCII literals are handled uniformly.

### 3. REGEXREPLACE backreferences: formulas does not expand `$N`

| Formula                                                      | excel/gsheets/lattice | formulas (live)         |
| ------------------------------------------------------------ | --------------------- | ----------------------- |
| `=REGEXREPLACE("2025-03-01","(\d+)-(\d+)-(\d+)","$3/$2/$1")` | `"01/03/2025"`        | `"$3/$2/$1"` (literal)  |
| `=REGEXREPLACE("John Smith","(\w+) (\w+)","$2, $1")`         | `"Smith, John"`       | `"$2, $1"` (literal)    |
| `=REGEXREPLACE("hello world","(\w+)","[$1]")`                | `"[hello] [world]"`   | `"[$1] [$1]"` (literal) |

**Mechanism (arg-semantics):** formulas _does_ run the pattern match and global replacement — the `"[$1] [$1]"` output proves it found both word matches and applied the replacement template twice — but it inserts the replacement string **literally**, never substituting the captured group for `$1`/`$2`/`$3`. This is a replacement-string parsing gap, not a missing function.

### 4. REGEXREPLACE non-backref cases agree across four engines

`REGEXREPLACE("a1b2c3","\d","x")="axbxcx"`, `REGEXREPLACE("Hello WORLD hello","(?i)hello","hi")="hi WORLD hi"`, `REGEXREPLACE("aabbaa","a+","x")="xbbx"`, `REGEXREPLACE("hello","\d+","x")="hello"` (unchanged), `REGEXREPLACE("hello world","\s+","-")="hello-world"` — all identical across excel/formulas/gsheets/lattice. Only hyperformula/ironcalc/pycel (`#NAME?`) and libreoffice (artifact) diverge.

### 5. Empty input: `REGEXREPLACE("","\d+","x")` — blank vs empty string

excel/formulas/libreoffice return a **blank cell**; gsheets/lattice return an **empty string `""`**; hyperformula/ironcalc/pycel `#NAME?`. (formulas `[[null]]` confirmed live.) This is the same empty-string-vs-blank-cell distinction seen in REPT/ASC/ROMAN (see `EMPTY-AND-ZERO-EDGES.md`).

## Edges explored beyond the corpus

Live probe on hyperformula/ironcalc/formulas/pycel confirmed:

- All three of hyperformula/ironcalc/pycel emit `#NAME?` for every REGEXEXTRACT and REGEXREPLACE input — a flat missing-function signature, no partial support.
- formulas: `REGEXEXTRACT(...)` → `[[null]]` (blank / untouched cell) for every input tried, including no-match; it genuinely has no REGEXEXTRACT. `REGEXREPLACE(...)` works for literal replacements and global matching but never expands `$N`.

## Wiki-facing notes

- **Portability warning:** `REGEXEXTRACT`/`REGEXREPLACE` are **not portable** to hyperformula, ironcalc, or pycel (they error with `#NAME?`). A workbook relying on them is Excel/Google/lattice-only.
- **Capture-group trap:** the same `REGEXEXTRACT` formula with capture groups returns _different things_ in Excel vs Google Sheets — Excel gives the whole match, Google gives the group(s). Migrating a sheet either direction silently changes results. To get capture groups in Excel, use the `return_mode` argument; to get the full match in Google, avoid groups (use a non-capturing pattern or wrap nothing).
- **formulas (the Python lib) caveat:** it supports `REGEXREPLACE` but **silently leaves `$1`/`$2` backreferences unexpanded**, so date-reformat / name-swap idioms produce literal `$N` text rather than erroring — an easy-to-miss failure.
- The inline `(?i)` case-insensitivity flag is honored by all four implementers.

## Open questions

- **text-regex-001:** Confirm on live Excel that `REGEXEXTRACT` with `return_mode` = 1 returns all matches and = 2 returns capture groups, and that the default (omitted / 0) is the full match — to nail down the exact arg-semantics behind the Excel-vs-Google split.
- Whether lattice's capture-group spill orientation (horizontal) matches Google Sheets exactly for >3 groups (recorded corpus only covers up to 3).
