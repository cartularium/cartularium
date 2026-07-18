---
name: ACOS
category: math
syntax: ACOS(value)
status: imported
description: The ACOS function returns the inverse cosine of a value in radians.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093461?hl=en).

The ACOS function returns the inverse cosine of a value in radians.

### Sample Usage

```gse
ACOS(0)
ACOS(A2)
ACOS(1)
```

### Syntax

```gse
ACOS(value)
```

- `value` - The value for which to calculate the inverse cosine. Must be between `-1` and `1`, inclusive.

### Notes

- Use the `DEGREES` function to convert the result of `ACOS` into degrees.
- Cosine is periodic, therefore there are many solutions to the inverse. `ACOS` returns the solution between 0 and Pi.

### See Also

[[TANH]]: The TANH function returns the hyperbolic tangent of any real number.

[[TAN]]: The TAN function returns the tangent of an angle provided in radians.

[[SINH]]: The SINH function returns the hyperbolic sine of any real number.

[[SIN]]: The SIN function returns the sine of an angle provided in radians.

[[RADIANS]]: The RADIANS function converts an angle value in degrees to radians.

[[PI]]: The PI function returns the value of pi to 9 decimal places.

[[DEGREES]]: The DEGREES function converts an angle value in radians to degrees.

[[COSH]]: The COSH function returns the hyperbolic cosine of any real number.

[[COS]]: The COS function returns the cosine of an angle provided in radians.

[[ATANH]]: The ATANH function returns the inverse hyperbolic tangent of a number.

[[ATAN2]]: The ATAN2 function returns the angle between the x-axis and a line segment from the origin (0,0) to the specified coordinate pair (`x`,`y`), in radians.

[[ATAN]]: The ATAN function returns the inverse tangent of a value in radians.

[[ASINH]]: The ASINH function returns the inverse hyperbolic sine of a number.

[[ASIN]]: The ASIN function returns the inverse sine of a value in radians.

[[ACOSH]]: The ACOSH function returns the inverse hyperbolic cosine of a number.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdFVIbDRaeTJ0U0d6UEM1YTdxcmdmcWc&amp;output=html" width="500"></iframe>