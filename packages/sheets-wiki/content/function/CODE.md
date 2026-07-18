---
name: CODE
category: text
syntax: CODE(string)
status: imported
description: Returns the numeric Unicode map value of the first character in the string provided.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094122?hl=en).

Returns the numeric Unicode map value of the first character in the string provided.

### Sample Usage

```gse
CODE("a")
CODE(A1)
```

### Syntax

```gse
CODE(string)
```

- `string` - The string whose first character's Unicode map value will be returned.

### Notes

- Only the first character in `string` will be evaluated; others will be ignored.

### See Also

[[CHAR]]: Convert a number into a character according to the current Unicode table.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHZsekpWblNrbDh5aGhmd3NnUmFWa3c&amp;output=html" width="500"></iframe>