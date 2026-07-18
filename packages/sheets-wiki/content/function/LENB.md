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

### Engine compatibility

The `*B` byte functions are locale-dependent by design: a character counts as 2 bytes only under a double-byte (DBCS) language — Japanese, Chinese, Korean — and otherwise behaves like plain `LEN`. This makes `LENB` of a CJK character split across engines. Testing `=LENB("あ")` (one hiragana character):

| Engine | Behavior |
| --- | --- |
| Google Sheets | `2` — counts the CJK character as two bytes (matching this page's `熊本` examples). |
| Excel | `1` in a Western (single-byte) locale, where `LENB` collapses to `LEN`; `2` in a DBCS-language locale (live Excel probe, 2026-07-11, Western locale). |
| Lattice | `2` — always uses the DBCS model, closest to a Japanese-locale Excel (assay: LENB/lenb-dbcs). |
| formulas | `1` — mirrors Western-locale Excel (live probe, 2026-07-11). |
| HyperFormula | `#NAME?` — the `*B` family is not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> `LENB` of the same string returns 1 in an English-locale Excel and 2 in a Japanese-locale Excel, so any cross-engine or cross-locale comparison of `*B` results is inherently fragile. The family is absent from HyperFormula, IronCalc, and pycel — prefer the non-`B` functions unless DBCS byte counting is specifically needed.

### Related functions

- [[MIDB]]: ​The MIDB function returns a section of a string starting at a given character and up to a specified number of bytes.
- [[LEFTB]]: The LEFTB function returns the left portion of a string up to a certain number of bytes.
- [[RIGHTB]]: The RIGHTB function returns the right portion of a string up to a certain number of bytes.