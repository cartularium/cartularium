---
tags:
  - concept
  - terminology
---

A **formula** is any expression in a cell that begins with `=` and computes a value. Formulas are the primary mechanism for calculation and data transformation in Google Sheets.

```
=A1 + 100
=SUM(B1:B10)
=IF(A1 > 0, "positive", "non-positive")
```

### Formulas vs. Functions

Every formula contains at least one [[Term|term]]. In Google Sheets, [[Operator|operators]] like `+` or `&` are syntactic sugar for underlying primitive functions (`ADD`, `CONCAT`, etc.) — so even `=A1 + A2` ultimately invokes a function.

| Concept | Description | Example |
|---------|-------------|---------|
| Formula | Any `=`-prefixed expression | `=A1*1.1` |
| Function | A named, callable operation | `SUM(...)` |
| Operator | A symbolic shorthand for a function | `+` → `ADD` |

Note: in Excel's framing, formulas and functions are often treated as distinct, with operators considered non-functions. In Google Sheets, operators are explicitly functions (with the exception of `.` and `%`).

### Formula Evaluation

Formulas are evaluated dynamically — they recalculate automatically when their dependencies change. The recalculation order is determined by the [[Dependency|dependency graph]].

[[Volatile]] functions (like `NOW` or `RAND`) recalculate on every sheet change regardless of whether their inputs changed.

### Array Formulas

Standard formulas operate on single values. Wrapping a formula in [[ARRAYFORMULA]] (or using functions that natively accept arrays) extends it to operate over ranges, producing multiple outputs.

```
=ARRAYFORMULA(A1:A10 * B1:B10)
```

### Comparison with Excel

In Excel (pre-365), array behavior required entering formulas with **Ctrl+Shift+Enter** (CSE), which wrapped the formula in `{}`. Excel 365 and Google Sheets both support dynamic arrays natively — no special entry method is needed. Google Sheets uses `ARRAYFORMULA` as an explicit wrapper; Excel 365 handles spilling automatically.

### See Also

- [[Function]] — the callable building blocks used within formulas.
- [[Operator]] — symbolic operations available in formulas.
- [[ARRAYFORMULA]] — extends formulas to operate over arrays.
- [[Volatile]] — functions that recalculate on every change.
- [[Term]] — technical breakdown of formula syntax.
