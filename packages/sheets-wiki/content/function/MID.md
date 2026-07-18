---
name: MID
category: text
syntax: MID(string, starting_at, extract_length)
status: imported
description: Returns a segment of a string.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094129?hl=en).

Returns a segment of a string.

### Sample Usage

```gse
MID("get this",5,4)
MID(A2,3,5)
```

### Syntax

```gse
MID(string, starting_at, extract_length)
```

- `string` - The string to extract a segment from.
- `starting_at` - The index from the left of `string` from which to begin extracting. The first character in `string` has the index 1.
- `extract_length` - The length of the segment to extract.

  + If the end of `string` is reached before `extract_length` characters are encountered, `MID` returns the characters from `starting_at` to the end of `string`.

### Notes

- To return the contents from `starting_at` to the end of `string`, use [[LEN]] to calculate the length of the string that will be returned rather than simply specifying a large number for `extract_length`.
- To return the contents of `string` beginning with a particular character or sub-string, use [[SEARCH]] to locate the index of the desired point.

### See Also

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[SPLIT]]: Divides text around a specified character or string, and puts each fragment into a separate cell in the row.

[[SEARCH]]: Returns the position at which a string is first found within text, ignoring case.

[[RIGHT]]: Returns a substring from the end of a specified string.

[[LEFT]]: Returns a substring from the beginning of a specified string.

[[LEN]]: Returns the length of a string.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdE94amh6ZzRvSHBLeXZUZ0pjakdPV0E&amp;output=html" width="500"></iframe>