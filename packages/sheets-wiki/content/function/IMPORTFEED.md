---
name: IMPORTFEED
category: web
syntax: IMPORTFEED(url, [query], [headers], [num_items])
status: imported
description: Imports a RSS or ATOM feed.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093337?hl=en).

Imports a RSS or ATOM feed.

### Sample Usage

```gse
IMPORTFEED("http://news.google.com/?output=atom")
IMPORTFEED(A2,B2,C2,D2)
```

### Syntax

```gse
IMPORTFEED(url, [query], [headers], [num_items])
```

- `url` - The URL of the RSS or ATOM feed, including protocol (e.g. `http://`).

  + The value for `url` must either be enclosed in quotation marks or be a reference to a cell containing the appropriate text.
- `query` - **[** OPTIONAL - `"items"` by default **]** - Specifies what data to fetch from `url`.

  + `"feed"` returns a single row containing feed information including title, description, and url.
  + `"feed <type>"` returns a particular attribute of the feed, where `<type>` is `title`, `description`, `author`, or `url`.
  + `"items"` returns a full table containing items from the feed. If `num_items` is not specified, all items currently published on the feed are returned.
  + `"items <type>"` returns a particular attribute of the requested item(s), where `<type>` is `title`, `summary` (the item content, minus hyperlinks and images), `url` (the URL of the individual item), or `created` (the post date associated with the item).
- `headers` - **[** OPTIONAL - `FALSE` by default **]** - Whether to include column headers as an extra row on top of the returned value.
- `num_items` - **[** OPTIONAL **]** - For queries of items, the number of items to return, starting from the most recent.

  + If `num_items` is not specified, all items currently published on the feed are returned.

### Related articles

- [[IMPORTXML]]: Imports data from any of various structured data types including XML, HTML, CSV, TSV, and RSS and ATOM XML feeds.
- [[IMPORTRANGE]]: Imports a range of cells from a specified spreadsheet.
- [[IMPORTHTML]]: Imports data from a table or list within an HTML page.
- [[IMPORTDATA]]: Imports data at a given url in .csv (comma-separated value) or .tsv (tab-separated value) format.