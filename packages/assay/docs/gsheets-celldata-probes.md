# gsheets CellData probe results

Generated: 2026-05-23T20:22:35.094Z
Spreadsheet: `1csVwyDpFvJ1RgggJ6uEDhsFGKXa1HfJVGNBz7lLTjuU`
Probe sheet (deleted after run): `celldata-probe-1779567751972`

Companion to [`gsheets-celldata-gap.md`](./gsheets-celldata-gap.md) — answers its 5 open questions empirically.
Re-run with: `node packages/assay/scripts/probes/gsheets-celldata.mjs`

---


## Probe 1 — Lambda at cell boundary

### 1 — `lambda-at-cell`

**Cell:** `A1`
**Formula:** `=LAMBDA(x, x+1)`
**Expectation:** errorValue (some code)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=LAMBDA(x, x+1)"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "N_A",
      "message": "Function LAMBDA should be followed by a call containing the actual values."
    }
  },
  "formattedValue": "#N/A",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 2 — Null encoding

### 2.a — `blank-untouched`

**Cell:** `A2`
**Formula:** _(untouched)_
**Expectation:** no effectiveValue; rowData entry may be absent

**Raw CellData:**

```json
{}
```

### 2.b — `empty-string-formula`

**Cell:** `A3`
**Formula:** `=""`
**Expectation:** stringValue: ""

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=\"\""
  },
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 2.c — `null-via-IF`

**Cell:** `A4`
**Formula:** `=IF(,,)`
**Expectation:** either omitted, errorValue NULL_VALUE, or numberValue 0

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=IF(,,)"
  },
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    }
  }
}
```

### 2.d — `isblank-sanity`

**Cell:** `A5`
**Formula:** `=ISBLANK(IF(,,))`
**Expectation:** boolValue TRUE (validates A4's nullness)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(IF(,,))"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 3 — HYPERLINK + textFormatRuns

### 3 — `hyperlink-formula`

**Cell:** `A6`
**Formula:** `=HYPERLINK("https://example.com", "click")`
**Expectation:** stringValue "click"; cell.hyperlink "https://example.com"; possibly textFormatRuns

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=HYPERLINK(\"https://example.com\", \"click\")"
  },
  "effectiveValue": {
    "stringValue": "click"
  },
  "formattedValue": "click",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {
        "red": 0.06666667,
        "green": 0.33333334,
        "blue": 0.8
      },
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": true,
      "foregroundColorStyle": {
        "rgbColor": {
          "red": 0.06666667,
          "green": 0.33333334,
          "blue": 0.8
        }
      },
      "link": {
        "uri": "https://example.com"
      }
    },
    "hyperlinkDisplayType": "LINKED"
  },
  "hyperlink": "https://example.com"
}
```


## Probe 4 — numberFormat inference (no explicit format applied)

### 4.a — `date-formula-no-explicit-format`

**Cell:** `A7`
**Formula:** `=DATE(2023, 3, 19)`
**Expectation:** numberValue 44999 (serial); effectiveFormat.numberFormat.type DATE?

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=DATE(2023, 3, 19)"
  },
  "effectiveValue": {
    "numberValue": 45004
  },
  "formattedValue": "3/19/2023",
  "effectiveFormat": {
    "numberFormat": {
      "type": "DATE"
    },
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 4.b — `now-formula`

**Cell:** `A8`
**Formula:** `=NOW()`
**Expectation:** numberValue (serial); effectiveFormat.numberFormat.type DATE_TIME?

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=NOW()"
  },
  "effectiveValue": {
    "numberValue": 46165.84901664352
  },
  "formattedValue": "5/23/2026 20:22:35",
  "effectiveFormat": {
    "numberFormat": {
      "type": "DATE_TIME"
    },
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 4.c — `literal-number`

**Cell:** `A9`
**Formula:** `123`
**Expectation:** numberValue 123; effectiveFormat absent or type NUMBER?

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "numberValue": 123
  },
  "effectiveValue": {
    "numberValue": 123
  },
  "formattedValue": "123",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 4.d — `date-reference`

