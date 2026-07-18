---
name: REGEXREPLACE
category: text
syntax: REGEXREPLACE(text, regular_expression, replacement)
status: imported
description: Replaces part of a text string with a different text string using regular expressions.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3098245?hl=en).

Replaces part of a text string with a different text string using regular expressions.

### Sample Usage

```gse
REGEXREPLACE("Spreadsheets", "S.*d", "Bed")
```

### Syntax

```gse
REGEXREPLACE(text, regular_expression, replacement)
```

- `text` - The text, a part of which will be replaced.
- `regular_expression` - The regular expression. All matching instances in `text` will be replaced.
- `replacement` - The text which will be inserted into the original text.

### Notes

- Google products use RE2 for regular expressions. Google Sheets supports RE2 except Unicode character class matching.  Learn more on [how to use RE2 expressions](https://github.com/google/re2/blob/master/doc/syntax.txt).
- This function only works with text (not numbers) as input and returns text as output. If a number is desired as the output, try using the [[VALUE]] function in conjunction with this function. If numbers are used as input, convert them to text using the [[TEXT]] function.

### See Also

[[REGEXEXTRACT]]: Extracts the first matching substrings according to a regular expression.

[[REGEXMATCH]]: Whether a piece of text matches a regular expression.

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[REPLACE]]: Replaces part of a text string with a different text string.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGFUTDhRTFVRUkpWZmp0emhOSm1yd0E&amp;output=html" width="500"></iframe>