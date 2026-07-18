---
name: GOOGLETRANSLATE
category: google
syntax: GOOGLETRANSLATE(text, [source_language, target_language])
status: imported
description: Translates text from one language into another.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093331?hl=en).

Translates text from one language into another.

### Sample Usage

```gse
GOOGLETRANSLATE("Hello World","en","es")
GOOGLETRANSLATE(A2,B2,C2)
GOOGLETRANSLATE(A2)
```

### Syntax

```gse
GOOGLETRANSLATE(text, [source_language, target_language])
```

- `text` - The text to translate.

  + The value for `text` must either be enclosed in quotation marks or be a reference to a cell containing the appropriate text.
- `source_language` - **[** OPTIONAL - `"auto"` by default **]** - The two-letter language code of the source language, e.g. "en" for English or "ko" for Korean, or "auto" to auto-detect the language.

  + If `source_language` is omitted, target\_language must also be omitted.
- `target_language` - **[** OPTIONAL - system language by default **]** - The two-letter language code of the target language, e.g. "en" for English or "ja" for Japanese.

### See Also

[[DETECTLANGUAGE]]: Identifies the language used in text within the specified range.

### Examples

Translates text in the specified range from the source language into the target language.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdERRZ1BEN2RZekNSZjFUZ3pXcVJmNUE&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>