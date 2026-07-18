---
name: REGEXMATCH
category: text
syntax: REGEXMATCH(text, regular_expression)
status: imported
description: Whether a piece of text matches a regular expression.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3098292?hl=en).

Whether a piece of text matches a regular expression.

### Sample Usage

```gse
REGEXMATCH("Spreadsheets", "S.r")
```

### Syntax

```gse
REGEXMATCH(text, regular_expression)
```

- `text` - The text to be tested against the regular expression.
- `regular_expression` - The regular expression to test the text against.

### Notes

- Google products use RE2 for regular expressions. Google Sheets supports RE2 except Unicode character class matching. Learn more on [how to use RE2 expressions](https://github.com/google/re2/blob/master/doc/syntax.txt).
- This function only works with text (not numbers) as input and returns a logical value, i.e. `TRUE` or `FALSE`, as output. If numbers are used as input, convert them to text using the [[TEXT]] function.

### See Also

[[REGEXEXTRACT]]: Extracts the first matching substrings according to a regular expression.

[[REGEXREPLACE]]: Replaces part of a text string with a different text string using regular expressions.

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[REPLACE]]: Replaces part of a text string with a different text string.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdF95dWZQSjVxT016cHZIbFE1WGFnN0E&amp;output=html" width="500"></iframe>