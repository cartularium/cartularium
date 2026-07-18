---
tags:
  - general
  - terminology
---

Google Sheets enforces two independent limits on each formula cell:

1. **Function call limit** — `2,000,000` calls per cell
2. **Stack limit** — `10,000` recursive calls per cell

If either limit is reached the formula stops and outputs `#ERROR!`. The two limits are tracked separately; a formula can exhaust the call limit without approaching the stack limit and vice versa.

---

## The Function Call Limit

Every node in a formula's expression tree costs 1 call. When a LAMBDA helper function (MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY) iterates over an array, each element multiplies the cost of the lambda body, making the limit easy to exhaust.

### How to count function calls

Every node in a formula's expression tree costs 1 call, with two exceptions:

**1. Skip literals.** Numbers, strings, booleans, and empty/null are free.

**2. Skip nodes in pass-through positions.** Some constructs pass a value through without evaluating it. A node in a pass-through position is free regardless of what it is — literal, reference, or lambda expression. The pass-through positions are:

- IF / IFS branch values (the condition is not pass-through)
- LET binding values
- REDUCE / SCAN init argument

Everything else costs 1.

**Exceptions to memorise.** These cannot be derived from the counting rule:

- IF and IFS cost 2, not 1
- Non-taken IF branch: root node costs 1 (reference) or 0 (literal); everything below the root is skipped
- Non-taken IFS branch: costs 2 — root node plus 1 structural slot
- LAMBDA and LET invocations pay a flat overhead of 2 in addition to their argument and body costs

### Operators desugar to functions

Operators are syntactic sugar for function calls and cost 1 each, with their operands costed separately. `a+b` = `add(a, b)` = 3 calls. Expressions chain left-associatively, so `x+x+x` = `add(add(x,x), x)` = 5 calls.

This can be verified by finding the limit of a MAP with a known body:

```gse
=rows(map(sequence(666664),lambda(x,x+x)))    // body = add(1) + x(1) + x(1) = 3 → limit 666,664
=rows(map(sequence(399998),lambda(x,x+x+x)))  // body = add(1)+x(1)+x(1)+add(1)+x(1) = 5 → limit 399,998
```

### Literals are free in return position, cost 1 when called

```gse
=rows(map(sequence(1999993),lambda(x,0)))   // body = 0(skip) = 0 → hits array limit, not call limit
=rows(map(sequence(999996),lambda(x,n(1)))) // body = N(1) + 1(1, called by N) = 2 → limit 999,996
```

The same literal costs nothing as a lambda body (pass-through) and 1 as a function argument (called).

### Pass-through positions

IF branch values are pass-through; the condition is not:

```gse
=rows(map(sequence(399998),lambda(x,if(x,x,x)))) // IF(2)+cond_x(1)+branch_x(1)+branch_x(1) = 5
=rows(map(sequence(399998),lambda(x,if(1,x,x)))) // IF(2)+cond_1(1)+x(1)+x(1) = 5 — condition called
=rows(map(sequence(499998),lambda(x,if(x,1,x)))) // IF(2)+x(1)+1(0)+x(1) = 4 — branch skipped
```

LET binding values are pass-through:

```gse
=rows(map(sequence(399998),lambda(x,let(y,1,y)))) // LET(1)+overhead(2)+name_y(1)+value_1(0)+body_y(1) = 5
=rows(map(sequence(333332),lambda(x,let(y,x,y)))) // LET(1)+overhead(2)+name_y(1)+value_x(1)+body_y(1) = 6
```

REDUCE and SCAN init is pass-through — free regardless of whether it is empty, a literal, a reference, or even a lambda expression:

```gse
=reduce(,sequence(1999992),lambda(a,b,b))         // init empty  → overhead 8
=reduce(0,sequence(1999992),lambda(a,b,b))         // init literal → overhead 8, same
=reduce(lambda(y,y),sequence(1999989),lambda(a,b,b)) // init lambda → overhead 8, same
=reduce(n(0),sequence(1999991),lambda(a,b,b))      // n(0) must be called to produce the init → overhead 9
```

The last case shows the boundary: when the init is an _expression that must be evaluated_ (rather than a value that is simply stored), it costs normally.

---

## LAMBDA and LET

Every LAMBDA invocation pays a flat overhead of 2 calls in addition to the cost of the lambda expression itself:

|Component|Cost|
|---|---|
|`LAMBDA` keyword|1|
|Each declared parameter|1|
|Body expression|per counting rules|
|Call overhead (flat, per invocation)|2|
|Each argument passed|1|

```gse
// lambda(y,y)(x) = LAMBDA(1)+param_y(1)+body_y(1)+overhead(2)+arg_x(1) = 6
=rows(map(sequence(333332),lambda(x,lambda(y,y)(x))))

// A lambda constructed but never called still pays its AST cost each iteration
=rows(map(sequence(666664),lambda(x,lambda(y,y))))  // LAMBDA(1)+param_y(1)+body_y(1) = 3
```

