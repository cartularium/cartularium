---
name: TEXTJOIN
category: text
syntax: TEXTJOIN(delimiter, ignore_empty, text1, [text2, ...])
status: imported
description: Combines the text from multiple strings and/or arrays, with a specifiable delimiter separating the different texts.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7013992?hl=en).

Combines the text from multiple strings and/or arrays, with a specifiable delimiter separating the different texts.

### Sample Usage

```gse
TEXTJOIN(“ “, TRUE, “hello”, “world”)
TEXTJOIN(“, ”, FALSE, A1:A5)
```

### Syntax

```gse
TEXTJOIN(delimiter, ignore_empty, text1, [text2, ...])
```

- `delimiter` - A string, possibly empty, or a reference to a valid string. If empty, text will be simply concatenated.
- `ignore_empty` - A boolean; if `TRUE`, empty cells selected in the text arguments won't be included in the result.
- `text1` - Any text item. This could be a string, or an array of strings in a range.
- `text2, ... [OPTIONAL]` - Additional text item(s).

### See Also

[[JOIN]]: Concatenates the elements of one or more one-dimensional arrays using a specified delimiter.

[[CONCATENATE]]: Appends strings to one another.

### Example

|  | A | B |
| --- | --- | --- |
| 1 | **Data** |  |
| 2 | Hello |  |
| 3 | there |  |
| 4 |  |  |
| 5 |  |  |
| 6 | Sheets |  |
|  |  |  |
| 8 | **Result** | **Formula** |
| 9 | Hello there Sheets | =TEXTJOIN(" ", TRUE, A2:A6) |
| 10 | Hello there   Sheets | =TEXTJOIN(" ", FALSE, A2:A6) |