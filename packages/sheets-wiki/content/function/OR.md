---
name: OR
category: logical
syntax: OR(logical_expression1, [logical_expression2, ...])
status: imported
description: The OR function returns true if any of the provided arguments are logically true, and false if all of the provided arguments are logically false.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093306?hl=en).

The OR function returns true if any of the provided arguments are logically true, and false if all of the provided arguments are logically false.

### Sample Usage

```gse
OR(A2 = "foo", A3 = "bar")
OR(TRUE,FALSE,TRUE)
OR(A1:A10,B1:B10)
OR(0,1,2,3)
```

### Syntax

```gse
OR(logical_expression1, [logical_expression2, ...])
```

- `logical_expression1` - An expression or reference to a cell containing an expression that represents some logical value, i.e. `TRUE` or `FALSE`, or an expression that can be coerced to a logical value.
- `logical_expression2, ...` - **[** OPTIONAL **]** - Additional expressions or references to cells containing expressions representing some logical values, i.e. `TRUE` or `FALSE`, or expressions that can be coerced to logical values.

### Notes

- The number 0 is logically false; all other numbers (including negative numbers) are logically true.

### See Also

[[NOT]]: Returns the opposite of a logical value - `NOT(TRUE)` returns `FALSE`; `NOT(FALSE)` returns `TRUE`.

[[AND]]: The AND function returns true if all of the provided arguments are logically true, and false if any of the provided arguments are logically false.

### Examples

Returns `TRUE` if at least one argument is `TRUE`, accepts both `logical_value` and range parameter.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdElXSnB5eXpfalNwZDVaQUFnd1Z0LXc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>