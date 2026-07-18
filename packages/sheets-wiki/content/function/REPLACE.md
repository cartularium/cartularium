---
name: REPLACE
category: text
syntax: REPLACE(text, position, length, new_text)
status: imported
description: Replaces part of a text string with a different text string.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3098247?hl=en).

Replaces part of a text string with a different text string.

### Sample Usage

```gse
REPLACE("Spreadsheets", 1, 6, "Bed")
```

### Syntax

```gse
REPLACE(text, position, length, new_text)
```

- `text` - The text, a part of which will be replaced.
- `position` - The position where the replacement will begin (starting from 1).
- `length` - The number of characters in the text to be replaced.
- `new_text` - The text which will be inserted into the original text.

### Notes

- This function returns text as the output. If a number is desired, try using the [[VALUE]] function in conjunction with this function.

### See Also

[[REGEXREPLACE]]: Replaces part of a text string with a different text string using regular expressions.

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdElhdkJGYXl4VXZLR3B1TVdjM2VTSkE&amp;output=html" width="100%"></iframe>