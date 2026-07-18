---
name: DETECTLANGUAGE
category: google
syntax: DETECTLANGUAGE(text_or_range)
status: imported
description: Identifies the language used in text within the specified range.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093278?hl=en).

Identifies the language used in text within the specified range.

### Sample Usage

```gse
DETECTLANGUAGE(A2:A7)
DETECTLANGUAGE("Bonjour")
DETECTLANGUAGE(A2)
```

### Syntax

```gse
DETECTLANGUAGE(text_or_range)
```

- `text_or_range` - The text or reference to cells containing text to evaluate.

  + If `text_or_range` is specified as a range, it must be a one-dimensional column range.

### Notes

- If the range specified contains multiple languages, the first text found will be evaluated.

### See Also

[[GOOGLETRANSLATE]]: Translates text from one language into another.

### Examples

Accepts both in-cell string and cell reference as the parameters and returns the language code.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHUwS0tkZUYwY0dfUXJvUFk1cW1xR0E&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

Edge cases .

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHUwS0tkZUYwY0dfUXJvUFk1cW1xR0E&amp;single=true&amp;gid=1&amp;output=html&amp;widget=true" width="500"></iframe>