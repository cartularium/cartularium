---
name: REGEXEXTRACT
category: text
syntax: REGEXEXTRACT(text, regular_expression)
status: imported
description: Extracts the first matching substrings according to a regular expression.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3098244?hl=en).

Extracts the first matching substrings according to a regular expression.

### Sample Usage

```gse
=REGEXEXTRACT("My favorite number is 241, but my friend's is 17", "\d+")
```

**Tip:**REGEXEXTRACT will return "241" in this example because it returns the first matching case.

### Syntax

```gse
REGEXEXTRACT(text, regular_expression)
```

- `text` - The input text.
- `regular_expression` - The first part of `text` that matches this expression will be returned.

### Capture Groups

It is possible to return multiple results with capture groups. A capture group is a part of a pattern that can be enclosed in parentheses. If there are no capture groups, the function returns the whole match.

### Sample Usage

```gse
=REGEXEXTRACT("You can also extract multiple values from text.”, “You can also (\w+) multiple (\w+) from text.”)
```

**Tip:** The example above will return two columns of data, “extract” in the first and “values” in the second.

### Notes

- Google products use RE2 for [regular expressions](https://support.google.com/docs/answer/62754#regular_expression). Google Sheets supports RE2 except Unicode character class matching. Learn more on [how to use RE2 expressions](https://github.com/google/re2/blob/master/doc/syntax.txt).
- This function only works with text (not numbers) as input and returns text as output. If a number is desired as the output, try using the [[VALUE]] function in conjunction with this function. If numbers are used as input, convert them to text using the [[TEXT]] function.

### Engine compatibility

`REGEXEXTRACT` originated in Google Sheets; Microsoft added it to Excel in 2024. Only Excel, Google Sheets, and Lattice implement it. The sharpest divergence is over **capture groups** — the same formula returns different things in Excel versus Google Sheets. Testing `=REGEXEXTRACT("2025-03-01", "(\d{4})-(\d{2})-(\d{2})")`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | Returns the capture groups by default, spilling `["2025","03","01"]` as a row. |
| Excel | Returns the *entire match* `"2025-03-01"` and ignores the parentheses; group extraction is exposed only through its optional `return_mode` argument, where `return_mode=2` spills the capture groups (live Excel probe, 2026-07-11). |
| Lattice | Follows Google Sheets semantics — returns the capture groups (assay: REGEXEXTRACT, capture-group cases). |
| formulas | Blank cell — `REGEXEXTRACT` is not implemented (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

When the pattern has no capture groups (or the single group equals the full match), Excel, Google Sheets, and Lattice coincide, and the inline `(?i)` case-insensitivity flag is honored by all three. A no-match is `#N/A` on all three.

> [!INFO]
> Migrating a capture-group `REGEXEXTRACT` in either direction silently changes results. To get capture groups in Excel, pass `return_mode`; to get the full match in Google Sheets, avoid parentheses (use a non-capturing group).

### See Also

[[REGEXMATCH]]: Whether a piece of text matches a regular expression.

[[REGEXREPLACE]]: Replaces part of a text string with a different text string using regular expressions.

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[REPLACE]]: Replaces part of a text string with a different text string.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFkxS1NreG5VSDVFOWlCTWVDU3dUWlE&amp;output=html" width="500"></iframe>