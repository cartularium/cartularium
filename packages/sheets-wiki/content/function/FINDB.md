---
name: FINDB
category: text
syntax: FINDB(search_for, text_to_search, [starting_at])
status: imported
description: Returns the byte position at which a string is first found within text.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3296009?hl=en).

> [!WARNING]
> The official documentation gives the following description for `FINDB`:
> > Returns the position at which a string is first found within text counting each double-character as 2.
> 
> Byte counting regarding `B` functions follow slightly different rules than the description would imply.

Returns the byte position at which a string is first found within text.

Bytes as determined for `B` functions use UTF-16 and count codepoints in the Basic Latin and Latin-1 Supplement blocks as 1 byte (e.g. the first 255 codepoints, `U+0000`–`U+00FF`).

### Sample Usage

```gse
FINDB("新", "农历新年", 2)
```

### Syntax

```gse
FINDB(search_for, text_to_search, [starting_at])
```

- `search_for` - The string to look for within `text_to_search`.
- - The text to search for the first occurrence of `search_for`.
- `starting_at` - **[** OPTIONAL - `1` by default **]** - The character position within `text_to_search` at which to start the search.

### Notes

- If `search_for` is not found, the `#VALUE!` error value is returned.
- Ensure that `search_for` and `text_to_search` are not supplied in reverse order, or the `#VALUE!` error will likely be returned. The arguments are supplied in a different order than other text functions such as `SPLIT` and `SUBSTITUTE`.
- It's recommended to use a function such as `IFERROR` to check for cases when there aren't matches to the search.
- Use `FIND` for standard character sets, and `FINDB` for double-byte character sets such as Japanese, Chinese (Simplified), Chinese (Traditional), and Korean.

### See Also

[[FIND]]: Returns the position at which a string is first found within text, case-sensitive.

[[SEARCH]]: Returns the position at which a string is first found within text, ignoring case.

[[SEARCHB]]: Returns the position at which a string is first found within text counting each double-character as 2.

[[REPLACE]]: Replaces part of a text string with a different text string.

[[REGEXREPLACE]]: Replaces part of a text string with a different text string using regular expressions.

[[REGEXMATCH]]: Whether a piece of text matches a regular expression.

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[SPLIT]]: Divides text around a specified character or string, and puts each fragment into a separate cell in the row.