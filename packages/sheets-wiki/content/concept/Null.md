---
tags:
  - datatype
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

A **null** is the absence of a value in a formula expression — an empty argument slot, or an expression that yields no value. It does not belong to any of the standard scalar [[Data type|types]] used by the evaluation engine, but it participates in expressions through coercion and truth-testing rules.

Null is distinct from a [[Blank|blank cell]]. A blank is a property of a *cell* (an empty cell in the grid); a null arises *inside* a formula, most often from an argument position left empty. The two are related — a reference to a blank cell reads as a null-like empty value — but the term "null" here refers to the in-formula sense.

### Syntax

Nulls most commonly appear in function calls when an argument position is left empty:

```gse
VLOOKUP("foo", A1:B5, 2, )
```

Here the fourth argument evaluates to null, which causes [[VLOOKUP]] to operate in its non-sorted mode because null is treated as a [[Boolean|falsy]] value.

### Properties

- **Truthiness.** Null is falsy in conditional contexts.

- **Coercion.** When a null is required to participate in arithmetic or string operations, it typically converts to `0` or `""` depending on the expected type. This mirrors how a reference to a [[Blank|blank cell]] coerces (see [[Type coercion]]).

- **Propagation.** Functions may return null, and those nulls can be passed to other functions. However, nulls cannot fill mandatory argument positions in functions that accept only a single argument; syntactically, there is no "blank" slot to express a null there.

```gse
ISBLANK(IF(,,))
```

The [[IF]] call returns null because its first argument is null, which is coerced to `FALSE`, and the `value_if_false` argument is null. The [[ISBLANK]] is able to detect the resulting null output.

### Cross-engine notes

The clearest place the null-vs-value question surfaces across engines is an [[IF]] with its false-branch omitted. `=IF(2>3, TRUE)` returns the boolean `FALSE` in Excel, Google Sheets, HyperFormula, IronCalc, and the `formulas` engine, but Lattice returns a genuine blank cell instead (assay: IF/if-two-args-false). If you want an empty result rather than `FALSE`, write the false-branch explicitly: `=IF(cond, x, "")`.

The related empty-string-versus-blank divergence — whether an empty result materializes as a blank cell or as `""` — is covered in [[Blank]].

### See Also

- [[Blank]] — the empty-*cell* counterpart, and the cross-engine empty-string boundary.
- [[ISBLANK]] — detects blank cells and null results.
- [[Type coercion]] — how null coerces to `0` and `""`.
- [[Data type]] — overview of the type system.
