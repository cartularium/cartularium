---
name: BAHTTEXT
category: text
engines:
  excel:
    status: available
  gsheets:
    status: available
coverage: pending-assay
syntax: BAHTTEXT(value)
status: imported
description: Converts a number to Thai text with the suffix [Baht](https://en.wikipedia.org/wiki/Thai_baht) for integer values and Satang for decimal values.
tags: []
---

Converts a number to Thai text with the suffix [Baht](https://en.wikipedia.org/wiki/Thai_baht) for integer values and Satang for decimal values.

### Sample Usage

```gse
BAHTTEXT(12)
BAHTTEXT(120.75)
```

### Syntax

```gse
BAHTTEXT(value)
```

- `value` - The [[Number]] to convert to Thai text.

### Notes
- This function is sometimes used in conjunction with [[GOOGLETRANSLATE]] to convert [[Number|numbers]] to their text representations (e.g. `13` to `thirteen`).