**Named functions are fully inlined.** A named function `DOUBLE` defined as `LAMBDA(x, x*2)` expands at the call site with the same cost as writing the lambda directly:

```gse
=rows(map(sequence(333332),lambda(x,double(x))))  // same cost as lambda(y,y)(x) = 6
```

**LET is an immediately-invoked LAMBDA** and pays the same 2-unit call overhead. Its binding values are pass-through (not called by LET itself):

```gse
=rows(map(sequence(333332),lambda(x,let(y,x,y))))   // LET(1)+overhead(2)+y(1)+x(1)+y(1) = 6
=rows(map(sequence(399998),lambda(x,let(y,1,y))))   // LET(1)+overhead(2)+y(1)+1(0)+y(1) = 5
```

---

## Conditional Functions

### IF and IFS

Both cost 2. The condition is called; branch values are pass-through.

```gse
=rows(map(sequence(399998),lambda(x,if(x,x,x))))  // IF(2)+x(1)+x(1)+x(1) = 5
=rows(map(sequence(499998),lambda(x,if(x,1,x))))  // IF(2)+x(1)+1(0)+x(1) = 4
=rows(map(sequence(499998),lambda(x,if(x,x,1))))  // IF(2)+x(1)+x(1)+1(0) = 4
```

Non-taken branches are charged only their root node:

```gse
// if(false, x+x+x+x+x, x) — the non-taken branch root costs 1; its children are skipped
=rows(map(sequence(399998),lambda(x,if(false,x+x+x+x+x,x))))  // IF(2)+false(1)+root(1)+x(1) = 5
```

### IFERROR / IFNA

Cost 1 each. Both arguments are called — neither is pass-through:

```gse
=rows(map(sequence(666664),lambda(x,iferror(x,x)))) // IFERROR(1)+x(1)+x(1) = 3
=rows(map(sequence(666664),lambda(x,iferror(x,1)))) // IFERROR(1)+x(1)+1(1) = 3 — fallback is called
```

### SWITCH

SWITCH is compiled into two distinct forms depending on whether a default argument is present.

**3-arg** `switch(expr, case, val)` — overhead 2. Expr and val are pass-through; case carries an implicit no-match error node and costs 2:

```gse
=rows(map(sequence(333332),lambda(x,switch(x,x,x)))) // 2+x(1)+x(2)+x(1) = 6
=rows(map(sequence(499998),lambda(x,switch(x,1,x)))) // 2+x(1)+1(0)+x(1) = 4 — case literal skipped
=rows(map(sequence(399998),lambda(x,switch(x,x,1)))) // 2+x(1)+x(2)+1(0) = 5 — val literal skipped
=rows(map(sequence(499998),lambda(x,switch(1,x,x)))) // 2+1(0)+x(2)+x(1) = 5 — expr literal skipped
```

**4-arg and multi-pair** `switch(expr, case, val, default)` — overhead 3. Expr and default are always called (not pass-through); case and val are pass-through:

```gse
=rows(map(sequence(285713),lambda(x,switch(x,x,x,x)))) // 3+x(1)+x(1)+x(1)+x(1) = 7
=rows(map(sequence(333332),lambda(x,switch(x,1,x,x)))) // 3+x(1)+1(0)+x(1)+x(1) = 6 — case skipped
=rows(map(sequence(333332),lambda(x,switch(x,x,1,x)))) // 3+x(1)+x(1)+1(0)+x(1) = 6 — val skipped
=rows(map(sequence(285713),lambda(x,switch(x,x,x,1)))) // 3+x(1)+x(1)+x(1)+1(1) = 7 — default always called
=rows(map(sequence(285713),lambda(x,switch(1,x,x,x)))) // 3+1(1)+x(1)+x(1)+x(1) = 7 — expr always called
```

**Structural note:** The two SWITCH forms behave inconsistently with each other. In 3-arg, expr and val are pass-through but case costs 2 (comparison + implicit no-match error). In 4-arg, expr and default are always called but case and val become pass-through. The most likely explanation is that the compiler emits different bytecode for the two forms — 3-arg SWITCH is likely optimised into an equality-check expression, while 4-arg compiles into a general dispatch structure. Both forms are internally consistent; the inconsistency is between forms.

---

## HOF Overhead

Each LAMBDA helper function has a fixed overhead charged once per formula cell, regardless of array size. The per-element cost is the call count of the lambda body.

### Maximum elements formula

```
floor((2,000,000 − overhead) / body_cost)
```

### Overhead table

Overhead is derived by counting the nodes of the full formula. For `=rows(map(sequence(n), lambda(x, body)))`:

```
ROWS(1) + MAP(1) + SEQUENCE(1) + LAMBDA(1) + param_x(1) + call_overhead(2) = 7
```

