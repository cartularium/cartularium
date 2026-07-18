---
name: TRIM
category: text
syntax: TRIM(text)
status: imported
description: Removes leading, trailing, and repeated spaces in text.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094140?hl=en).

Removes leading, trailing, and repeated spaces in text.

### Sample Usage

```gse
TRIM(" lorem ipsum")
TRIM(A2)
```

### Syntax

```gse
TRIM(text)
```

- `text` - The string or reference to a cell containing a string to be trimmed.

### Notes

- Google Sheets trims text input into cells by default.
- It is important to use `TRIM` when text is used in formulas or data validation because spaces in front of or after the text are significant.
- `TRIM` removes all spaces in a text string, leaving just a single space between words.
- Whitespace or non-breaking space will not be trimmed.

### See Also

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[REPLACE]]: Replaces part of a text string with a different text string.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdG1xd21mTkRHbHYtVHgxTU5CTnNTMEE&amp;output=html" width="500"></iframe>