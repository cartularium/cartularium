---
tags:
  - guide
  - arrays
---

# Advanced Array Patterns

This guide explores structural patterns for manipulating data using arrays and [[Array-enabled functions]].

## Array Literals (`{}`)

Array literals allow you to construct custom tables of data on the fly.

- **Commas (`,`)**: Separate data into columns (horizontal).
- **Semicolons (`;`)**: Separate data into rows (vertical).

**Example**: Creating a 2x2 table:
```gse
={1, 2; 3, 4}
```

> [!NOTE]
> In European locales, the syntax often differs (using `\` for columns and `;` for rows).

## Array Broadcasting

When an array-enabled function receives a mixture of single values and ranges, it "broadcasts" the single value across the entire range.

**Example**:
```gse
=ARRAYFORMULA(A1:A10 * 2) 
```
The number `2` is broadcast to every cell in the range `A1:A10`.

## Advanced Concatenation

You can use array literals to join disparate ranges or add headers to data:

```gse
={"Header 1", "Header 2"; A2:B}
```
This creates a single array with custom headers followed by the data from columns A and B.

## Default Values

Use array literals to provide fallback or default values when a lookup might fail:

```gse
=IFNA(VLOOKUP(A1, B:C, 2, 0), {"No Data Found", 0})
```

## Data Restructuring

Array literals are the primary tool for [[VLOOKUP]] "left-lookups":

```gse
=VLOOKUP(key, {Data_Column, ID_Column}, 2, 0)
```
By placing the `ID_Column` (return value) to the right of the `Data_Column` (search key) within a custom array, you bypass the standard restriction that VLOOKUP only searches the first column.
