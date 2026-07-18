---
tags:
  - concept
  - terminology
---

Wildcards are special characters that enable "fuzzy" text matching in supported functions. They allow matching against patterns rather than exact values.

### The Three Wildcards

| Character | Name | Matches |
|-----------|------|---------|
| `*` | Asterisk | Zero or more characters |
| `?` | Question mark | Any single character |
| `~` | Tilde | Literal wildcard character (escape) |

Use the tilde to match a literal wildcard: `~*` matches a literal asterisk, `~?` matches a literal question mark, and `~~` matches a literal tilde.

### Examples

```
=COUNTIF(A1:A10, "*ing")       ' matches anything ending in "ing"
=COUNTIF(A1:A10, "???")        ' matches exactly 3-character strings
=COUNTIF(A1:A10, "~?")         ' matches the literal character "?"
=SUMIF(A1:A10, "report*", B1:B10)  ' sums where column A starts with "report"
```

### Supported Functions

Wildcards work in text-matching contexts for: [[COUNTIF]], [[COUNTIFS]], [[SUMIF]], [[SUMIFS]], [[AVERAGEIF]], [[AVERAGEIFS]], [[MAXIFS]], [[MINIFS]], [[MATCH]], [[XMATCH]], [[SEARCH]], [[VLOOKUP]], [[HLOOKUP]], [[XLOOKUP]].

### Important Limitation

Wildcards only work with **text**, not numbers. To match numeric values with conditions, use comparison operators (`>`, `<`, `=`) instead.

### Comparison with Excel

Wildcard behavior is identical in Google Sheets and Excel. The same three characters (`*`, `?`, `~`) apply in both, and they work in the same set of functions.

### See Also

- [[SEARCH]] — case-insensitive substring matching (also accepts wildcards).
- [[REGEXMATCH]] — full regular expression matching as an alternative to wildcards.
- [[COUNTIF]] — most common context for wildcard usage.
