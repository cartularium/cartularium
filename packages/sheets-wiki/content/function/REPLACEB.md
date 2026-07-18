---
name: REPLACEB
category: text
syntax: REPLACEB(text, position, num_bytes, new_text)
status: imported
description: The REPLACEB function replaces part of a text string, based on a number of bytes, with a different text string.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9367752?hl=en).

The REPLACEB function replaces part of a text string, based on a number of bytes, with a different text string.

### Syntax
```gse
REPLACEB(text, position, num_bytes, new_text)
```

| Part | Description |
| --- | --- |
| `text` | The text, a part of which will be replaced. |
| `position` | The position where the replacement will begin (starting from 1). |
| `num_bytes` | The number of bytes in the text to be replaced. |
| `new_text` | The text which will be inserted into the original text. |

### Notes

- `REPLACEB` returns the same value as `REPLACE` if the input `text` has only single byte characters
- This function returns text as the output. If a number is desired, try using the `VALUE` function in conjunction with this function.

### Examples

| A | B | C |
| --- | --- | --- |
| **1** | **Input** | **Formula** | **Output** |
| **2** | Aeñds | `=REPLACEB(A2, 2, 3,"new")` | Anews |
| **3** | Aeñds | `=REPLACE(A3, 2, 3,"new")` | Anews |
| **4** | `熊本=熊本` | `=REPLACEB(A4, 2, 3,"new")` | 熊new熊本 |
| **5** | `熊本=熊本` | `=REPLACE(A5, 2, 3,"new")` | 熊new本 |

### Related functions

- [[LENB]]: The LENB function returns the length of a string in bytes.
- [[LEFTB]]: The LEFTB function returns the left portion of a string up to a certain number of bytes.
- [[RIGHTB]]: The RIGHTB function returns the right portion of a string up to a certain number of bytes.
- [[MIDB]]:The MIDB function returns a section of a string starting at a given character and up to a specified number of bytes.