|Function|Overhead|Notes|
|---|---|---|
|`MAP(array, lambda)`|7||
|`MAP(a1, a2, lambda)`|10|+3 per extra array: SEQUENCE(1) + param(1) + zip_node(1)|
|`MAP(a1, a2, a3, lambda)`|13|+3 again|
|`REDUCE(init, array, lambda)`|8|+1 for extra accumulator param; init is pass-through|
|`SCAN(init, array, lambda)`|9|+1 for extra accumulator param + 1 output array node|
|`BYROW(array, lambda)`|7 or 8|depends on SEQUENCE argument count (see note)|
|`BYCOL(array, lambda)`|7 or 8|same|
|`MAKEARRAY(rows, cols, lambda)`|8|LAMBDA has 2 params (r, c); dimension literals are pass-through|

**BYROW/BYCOL note:** The overhead depends on the SEQUENCE call used to generate the input. `SEQUENCE(n)` contributes 1; `SEQUENCE(n, 1)` contributes 2 because the second argument `1` is called by SEQUENCE. This is a property of SEQUENCE, not of BYROW or BYCOL.

```gse
=rows(byrow(sequence(1999993),lambda(r,r)))    // sequence(n) → overhead 7 → limit 1,999,993
=rows(byrow(sequence(1999992,1),lambda(r,r)))  // sequence(n,1) → overhead 8 → limit 1,999,992
```

**REDUCE/SCAN init note:** The init is pass-through — stored and passed to the lambda as the initial accumulator without being called. This applies regardless of whether the init is empty, a literal, a reference, or a lambda expression. Only an expression that must itself be evaluated to produce the init value incurs a cost.

```gse
=reduce(,sequence(1999992),lambda(a,b,b))            // empty init   → overhead 8
=reduce(0,sequence(1999992),lambda(a,b,b))            // literal init → overhead 8
=reduce(lambda(y,y),sequence(1999989),lambda(a,b,b)) // lambda init  → overhead 8
=reduce(n(0),sequence(1999991),lambda(a,b,b))         // expression   → overhead 9
```

### Example body costs with MAP (overhead = 7)

|Lambda body|Body cost|Max elements|
|---|---|---|
|`lambda(x, )`|0|10,000,000 (array limit)|
|`lambda(x, x)`|1|1,999,993|
|`lambda(x, n(x))`|2|999,996|
|`lambda(x, x+x)`|3|666,664|
|`lambda(x, x+x+x)`|5|399,998|
|`lambda(x, if(x,x,x))`|5|399,998|
|`lambda(x, lambda(y,y)(x))`|6|333,332|

---

## The Stack Limit

The stack limit is `10,000` calls, applying to LAMBDA recursion and iterative calculation. It is entirely separate from the function call limit. Church-encoded lists in Google Sheets may appear to circumvent this limit due to how closures are handled.

---

## Practical Implications

**Body cost dominates.** Each call saved from the lambda body multiplies across every element. Moving work outside the lambda is the highest-leverage optimisation.

**Operators are not free.** `x+1` = 3 calls. Prefer built-in functions that combine multiple operations internally when near the limit.

**Constants inside function arguments cost 1.** `n(1)` = 2 calls. Binding a constant via LET makes it a pass-through value (cost 0) wherever it is referenced inside the body.

**REDUCE/SCAN init is always free** as long as it does not require evaluation to produce the value.

**Split across cells.** Each cell has its own independent budget of 2,000,000. A computation that exceeds the limit in one cell can often be split across two.

**LAMBDA itself is not restricted.** Only LAMBDA helper functions (MAP, REDUCE, SCAN, etc.) are subject to the call limit. A standalone `LAMBDA(...)(args)` call is not.

**Named functions are inlined.** Refactoring a lambda body into a named function does not reduce its call cost — the body is fully expanded at the call site.

---

## Quick Reference

### Counting rules

|Node|Cost|
|---|---|
|Any function or operator|1|
|IF / IFS|2|
|IFERROR / IFNA|1|
|SWITCH (no default)|2 + args|
|SWITCH (with default)|3 + args|
|Variable reference|1|
|Literal — pass-through or unevaluated|0|
|Literal — called by parent|1|
|Array literal `{...}`|2 + n_slots|
|LAMBDA / LET call overhead|2|
|IF non-taken branch|1 (root node only)|
|IFS non-taken branch|2|

### Pass-through positions

|Construct|Pass-through slot|
|---|---|
|`IF` / `IFS`|Branch values (not condition)|
|`LET`|Binding values|
|`REDUCE` / `SCAN`|Init argument|
|`SWITCH` 3-arg|Expr, val|
|`SWITCH` 4-arg+|Case, val|

### HOF overhead

|HOF|Overhead|
|---|---|
|MAP (1 array)|7|
|MAP (k arrays)|7 + 3(k−1)|
|REDUCE|8|
|SCAN|9|
|BYROW / BYCOL|7 or 8 (depends on SEQUENCE args)|
|MAKEARRAY|8|
### Further Reading

- [Calculation Limits](https://docs.google.com/spreadsheets/d/160UfdYEOoplAaKzm4Cx4rF0NNWwd6b2KC3LH3xAr-jk/edit#gid=0)
	- This spreadsheet contains a number of formulae at each calculation limit to demonstrate this phenomenon.
