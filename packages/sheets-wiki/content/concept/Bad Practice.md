Bad practice is a set of techniques, especially common ones, that result in [[Good practice|otherwise avoidable]] adverse effects.

### Using INDEX+MATCH instead of modern alternatives

`INDEX+MATCH` is a common pattern in Excel, but it is bad practice in Google Sheets. `INDEX` does not support array arguments for its row or column indices, which prevents the formula from producing array output when used inside `ARRAYFORMULA`. Use `XLOOKUP` or `VLOOKUP` instead, as they are more concise and natively support array outputs.

### Using LEN for blank cell detection

Using `LEN(A1)` to check if a cell is empty is less efficient and less semantically clear than `ISBLANK(A1)`. Additionally, `LEN` returns `0` for cells containing empty strings `""`, which are not truly blank.

### Runaway ARRAYFORMULA without controls

Using `ARRAYFORMULA` without output control can generate results across tens of thousands of rows, degrading sheet performance. Modern alternatives such as `TOCOL`, `LET`, and concise filter expressions (`FILTER(col, col<>"")`) often eliminate the need for `ARRAYFORMULA` entirely. When `ARRAYFORMULA` is appropriate, limit its output using `IF(ISBLANK(...))` or `ARRAY_CONSTRAIN`.

### Storing numeric data as text

Storing numbers as text — recognizable by left-alignment in a cell — prevents arithmetic, sorting, and type-aware functions from working correctly. Convert text to numbers using `VALUE()`. Note that dates are stored as numbers internally and do not require special handling, but dates entered as text strings (e.g. `"2024-01-01"`) must be converted using `DATEVALUE()`.

### See Also

- [[Good practice]] — recommended techniques.
- [[Array-enabled functions]] — proper `ARRAYFORMULA` usage.
- [[Type coercion]] — how types are converted.
