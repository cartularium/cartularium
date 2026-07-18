---
tags:
  - theory
  - terminology
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

A **dependency** is a directed relationship between two [[term|terms]] in a spreadsheet, where one term's value depends on another's.  
Dependencies form the underlying structure that determines evaluation order and recalculation behavior in Google Sheets.

Every formula defines one or more *dependencies* through cell references, named ranges, or function calls.  

### Circular Dependencies

A **circular dependency** arises when a term depends—directly or indirectly—on itself. Google Sheets detects such cycles and raises a `#REF!` error.  

[[Iterative calculation]] can sometimes be enabled to handle controlled cycles, though this is rarely used for ordinary modeling.

### Volatile Dependencies

[[Volatile]] functions introduce volatile dependencies.  

Volatile functions (e.g. `RAND()`, `NOW()`, `RANDBETWEEN()`) cause dependent formulas to recalculate even if their inputs have not changed.  
These can introduce performance overhead in large models.

### See Also
- [[Calculation limits]] - boundaries on recursion, dependency depth, and evaluation time.  
