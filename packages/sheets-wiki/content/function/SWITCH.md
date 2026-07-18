---
name: SWITCH
category: logical
syntax: SWITCH(expression, case1, value1, [case2, value2, ...], [default])
status: imported
description: Tests an expression against a list of cases and returns the corresponding value of the first matching case, with an optional default value if nothing else is met.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7013690?hl=en).

Tests an expression against a list of cases and returns the corresponding value of the first matching case, with an optional default value if nothing else is met.

### Sample Usage

```gse
SWITCH(A1:A10, 0, “No”, 1, “Other”)
SWITCH(A3:A8, 4, “Four”, 8, “Eight”)
```

### Syntax

```gse
SWITCH(expression, case1, value1, [case2, value2, ...], [default])
```

- `expression` - Any valid values.
- `case1` - The first case to be checked against `expression`.
- `value1` - The corresponding value to be returned if `case1` matches `expression`.
- `case2, value2, … -` **Optional:** Additional cases and values if the first one doesn’t match the expression.
- `default -` **Optional:**An optional value, specified as the last parameter, to be returned if none of the cases match the expression.

### See Also

[[IFS]]:

Evaluates multiple conditions and returns a value that corresponds to the first true condition.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

### Example 1

|  | A | B | C |
| --- | --- | --- | --- |
| 1 | **Data** | **Result** | **Formula** |
| 2 | 1 | Yes | =SWITCH(A2:A7,0,"No",1,"Yes","Other") |
| 3 | 1 | Yes |  |
| 4 | 2 | Other |  |
| 5 | 0 | No |  |
| 6 | 3 | Other |  |
| 7 | 2 | Other |  |

### Example 2

|  | A | B | C |
| --- | --- | --- | --- |
| 1 | **Grade** | **Passed?** | **Formula** |
| 2 | A | Pass | =SWITCH(A2:A6,"F","Fail","Pass") |
| 3 | B | Pass |  |
| 4 | C | Pass |  |
| 5 | D | Pass |  |
| 6 | F | Fail |  |