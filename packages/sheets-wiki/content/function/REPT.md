---
name: REPT
category: text
syntax: REPT(text_to_repeat, number_of_repetitions)
status: imported
description: Returns specified text repeated a number of times.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094134?hl=en).

Returns specified text repeated a number of times.

### Sample Usage

```gse
REPT("ha",4)
REPT(A2,3)
```

### Syntax

```gse
REPT(text_to_repeat, number_of_repetitions)
```

- `text_to_repeat` - The character or string to repeat.
- `number_of_repetitions` - The number of times `text_to_repeat` should appear in the value returned.

  + The `number_of_repetitions` can’t exceed the character limit of a cell, 32,000 characters. If `number_of_repetitions` is greater than 32,000 characters, REPT will return a `#VALUE!` error.

### Notes

- `REPT` does not insert spaces between repetitions of `text_to_repeat`. If spaces are desired, a space must be appended to the end of the value of `text_to_repeat`. The resulting return value from `REPT` will have at least one trailing space, which may be removed with [[TRIM]].

### See Also

[[TRIM]]: Removes leading, trailing, and repeated spaces in text.

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[SPLIT]]: Divides text around a specified character or string, and puts each fragment into a separate cell in the row.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdENhc0ppdjdVRHZINElRQnB4RS13Y0E&amp;output=html" width="500"></iframe>