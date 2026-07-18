---
tags:
  - formatting
  - conditional
---

Conditional formatting in Google Sheets applies visual formatting (colors, font styles, etc.) to cells based on their values or formulas.

### Range Application & Referencing

When applying a conditional format to a range (e.g., `B2:D10`), Google Sheets evaluates the formula for **each cell** in that range from the perspective of the top-left cell.

> [!IMPORTANT]
> The behavior of a conditional formatting rule is heavily dictated by **anchoring**. For a detailed explanation of `$` notation, see [[Cell references]].

#### How Anchoring Affects CF Rules

| Reference Mode | CF Behavior |
|----------------|-------------|
| **Relative** (`=A1="x"`) | Each cell in the range is checked against itself. |
| **Column-locked** (`=$A1="x"`) | Every cell in the row checks column A of that same row. Used for **highlighting entire rows**. |
| **Row-locked** (`=A$1="x"`) | Every cell in the column checks row 1 of that same column. |
| **Absolute** (`=$A$1="x"`) | Every cell in the entire range checks exactly cell A1. |

### Common Patterns

#### Highlighting entire rows
To highlight a full row based on a single column's value (e.g., Column A):
- **Range**: `A2:Z100`
- **Formula**: `=$A2="Done"`
This locks the comparison to column A, but allows the row number to adjust for each row in the range.

Applied to range `A2:Z100`, this highlights the entire row when column A contains "x".

#### Highlighting matching cells only

To highlight only cells that contain a specific value:

```gse
=A1="x"
```

Without anchors, each cell is checked individually.

#### Avoiding false highlights on blank cells

When comparing values, blank cells can trigger unwanted highlighting. Use `AND` to exclude blanks:

```gse
=AND($B1>$C1, $B1<>"")
```

This only highlights when B1 is greater than C1 **and** B1 is not blank.

#### Highlighting based on another sheet

Reference cells on other sheets:

```gse
=Sheet2!$A1="complete"
```

### Rules for Multiple Conditions

- Multiple conditional format rules are evaluated in order (top to bottom in the rules list)
- First matching rule wins (unless "Done" is unchecked, allowing multiple rules to apply)
- More specific rules should appear before general ones

### Custom Formulas vs. Presets

Google Sheets offers preset conditions (e.g., "Greater than", "Text contains") and custom formulas. Custom formulas provide maximum flexibility but require understanding of reference anchoring.

### Performance Considerations

Complex conditional formatting formulas (especially those referencing large ranges or using heavy calculations) can slow sheet performance. Simplify formulas when possible and limit the application range.

### See Also
- [[Data type]] — understanding cell value types
- [[Array#Range]] — how ranges work with references
- [[Boolean]] — TRUE/FALSE values in conditional logic
