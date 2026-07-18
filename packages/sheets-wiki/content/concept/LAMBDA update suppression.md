---
tags:
  - technique
  - function
  - deprecated
aliases:
  - lus
  - query freezing
---
```gse
LAMBDA(volatile, update, volatile)([volatile function], [update condition])
```

> [!WARNING]
> As of 1/6/25, LUS is no longer functional. Please be aware that the information on this page is no longer relevant. This article is kept for archival purposes only.

> [!NOTE]
> This technique was independently discovered by the StackOverflow community, who named this technique QUERY freezing.

[[LAMBDA]] references only recalculate when a change is detected in a cell referenced by the formula. This property overrides the typical volatile property of updating whenever any cell is updated.

Because LUS is [[unstable]], typical use cases relate to temporary randomization and dice rolling.

Like all volatile functions, LUS will cause a desynchronization between the server and client sheets. In order to load the canon server-side value, simply refresh your client.

# Example

```gse
=LAMBDA(x,x)(RANDBETWEEN(1,10))
```

This `RANDBETWEEN` will not update on a cell change. Compare to:

```gse
=RANDBETWEEN(1,10)
```
