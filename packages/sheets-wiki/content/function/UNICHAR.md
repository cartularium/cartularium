---
name: UNICHAR
category: text
syntax: UNICHAR(number)
status: imported
description: Returns the Unicode character for a number.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9369024?hl=en).

Returns the Unicode character for a number. This method supports returning characters in both the UTF-8 and UTF-16 character set.

### Syntax
```gse
UNICHAR(number)
```

| Part | Description |
| --- | --- |
| `number` | Required. The number to convert into a Unicode character. The number should be greater than 0. |

### Sample formulas

```gse
Example 1: UNICHAR(68) returns D
Example 2: UNICHAR(307) returns \u0133, which may appear as ĳ
```

### Notes

- If number is 0, the method returns a #VALUE error.
- If the number does not have a Unicode character, the method returns a #VALUE error.
- It is possible that the method’s output changes overtime as the Unicode character set is refined.

### Examples

Result for =`UNICHAR(68)`

| A | B |
| --- | --- |
| **1** | D |  |
| **2** |  |  |

Result for =`UNICHAR(307)`

| A | B |
| --- | --- |
| **1** | ij |  |
| **2** |  |  |

### Related functions

- [[UNICODE]]: The `UNICODE` function returns the decimal Unicode value of the first character of the text.