---
tags:
  - datatype
---

**String** is the [[Data type|data type]] used for text in Google Sheets. Any sequence of characters that is not interpreted as a number, boolean, or error is treated as a string.

### Characteristics

- **Encoding**: Google Sheets uses [UTF-8](https://en.wikipedia.org/wiki/UTF-8) encoding, allowing for a wide range of international characters and symbols.
- **Literals**: In formulas, strings must be enclosed in double quotes (e.g., `"Hello"`). Literal text entered directly into a cell does not require quotes.
- **Maximum Length**: A single cell can contain up to 50,000 characters.

### String Operators

- **Concatenation (`&`)**: Joins two values into a single string.
  - `="Hello " & "World"` → `"Hello World"`
  - `="Area: " & 51` → `"Area: 51"` (The number 51 is coerced to a string)

### Text vs. Numbers
A common point of confusion is "numeric strings"—text that looks like a number.
- `'123` (leading apostrophe) is a string.
- `="123"` is a string.
- `123` is a number.

Strings cannot be used in mathematical operations without [[Type coercion|coercion]].

### See Also
- [[Data type]] — Overview of the Sheets type system.
- [[Type coercion]] — How strings convert to other types.
- [[TEXT]] — Function to format numbers into strings.
- [[T]] — Function to verify if a value is a string.
