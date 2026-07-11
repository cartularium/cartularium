# HYPERLINK — cross-engine deep dive

**Batch:** stat-analytics · **Refs:** HYPERLINK/hyperlink-url-only, HYPERLINK/hyperlink-with-label · **Confidence:** medium

## Behavior summary

`HYPERLINK(url, [link_label])` makes a cell whose displayed text is `link_label` (defaulting to `url`) and whose click target is `url`. Assay records a cell's _scalar value_, and for HYPERLINK that scalar is the **display text** — the link target itself is presentation metadata the value model does not capture.

## Divergences

`=HYPERLINK("https://example.com")` and `=HYPERLINK("https://example.com", "click me")`:

| engine       | url-only                  | with-label | class                 |
| ------------ | ------------------------- | ---------- | --------------------- |
| gsheets      | "https://example.com"     | "click me" | string (display text) |
| hyperformula | "https://example.com"     | "click me" | string (display text) |
| formulas     | #NAME?                    | #NAME?     | not implemented       |
| ironcalc     | #NAME?                    | #NAME?     | not implemented       |
| pycel        | #NAME?                    | #NAME?     | not implemented       |
| excel        | _(absent from partition)_ | _(absent)_ | not recorded          |
| lattice      | _(absent)_                | _(absent)_ | not recorded          |
| libreoffice  | _(absent)_                | _(absent)_ | not recorded          |

Two facts:

- **gsheets and hyperformula** implement HYPERLINK and expose the display text as the value: the url when no label, the label otherwise. Live-confirmed on hyperformula.
- **formulas, ironcalc, pycel** do not implement HYPERLINK and return `#NAME?` (missing-function, live-confirmed).
- **excel, lattice, libreoffice are absent from the recorded partition entirely** — their results were not captured as comparable scalars. Two plausible reasons: the case was skipped for those lanes, or the engine returned an opaque rich-hyperlink object that the harness did not reduce to a string. (libreoffice is separately affected by the suite-wide blank recording gap.)

Cause: **missing-function** for the formulas/ironcalc/pycel branch; the excel/lattice/libreoffice absence is an unresolved recording question, not a computed divergence.

## Edges explored beyond the corpus

Live probe (hyperformula/ironcalc/formulas/pycel):

- hyperformula: `HYPERLINK("https://example.com")` => `"https://example.com"`, `HYPERLINK(..., "click me")` => `"click me"`.
- formulas / ironcalc / pycel: `#NAME?` for both.

## Wiki-facing notes

- The **value** of a HYPERLINK cell is its display text (label, or url if unlabeled), not the link target — relevant for anyone reading HYPERLINK results programmatically.
- Supported on Google Sheets and HyperFormula (as a plain-string value). NOT supported by the `formulas` library, IronCalc, or pycel (`#NAME?`).
- Excel _does_ support HYPERLINK (returns the label as the cell's text), but assay has not captured an Excel value here — treat Excel support as "yes, but the recorded scalar is unconfirmed" pending probe.

## Open questions

- What scalar (if any) do Excel and Google Sheets expose to a reader for a HYPERLINK cell — the label string, or an opaque rich value? (probe stat-analytics-002). This determines whether excel/lattice belong in the string class or a separate opaque-value class.
