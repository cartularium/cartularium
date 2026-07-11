# CELL — cross-engine deep dive

**Batch:** info · **Refs:** CELL/cell-format · **Confidence:** high · **Related:** DV-0033 (CELL missing in formulas/hyperformula/lattice/pycel for other info-types)

## Behavior summary

`CELL(info_type, reference)` returns metadata about a cell. Support for CELL is sharply tiered across engines, and even engines that implement CELL do not support every `info_type` argument.

## Divergences

`=CELL("format", A1)` with `A1 = 42`:

| engine       | result  | tier                                           |
| ------------ | ------- | ---------------------------------------------- |
| excel        | "G"     | full CELL support; "G" = General number format |
| gsheets      | #VALUE! | CELL recognized, `"format"` info_type rejected |
| ironcalc     | #VALUE! | CELL recognized, `"format"` info_type rejected |
| formulas     | #NAME?  | CELL not implemented                           |
| hyperformula | #NAME?  | CELL not implemented                           |
| pycel        | #NAME?  | CELL not implemented                           |

(lattice and libreoffice have no recorded value class for this case; libreoffice would be the suite-wide `blank` artifact.)

Three tiers:

1. **excel → "G" (full support).** Excel implements CELL including the `"format"` info_type, returning the format code "G" (General) for the plain number 42.
2. **gsheets, ironcalc → #VALUE! (missing-arg-form).** Both recognize the CELL function but reject the `"format"` info_type argument. Live-probe: ironcalc returns #VALUE! for `CELL("format", A1)` but returns the string `"v"` for `CELL("type", A1)` — so the rejection is per-info_type, not a blanket CELL failure.
3. **formulas, hyperformula, pycel → #NAME? (missing-function).** No CELL at all. Live-probe confirmed #NAME? for `CELL("format"|"type"|"width", A1)` on all three.

## Edges explored beyond the corpus (live pure engines)

- IronCalc: `CELL("type", A1)` → `"v"` (value); `CELL("format", A1)` → #VALUE!; `CELL("width", A1)` → #VALUE!. IronCalc implements a subset of CELL info_types.
- formulas / hyperformula / pycel: all CELL info_types → #NAME? (uniformly unimplemented).

## Wiki-facing notes

- CELL is one of the least portable info functions. **Only Excel (and Google Sheets, for a subset of info_types) can be relied on.**
- The `"format"` info_type specifically is Excel-only among the tested engines: Google Sheets and IronCalc return #VALUE! for it; formulas/HyperFormula/pycel return #NAME?.
- IronCalc supports `CELL("type", ...)` (returns "v"/"l"/"b" style codes) but not `"format"` or `"width"`.
- Portability advice: avoid CELL in cross-engine formulas; if unavoidable, restrict to `"type"` and test on the target engine.

## Open questions

- Which CELL info_types does Google Sheets accept vs reject? (probe info-001, info-001b) — corpus only has the #VALUE! for `"format"`; the accepted-set is unknown and needs live gsheets.
- Confirm excel "G" for `CELL("format", A1)` (probe info-001) — already in corpus, worth a live re-confirm since it anchors tier 1.