**Cell:** `A10`
**Formula:** `=A7`
**Expectation:** does the inferred type propagate from A7?

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A7"
  },
  "effectiveValue": {
    "numberValue": 45004
  },
  "formattedValue": "3/19/2023",
  "effectiveFormat": {
    "numberFormat": {
      "type": "DATE"
    },
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 5 — errorValue per ErrorType

### 5.a — `div-by-zero`

**Cell:** `A11`
**Formula:** `=1/0`
**Expectation:** errorValue.type DIVIDE_BY_ZERO

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=1/0"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "DIVIDE_BY_ZERO",
      "message": "Function DIVIDE parameter 2 cannot be zero."
    }
  },
  "formattedValue": "#DIV/0!",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 5.b — `na-explicit`

**Cell:** `A12`
**Formula:** `=NA()`
**Expectation:** errorValue.type N_A

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=NA()"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "N_A"
    }
  },
  "formattedValue": "#N/A",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 5.c — `unknown-function`

**Cell:** `A13`
**Formula:** `=NotARealFunction()`
**Expectation:** errorValue.type NAME

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=NotARealFunction()"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "NAME",
      "message": "Unknown function: 'NotARealFunction'."
    }
  },
  "formattedValue": "#NAME?",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 5.d — `non-overlapping-intersect`

**Cell:** `A14`
**Formula:** `=A1:Z1 A30:Z30`
**Expectation:** errorValue.type REF or NULL_VALUE (last run got parse-error ERROR; trying clearer non-overlap)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A1:Z1 A30:Z30"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "ERROR",
      "message": "Formula parse error."
    }
  },
  "formattedValue": "#ERROR!",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 5.e — `sqrt-negative`

**Cell:** `A15`
**Formula:** `=SQRT(-1)`
**Expectation:** errorValue.type NUM

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=SQRT(-1)"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "NUM",
      "message": "Function SQRT parameter 1 value is negative. It should be positive or zero."
    }
  },
  "formattedValue": "#NUM!",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 5.f — `vlookup-miss`

**Cell:** `A16`
**Formula:** `=VLOOKUP("nope", B1:B1, 1, FALSE)`
**Expectation:** errorValue.type N_A

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=VLOOKUP(\"nope\", B1, 1, FALSE)"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "N_A",
      "message": "Did not find value 'nope' in VLOOKUP evaluation."
    }
  },
  "formattedValue": "#N/A",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 5.g — `string-plus-number`

**Cell:** `A17`
**Formula:** `="a"+1`
**Expectation:** errorValue.type VALUE (or coerced numberValue 1?)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=\"a\"+1"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "VALUE",
      "message": "Function ADD parameter 1 expects number values. But 'a' is a text and cannot be coerced to a number."
    }
  },
  "formattedValue": "#VALUE!",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 6 — Null vs "" semantic distinction (the API wire format conflates them)

### 6.a — `isblank-of-untouched`

**Cell:** `A18`
**Formula:** `=ISBLANK(A2)`
**Expectation:** TRUE (truly blank)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(A2)"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.b — `isblank-of-empty-string`

**Cell:** `A19`
**Formula:** `=ISBLANK(A3)`
**Expectation:** the key question: TRUE means "" is null-like; FALSE means it's a real empty string

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(A3)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.c — `isblank-of-if-null-via-ref`

**Cell:** `A20`
**Formula:** `=ISBLANK(A4)`
**Expectation:** TRUE (compare to 2.d which did ISBLANK(IF(,,)) inline)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(A4)"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.d — `istext-of-empty-string`

**Cell:** `A21`
**Formula:** `=ISTEXT(A3)`
**Expectation:** TRUE if "" is a string-typed cell; FALSE if it's null-like

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISTEXT(A3)"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.e — `istext-of-if-null`

**Cell:** `A22`
**Formula:** `=ISTEXT(A4)`
**Expectation:** FALSE expected (null is not text)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISTEXT(A4)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.f — `concat-empty-string`

