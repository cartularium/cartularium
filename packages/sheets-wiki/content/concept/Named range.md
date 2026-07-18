---
tags:
  - concept
  - structure
---

A **named range** assigns a human-readable label to a cell or range of cells. Named ranges make formulas easier to read and maintain by replacing cryptic addresses like `C4:C20` with descriptive names like `sales`.

### Creating Named Ranges

In Google Sheets: **Data → Named ranges → Add a range**.

Alternatively, named ranges can be defined via the Name Box by typing a name directly into the box while the target range is selected and pressing Enter.

### Usage in Formulas

Once defined, a named range can be used anywhere a cell reference is valid:

```
=SUM(sales)
=AVERAGE(sales)
=MAX(sales)
=FILTER(orders, region = "West")
```

### Key Characteristics

- **Absolute by default**: Named ranges behave like absolute references (`$A$1`) — they do not shift when a formula is copied.
- **Workbook-scoped**: Named ranges are available across all sheets in a workbook.
- **Readable formulas**: Names communicate intent, making complex formulas significantly easier to audit.

### Dynamic Named Ranges

Named ranges point to a fixed range and do not automatically expand when new data is added. To create a dynamic named range that grows with data, use [[OFFSET]] or [[INDIRECT]] — though both are [[Volatile|volatile]] and carry a performance cost. Using a structured [[Table]] is generally preferable.

### Comparison with Excel

Named ranges work the same in Excel and Google Sheets. Excel additionally provides the **Name Manager** (Ctrl+F3) for bulk editing and organizing named ranges with scope control (workbook vs. sheet level). Google Sheets does not offer sheet-scoped named ranges — all names are workbook-scoped.

In Excel, named ranges are also a core part of **structured references** used in Excel Tables. Google Sheets [[Table|Tables]] offer similar column-reference syntax natively.

### See Also

- [[Cell references]] — the underlying reference system that named ranges simplify.
- [[Table]] — structured data with built-in column references, often preferable to named ranges for tabular data.
- [[INDIRECT]] — can reference named ranges from text strings.
