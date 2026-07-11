---
tags:
  - datatype
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

Entry rejection is the refusal of a spreadsheet engine to store a formula at the moment it is entered, leaving the cell genuinely empty. The cell holds no formula, no value, and no [[Error|error]] — it is indistinguishable from a cell that was never touched. This is distinct from a formula that is stored and then evaluates to an error: an entry-rejected cell was never accepted in the first place.

Entry rejection is primarily an Excel behavior. Google Sheets accepts and evaluates several of the same formulas.

### Examples

Excel refuses the following at entry, recording an empty cell (Excel probe, 2026-07-11):

```gse
=INDEX(A1:A3)
=AND()
=SUM()
```

- [[INDEX]] with `row_num` omitted (`=INDEX(A1:A3)`, `=INDEX({1;2;3})`, `=INDEX(A1:A3*10)`) is rejected. Supplying the index makes the same call valid: `=INDEX(A1:A2, 0)` is accepted and spills the whole column `{1;2}`, and `=INDEX(A1:A3, 2)` returns the second element. The rejection is triggered specifically by the omitted `row_num`, not by the range or the arithmetic inside it.
- Zero-argument aggregates such as `=AND()` and `=SUM()` are rejected because they supply too few arguments.

Google Sheets accepts `=INDEX(array)` with both indices omitted and treats it as an array wrapper: `=INDEX({1,2,3}+{10;20;30})` spills the full 3×3 outer product in Sheets (gsheets probe spill-broadcast-002, 2026-07-11), where Excel yields nothing. See [[INDEX]] for this Sheets-specific idiom.

### Reading recorded blanks

An entry-rejected cell reads back as blank, which is easy to misread as a computed result. It is not `0`, not an empty string, and not a [[Null|null]] value — the formula was never stored. When comparing engines, an Excel blank for one of these formulas is a rejection, not a value: it should not be reconciled against another engine's `0`, spilled array, or error code as though the two engines computed different answers. Only one of them computed anything at all.

### Engine compatibility

| Engine        | Behavior                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| Excel         | Rejects `=INDEX(range)` (row_num omitted), `=AND()`, `=SUM()` at entry, leaving an empty cell. |
| Google Sheets | Accepts and evaluates `=INDEX(array)` as an array wrapper; evaluates the aggregates.            |

### See Also

[[Null]]
[[Zero element]]
[[INDEX]]
