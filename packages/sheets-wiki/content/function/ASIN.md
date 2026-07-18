---
name: ASIN
category: math
syntax: ASIN(value)
status: imported
description: The ASIN function returns the inverse sine of a value in radians.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093464?hl=en).

The ASIN function returns the inverse sine of a value in radians.

### Sample Usage

```gse
ASIN(0)
ASIN(A2)
ASIN(1)
```

### Syntax

```gse
ASIN(value)
```

- `value` - The value for which to calculate the inverse sine. Must be between `-1` and `1`, inclusive.

### Notes

- Use the `DEGREES` function to convert the result of `ASIN` into degrees.
- Sine is periodic, therefore there are many solutions to the inverse. `ASIN` returns the solution between -Pi/2 and Pi/2.

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

[[ACOSH]]: The ACOSH function returns the inverse hyperbolic cosine of a number.

[[ACOS]]: The ACOS function returns the inverse cosine of a value in radians.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDNmSkR3djBFeXpOMXE0UmtsZWUybWc&amp;output=html" width="500"></iframe>