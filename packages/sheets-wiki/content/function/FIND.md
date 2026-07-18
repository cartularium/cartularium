---
name: FIND
category: text
syntax: FIND(search_for, text_to_search, [starting_at])
status: imported
description: Returns the position at which a string is first found within text, case-sensitive.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094126?hl=en).

Returns the position at which a string is first found within text, case-sensitive.

### Sample Usage

```gse
FIND("n",A2)
FIND("wood","How much wood can a woodchuck chuck",14)
```

### Syntax

```gse
FIND(search_for, text_to_search, [starting_at])
```

- `search_for` - The string to look for within `text_to_search`.
- `text_to_search` - The text to search for the first occurrence of `search_for`.
- `starting_at` - **[** OPTIONAL - `1` by default **]** - The character within `text_to_search` at which to start the search.

### Notes

- `FIND` is case-sensitive, meaning that uppercase and lowercase letters matter. For example, "abc" will not match "ABC". To ignore case, use the [[SEARCH]] function.
- Ensure that `search_for` and `text_to_search` are not supplied in reverse order, or the `#VALUE!` error will likely be returned. The arguments are supplied in a different order than other text functions such as [[SPLIT]] and [[SUBSTITUTE]].
- It's recommended to use a function such as [[IFERROR]] to check for cases when there aren't matches to the search.
- If the pattern you're searching for isn't found, `#VALUE!` is returned.

### See Also

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[SPLIT]]: Divides text around a specified character or string, and puts each fragment into a separate cell in the row.

[[SEARCH]]: Returns the position at which a string is first found within text, ignoring case.

[[IFERROR]]: Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdC01cjBRdUxydGJ2Q0JpTkl0U0pwUVE&amp;output=html" width="500"></iframe>