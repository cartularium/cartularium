---
name: CHOOSE
category: lookup
syntax: CHOOSE(index, choice1, [choice2, ...])
status: imported
description: Returns an element from a list of choices based on index.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093371?hl=en).

Returns an element from a list of choices based on index.

### Sample Usage

```gse
CHOOSE(2,"A","B","C")
```

### Syntax

```gse
CHOOSE(index, choice1, [choice2, ...])
```

- `index` - Which choice (of the up to 29 provided) to return.

  + If `index` is zero, negative, or greater than the number of choices provided, the `#NUM!` error is returned.
- `choice1` - A potential value to return. Required. May be a reference to a cell or an individual value.
- `choice2, ...` - Additional values among which to choose.

### Engine compatibility

An in-range `CHOOSE` agrees everywhere (`=CHOOSE(1, "a", "b", "c")` is `"a"`). Every engine also errors on an out-of-range index — they only disagree on the error *code*. Testing `=CHOOSE(5, "a", "b", "c")`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | `#NUM!` — index outside the numeric domain of choices (matches this page's Syntax note). |
| Excel | `#VALUE!` — index treated as an invalid value (live Excel probe, 2026-07-11). |
| formulas | `#VALUE!` (live probe, 2026-07-11). |
| IronCalc | `#VALUE!` (live probe, 2026-07-11). |
| pycel | `#VALUE!` (live probe, 2026-07-11). |
| Lattice | `#VALUE!`. |
| HyperFormula | `#NUM!` — same as Google Sheets (live probe, 2026-07-11). |

> [!INFO]
> Both `#VALUE!` and `#NUM!` are defensible readings of an out-of-range index; the split is real but harmless if you catch it with [[IFERROR]]. Code that branches on the specific error code is not portable between Google Sheets/HyperFormula and the Excel family.

### See Also

[[OFFSET]]: Returns a range reference shifted a specified number of rows and columns from a starting cell reference.

### Examples

Uses an `index` to return a value from the specified list of up to 30 values.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHJkb3NhRDF5MWhyNGQyemdwZ2YwM1E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>