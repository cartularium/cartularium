---
tags:
  - concept
  - structure
---

A **spreadsheet** is the top-level container in Google Sheets. It corresponds to a single file and can contain multiple [[Sheet|sheets]] (tabs).

### Structure

A spreadsheet is identified by a unique **spreadsheet ID** (also called a spreadsheet key), which appears in URLs as:

```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

Each spreadsheet contains:
- One or more [[Sheet|sheets]] (individual tabs)
- Named ranges that span across sheets
- Spreadsheet-level properties (title, locale, time zone, etc.)
- Developer metadata

### Terminology

> [!WARNING]
> The term "spreadsheet" can cause confusion:
>
> - In the **Google Sheets UI** and casual usage, "spreadsheet" often refers to the entire file
> - In **Google Apps Script**, the equivalent object is called `Spreadsheet` (with a capital S)
> - In the **Google Sheets API**, this is the `Spreadsheet` resource
>
> See [[Sheet]] for the individual tabs within a spreadsheet.

### Properties

Spreadsheets have various properties including:
- **Title** — the file name
- **Locale** — determines number and date formatting defaults
- **Time zone** — affects date/time interpretation
- **Recalculation settings** — controls when formulas update
- **Iterative calculation settings** — for circular references

### API Reference

For complete API documentation, see [Spreadsheet resource](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets#resource:-spreadsheet).

### See Also
- [[Sheet]] — individual tabs within a spreadsheet
- [[Data type]] — types of data that can be stored in cells
