# SEQUENCE and SEQUENCE-composed spills — engine support tiers

**Batch:** spill-broadcast · **Refs:** SEQUENCE/sequence-column-spill, SEQUENCE/sequence-2d-spill, SEQUENCE/sequence-row-spill, FILTER/filter-of-sequence, SORT/sort-of-sequence-ascending, TOCOL/tocol-of-2d-sequence, TRANSPOSE/transpose-of-sequence, INDEX/index-into-sequence, HSTACK/hstack-two-sequences, VSTACK/vstack-two-sequences · **Confidence:** high

## Behavior summary

`SEQUENCE` generates a spilled array of consecutive numbers and is the workhorse source for spill-edge tests. Support divides the engines cleanly: **Excel, Google Sheets, and Lattice implement it; the `formulas` library, HyperFormula, IronCalc, and pycel do not** (all return `#NAME?` — live-confirmed: `=SEQUENCE(3)` -> `#NAME?` on all four pure engines).

Because the spill-edge cases wrap SEQUENCE in another function, the failure of `SEQUENCE` propagates outward, and the `formulas` library surfaces it in structurally interesting ways.

## Divergences

Baseline: excel/gsheets/lattice compute; formulas/hyperformula/ironcalc/pycel -> `#NAME?`; libreoffice blank (recording gap).

| ref                                       | excel/gsheets/lattice    | how `formulas` fails                                 | hyperformula/ironcalc/pycel |
| ----------------------------------------- | ------------------------ | ---------------------------------------------------- | --------------------------- |
| `SEQUENCE(3)`                             | `[1;2;3]`                | `#NAME?`                                             | `#NAME?`                    |
| `SEQUENCE(3,2)`                           | `[[1,2],[3,4],[5,6]]`    | `#NAME?`                                             | `#NAME?`                    |
| `SEQUENCE(1,3)`                           | `[1,2,3]`                | `#NAME?`                                             | `#NAME?`                    |
| `FILTER(SEQUENCE(5), SEQUENCE(5)>2)`      | `[3;4;5]`                | `#NAME?`                                             | `#NAME?`                    |
| `SORT(SEQUENCE(5),1,1)`                   | `[1;2;3;4;5]`            | `#NAME?`                                             | `#NAME?`                    |
| `TOCOL(SEQUENCE(2,3))`                    | `[1;2;3;4;5;6]`          | `#NAME?`                                             | `#NAME?`                    |
| `TRANSPOSE(SEQUENCE(3))`                  | `[1,2,3]`                | `#NAME?`                                             | `#NAME?`                    |
| `INDEX(SEQUENCE(5,5),3,4)`                | `14`                     | **`#REF!`** (index resolves against a failed source) | `#NAME?`                    |
| `HSTACK(SEQUENCE(3), SEQUENCE(3,1,10))`   | `[[1,10],[2,11],[3,12]]` | **`[#NAME?, #NAME?]`** (1x2, shape-preserving)       | `#NAME?`                    |
| `VSTACK(SEQUENCE(1,3), SEQUENCE(1,3,10))` | `[[1,2,3],[10,11,12]]`   | **`[#NAME?; #NAME?]`** (2x1, shape-preserving)       | `#NAME?`                    |

The `formulas` library's HSTACK/VSTACK run over the two failed `SEQUENCE` arguments and **preserve the stacked shape**, emitting one `#NAME?` cell per stacked input rather than collapsing to a single error. INDEX-into-sequence produces `#REF!` (not `#NAME?`) because INDEX itself is implemented and rejects the out-of-range access against the failed source. These distinct `formulas` outcomes are why hstack-two-sequences and vstack-two-sequences and index-into-sequence each form their own agreement class in the partition, separate from the plain `#NAME?` engines.

## Lattice recording gap (open)

Lattice appears in the computing class for the composed cases that use `SEQUENCE(2,3)`/`SEQUENCE(5,5)`/`SEQUENCE(3,1,10)` (tocol, index-into, hstack/vstack-two-sequences) but is **absent from the recorded partitions for the plain `SEQUENCE(3,2)` and `SEQUENCE(1,3)` forms** in the spill suite. Since Lattice clearly computes 2-D SEQUENCE elsewhere, this is almost certainly a Lattice recording gap for those two refs, not a real capability boundary. Cannot be resolved here (Lattice is not a probe-able engine); flagged for a human re-record.

## Wiki-facing notes

- The SEQUENCE page should carry the support matrix: **Excel / Google Sheets / Lattice: yes. `formulas`, HyperFormula, IronCalc, pycel: no (`#NAME?`).** Any formula built on SEQUENCE inherits this — a SEQUENCE-sourced FILTER/SORT/TOCOL/TRANSPOSE will fail on the four engines that lack it.
- HyperFormula supports FILTER but NOT SEQUENCE, so `FILTER(A1:A5, ...)` (range source) works there while `FILTER(SEQUENCE(5), ...)` does not — a subtle portability edge.

## Open questions

- Lattice's real support for `SEQUENCE(3,2)` / `SEQUENCE(1,3)` — re-record needed (see above).
- Excel/Sheets spill values are strongly grounded in fixtures; a low-priority re-confirm is probe `spill-broadcast-005`.
