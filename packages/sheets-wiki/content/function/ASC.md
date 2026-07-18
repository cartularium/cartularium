---
name: ASC
category: text
syntax: '=ASC(text)'
status: imported
description: The ASC function converts full-width ASCII and Katakana characters to their half-width counterparts.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9061514?hl=en).

The ASC function converts full-width ASCII and Katakana characters to their half-width counterparts.  All standard-width characters remain unchanged by the ASC function.

### Syntax
```gse
=ASC(text)
```

| Part | Description |
| --- | --- |
| `text` | The text to convert to half-width characters. |

### Sample formula

```gse
ASC("カタカナ")
```

### Example

| A | B |
| --- | --- |
| **1** | **Formula** | **Result** |
| **2** | `=ASC(“グーグル”)` | ｸﾞｰｸﾞﾙ |