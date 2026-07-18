---
name: LENB
category: text
syntax: LENB(string)
status: imported
description: The LENB function returns the length of a string in bytes.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9367584?hl=en).

The LENB function returns the length of a string in bytes.

Bytes as determined for `B` functions use UTF-16 and count codepoints in the Basic Latin and Latin-1 Supplement blocks as 1 byte (e.g. the first 255 codepoints, `U+0000`–`U+00FF`).

### Syntax
```gse
LENB(string)
```

| Part | Description |
| --- | --- |
| `string` | The string to get the length in bytes |

### Notes

`LENB` returns the same value as `LEN` if the input string has only single byte characters.

### Examples

| A | B | C |
| --- | --- | --- |
| **1** | **Input** | **Formula** | **Output** |
| **2** | Aeñ | `=LENB(A2)` | 3 |
| **3** | Aeñ | `=LEN(A3)` | 3 |
| **4** | `熊本` | `=LENB(A4)` | 4 |
| **5** | `熊本` | `=LEN(A5)` | 2 |

### Related functions

- [[MIDB]]: ​The MIDB function returns a section of a string starting at a given character and up to a specified number of bytes.
- [[LEFTB]]: The LEFTB function returns the left portion of a string up to a certain number of bytes.
- [[RIGHTB]]: The RIGHTB function returns the right portion of a string up to a certain number of bytes.