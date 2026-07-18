---
name: LEFTB
category: text
syntax: LEFTB(string, num_of_bytes)
status: imported
description: The LEFTB function returns the left portion of a string up to a certain number of bytes.
tags: [modified, undocumented]
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

### Engine compatibility

`LEFTB` takes bytes only under a double-byte (DBCS) locale; in a single-byte (Western) locale it collapses to plain `LEFT`. Testing `=LEFTB("あいう",2)` (take 2 bytes):

| Engine | Behavior |
| --- | --- |
| Google Sheets | `"あ"` — 2 bytes is one CJK character (matching this page's `熊本` example). |
| Excel | `"あい"` in a Western locale, where `LEFTB` collapses to `LEFT` (2 characters); `"あ"` in a DBCS locale (live Excel probe, 2026-07-11, Western locale). |
| Lattice | `"あ"` — always DBCS (assay: LEFTB/leftb-dbcs). |
| formulas | `"あい"` — mirrors Western-locale Excel (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> `LEFTB` cutting a CJK string returns a different number of characters depending on the engine and locale, so it is not portable. The `*B` family is absent from HyperFormula, IronCalc, and pycel.

### Related functions

- [[MIDB]]: ​The MIDB function returns a section of a string starting at a given character and up to a specified number of bytes.
- [[RIGHTB]]: The RIGHTB function returns the right portion of a string up to a certain number of bytes.
- [[LENB]]: The LENB function returns the length of a string in bytes.