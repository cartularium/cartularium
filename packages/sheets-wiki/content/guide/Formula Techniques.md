---
tags:
  - guide
  - techniques
---

# Formula Techniques

This guide covers practical strategies for building, debugging, and maintaining complex formulas in Google Sheets.

## The Onion Approach

Complex formulas are often difficult to write and even harder to debug. The **Onion Approach** (pioneered by Ben Collins) advocates for building formulas in layers, like an onion.

1. **Start at the Core**: Write the innermost function first (e.g., a simple `INDEX` or `MATCH`). Verify it works.
2. **Add a Layer**: Wrap that function in the next logically required function (e.g., `IFERROR` or `VLOOKUP`).
3. **Test Incrementally**: Check the output after every single addition.
4. **Final Wrap**: Add the outermost "wrapper" functions like `ARRAYFORMULA` or `LAMBDA` last.

**Why it works**: If the formula breaks, you know exactly which layer caused the failure.

## Commenting in Formulas

Google Sheets does not have a native comment syntax within the formula bar, but you can use these functional workarounds.

### The `N()` Function
The `N()` function returns a number. If given a text string, it returns `0`. You can add this to any mathematical formula without changing the result.

```gse
=SUM(A1:A100) + N("Summing the first 100 rows of data")
```

### `LET` Remarks
The [[LET]] function allows you to define variables. You can use this to create "remarks" that serve as documentation for your formula logic.

```gse
=LET(
  rem_a, "Get the average price",
  avg_price, AVERAGE(B2:B10),
  rem_b, "Apply 10% discount",
  avg_price * 0.9
)
```

## Shortcuts & Efficiency

- **Editing**: Press `F2` to quickly enter edit mode for a cell.
- **Multi-line Formulas**: Press `Ctrl + Enter` (or `Cmd + Enter`) inside the formula bar to add a line break. This makes complex `IFS` or `LET` statements much easier to read.
- **Quick Fill**: Double-click the blue corner of a selected cell to fill the formula down as far as the adjacent data extends.
- **Toggle References**: Use `F4` to cycle through absolute and relative reference modes (`$A$1`, `A$1`, etc.).

## Visual Debugging

- **Formula Helper**: Pay attention to the yellow highlighting in the function helper pane; it shows you exactly which argument you are currently typing.
- **Colored Ranges**: Google Sheets color-codes ranges in your formulas. Match the color in the formula to the highlight on the sheet to verify your references.
- **F2 Range Highlight**: Position your cursor over a range in the formula bar and press `F2` to highlight that specific range on the sheet.
