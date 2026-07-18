---
tags:
  - datatype
  - technique
  - terminology
aliases:
  - LAMBDA UDT
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

While Google Sheets natively supports [[Array|arrays]], [[LAMBDA]] can be used to simulate composite data structures. In this context, "data structure" refers to the computer science concept — organizing multiple values into a single structured term — distinct from the conventional spreadsheet usage, which refers to conventions for arranging information across cells.

### LAMBDA UDTs

A *user-defined type* (UDT) combines fields into a single [[Term|term]] using closure. The general form uses [[LAMBDA]] and [[CHOOSE]]:

```gse
LAMBDA(i, CHOOSE(i, field_1, field_2, ...))
```

To retrieve a field, apply an index to the term. A constructor pattern makes this ergonomic:

```gse
=LET(
    pair,     LAMBDA(a, b, LAMBDA(i, CHOOSE(i, a, b))),
    instance, pair("hello", 42),
    instance(1)
)
→ "hello"
```

Fields can hold any [[Term|term]] except [[Term#Primitive function|primitive functions]].

UDTs are a niche pattern. [[Calculation limits]] are a significant constraint, as each field access involves a LAMBDA invocation and call costs accumulate quickly.

### State management in REDUCE

The most common practical use of LAMBDA data structures is carrying multiple accumulators in [[REDUCE]]. Without a structured term, `REDUCE` can only maintain a single accumulator value. A pair allows two values to be tracked simultaneously:

```gse
=LET(
    pair, LAMBDA(a, b, LAMBDA(i, CHOOSE(i, a, b))),
    fst,  LAMBDA(p, p(1)),
    snd,  LAMBDA(p, p(2)),
    result, REDUCE(
        pair(0, 0),
        A1:A10,
        LAMBDA(acc, x, pair(fst(acc) + x, snd(acc) + 1))
    ),
    fst(result) / snd(result)
)
```

This computes the average of `A1:A10` while tracking sum and count simultaneously — without [[LAMBDA recursion]].

### Complex data structures

More complex structures such as linked lists and binary search trees can be implemented using UDTs, but these are LAMBDA-intensive, heavily constrained by [[Calculation limits]], and are rarely practical. Community implementations include:

- [Singly-Linked List](https://docs.google.com/spreadsheets/d/1NCpS9HH_IOQGtYby1qE1h7F5WqvuGFlNiPfXh_zMHFQ/edit?gid=0#gid=0)
- [Doubly-Linked List](https://docs.google.com/spreadsheets/d/1JPlLJjkWFH40drkoQFJsMggoaNqqjdAGyQbxbN3YlP8/edit?gid=0#gid=0)
- [Binary Search Tree](https://docs.google.com/spreadsheets/d/1o4KlsxVrp-ylj3juHKPtLaMJS2xF-CNwkeREYrWd4Jg/edit?gid=0#gid=0)

For higher-level libraries built on these patterns, see [[project/anduin/]] and [[project/container/]].

### See Also

- [[LAMBDA]] — the mechanism that enables user-defined types.
- [[REDUCE]], [[SCAN]] — the most common functions used with LAMBDA data structures.
- [[Calculation limits]] — a key constraint on all LAMBDA-intensive formulas.
