---
name: XMATCH
category: uncategorized
syntax: XMATCH(search_key, lookup_range, [match_mode], [search_mode])
status: imported
description: XMATCH returns the relative position of an item in an array or range that matches a specified value.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/12406049?hl=en).

`XMATCH` returns the relative position of an item in an array or range that matches a specified value. `XMATCH`:

- Supports enhanced match and search functionality
- Allows wildcard matches with a question mark (?) or asterisk (\*)

### Sample usage

```gse
XMATCH("Apple", A2:A)
XMATCH("Price", A2:A)
```

### Syntax

```gse
XMATCH(search_key, lookup_range, [match_mode], [search_mode])
```

- `search_key`: The value to search for. For example, `42`, `"Cats"`, or `B24`.
- `lookup_range`: The range to consider for the search. This range must be a singular row or column.
- `match_mode`: [OPTIONAL: `0` by default] The manner in which to find a match for the `search_key`.
  + `0` is for an exact match.
  + `1` is for an exact match or the next value that's greater than the `search_key`.
  + `-1` is for an exact match or the next value that's lesser than the `search_key`.
  + `2` is for a wildcard match.
- `search_mode`: [OPTIONAL: `1` by default] The manner in which to search through the lookup range.
  + `1` is to search from the first entry to the last.
  + `-1` is to search from the last entry to the first.
  + `2` is to search through the range with binary search. The range needs to be sorted in ascending order first.
  + `-2` is to search through the range with binary search. The range needs to be sorted in descending order first.

### Examples

Lookup table for all examples.

![Lookup table for all examples.](https://storage.googleapis.com/support-kms-prod/vfiOaTPuSc9E1BGBeUe9b3HznaPjucSbwnER)

`XMATCH` on Sales rep column with `match_mode` and `search_mode` omitted.

![XMATCH on Sales rep column with match_mode and search_mode omitted.](https://storage.googleapis.com/support-kms-prod/I51zhYvwwXyKgSLvyMlrz8RqgQtUA38rxyZv)

`XMATCH` for Total Amount sold with `match_mode` = `0` and `search_mode` = `1` and `-1`.

![XMATCH for Total Amount sold with match_mode = 0 and search_mode = 1 and -1.](https://storage.googleapis.com/support-kms-prod/rNg3XLnmNx4kz3pR2RzIW3RYrFkKAqPdgZso)

`XMATCH` with horizontal matching.

![XMATCH with horizontal matching.](https://storage.googleapis.com/support-kms-prod/hss2bEOjYpOKIuDFrx5ITWIt1fURJYsBuUKz)

`XMATCH` with `match_mode` = `1` and `match_mode` = `-1` and `search_mode` omitted.

![XMATCH with match_mode = 1 and match_mode = -1 and search_mode omitted.](https://storage.googleapis.com/support-kms-prod/zPfF7mcLwj5T3PGxFYCxP2IwY1gEwuS85s7x)

### Related functions

- [[XLOOKUP]]
- [[MATCH]]