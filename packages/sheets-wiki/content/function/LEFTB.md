---
name: LEFTB
category: text
syntax: LEFTB(string, num_of_bytes)
status: imported
description: The LEFTB function returns the left portion of a string up to a certain number of bytes.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9367470?hl=en).

The LEFTB function returns the left portion of a string up to a certain number of bytes.

Bytes as determined for `B` functions use UTF-16 and count codepoints in the Basic Latin and Latin-1 Supplement blocks as 1 byte (e.g. the first 255 codepoints, `U+0000`–`U+00FF`).

### Syntax
```gse
LEFTB(string, num_of_bytes)
```

| Part | Description |
| --- | --- |
| `string` | The string from which the left portion will be returned. |
| `num_of_bytes` | (Optional) The number of bytes to return from the left side of `string`. |

### Notes

- `LEFTB` returns the same value as `LEFT` if the input string has only single byte characters
- `num_of_bytes` must be greater than or equal to zero.
- If `num_of_bytes` is greater than the length of text in bytes, `LEFTB` returns all of text.
- If `num_of_bytes` is omitted, it is assumed to be 1.

### Examples

| A | B | C |
| --- | --- | --- |
| **1** | **Input** | **Formula** | **Output** |
| **2** | Aeñ | `=LEFTB(A2, 2)` | Ae |
| **3** | Aeñ | `=LEFT(A3,2)` | Ae |
| **4** | `熊本` | `=LEFTB(A4, 2)` | 熊 |
| **5** | `熊本` | `=LEFT(A5,2)` | 熊本 |

### Related functions

- [[MIDB]]: ​The MIDB function returns a section of a string starting at a given character and up to a specified number of bytes.
- [[RIGHTB]]: The RIGHTB function returns the right portion of a string up to a certain number of bytes.
- [[LENB]]: The LENB function returns the length of a string in bytes.