---
tags:
  - technique
  - terminology
---

Good practice is a set of general principles for writing effective, maintainable, and performant formulas in Google Sheets.

### Prefer native functions over idioms from other software

Google Sheets has its own function set optimized for its evaluation model. Patterns idiomatic to Excel or other spreadsheet programs may not translate well — and may constitute [[Bad Practice|bad practice]] in Sheets. When a native function exists for a task, prefer it.

### Use LET for readability

[[LET]] assigns names to subexpressions, reducing repetition and making complex formulas easier to read and maintain:

```gse
=LET(
    rate,  B2 / 12,
    total, A2 * (1 + rate) ^ C2,
    total - A2
)
```

Note that LET bindings are always evaluated, even if unused. In performance-critical formulas approaching [[Calculation limits]], inlining an expression may be more efficient than binding it with LET, even at the cost of readability.

### Prefer MAP, REDUCE, and SCAN over LAMBDA recursion

[[REDUCE]], [[MAP]], and [[SCAN]] are purpose-built for common iteration patterns and are generally more readable, more predictable, and less constrained by [[Calculation limits]] than equivalent [[LAMBDA recursion|recursive formulas]]. Reserve explicit recursion for problems that are inherently recursive in structure.

### Understand your data types

Functions behave differently depending on the [[Data type]] of their inputs. Knowing whether data is a [[Number]], [[String]], or [[Boolean]] — and how [[Type coercion]] applies — prevents subtle errors. Numbers stored as text (typically visible as left-aligned cell values) will break arithmetic, sorting, and most numeric functions.

### Document complex formulas

Non-trivial formulas benefit from documentation. See [[Documenting formulas]] for community conventions on inline comments and formula structure.

### See Also

- [[Bad Practice]] — common anti-patterns.
- [[LET]], [[MAP]], [[REDUCE]], [[SCAN]] — building blocks for clear, efficient formulas.
- [[Calculation limits]] — constraints to keep in mind for large or recursive formulas.
- [[Documenting formulas]] — how to annotate complex formulas.
