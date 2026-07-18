---
name: IMPORTDATA
category: web
syntax: IMPORTDATA(url)
status: imported
description: Imports data at a given url in .
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093335?hl=en).

Imports data at a given url in .csv (comma-separated value) or .tsv (tab-separated value) format.

### Sample Usage

```gse
IMPORTDATA("https://www2.census.gov/programs-surveys/popest/datasets/2010-2019/national/totals/nst-est2019-popchg2010_2019.csv")
IMPORTDATA(A2)
```

### Syntax

```gse
IMPORTDATA(url)
```

- `url` - The url from which to fetch the .csv or .tsv-formatted data, including protocol (e.g. `http://`).

  + The value for `url` must either be enclosed in quotation marks or be a reference to a cell containing the appropriate text.

### See Also

[[IMPORTXML]]: Imports data from any of various structured data types including XML, HTML, CSV, TSV, and RSS and ATOM XML feeds.

[[IMPORTRANGE]]: Imports a range of cells from a specified spreadsheet.

[[IMPORTHTML]]: Imports data from a table or list within an HTML page.

[[IMPORTFEED]]: Imports a RSS or ATOM feed.

[Learn how to optimize your data reference.](https://support.google.com/docs/answer/12159115)

### Examples

Retrieves United States population data from the specified CSV file `URL`.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHU1eHA4QXJQa3I0TUxMNTRiTGVXX2c&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>