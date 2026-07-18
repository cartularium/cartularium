---
tags:
  - concept
  - structure
---

A **sheet** (also called a tab) is an individual workspace within a [[Spreadsheet]]. Each sheet contains a grid of cells organized into rows and columns.

### Structure

Each sheet is identified by a unique **sheet ID** (also called `gid`), which appears in URLs as:

```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=SHEET_ID
```

The first sheet in a new spreadsheet typically has `gid=0`.

### Terminology

> [!WARNING]
> The term "sheet" can cause confusion:
>
> - In the **Google Sheets UI**, these are called "sheets" or "tabs"
> - In **Google Apps Script**, the equivalent object is called `Sheet`
> - In casual usage, people often say "spreadsheet" when referring to a sheet
>
> See [[Spreadsheet]] for the container file that holds multiple sheets.

### Sheet Types

Sheets can be one of several types:
- **GRID** — standard grid of cells (most common)
- **OBJECT** — for embedded charts or images
- **DATA_SOURCE** — connected to external data sources

### Properties

Sheets have various properties including:
- **Title** — the sheet name shown on the tab
- **Index** — position in the tab bar (0-based)
- **Grid properties** — row count, column count, frozen rows/columns
- **Hidden** — whether the sheet is visible
- **Tab color** — visual identification color
- **Right-to-left** — text direction setting

### Components

A sheet can contain:
- **Grid data** — the actual cell values and formatting
- **Conditional format rules** — apply formatting based on cell values
- **Filter views** — saved filter configurations
- **Protected ranges** — cells with restricted editing
- **Merges** — merged cell ranges
- **Charts** — embedded visualizations
- **Banded ranges** — alternating row/column colors

### API Reference

For complete API documentation, see [Sheet resource](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/sheets#resource:-sheet).

### See Also
- [[Spreadsheet]] — the container file for sheets
- [[Array#Range]] — how ranges reference sheet cells
- [[Data type]] — types of data stored in cells
