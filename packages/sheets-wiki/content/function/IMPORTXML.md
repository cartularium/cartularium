---
name: IMPORTXML
category: web
syntax: IMPORTXML(url, xpath_query, locale)
status: imported
description: Imports data from any of various structured data types including XML, HTML, CSV, TSV, and RSS and ATOM XML feeds.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093342?hl=en).

Imports data from any of various structured data types including XML, HTML, CSV, TSV, and RSS and ATOM XML feeds.

### Sample Usage

```gse
IMPORTXML("https://en.wikipedia.org/wiki/Moon_landing", "//a/@href")
IMPORTXML(A2,B2)
```

### Syntax

```gse
IMPORTXML(url, xpath_query, locale)
```

- `url` - The URL of the page to examine, including protocol (e.g. `http://`).

  + The value for `url` must either be enclosed in quotation marks or be a reference to a cell containing the appropriate text.
- `xpath_query` - The XPath query to run on the structured data.

  + For more information on XPath, see <http://www.w3schools.com/xml/xpath_intro.asp>.
- `locale` - A language and region locale code to use when parsing the data. If unspecified, the document locale is used.

### See Also

[[IMPORTRANGE]]: Imports a range of cells from a specified spreadsheet.

[[IMPORTHTML]]: Imports data from a table or list within an HTML page.

[[IMPORTFEED]]: Imports a RSS or ATOM feed.

[[IMPORTDATA]]: Imports data at a given url in .csv (comma-separated value) or .tsv (tab-separated value) format.

[Learn how to optimize your data reference](https://support.google.com/docs/answer/12159115).