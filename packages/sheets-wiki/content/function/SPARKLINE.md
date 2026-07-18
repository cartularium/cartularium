---
name: SPARKLINE
category: google
syntax: SPARKLINE(data, [options])
status: imported
description: Creates a miniature chart contained within a single cell.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093289?hl=en).

Creates a miniature chart contained within a single cell.

### Sample Usage

```gse
SPARKLINE(A1:F1)
SPARKLINE(A2:E2,{"charttype","bar";"max",40})
SPARKLINE(A2:E2,A4:B5)
SPARKLINE(A1:A5, {"charttype","column"; "axis", true; "axiscolor", "red"})
```

### Syntax

```gse
SPARKLINE(data, [options])
```

- `data` - The range or array containing the data to plot.
- `options` - **[** OPTIONAL **]** - A range or array of optional settings and associated values used to customize the chart.

  + If referencing a range, `options` should be two cells wide where the first cell is the option and the second cell is the value that option is set to.
  + The `"charttype"` option defines the type of chart to plot, which includes:

    - `"line"` for a line graph (the default)
    - `"bar"` for a stacked bar chart
    - `"column"` for a column chart
    - `"winloss"` for a special type of column chart that plots 2 possible outcomes: positive and negative (like a coin toss, heads or tails).
  + For line graphs:

    - `"xmin"` sets the minimum value along the horizontal axis.
    - `"xmax"` sets the maximum value along the horizontal axis.
    - `"ymin"` sets the minimum value along the vertical axis.
    - `"ymax"` sets the maximum value along the vertical axis.
    - `"color"` sets the color of the line.
    - `"empty"` sets how to treat empty cells. Possible corresponding values include: `"zero"` or `"ignore"`.
    - `"nan"` sets how to treat cells with non-numeric data. Options are: `"convert"` and `"ignore"`.
    - `"rtl"` determines whether or not the chart is rendered right to left. Options are `true` or `false`.
    - `"linewidth"` determines how thick the line will be in the chart. A higher number means a thicker line.
  + For column and winloss sparklines:

    - `"color"` sets the color of chart columns.
    - `"lowcolor"` sets the color for the lowest value in the chart
    - `"highcolor"` sets the color for the higest value in the chart
    - `"firstcolor"` sets the color of the first column
    - `"lastcolor"` sets the color of the last column
    - `"negcolor"` sets the color of all negative columns
    - `"empty"` sets how to treat empty cells. Possible corresponding values include: `"zero"` or `"ignore"`.
    - `"nan"` sets how to treat cells with non-numeric data. Options are: `"convert"` and `"ignore"`.
    - `"axis"` decides if an axis needs to be drawn (`true`/`false`)
    - `"axiscolor"` sets the color of the axis (if applicable)
    - `"ymin"` sets the custom minimum data value that should be used for scaling the height of columns (not applicable for win/loss)
    - `"ymax"` sets the custom maximum data value that should be used for scaling the height of columns (not applicable for win/loss)
    - `"rtl"` determines whether or not the chart is rendered right to left. Options are `true` or `false`.
  + For bar charts:

    - `"max"` sets the maximum value along the horizontal axis.
    - `"color1"` sets the first color used for bars in the chart.
    - `"color2"` sets the second color used for bars in the chart.
    - `"empty"` sets how to treat empty cells. Possible corresponding values include: `"zero"` or `"ignore"`.
    - `"nan"` sets how to treat cells with non-numeric data. Options are: `"convert"` and `"ignore"`.
    - `"rtl"` determines whether or not the chart is rendered right to left. Options are `true` or `false`.

### Notes

- Colors can be written using their names (e.g., "green") or as a hex code (e.g., "#3D3D3D").
- To modify the color of a line chart, change the font color of the cell.

### See Also

[[IMAGE]]: Inserts an image into a cell.

[[GOOGLEFINANCE]]: Fetches current or historical securities information from Google Finance.