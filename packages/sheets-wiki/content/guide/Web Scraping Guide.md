---
tags:
  - guide
  - web
---

# Web Scraping Guide

A guide to effectively using [[IMPORTXML]], [[IMPORTHTML]], and other import functions to pull web data into Google Sheets.

## General Strategy

Web scraping in Sheets is susceptible to page structure changes and loading timeouts. Use these strategies to improve reliability.

### Use Mobile Sites
Mobile versions of websites (e.g., `m.wikipedia.org` instead of `en.wikipedia.org`) often have significantly simpler HTML structures. They contain fewer nested divs and scripts, making them faster to load and easier to target with XPath.

### Target Specific Elements
Avoid broad XPath queries like `//div`. Be as specific as possible to minimize the data Sheets has to process.

## Finding XPaths with DevTools

You don't need to guess the structure of a page. Use the Browser Developer Tools (usually `F12` or `Ctrl+Shift+I`).

1. **Inspect**: Right-click the element you want to scrape and select "Inspect".
2. **Identify**: Look for unique `id` or `class` attributes.
3. **Copy XPath**: Many browsers allow you to right-click an element in the inspector and select "Copy" -> "Copy XPath". Note that generated XPaths are often brittle; it's better to write a logical one (e.g., `//h1[@id='title']`).

## Common Troubleshooting

| Issue | Potential Cause | Solution |
|-------|-----------------|----------|
| `#N/A` | Element not found | Verify XPath; check if content is loaded via JavaScript. |
| `#ERROR!` | URL or XPath syntax | Ensure URL includes `https://` and XPath is quoted. |
| Empty Result | Data is behind a login | Google Sheets cannot scrape authenticated pages. |
| "Resource not found" | Bot blocking | Some sites block Google's user agent. Try using a mobile URL. |

## Handling Namespaces in XML

If an XML feed uses namespaces (e.g., `<media:content>`), standard XPath may fail. Use the `local-name()` function:

```gse
=IMPORTXML(url, "//*[local-name()='content']")
```

## Performance
Limit the number of import functions in a single sheet. Google Sheets imposes limits on how many external requests can be active simultaneously. If you have hundreds of imports, they will likely return "Loading..." indefinitely.
