---
tags:
  - technique
  - terminology
---

LAMBDA recursion allows the user to apply [[LAMBDA|lambda terms]] [recursively](https://en.wikipedia.org/wiki/Recursion_(computer_science)) using [anonymous recursion](https://en.wikipedia.org/wiki/Anonymous_recursion).

```gse
LET(
	func, LAMBDA(func, <variables>, <expression>),
	func(func, <variables>)
)

LAMBDA(func, func(func, <variables>))(LAMBDA(func, <variables>, <expression>))
```

Either syntax is valid; however, `LET` is typically easier to work with and read. In computer science terms, `LET` enables [named function recursion](https://en.wikipedia.org/wiki/Anonymous_recursion#Named_functions).

Recursive formulae should have a [base case](https://www.geeksforgeeks.org/what-is-base-case-in-recursion/). Iterative formulae, not to be confused with [[Iterative calculation]], can be implemented using [tail recursion](https://en.wikipedia.org/wiki/Tail_call). This is the most common use for LAMBDA recursion. However, tail call optimization is not guaranteed in Google Sheets — unlike many functional languages, tail-recursive formulas can still run into [[Calculation limits]]. Other forms of recursion, such as multiple recursion, are even more constrained for the same reason.

### Example

Factorial is a standard illustration. Because Sheets does not guarantee tail call optimization, the call stack grows with input size, limiting this to small values before hitting [[Calculation limits]]:

```gse
=LET(
    fact, LAMBDA(self, n,
        IF(n <= 1, 1, n * self(self, n - 1))
    ),
    fact(fact, 5)
)
→ 120
```

### Prefer REDUCE for iteration

For iterative tasks — accumulating a result across an array — [[REDUCE]] is almost always preferable to LAMBDA recursion. `REDUCE` is purpose-built for iteration, is more readable, and is not subject to the same stack growth. Reserve explicit recursion for problems that are inherently recursive in structure (e.g. tree traversal).

For cases requiring multiple accumulators in `REDUCE`, see [[LAMBDA data structures]].

### See Also

- [[REDUCE]], [[SCAN]], [[MAP]] — functional alternatives that avoid explicit recursion.
- [[Calculation limits]] — stack and function call limits that constrain recursive formulas.
- [[LAMBDA data structures]] — using structured terms as accumulators.