**Cell:** `A23`
**Formula:** `="x" & A3`
**Expectation:** "x" (empty string concatenates as nothing)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=\"x\" & A3"
  },
  "effectiveValue": {
    "stringValue": "x"
  },
  "formattedValue": "x",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.g — `concat-if-null`

**Cell:** `A24`
**Formula:** `="x" & A4`
**Expectation:** "x" if null coerces to "" in concat

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=\"x\" & A4"
  },
  "effectiveValue": {
    "stringValue": "x"
  },
  "formattedValue": "x",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.h — `empty-string-eq-empty`

**Cell:** `A25`
**Formula:** `=A3 = ""`
**Expectation:** TRUE (definitional)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A3 = \"\""
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.i — `null-eq-empty-string`

**Cell:** `A26`
**Formula:** `=A4 = ""`
**Expectation:** TRUE means null == "" via coercion; FALSE distinguishes them

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A4 = \"\""
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 6.j — `empty-string-eq-null`

**Cell:** `A27`
**Formula:** `=A3 = A4`
**Expectation:** the cleanest test: are they semantically interchangeable?

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A3 = A4"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 7 — Multi-link cell via textFormatRuns

### 7 — `two-link-rich-text`

**Cell:** `A28`
**Input (rich-cell via updateCells):**

```json
{
  "userEnteredValue": {
    "stringValue": "alpha bravo charlie"
  },
  "textFormatRuns": [
    {
      "startIndex": 0,
      "format": {
        "link": {
          "uri": "https://example.com/alpha"
        }
      }
    },
    {
      "startIndex": 5,
      "format": {}
    },
    {
      "startIndex": 12,
      "format": {
        "link": {
          "uri": "https://example.com/charlie"
        }
      }
    }
  ]
}
```
**Expectation:** cell-level hyperlink absent or one of the two; textFormatRuns preserved with both links

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "stringValue": "alpha bravo charlie"
  },
  "effectiveValue": {
    "stringValue": "alpha bravo charlie"
  },
  "formattedValue": "alpha bravo charlie",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  },
  "textFormatRuns": [
    {
      "format": {
        "foregroundColor": {
          "red": 0.06666667,
          "green": 0.33333334,
          "blue": 0.8
        },
        "underline": true,
        "foregroundColorStyle": {
          "rgbColor": {
            "red": 0.06666667,
            "green": 0.33333334,
            "blue": 0.8
          }
        },
        "link": {
          "uri": "https://example.com/alpha"
        }
      }
    },
    {
      "startIndex": 5,
      "format": {}
    },
    {
      "startIndex": 12,
      "format": {
        "foregroundColor": {
          "red": 0.06666667,
          "green": 0.33333334,
          "blue": 0.8
        },
        "underline": true,
        "foregroundColorStyle": {
          "rgbColor": {
            "red": 0.06666667,
            "green": 0.33333334,
            "blue": 0.8
          }
        },
        "link": {
          "uri": "https://example.com/charlie"
        }
      }
    }
  ]
}
```


## Probe 8 — LOADING via IMPORTHTML (immediate + after-wait reads)

### 8 — `importhtml-loading-attempt`

**Cell:** `A29`
**Formula:** `=IMPORTHTML("https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)", "table", 1)`
**Expectation:** errorValue.type LOADING if caught in flight; otherwise a populated cell or different error

**Immediate read (no calc wait — looking for LOADING):**

```json
{
  "userEnteredValue": {
    "formulaValue": "=IMPORTHTML(\"https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)\", \"table\", 1)"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "REF",
      "message": "Result was not automatically expanded, please insert more columns (1)."
    }
  },
  "formattedValue": "#REF!",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

**After 600ms wait:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=IMPORTHTML(\"https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)\", \"table\", 1)"
  },
  "effectiveValue": {
    "errorValue": {
      "type": "REF",
      "message": "Result was not automatically expanded, please insert more columns (1)."
    }
  },
  "formattedValue": "#REF!",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 9 — Spilled array formula with Null result (three-shape Null question)

