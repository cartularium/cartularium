---
name: ISBETWEEN
category: operator
syntax: ISBETWEEN(value_to_compare, lower_value, upper_value, lower_value_is_inclusive, upper_value_is_inclusive)
status: imported
description: "Checks whether a provided number is between two other numbers\_either inclusively or exclusively."
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/10538337?hl=en).

Checks whether a provided number is between two other numbers either inclusively or exclusively.

### Syntax
```gse
ISBETWEEN(value_to_compare, lower_value, upper_value, lower_value_is_inclusive, upper_value_is_inclusive)
```

| Part | Description |
| --- | --- |
| value\_to\_compare | The value to test as being between `lower\_value` and `upper\_value`. |
| lower\_value | The lower boundary of the range of values that `value\_to\_compare` can fall within. |
| upper\_value | The upper boundary of the range of values that `value\_to\_compare` can fall within. |
| lower\_value\_is\_inclusive [optional] | Whether the range of values includes the `lower\_value`. By default this is TRUE |
| upper\_value\_is\_inclusive [optional] | Whether the range of values includes the `upper\_value`. By default this is TRUE |

### Examples

Short description of the example being shown below. Feel free to add more rows and columns to the table below if needed.

| FORMULA | OUTPUT |
| --- | --- |
| =ISBETWEEN(7.9, 1.2, 12.45) | TRUE |
| =ISBETWEEN(1.2, 1.2, 12.45, TRUE) | TRUE |
| =ISBETWEEN(1.2, 1.2, 12.45, FALSE) | FALSE |
| =ISBETWEEN(12.45, 1.2, 12.45, TRUE, TRUE) | TRUE |
| =ISBETWEEN(12.45, 1.2, 12.45, TRUE, FALSE) | FALSE |
| =ISBETWEEN(7.9, 1.2, 12.45, FALSE, FALSE) | TRUE |

### Related functions

- [[GT]]
- [[GTE]]
- [[LT]]
- [[LTE]]