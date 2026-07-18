---
tags:
  - datatype
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

Broadcasting is the elementwise combination of [[Array|arrays]] of different shapes under an [[Operator|operator]] or an [[Array-enabled functions|array-enabled]] function. A [[Data type#Scalar types|scalar]] combines with every element of an array; a row [[Array#Vectors|vector]] and a column vector expand to a two-dimensional grid; two arrays of the same shape combine cell by cell. The rules mirror those of [NumPy](https://numpy.org/doc/stable/user/basics.broadcasting.html).

### The portable core

A scalar broadcasts against any array, and a row vector against a column vector expands to the full outer product. These forms agree across every engine that implements array arithmetic.

| Formula                | Result                             |
| ---------------------- | ---------------------------------- |
| `=1+{10,20,30}`        | `{11,21,31}`                       |
| `=60/{1,2,3}`          | `{60,30,20}`                       |
| `=2^{0,1,2,3}`         | `{1,2,4,8}`                        |
| `={1,2,3}+{10;20;30}`  | `{11,12,13;21,22,23;31,32,33}`     |

The last row is the outer product: the row vector `{1,2,3}` and the column vector `{10;20;30}` expand against each other to a 3×3 grid. Google Sheets, Excel, HyperFormula, Lattice, and the `formulas` library all produce these results (live probe, 2026-07-11; gsheets confirmed via `INDEX`-wrapped probe spill-broadcast-002, 2026-07-11). IronCalc reports `#N/IMPL!` and pycel returns `#NAME?` — neither implements broadcast arithmetic (live probe, 2026-07-11).

### Orientation determines the result

The engines diverge when two operands have incompatible non-scalar shapes — two vectors of the same orientation and unequal length, or two grids whose dimensions do not line up. Excel pads the non-overlapping cells with `#N/A`; Google Sheets does not pad at all.

| Engine        | `={1,2,3}+{10,20}`                     |
| ------------- | -------------------------------------- |
| Excel         | `{11,22,#N/A}` — pads the overflow     |
| HyperFormula  | `{11,22,#N/A}` — pads the overflow     |
| Lattice       | `{11,22,#N/A}` — pads the overflow     |
| Google Sheets | `11` — collapses to the first element  |
| formulas      | raises a broadcast error               |
| IronCalc      | `#N/IMPL!`                             |
| pycel         | `#NAME?`                               |

Excel's `#N/A` padding is live-confirmed (Excel probe, 2026-07-11), as is HyperFormula's (live probe, 2026-07-11). Google Sheets' collapse to the single top-left value was the surprise of the deep dive: a hypothesis that both engines padded with `#N/A` was contradicted live (gsheets probe spill-broadcast-004, 2026-07-11). The `formulas` library refuses the operation outright — its `BroadcastError` is recorded as an execution failure rather than a value.

This gives Google Sheets a sharp orientation dependence that Excel lacks:

- A row vector and a **column** vector (perpendicular orientations) broadcast to a full outer-product grid.
- Two vectors of the **same** orientation and unequal length undergo **broadcast collapse** — Sheets returns only the first element, silently, with no error and no `#N/A` padding.

Because the collapse is silent, a formula written for Excel that relies on `#N/A` padding will return a single wrong value in Google Sheets rather than an error. Do not treat `#N/A` padding as a portable signal.

### Array-enabled functions do not auto-map in Sheets

An [[Array-enabled functions|array-enabled]] wrapper such as [[IFERROR]] broadcasts over an array argument in Excel but not in Google Sheets, which returns only the first element unless the call is wrapped in [[ARRAYFORMULA]].

| Engine        | `=IFERROR(10/{1,0,2}, -1)`                  |
| ------------- | ------------------------------------------- |
| Excel         | `{10,-1,5}` — maps over the array           |
| Google Sheets | `10` — first element only, no mapping       |

`10/{1,0,2}` produces `{10, #DIV/0!, 5}`; Excel maps `IFERROR` across it and replaces the error with `-1` (Excel probe, 2026-07-11). Google Sheets evaluates only the first element and never reaches the error branch (gsheets probe dve-007, 2026-07-11). To force the mapping in Sheets, wrap the expression: `=ARRAYFORMULA(IFERROR(10/{1,0,2}, -1))`. This is the same [[Array-enabled functions#Implicit intersection|implicit intersection]] behavior that collapses `LEN` over a range.

### Engine compatibility

Element-wise scalar-and-outer-product broadcasting is portable across Excel, Google Sheets, HyperFormula, Lattice, and the `formulas` library. The portable core ends at mismatched shapes: Excel and HyperFormula pad with `#N/A`, Google Sheets collapses to a scalar, and `formulas` errors.

| Engine        | Behavior                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Google Sheets | Broadcasts scalar and row×column forms. Same-orientation unequal-length operands collapse to the first element (no `#N/A` padding). Array-enabled functions require [[ARRAYFORMULA]] to map. |
| Excel         | Broadcasts all forms; pads mismatched shapes with `#N/A`. Array-enabled functions auto-map over arrays. |
| HyperFormula  | Broadcasts arithmetic including `#N/A` padding on mismatched shapes.                               |
| Lattice       | Matches Excel/Sheets on the agreeing cases (recorded fixtures); pads mismatched shapes with `#N/A`. |
| formulas      | Broadcasts scalar and outer-product forms; raises a broadcast error on mismatched shapes.          |
| IronCalc      | Broadcast arithmetic not implemented — `#N/IMPL!`.                                                 |
| pycel         | No array engine — `#NAME?`, or silent collapse to the first element (see [[Dynamic array]]).        |

### See Also

[[Array-enabled functions]]
[[Array]]
[[Dynamic array]]
