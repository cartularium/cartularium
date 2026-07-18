---
name: SEARCH
category: text
syntax: SEARCH(search_for, text_to_search, [starting_at])
status: imported
description: Returns the position at which a string is first found within text, ignoring case.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094154?hl=en).

Returns the position at which a string is first found within text, ignoring case.

### Sample Usage

```gse
SEARCH("n",A2)
SEARCH("wood","How much wood can a woodchuck chuck",14)
```

### Syntax

```gse
SEARCH(search_for, text_to_search, [starting_at])
```

- `search_for` - The string to look for within `text_to_search`.
- `text_to_search` - The text to search for the first occurrence of `search_for`.
- `starting_at` - **[** OPTIONAL - `1` by default **]** - The character within `text_to_search` at which to start the search.

### Notes

- `SEARCH` is **not** case-sensitive, meaning that uppercase and lowercase letters do not matter. For example, "abc" will match "ABC". To compare text where case matters, use the [[FIND]] function.
- Ensure that `search_for` and `text_to_search` are not supplied in reverse order, or the `#VALUE!` error will likely be returned. The arguments are supplied in a different order than other text functions such as [[SPLIT]] and [[SUBSTITUTE]].
- It's recommended to use a function such as [[IFERROR]] to check for cases when there aren't matches to the search.

### See Also

[[SUBSTITUTE]]: Replaces existing text with new text in a string.

[[SPLIT]]: Divides text around a specified character or string, and puts each fragment into a separate cell in the row.

[[FIND]]: Returns the position at which a string is first found within text, case-sensitive.

[[IFERROR]]: Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdEczSXdsMDZGdGxVU3dXR0hrNWlQWlE&amp;output=html" width="500"></iframe>