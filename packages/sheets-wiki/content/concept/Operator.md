---
tags:
  - terminology
---

Operators are a type of function that take one or two operands and return a value. Operators are typically [syntactic sugar](https://en.wikipedia.org/wiki/Syntactic_sugar) for underlying primitive functions (with the notable exceptions of `.` and `%`). Such primitives are rarely seen and using them is generally [[bad practice]].

### Syntax

Unlike normal functions, operators generally separate their arguments using the form `[argument] operator argument`. For example, the `MULTIPLY` function can also be represented using the `*` operator. Thus, `MULTIPLY(3,5)` is functionally the same as `3 * 5`.

### Math Operators

| Operator | Function Equivalent | Description                                    |
| -------- | ------------------- | ---------------------------------------------- |
| `+`      | [[ADD]]                | Adds numbers together                          |
| `-`      | [[MINUS]]             | Subtracts one number from another              |
| `*`      | [[MULTIPLY]]          | Multiplies numbers                             |
| `/`      | [[DIVIDE]]           | Divides one number by another                  |
| `^`      | [[POW]] or [[POWER]]       | Raises a number to the power of another number |
| `%`      | None                | Converts a number to a percentage              |

### Comparators

Comparators are a special class of operator.

| Operator | Function | Semantic                 | Description                                                      |
| -------- | -------- | ------------------------ | ---------------------------------------------------------------- |
| `=`      | [[EQ]]     | Equal to                 | Check if two things are the same. Case insensitive.              |
| `<>`     | [[NE]]     | Not equal to             | Check if two things are not the same. Case insensitive.          |
| `<`      | [[LT]]     | Less than                | Check if the first value is less than the second.                |
| `<=`     | [[LTE]]    | Less than or equal to    | Check if the first value is less than or equal to the second.    |
| `>`      | [[GT]]     | Greater than             | Check if the first value is greater than the second.             |
| `>=`     | [[GTE]]    | Greater than or equal to | Check if the first value is greater than or equal to the second. |

### Other

| Operator | Function    | Description                            |
| -------- | ----------- | -------------------------------------- |
| `:`      | [[REFERENCE]] | Creates a range between two references |
| `&`      | [[CONCAT]]    | Concatenates two strings               |
| `.` |  None | Extracts data from a [[smart chip]] |