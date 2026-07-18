---
tags:
  - terminology
  - datastructure
---

A **table** is an organized collection of data where each column represents a distinct attribute and each row represents a single record. Tables are the dominant data structure in spreadsheet modeling; most Sheets functions are designed to operate on tabular data.

For best practices around table design, see [[Taming Spreadsheet Data Structure For Success]].

### Native tables

Google Sheets supports a native table feature (Insert > Table) that formalizes a cell range into a structured object. Native tables provide:

- **Type constraints** — columns enforce a consistent data type, surfacing common errors such as numbers stored as text.
- **Structured references** — column headers become named references usable in formulas, similar to [[Named range|named ranges]] but scoped to the table.
- **Filter views and aggregations** — built-in filtering, sorting, and group-by operations that do not alter the underlying data.
- **Auto-expansion** — rows added adjacent to the table are automatically included.

### See Also

- [[Array]] — the computational representation of tabular data in formulas.
- [[QUERY]] — SQL-like operations on tabular data.
- [[Taming Spreadsheet Data Structure For Success]] — community guide on table design.