### 9.a — `spill-anchor`

**Cell:** `B1`
**Formula:** `=ARRAYFORMULA({"a"; ""; IF(,,)})`
**Expectation:** anchor; userEnteredValue.formulaValue set; effectiveValue stringValue 'a'

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ARRAYFORMULA({\"a\"; \"\"; IF(,,)})"
  },
  "effectiveValue": {
    "stringValue": "a"
  },
  "formattedValue": "a",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.b — `spill-recipient-empty-string`

**Cell:** `B2`
**Formula:** _(untouched)_
**Expectation:** no userEnteredValue (only anchor has); effectiveValue stringValue ''

**Raw CellData:**

```json
{
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.c — `spill-recipient-null`

**Cell:** `B3`
**Formula:** _(untouched)_
**Expectation:** no userEnteredValue; effectiveValue probably absent (analog of direct-IF(,,) minus the formulaValue)

**Raw CellData:**

```json
{
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    }
  }
}
```

### 9.d — `isblank-of-spill-anchor`

**Cell:** `A30`
**Formula:** `=ISBLANK(B1)`
**Expectation:** FALSE (B1 = 'a')

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(B1)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.e — `isblank-of-spill-empty-string`

**Cell:** `A31`
**Formula:** `=ISBLANK(B2)`
**Expectation:** FALSE (B2 = '')

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(B2)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.f — `isblank-of-spill-null`

**Cell:** `A32`
**Formula:** `=ISBLANK(B3)`
**Expectation:** TRUE if spilled-Null is ISBLANK like direct-IF(,,) was (probe 2.d)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(B3)"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.g — `istext-of-spill-null`

**Cell:** `A33`
**Formula:** `=ISTEXT(B3)`
**Expectation:** FALSE (Null not text — matches probe 6.e)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISTEXT(B3)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.h — `type-of-spill-null`

**Cell:** `A34`
**Formula:** `=TYPE(B3)`
**Expectation:** gsheets TYPE for Null — 1 (number) if Excel-like, or possibly other

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=TYPE(B3)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.i — `concat-spill-null`

**Cell:** `A35`
**Formula:** `="x" & B3`
**Expectation:** 'x' if Null coerces to '' (matches probe 6.g for direct-IF(,,))

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=\"x\" & B3"
  },
  "effectiveValue": {
    "stringValue": "x"
  },
  "formattedValue": "x",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.j — `spill-null-eq-empty`

**Cell:** `A36`
**Formula:** `=B3 = ""`
**Expectation:** TRUE if Null coerces equal to '' (matches probe 6.i)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=B3 = \"\""
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.k — `spill-null-eq-zero`

**Cell:** `A37`
**Formula:** `=B3 = 0`
**Expectation:** ?? — Excel says TRUE; gsheets behavior unknown for Null

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=B3 = 0"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 9.l — `spill-null-eq-direct-null`

**Cell:** `A38`
**Formula:** `=B3 = A4`
**Expectation:** are spilled-Null and direct-IF(,,) semantically identical?

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=B3 = A4"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 10 — VLOOKUP returning a blank cell (does Null propagate?)

### 10.setup — `lookup-key-1`

**Cell:** `D1`
**Formula:** `1`
**Expectation:** literal 1 — input

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "numberValue": 1
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.setup — `lookup-value-1`

**Cell:** `E1`
**Formula:** `100`
**Expectation:** literal 100

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "numberValue": 100
  },
  "effectiveValue": {
    "numberValue": 100
  },
  "formattedValue": "100",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.setup — `lookup-key-2`

**Cell:** `D2`
**Formula:** `2`
**Expectation:** literal 2; E2 is the untouched lookup target

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "numberValue": 2
  },
  "effectiveValue": {
    "numberValue": 2
  },
  "formattedValue": "2",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.setup — `lookup-key-3`

**Cell:** `D3`
**Formula:** `3`
**Expectation:** literal 3

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "numberValue": 3
  },
  "effectiveValue": {
    "numberValue": 3
  },
  "formattedValue": "3",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.setup — `lookup-value-3`

**Cell:** `E3`
**Formula:** `300`
**Expectation:** literal 300

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "numberValue": 300
  },
  "effectiveValue": {
    "numberValue": 300
  },
  "formattedValue": "300",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.a — `lookup-target-blank`

**Cell:** `E2`
**Formula:** _(untouched)_
**Expectation:** untouched — no rowData entry (matches probe 2.a)

**Raw CellData:**

```json

