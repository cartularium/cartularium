---
name: LEN
category: text
syntax: LEN(text)
status: imported
description: Returns the length of a string.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094081?hl=en).

Returns the length of a string.

### Sample Usage

```gse
LEN(A2)
LEN("lorem ipsum")
```

### Syntax

```gse
LEN(text)
```

- `text` - The string whose length will be returned.

### Notes

- `LEN` counts all characters, even spaces and nonprinting characters. In cases where `LEN` returns unexpected values, ensure that there are no such characters in `text`.

### See Also

[[LEFT]]: Returns a substring from the beginning of a specified string.

[[RIGHT]]: Returns a substring from the end of a specified string.

[[MID]]: Returns a segment of a string.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGFBTm83Ukt5YXlLVXVZMTdCZ0dpcGc&amp;output=html" width="500"></iframe>