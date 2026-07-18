---
title: Array-enabled functions
description: Explains array iteration and lists array-enabling functions.
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

"Array-enabled" refers to a specific behavior where a function iterates over a [[Array#Range|range]] or [[Array#Virtual array|virtual array]] of values provided as an argument, evaluating the expression for each item individually.

### Concepts

It is important to distinguish between "array-enabling functions" and functions that "can be array-enabled."

- Array-enabling functions: A specific, small set of functions that generally force their arguments to be evaluated for each item in a range or virtual array.
- Functions that can be array-enabled: A large category of functions (like [[LEN]], [[REGEXEXTRACT]], `&`, `+`) that normally accept only [[Data type#Scalar types|scalar]] (single) values but, when wrapped in an array-enabling function, can process arrays.
    - This includes most [[Operator|operators]] (such as `+`, `-`, `*`, `/`, `&`).

### Distinctions

#### vs array formulae
The term "array formula" is often used broadly, but strictly speaking, it refers to any formula that outputs an [[Array|array]] of values, regardless of how it processes inputs. An array-enabled function often results in an array formula, but the term "array-enabled" specifically describes how the function handles its arguments.

When inputs of different dimensions are provided (such as a row vector and a column vector), array-enabled functions typically broadcast the inputs to form a result that encompasses both dimensions (e.g., an $m \times n$ matrix). This contrasts with standard scalar functions, which would return an error or only process the first value.

### Implicit intersection

When a function that can be array-enabled is provided with an array argument but is not wrapped in an array-enabling function, it attempts to return a single value based on the input type and the formula's position:

- [[Array#Virtual array|Virtual array]]: It simply returns the top-left value, similarly to [[SINGLE]].
- [[Array#Range|Range]]: It checks for an intersection with the formula's row or column.
    - Intersection: If the range intersects, it returns the value from that intersection.
    - No Intersection: If the range does not intersect, it returns an error:
        > A matching value could not be found. To get the values for the entire range use the ARRAYFORMULA function.

#### vs `ARRAYFORMULA`
[[ARRAYFORMULA]] is the most common and explicit array-enabling function. Its sole purpose is to enable this iterative evaluation behavior. However, it is not the only function that does this. Other functions, like [[INDEX]], are also array-enabling, often as a side effect of their primary purpose.

### Array-enabling functions

The following functions are "array-enabling." They can be used to wrap other expressions to force array evaluation.

1. [[ARRAYFORMULA]]: The standard function for enabling array iteration.
2. [[INDEX]]: Often used as a shorthand for `ARRAYFORMULA` because it is shorter to type.
3. [[SORT]]: Enabling array evaluation is necessary for it to sort the resulting array.
4. [[FILTER]]: Enabling array evaluation allows it to filter based on the calculated criteria.
5. [[SUMPRODUCT]]: Designed to work with arrays, providing this behavior implicitly.

### Examples

#### Using `INDEX` as a wrapper

`INDEX` is frequently used by advanced users to avoid the verbose `ARRAYFORMULA`.

```gse
=INDEX(A:A * 2)
```

Is functionally equivalent to:

```gse
=ARRAYFORMULA(A:A * 2)
```

In both cases, the multiplication operation `*` (which is a function that *can be array-enabled*) is forced to iterate over every value in column A.
