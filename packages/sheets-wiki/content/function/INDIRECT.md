---
name: INDIRECT
category: lookup
syntax: INDIRECT(cell_reference_as_string, [is_A1_notation])
status: imported
description: Returns a cell reference specified by a string.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093377?hl=en).

Returns a cell reference specified by a string.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1cbh9wUeE0UtIMPSEv51GE7qYix-qwOm_er0wW4LhuK0/copy)

**Note**: Each example is in its own tab.

### Sample Usage

```gse
INDIRECT("Sheet2!"&B10)
INDIRECT("A2")
INDIRECT("R2C3", FALSE)
```

### Student info

Student Info data as a separate sheet in the spreadsheet.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDNOSklLU1hCdGpaNHhlX3VFTlBBLVE&amp;single=true&amp;gid=1&amp;output=html&amp;widget=true" width="500"></iframe>

### Student grades

Returns the contents of the reference which can be a cell or an area.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDNOSklLU1hCdGpaNHhlX3VFTlBBLVE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

### Syntax

```gse
INDIRECT(cell_reference_as_string, [is_A1_notation])
```

- `cell_reference_as_string` - A cell reference, written as a string with surrounding quotation marks.
- `is_A1_notation` - **[**OPTIONAL - `TRUE` by default**]** - Indicates if the cell reference is in A1 notation or R1C1 notation.

**Tip**: You can't use table references in =INDIRECT yet. Try [[IMPORTRANGE]] instead.