```

### 10.b — `vlookup-of-blank`

**Cell:** `A40`
**Formula:** `=VLOOKUP(2, D1:E3, 2, FALSE)`
**Expectation:** Excel returns 0 (decay); gsheets might propagate Null

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=VLOOKUP(2, D1:E3, 2, FALSE)"
  },
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    }
  }
}
```

### 10.c — `vlookup-result-isblank`

**Cell:** `A41`
**Formula:** `=ISBLANK(A40)`
**Expectation:** TRUE if blank propagates (gsheets-like Null); FALSE if decay (Excel-like)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISBLANK(A40)"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.d — `vlookup-result-istext`

**Cell:** `A42`
**Formula:** `=ISTEXT(A40)`
**Expectation:** FALSE either way

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISTEXT(A40)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.e — `vlookup-result-type`

**Cell:** `A43`
**Formula:** `=TYPE(A40)`
**Expectation:** 1 if number-coerced; ? if Null propagates

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=TYPE(A40)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.f — `vlookup-result-concat`

**Cell:** `A44`
**Formula:** `="x" & A40`
**Expectation:** 'x' if Null/blank propagates; 'x0' if decay to 0

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=\"x\" & A40"
  },
  "effectiveValue": {
    "stringValue": "x"
  },
  "formattedValue": "x",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.g — `vlookup-result-eq-empty`

**Cell:** `A45`
**Formula:** `=A40 = ""`
**Expectation:** TRUE if Null/blank propagates and coerces to ''; ?? otherwise

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A40 = \"\""
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.h — `vlookup-result-eq-zero`

**Cell:** `A46`
**Formula:** `=A40 = 0`
**Expectation:** TRUE if decay to 0 (Excel) or polymorphic-equal (blank)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A40 = 0"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 10.i — `vlookup-result-eq-untouched`

**Cell:** `A47`
**Formula:** `=A40 = A2`
**Expectation:** TRUE if VLOOKUP result is semantically identical to truly-untouched

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A40 = A2"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```


## Probe 11 — Null categorization (CELL, N, T, COUNTBLANK, COUNTA, IS* symmetric to Excel)

### 11.a — `cell-type-untouched`

**Cell:** `B5`
**Formula:** `=CELL("type", A2)`
**Expectation:** expect 'b' (blank) — matches Excel

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=CELL(\"type\", A2)"
  },
  "effectiveValue": {
    "stringValue": "b"
  },
  "formattedValue": "b",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.b — `cell-type-if-null`

**Cell:** `B6`
**Formula:** `=CELL("type", A4)`
**Expectation:** if 'b', gsheets sees direct-Null as blank; if 'v', it sees as value

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=CELL(\"type\", A4)"
  },
  "effectiveValue": {
    "stringValue": "b"
  },
  "formattedValue": "b",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.c — `cell-type-spill-null`

**Cell:** `B7`
**Formula:** `=CELL("type", B3)`
**Expectation:** spilled-Null categorization

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=CELL(\"type\", B3)"
  },
  "effectiveValue": {
    "stringValue": "b"
  },
  "formattedValue": "b",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.d — `cell-type-vlookup-null`

**Cell:** `B8`
**Formula:** `=CELL("type", A40)`
**Expectation:** VLOOKUP-result-Null categorization

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=CELL(\"type\", A40)"
  },
  "effectiveValue": {
    "stringValue": "b"
  },
  "formattedValue": "b",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.e — `n-of-if-null`

