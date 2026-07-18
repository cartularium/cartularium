---
tags:
  - function
  - terminology
---

> [!INFO]
> sheets.wiki is a reference, not a guidebook. For tutorials and applied examples, see the blog or linked `Guides`.


Google Sheets currently has over 500 documented functions and numerous #undocumented functions. Functions are comprised of [[Term#Primitive functions|primitive functions]], [[LAMBDA]] functions, and [[Operator|operators]]. Functions form the foundation of expression syntax and are used to manipulate, transform, and compute data.

Alongside [[Operator|operators]] and [[LAMBDA]] expressions, functions are one of three primary [[Term#Callable terms|callable terms]] in Sheets.

Generally speaking, most advanced users learn functions through one of two methods. The first is by by raw experience. The second, championed by [[Matt King]], involves going through the full list of functions and trying to understand each one.

### Function Categories

| Category | Description |
|-----------|-------------|
| **[[Term#Primitive function|Primitive functions]]** | Built-in Sheets functions such as `SUM`, `FILTER`, or `VLOOKUP`. |
| **[[LAMBDA]] functions** | User-defined callable terms created using `LAMBDA`, `MAP`, `REDUCE`, and related constructs. |
| **[[Operator|Operators]]** | Symbolic primitives (e.g., `+`, `-`, `&`) representing shorthand function calls. |

Each produces a value when evaluated.

### Learning Functions

Advanced users tend to learn functions in two ways:

1. **Empirical** — through experimentation and formula construction.  
2. **Systematic** — popularized by [[Matt King]], who advocates reviewing the entire function list to understand each function’s scope, typing, and coercion.

### Functional Complexity

Functions vary by syntax and conceptual depth. They can be grouped broadly by complexity:

#### Basic Functions

Operate on simple arguments and return single values.

- [[SUM]], [[AVERAGE]], [[MIN]], [[MAX]], [[COUNT]]

These are straightforward and easily nested.

#### Intermediate Functions

Accept or return [[Array|arrays]] and often depend on array dimensionality.

- [[FILTER]], [[SORT]], [[VLOOKUP]], [[INDEX]], [[MATCH]]

They are central to tabular computation and relational lookups.

#### Advanced Functions

Use complex syntax or enable extended functionality.

| Category | Description |
|-----------|-------------|
| [[REGEX functions]] | Pattern matching and text manipulation. |
| [[QUERY]] | SQL-like transformation of [[Table|tabular]] data. |
| [[LAMBDA]] | Functional abstraction, recursion, and [[LAMBDA recursion]]. |
| [[IMPORT functions]] | Retrieve and process web data. |

### Function Behavior and Typing

Each function defines its own typing and coercion rules under the broader [[Data type|type system]]. Examples:

- `JOIN(,1,2,3)` coerces numeric values to strings.  
- `FILTER(A1:A,"foo")` returns `#VALUE!` when coercion fails.

Understanding a function requires understanding both its **input coercion** and **output type**.

### Notes

- [[Volatile]] functions (such as `RAND`) recalculate on every sheet change.  

### See Also

- [[Operator|Operators]] — symbolic functions such as `+`, `&`, and `^`.  
- [[LAMBDA]] — user-defined function construction.  
- [[Data type|Data types]] and [[Type Coercion]] — how functions interpret and convert values.  

