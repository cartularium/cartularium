---
name: CHAR
category: text
syntax: CHAR(table_number)
status: imported
description: Convert a number into a character according to the current Unicode table.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094120?hl=en).

Convert a number into a character according to the current Unicode table.

### Sample Usage

```gse
CHAR(97)
CHAR(HEX2DEC("A3"))
CHAR(A1)
```

### Syntax

```gse
CHAR(table_number)
```

- `table_number` - The number of the character to look up from the current Unicode table in decimal format.

  + `table_number` must be a number in decimal format (base 10). Many tables provide Unicode values in hexadecimal format (base 16). In this case, use the [[HEX2DEC]] function to convert.

### Notes

- The current Unicode table can be found online at the [unicode website](http://www.unicode.org/charts/) or on [Wikipedia](http://en.wikipedia.org/wiki/List_of_Unicode_characters).
- Not all Unicode characters will display properly on all computers and devices. Special fonts or languages may have to be installed or enabled on your computer.

### See Also

[[CODE]]: Returns the numeric Unicode map value of the first character in the string provided.

[[HEX2DEC]]: The HEX2DEC function converts a signed hexadecimal number to decimal format.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHQzZXhjdVdVLUVFRWh1MmhEUmFsVXc&amp;output=html" width="500"></iframe>