**Cell:** `B9`
**Formula:** `=N(A4)`
**Expectation:** 0 (numeric coercion of Null)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=N(A4)"
  },
  "effectiveValue": {
    "numberValue": 0
  },
  "formattedValue": "0",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.f — `t-of-if-null`

**Cell:** `B10`
**Formula:** `=T(A4)`
**Expectation:** '' (text coercion of Null)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=T(A4)"
  },
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.g — `countblank-untouched`

**Cell:** `B11`
**Formula:** `=COUNTBLANK(A2)`
**Expectation:** 1 (matches Excel)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTBLANK(A2)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.h — `countblank-empty-string`

**Cell:** `B12`
**Formula:** `=COUNTBLANK(A3)`
**Expectation:** 1 (matches Excel — '=""' counts as blank in COUNTBLANK)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTBLANK(A3)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.i — `countblank-if-null`

**Cell:** `B13`
**Formula:** `=COUNTBLANK(A4)`
**Expectation:** TRUE schema-divider — Excel says 0 (IF(,,) is number 0); gsheets says 1 if it treats IF(,,) as blank-like

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTBLANK(A4)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.j — `countblank-spill-null`

**Cell:** `B14`
**Formula:** `=COUNTBLANK(B3)`
**Expectation:** likely 1 if gsheets is consistent

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTBLANK(B3)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.k — `countblank-vlookup-null`

**Cell:** `B15`
**Formula:** `=COUNTBLANK(A40)`
**Expectation:** 1 if Null propagates with blank-ness; 0 if it decays

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTBLANK(A40)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.l — `counta-untouched`

**Cell:** `B16`
**Formula:** `=COUNTA(A2)`
**Expectation:** 0 (matches Excel)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTA(A2)"
  },
  "effectiveValue": {
    "numberValue": 0
  },
  "formattedValue": "0",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.m — `counta-empty-string`

**Cell:** `B17`
**Formula:** `=COUNTA(A3)`
**Expectation:** 1 (matches Excel — has a formula)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTA(A3)"
  },
  "effectiveValue": {
    "numberValue": 1
  },
  "formattedValue": "1",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.n — `counta-if-null`

**Cell:** `B18`
**Formula:** `=COUNTA(A4)`
**Expectation:** 1 (matches Excel — has a formula)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=COUNTA(A4)"
  },
  "effectiveValue": {
    "numberValue": 0
  },
  "formattedValue": "0",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.o — `isnumber-of-if-null`

**Cell:** `B19`
**Formula:** `=ISNUMBER(A4)`
**Expectation:** FALSE (Null is not a number)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISNUMBER(A4)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.p — `islogical-of-if-null`

**Cell:** `B20`
**Formula:** `=ISLOGICAL(A4)`
**Expectation:** FALSE

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISLOGICAL(A4)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.q — `iserror-of-if-null`

**Cell:** `B21`
**Formula:** `=ISERROR(A4)`
**Expectation:** FALSE

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=ISERROR(A4)"
  },
  "effectiveValue": {
    "boolValue": false
  },
  "formattedValue": "FALSE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```

### 11.r — `if-null-eq-false`

**Cell:** `B22`
**Formula:** `=A4 = FALSE`
**Expectation:** TRUE if Null polymorphically equals FALSE (Excel blank does)

**Raw CellData:**

```json
{
  "userEnteredValue": {
    "formulaValue": "=A4 = FALSE"
  },
  "effectiveValue": {
    "boolValue": true
  },
  "formattedValue": "TRUE",
  "effectiveFormat": {
    "textFormat": {
      "foregroundColor": {},
      "fontFamily": "Arial",
      "fontSize": 10,
      "bold": false,
      "italic": false,
      "strikethrough": false,
      "underline": false,
      "foregroundColorStyle": {
        "rgbColor": {}
      }
    },
    "hyperlinkDisplayType": "PLAIN_TEXT"
  }
}
```
