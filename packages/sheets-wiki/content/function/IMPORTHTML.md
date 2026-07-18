---
name: IMPORTHTML
category: web
syntax: IMPORTHTML(url, query, index)
status: imported
description: Imports data from a table or list within an HTML page.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093339?hl=en).

Imports data from a table or list within an HTML page.

### Sample Usage

```gse
IMPORTHTML("http://en.wikipedia.org/wiki/Demographics_of_India","table",4)
IMPORTHTML(A2,B2,C2)
```

### Syntax

```gse
IMPORTHTML(url, query, index)
```

- `url` - The URL of the page to examine, including protocol (e.g. `http://`).

  + The value for `url` must either be enclosed in quotation marks or be a reference to a cell containing the appropriate text.
- `query` - Either "list" or "table" depending on what type of structure contains the desired data.
- `index` - The index, starting at `1`, which identifies which table or list as defined in the HTML source should be returned.

  + The indices for lists and tables are maintained separately, so there may be both a list and a table with index `1` if both types of elements exist on the HTML page.

### See Also

[[IMPORTXML]]: Imports data from any of various structured data types including XML, HTML, CSV, TSV, and RSS and ATOM XML feeds.

[[IMPORTRANGE]]: Imports a range of cells from a specified spreadsheet.

[[IMPORTFEED]]: Imports a RSS or ATOM feed.

[[IMPORTDATA]]: Imports data at a given url in .csv (comma-separated value) or .tsv (tab-separated value) format.

[Learn how to optimize your data reference.](https://support.google.com/docs/answer/12159115)