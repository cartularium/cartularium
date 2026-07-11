# SORT sort_order = -1 — Google Sheets sorts ascending where Excel sorts descending

**Batch:** spill-broadcast · **Refs:** SORT/sort-descending-unique, SORT/sort-of-sequence-descending (control: SORT/sort-of-sequence-ascending, SORT/sort-of-filter, SORT/sort-spill) · **Confidence:** high

## Behavior summary

`SORT(range, sort_index, sort_order)` — the third argument controls direction. In the Excel spec, `sort_order = 1` is ascending and `sort_order = -1` is descending. Google Sheets diverges on the descending case.

## Divergences

`=SORT(SEQUENCE(5), 1, -1)` and `=SORT(UNIQUE({3;1;4;1;5;9;2;6;5;3}), 1, -1)`:

| engine                        | result                                           | mechanism                                                                          |
| ----------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| excel, lattice, formulas      | descending (`[5;4;3;2;1]`, `[9;6;5;4;3;2;1]`)    | `-1` = descending flag (Excel spec)                                                |
| **gsheets**                   | **ascending** (`[1;2;3;4;5]`, `[1;2;3;4;5;6;9]`) | reads the third arg as boolean `is_ascending`; `-1` is truthy -> TRUE -> ascending |
| hyperformula, ironcalc, pycel | `#NAME?`                                         | SORT (and SEQUENCE) unimplemented                                                  |
| libreoffice                   | blank                                            | recording gap                                                                      |

The mechanism: Google Sheets' `SORT` third parameter is `is_ascending` (a boolean), documented to be TRUE for ascending / FALSE for descending. Passing `-1` — which Excel users write for "descending" — is a **nonzero, hence truthy, hence TRUE** value in Sheets, so Sheets sorts ascending. It is not a bug in the sense of a miscompute; it is a genuine argument-semantics incompatibility between the two SORT signatures.

## The control that proves the mechanism

`=SORT(SEQUENCE(5), 1, 1)` (ascending flag): excel, gsheets, and lattice **all agree** ascending `[1;2;3;4;5]`. The engines diverge _only_ when the flag is `-1`. If the divergence were about SORT semantics generally, the ascending case would diverge too — it does not. This isolates the cause to the interpretation of the `-1`/`FALSE` value.

Note `=SORT(FILTER({5;3;1;4;2}, {TRUE;TRUE;FALSE;TRUE;FALSE}))` (sort-of-filter, default ascending) also agrees across excel/formulas/gsheets/lattice (`[3;4;5]`) — again, agreement whenever descending `-1` is not used.

## Wiki-facing notes

- The SORT page needs a prominent portability warning: **`SORT(range, n, -1)` sorts DESCENDING in Excel/Lattice but ASCENDING in Google Sheets**, because Sheets treats the third argument as a boolean `is_ascending` (any nonzero value = ascending). To sort descending portably: in Sheets use `SORT(range, n, FALSE)`; in Excel use `SORT(range, n, -1)`. There is no single third-argument value that sorts descending in both.
- This is a silent wrong-answer hazard: no error is raised, the data is just in the opposite order.

## Open questions

- Live re-confirm on Excel + Sheets: probe `spill-broadcast-006` (`SORT(SEQUENCE(5),1,-1)`) and the cleaner literal control `spill-broadcast-008` (`SORT({3;1;2},1,-1)`). Grounding is currently from recorded fixtures for the excel/gsheets/lattice branches (strong, but a direct re-record removes any doubt).
