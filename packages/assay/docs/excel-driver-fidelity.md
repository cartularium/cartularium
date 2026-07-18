# Excel driver fidelity audit + behavior probes

Generated: 2026-05-22T22:18:34.334907

Companion to [`excel-celldata-gap.md`](./excel-celldata-gap.md) and the gsheets-side [`gsheets-celldata-probes.md`](./gsheets-celldata-probes.md).

Each scenario probes three surfaces:

- **A** — openpyxl per-cell (`cell.value`, `cell.data_type`, `cell.number_format`, `cell.is_date`, `cell.hyperlink`, `cell.comment`, `CellRichText` when applicable)
- **C** — raw OOXML XML extracted from the saved xlsx zip (the `<c>` element, attributes + children)
- **B** — xlwings live `.api` (best-effort on Mac AppleEvents; many Windows COM properties unreachable)

**Disagreements between A and C are the audit's primary deliverable** — they catalog where openpyxl lies or omits relative to what Excel actually persisted.

Re-run: `uv run python packages/assay/scripts/probes/excel-driver-fidelity.py`

---

## Null / blank / empty

### null-blank-empty

**Recalc status:** **ok**

**Description:** Does Excel have a runtime-Null distinct from empty string and 0? Use Excel-specific TYPE() and CELL('type') alongside the gsheets-style ISBLANK/ISTEXT probes.

**Pre-probe expectation:** Excel typically collapses IF(,,) to 0 (different from gsheets, which has a Null). Empty string is a real string. Expect TYPE(A3) = 1 (number, because Excel coerces empty arg to 0), CELL('type', A3) = 'v'. If we're wrong here, that's the discovery.

#### Target: `A1` — untouched cell

**Surface A (openpyxl per-cell):**

```json
{
  "value": null,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "_missing": true,
  "_note": "no <c r='A1'> in null-blank-empty"
}
```

#### Target: `A2` — ="" 

**Surface A (openpyxl per-cell):**

```json
{
  "value": null,
  "data_type": "str",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "\"\"",
      "attributes": {}
    },
    "v": null
  }
}
```

#### Target: `A3` — =IF(,,)

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3"
  },
  "children": {
    "f": {
      "text": "IF(,,)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A4` — ISBLANK(A1) — truly empty

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A4",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISBLANK(A1)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `A5` — ISBLANK(A2) — empty-string-formula

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A5",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISBLANK(A2)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A6` — ISBLANK(A3) — IF(,,)

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A6"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A6",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISBLANK(A3)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A7` — ISTEXT(A2)

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A7"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A7",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISTEXT(A2)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `A8` — ISTEXT(A3)

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A8"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A8",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISTEXT(A3)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A9` — "x" & A2

**Surface A (openpyxl per-cell):**

```json
{
  "value": "x",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A9"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A9",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "\"x\" & A2",
      "attributes": {}
    },
    "v": "x"
  }
}
```

#### Target: `A10` — "x" & A3

**Surface A (openpyxl per-cell):**

```json
{
  "value": "x0",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A10"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A10",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "\"x\" & A3",
      "attributes": {}
    },
    "v": "x0"
  }
}
```

#### Target: `A11` — A2 = A3 — are they semantically interchangeable?

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A11"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A11",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A2=A3",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A12` — A2 = empty literal

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A12"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A12",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A2=\"\"",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `A13` — A3 = empty literal

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A13"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A13",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A3=\"\"",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A14` — TYPE(A2) — 2 means text, 1 means number, 16 means error

**Surface A (openpyxl per-cell):**

```json
{
  "value": 2,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A14"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A14"
  },
  "children": {
    "f": {
      "text": "TYPE(A2)",
      "attributes": {}
    },
    "v": "2"
  }
}
```

#### Target: `A15` — TYPE(A3) — what does Excel think IF(,,) is?

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A15"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A15"
  },
  "children": {
    "f": {
      "text": "TYPE(A3)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `A16` — CELL("type", A2) — "v" = value, "l" = label, "b" = blank

**Surface A (openpyxl per-cell):**

```json
{
  "value": "l",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A16"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A16",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A2)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "A16",
        "ca": "1"
      }
    },
    "v": "l"
  }
}
```

#### Target: `A17` — CELL("type", A3) — does Excel call this blank?

**Surface A (openpyxl per-cell):**

```json
{
  "value": "v",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A17"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A17",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A3)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "A17",
        "ca": "1"
      }
    },
    "v": "v"
  }
}
```


## Error sentinels

### error-sentinels

**Recalc status:** **ok**

**Description:** Each known Excel error sentinel. Includes Excel-only sentinels (#NULL!, #SPILL!, #CALC!) absent from the gsheets ErrorType enum. Previous run got #VALUE! for the SPILL and CALC tests — hypothesis: xlwings.formula2 entered SEQUENCE as single-cell array when the obstacle was pre-written. Now writing the obstacle POST-formula via post_formula_data.

**Pre-probe expectation:** All historical errors → standard sentinel. With obstacle written AFTER SEQUENCE spills, Excel should emit #SPILL!. #CALC! for empty FILTER result — but FILTER didn't change; may still need different test setup.

#### Target: `A1` — #DIV/0! from 1/0

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#DIV/0!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "t": "e"
  },
  "children": {
    "f": {
      "text": "1/0",
      "attributes": {}
    },
    "v": "#DIV/0!"
  }
}
```

#### Target: `A2` — #N/A from NA()

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#N/A",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "t": "e"
  },
  "children": {
    "f": {
      "text": "NA()",
      "attributes": {}
    },
    "v": "#N/A"
  }
}
```

#### Target: `A3` — #NAME? from unknown function

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#NAME?",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3",
    "t": "e",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "NotARealFunction()",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "A3",
        "ca": "1"
      }
    },
    "v": "#NAME?"
  }
}
```

#### Target: `A4` — #NUM! from SQRT(-1)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#NUM!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A4",
    "t": "e"
  },
  "children": {
    "f": {
      "text": "SQRT(-1)",
      "attributes": {}
    },
    "v": "#NUM!"
  }
}
```

#### Target: `A5` — #N/A from VLOOKUP miss — does Excel attach a message anywhere?

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#N/A",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A5",
    "t": "e"
  },
  "children": {
    "f": {
      "text": "VLOOKUP(\"nope\", A1, 1, FALSE)",
      "attributes": {}
    },
    "v": "#N/A"
  }
}
```

#### Target: `A6` — #VALUE! from text + number

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#VALUE!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A6"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A6",
    "t": "e"
  },
  "children": {
    "f": {
      "text": "\"a\"+1",
      "attributes": {}
    },
    "v": "#VALUE!"
  }
}
```

#### Target: `A7` — #NULL! from non-overlapping intersect — Excel-only vs gsheets ERROR

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#NULL!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A7"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A7",
    "t": "e",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "A1:A10 B11:B20",
      "attributes": {
        "t": "array",
        "ref": "A7"
      }
    },
    "v": "#NULL!"
  }
}
```

#### Target: `C1` — #SPILL! anchor (obstacle at C3 written post-formula)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#VALUE!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C1",
    "t": "e",
    "cm": "1",
    "vm": "1"
  },
  "children": {
    "f": {
      "text": "_xlfn.SEQUENCE(5)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "C1",
        "ca": "1"
      }
    },
    "v": "#VALUE!"
  }
}
```

#### Target: `C3` — obstacle cell — should remain 'obstacle' string

**Surface A (openpyxl per-cell):**

```json
{
  "value": "obstacle",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C3",
    "t": "s"
  },
  "children": {
    "v": "0"
  },
  "resolved_shared_string": "<ns0:si xmlns:ns0=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><ns0:t>obstacle</ns0:t></ns0:si>"
}
```

#### Target: `D1` — #CALC! from empty array result

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#VALUE!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "D1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "D1",
    "t": "e",
    "cm": "1",
    "vm": "2"
  },
  "children": {
    "f": {
      "text": "_xlfn._xlws.FILTER(A1:A5, FALSE)",
      "attributes": {
        "t": "array",
        "ref": "D1"
      }
    },
    "v": "#VALUE!"
  }
}
```


### stockhistory-getting-data

**Recalc status:** **ok**

**Description:** STOCKHISTORY attempt to surface #GETTING_DATA in flight. Now entered via xlwings.formula2 post-open so Excel's parser handles the modern-function namespacing.

**Pre-probe expectation:** The audit question is whether #GETTING_DATA ever lands in the saved file. If Excel resolves to data or error before save, the answer is no. Probably fails to open without sign-in.

#### Target: `A1` — STOCKHISTORY — #GETTING_DATA if in-flight, an error if no MS account, or actual data if signed in

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#VALUE!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "t": "e",
    "cm": "1",
    "vm": "1"
  },
  "children": {
    "f": {
      "text": "_xlfn.STOCKHISTORY(\"MSFT\", TODAY()-5, TODAY())",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "A1",
        "ca": "1"
      }
    },
    "v": "#VALUE!"
  }
}
```


## numFmt inference and propagation

### numfmt-inference

**Recalc status:** **ok**

**Description:** Whether Excel auto-applies a date/time/percent format to formulas that produce typed values, and whether it propagates through cell references and arithmetic. CRITICAL re-test with xlwings.formula2 — first run showed no auto-format, but that was openpyxl-write which may bypass Excel's UI-side auto-format heuristics. This run tests whether xlwings entry triggers them.

**Pre-probe expectation:** DATE/NOW/TODAY: auto-applied. Reference inherits (gsheets does — Excel should too). Arithmetic with date keeps date. Literal serial does NOT infer. ALSO probe whether openpyxl's `is_date` agrees with the cell's actual numFmt.

#### Target: `A1` — DATE() — expect numFmt=DATE auto-applied

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__datetime__": "2023-03-19T00:00:00"
  },
  "data_type": "d",
  "number_format": "mm-dd-yy",
  "is_date": true,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "s": "1"
  },
  "children": {
    "f": {
      "text": "DATE(2023,3,19)",
      "attributes": {}
    },
    "v": "45004"
  }
}
```

#### Target: `A2` — NOW() — expect numFmt=DATE_TIME auto-applied

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__datetime__": "2026-05-22T22:18:25.080000"
  },
  "data_type": "d",
  "number_format": "m/d/yy h:mm",
  "is_date": true,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "s": "2"
  },
  "children": {
    "f": {
      "text": "NOW()",
      "attributes": {
        "ca": "1"
      }
    },
    "v": "46164.929456944446"
  }
}
```

#### Target: `A3` — TODAY() — expect numFmt=DATE auto-applied

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__datetime__": "2026-05-22T00:00:00"
  },
  "data_type": "d",
  "number_format": "mm-dd-yy",
  "is_date": true,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3",
    "s": "1"
  },
  "children": {
    "f": {
      "text": "TODAY()",
      "attributes": {
        "ca": "1"
      }
    },
    "v": "46164"
  }
}
```

#### Target: `A4` — literal 123 — expect General / no inference

**Surface A (openpyxl per-cell):**

```json
{
  "value": 123,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A4"
  },
  "children": {
    "v": "123"
  }
}
```

#### Target: `A5` — =A1 — does the date numFmt propagate?

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__datetime__": "2023-03-19T00:00:00"
  },
  "data_type": "d",
  "number_format": "mm-dd-yy",
  "is_date": true,
  "coordinate": "A5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A5",
    "s": "1"
  },
  "children": {
    "f": {
      "text": "A1",
      "attributes": {}
    },
    "v": "45004"
  }
}
```

#### Target: `A6` — =A1+0 — date + number, does it stay date?

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__datetime__": "2023-03-19T00:00:00"
  },
  "data_type": "d",
  "number_format": "mm-dd-yy",
  "is_date": true,
  "coordinate": "A6"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A6",
    "s": "1"
  },
  "children": {
    "f": {
      "text": "A1+0",
      "attributes": {}
    },
    "v": "45004"
  }
}
```

#### Target: `A7` — TEXT(A1, 'yyyy-mm-dd') — explicit text format on date

**Surface A (openpyxl per-cell):**

```json
{
  "value": "2023-03-19",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A7"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A7",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "TEXT(A1, \"yyyy-mm-dd\")",
      "attributes": {}
    },
    "v": "2023-03-19"
  }
}
```

#### Target: `A8` — literal 45004 — same serial as A1 but no inference

**Surface A (openpyxl per-cell):**

```json
{
  "value": 45004,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A8"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A8"
  },
  "children": {
    "v": "45004"
  }
}
```

#### Target: `A9` — 10% literal — percent inference

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0.1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A9"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A9"
  },
  "children": {
    "f": {
      "text": "10%",
      "attributes": {}
    },
    "v": "0.1"
  }
}
```

#### Target: `A10` — 1/4 — general number

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0.25,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A10"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A10"
  },
  "children": {
    "f": {
      "text": "1/4",
      "attributes": {}
    },
    "v": "0.25"
  }
}
```


## Boolean values

### boolean-data-type

**Recalc status:** **ok**

**Description:** OOXML `t='b'` round-trip via openpyxl and xlwings. Does data_type stay 'b' through write/recalc/read?

**Pre-probe expectation:** t='b' for booleans; openpyxl reports value=True/False and data_type='b'. A4 tests openpyxl's writer.

#### Target: `A1` — TRUE formula

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "TRUE",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `A2` — FALSE formula

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "FALSE",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A3` — boolean from 1=1

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "1=1",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `A4` — Python True written via openpyxl

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A4",
    "t": "b"
  },
  "children": {
    "v": "1"
  }
}
```

#### Target: `A5` — integer 1 from IF(TRUE,1,0) — should be number, not boolean

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A5"
  },
  "children": {
    "f": {
      "text": "IF(TRUE, 1, 0)",
      "attributes": {}
    },
    "v": "1"
  }
}
```


## Rich text per-run round-trip

### rich-text

**Recalc status:** **ok**

**Description:** Does openpyxl's CellRichText survive a write → xlwings recalc-and-save → openpyxl read cycle? Does Excel preserve runs, flatten them, or strip them?

**Pre-probe expectation:** A1 round-trips with runs preserved if openpyxl 3.1.5's CellRichText writer is faithful AND Excel preserves it. Worth checking — Excel has been known to flatten runs on certain operations.

#### Target: `A1` — CellRichText with bold + italic runs

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__rich_text__": "Hello plain world"
  },
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1",
  "rich_runs": [
    {
      "text": "Hello ",
      "format": {
        "b": "True",
        "i": "False",
        "rFont": "Calibri",
        "sz": "11.0"
      }
    },
    {
      "text": "plain ",
      "format": {
        "b": "False",
        "i": "False",
        "color": "<openpyxl.styles.colors.Color object>\nParameters:\nrgb=None, indexed=None, auto=None, theme=1, tint=0.0, type='theme'",
        "rFont": "Calibri",
        "sz": "11.0"
      }
    },
    {
      "text": "world",
      "format": {
        "b": "False",
        "i": "True",
        "rFont": "Calibri",
        "sz": "11.0"
      }
    }
  ]
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "t": "s"
  },
  "children": {
    "v": "0"
  },
  "resolved_shared_string": "<ns0:si xmlns:ns0=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><ns0:r><ns0:rPr><ns0:b /><ns0:sz val=\"11\" /><ns0:rFont val=\"Calibri\" /><ns0:family val=\"2\" /></ns0:rPr><ns0:t xml:space=\"preserve\">Hello </ns0:t></ns0:r><ns0:r><ns0:rPr><ns0:sz val=\"11\" /><ns0:color theme=\"1\" /><ns0:rFont val=\"Calibri\" /><ns0:family val=\"2\" /><ns0:scheme val=\"minor\" /></ns0:rPr><ns0:t xml:space=\"preserve\">plain </ns0:t></ns0:r><ns0:r><ns0:rPr><ns0:i /><ns0:sz val=\"11\" /><ns0:rFont val=\"Calibri\" /><ns0:family val=\"2\" /></ns0:rPr><ns0:t>world</ns0:t></ns0:r></ns0:si>"
}
```

#### Target: `A2` — plain string control

**Surface A (openpyxl per-cell):**

```json
{
  "value": "plain text",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "t": "s"
  },
  "children": {
    "v": "1"
  },
  "resolved_shared_string": "<ns0:si xmlns:ns0=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><ns0:t>plain text</ns0:t></ns0:si>"
}
```

#### Target: `A3` — string concat formula — formulas never produce runs

**Surface A (openpyxl per-cell):**

```json
{
  "value": "bold italic",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "\"bold \" & \"italic\"",
      "attributes": {}
    },
    "v": "bold italic"
  }
}
```


## Hyperlink encodings

### hyperlinks

**Recalc status:** **ok**

**Description:** Excel has two distinct file-level hyperlink encodings: the sheet-level <hyperlinks> block (manual) and the =HYPERLINK() formula text. Do they cross-populate? What does openpyxl's cell.hyperlink resolve in each case?

**Pre-probe expectation:** A1: cell.hyperlink resolves; URL also in raw <hyperlinks> block. A2: cell.hyperlink is None; URL only inside <f>. A3: behavior unclear — Excel may or may not auto-recognize. This is exactly the audit's job.

**Sheet-level `<hyperlinks>` block:** `[{"ref": "A1", "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id": "rId1", "{http://schemas.microsoft.com/office/spreadsheetml/2014/revision}uid": "{00000000-0004-0000-0000-000000000000}", "resolved_target": "https://example.com/manual"}]`

#### Target: `A1` — manual hyperlink via openpyxl.Hyperlink → sheet-level <hyperlinks>

**Surface A (openpyxl per-cell):**

```json
{
  "value": "click manual",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1",
  "hyperlink": {
    "target": "https://example.com/manual",
    "display": null,
    "tooltip": null,
    "location": null
  }
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "t": "s"
  },
  "children": {
    "v": "0"
  },
  "resolved_shared_string": "<ns0:si xmlns:ns0=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><ns0:t>click manual</ns0:t></ns0:si>"
}
```

#### Target: `A2` — =HYPERLINK formula — URL only in <f>, not in sheet hyperlinks block

**Surface A (openpyxl per-cell):**

```json
{
  "value": "click formula",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "s": "1",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "HYPERLINK(\"https://example.com/formula\", \"click formula\")",
      "attributes": {}
    },
    "v": "click formula"
  }
}
```

#### Target: `A3` — typed URL — does Excel auto-recognize and emit a hyperlink?

**Surface A (openpyxl per-cell):**

```json
{
  "value": "https://example.com/typed",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3",
    "t": "s"
  },
  "children": {
    "v": "1"
  },
  "resolved_shared_string": "<ns0:si xmlns:ns0=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><ns0:t>https://example.com/typed</ns0:t></ns0:si>"
}
```


## Spill / array models

### spill-array-models

**Recalc status:** **ok**

**Description:** Modern dynamic-array (SEQUENCE-style) anchor/recipient identity in OOXML, and legacy CSE array via xlwings.formula_array. With xlwings.formula2 entry for SEQUENCE, Excel should evaluate it correctly (previous run hit _xludf rewrite due to openpyxl-write). Plus C5: =TYPE(A1#) for spill-range introspection — does the # spill-range operator make TYPE see an array (64)?

**Pre-probe expectation:** A1 has <f> + spill metadata in xl/metadata.xml. A2-A5 are plain value cells (no cm). CSE array gets <f t='array' ref='C1'>. C5: TYPE(A1#) should return 64 if the # operator exposes the array nature, distinguishing it from TYPE(A1)=1.

#### Target: `A1` — SEQUENCE(5) anchor — has <f>, should have spill metadata

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "_xlfn.SEQUENCE(5)",
      "attributes": {
        "t": "array",
        "ref": "A1:A5"
      }
    },
    "v": "1"
  }
}
```

#### Target: `A2` — spill recipient — should have <c cm='...'> but no <f>

**Surface A (openpyxl per-cell):**

```json
{
  "value": 2,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2"
  },
  "children": {
    "v": "2"
  }
}
```

#### Target: `A3` — spill recipient

**Surface A (openpyxl per-cell):**

```json
{
  "value": 3,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3"
  },
  "children": {
    "v": "3"
  }
}
```

#### Target: `A4` — spill recipient

**Surface A (openpyxl per-cell):**

```json
{
  "value": 4,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A4"
  },
  "children": {
    "v": "4"
  }
}
```

#### Target: `A5` — spill recipient

**Surface A (openpyxl per-cell):**

```json
{
  "value": 5,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A5"
  },
  "children": {
    "v": "5"
  }
}
```

#### Target: `C1` — CSE-array attempt — depends on xlwings.formula_array re-write

**Surface A (openpyxl per-cell):**

```json
{
  "value": 4,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C1"
  },
  "children": {
    "f": {
      "text": "SUM(IF(B1:B3>0,B1:B3))",
      "attributes": {
        "t": "array",
        "ref": "C1"
      }
    },
    "v": "4"
  }
}
```

#### Target: `E1` — TYPE(A1#) — spill-range introspection; expect 64 (array)

**Surface A (openpyxl per-cell):**

```json
{
  "value": 64,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "E1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "E1"
  },
  "children": {
    "f": {
      "text": "TYPE(_xlfn.ANCHORARRAY(A1))",
      "attributes": {}
    },
    "v": "64"
  }
}
```

#### Target: `E2` — TYPE(A1) — single-cell control; expect 1 (number)

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "E2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "E2"
  },
  "children": {
    "f": {
      "text": "TYPE(A1)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `E3` — ROWS(A1#) — how big does Excel see the spill; expect 5

**Surface A (openpyxl per-cell):**

```json
{
  "value": 5,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "E3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "E3"
  },
  "children": {
    "f": {
      "text": "ROWS(_xlfn.ANCHORARRAY(A1))",
      "attributes": {}
    },
    "v": "5"
  }
}
```

#### Target: `E4` — SUM(A1#) — spill-range arithmetic; expect 15

**Surface A (openpyxl per-cell):**

```json
{
  "value": 15,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "E4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "E4"
  },
  "children": {
    "f": {
      "text": "SUM(_xlfn.ANCHORARRAY(A1))",
      "attributes": {}
    },
    "v": "15"
  }
}
```


## LAMBDA, LET, and modern lambda helpers

### lambda-at-boundary

**Recalc status:** **ok**

**Description:** Does Excel's cell-boundary LAMBDA emit #CALC! or #VALUE!? How do LET / BYROW present? Re-test with xlwings.formula2 entry — first run hit _xludf rewrite.

**Pre-probe expectation:** A1: #CALC! (probably; gsheets returns N_A with a specific message). A2: 6. A3: 6. A4: array {3;7} — depends on spill behavior.

#### Target: `A1` — bare LAMBDA — expect #CALC! probably

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#VALUE!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "t": "e",
    "cm": "1",
    "vm": "1"
  },
  "children": {
    "f": {
      "text": "_xlfn.LAMBDA(_xlpm.x, _xlpm.x+1)",
      "attributes": {
        "t": "array",
        "ref": "A1"
      }
    },
    "v": "#VALUE!"
  }
}
```

#### Target: `A2` — called LAMBDA — expect 6

**Surface A (openpyxl per-cell):**

```json
{
  "value": 6,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "_xlfn.LAMBDA(_xlpm.x, _xlpm.x+1)(5)",
      "attributes": {
        "t": "array",
        "ref": "A2"
      }
    },
    "v": "6"
  }
}
```

#### Target: `A3` — LET binding — expect 6

**Surface A (openpyxl per-cell):**

```json
{
  "value": 6,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3"
  },
  "children": {
    "f": {
      "text": "_xlfn.LET(_xlpm.x, 5, _xlpm.x+1)",
      "attributes": {}
    },
    "v": "6"
  }
}
```

#### Target: `A4` — BYROW returning array of row sums — modern lambda helper

**Surface A (openpyxl per-cell):**

```json
{
  "value": 3,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A4",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "_xlfn.BYROW({1,2;3,4}, _xlfn.LAMBDA(_xlpm.row, SUM(_xlpm.row)))",
      "attributes": {
        "t": "array",
        "ref": "A4:A5"
      }
    },
    "v": "3"
  }
}
```


## _xlfn. / _xlws. function-name prefixing

### xlfn-prefixing

**Recalc status:** **ok**

**Description:** Modern Excel functions are stored in the saved xlsx as _xlfn.XLOOKUP, _xlfn._xlws.FILTER, etc. With xlwings.formula2 entry, Excel's parser should write the correct prefixes. After save, raw XML should show _xlfn./_xlws. namespacing.

**Pre-probe expectation:** Raw XML shows _xlfn./ _xlws. prefixes. openpyxl when data_only=False reads <f> — does it strip? data_only=True hides <f> entirely.

#### Target: `D1` — XLOOKUP — expect _xlfn.XLOOKUP in raw XML, 'XLOOKUP' or the prefixed form in openpyxl <f> read?

**Surface A (openpyxl per-cell):**

```json
{
  "value": 2,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "D1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "D1"
  },
  "children": {
    "f": {
      "text": "_xlfn.XLOOKUP(\"beta\", A1:A3, B1:B3)",
      "attributes": {}
    },
    "v": "2"
  }
}
```

#### Target: `D2` — FILTER — expect _xlfn._xlws.FILTER

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#VALUE!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "D2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "D2",
    "t": "e",
    "cm": "1",
    "vm": "1"
  },
  "children": {
    "f": {
      "text": "_xlfn._xlws.FILTER(B1:B3, B1:B3>1)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "D2",
        "ca": "1"
      }
    },
    "v": "#VALUE!"
  }
}
```

#### Target: `D3` — UNIQUE

**Surface A (openpyxl per-cell):**

```json
{
  "value": "#VALUE!",
  "data_type": "e",
  "number_format": "General",
  "is_date": false,
  "coordinate": "D3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "D3",
    "t": "e",
    "cm": "1",
    "vm": "2"
  },
  "children": {
    "f": {
      "text": "_xlfn.UNIQUE({1;2;2;3})",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "D3",
        "ca": "1"
      }
    },
    "v": "#VALUE!"
  }
}
```

#### Target: `D4` — LET

**Surface A (openpyxl per-cell):**

```json
{
  "value": 10,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "D4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "D4"
  },
  "children": {
    "f": {
      "text": "_xlfn.LET(_xlpm.x, 5, _xlpm.x*2)",
      "attributes": {}
    },
    "v": "10"
  }
}
```


## Implicit intersection / @ operator

### implicit-intersection

**Recalc status:** **ok**

**Description:** Post-365 dynamic arrays changed the meaning of bare range refs in single-cell contexts. The @ operator restores pre-365 single-value behavior. Re-test with xlwings entry — last run showed @ stripped on save (pre-365 behavior, but possibly an openpyxl-write artifact).

**Pre-probe expectation:** C1 spills to C1:C5 with value 1,2,3,4,5. D1 = 1. E1 = 15. Worth checking whether Excel rewrites the formula on save (some versions normalize @ insertion).

#### Target: `C1` — =A1:A5 — should spill in 365; <f> may carry @ in older form

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C1",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "A1:A5",
      "attributes": {
        "t": "array",
        "ref": "C1:C5"
      }
    },
    "v": "1"
  }
}
```

#### Target: `D1` — =@A1:A5 — single value, A1

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "D1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "D1"
  },
  "children": {
    "f": {
      "text": "A1:A5",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `E1` — =SUM(A1:A5) — control, no intersection issue

**Surface A (openpyxl per-cell):**

```json
{
  "value": 15,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "E1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "E1"
  },
  "children": {
    "f": {
      "text": "SUM(A1:A5)",
      "attributes": {}
    },
    "v": "15"
  }
}
```


## Date system (1900 vs 1904)

### date-system-1900

**Recalc status:** **ok**

**Description:** Default 1900 date system. Confirms baseline. Now tests whether xlwings.formula2 entry of =DATE() triggers Excel's UI-side auto-format (the first run via openpyxl-write showed no auto-format).

**Pre-probe expectation:** If xlwings entry triggers auto-format, A1 will have a date numFmt and openpyxl.cell.value may coerce to datetime. If not, same as last run.

#### Target: `A1` — =DATE(2023,3,19) → serial 45004; auto-numFmt?

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__datetime__": "2023-03-19T00:00:00"
  },
  "data_type": "d",
  "number_format": "mm-dd-yy",
  "is_date": true,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "s": "1"
  },
  "children": {
    "f": {
      "text": "DATE(2023,3,19)",
      "attributes": {}
    },
    "v": "45004"
  }
}
```

#### Target: `A2` — literal 45004

**Surface A (openpyxl per-cell):**

```json
{
  "value": 45004,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2"
  },
  "children": {
    "v": "45004"
  }
}
```

#### Target: `A3` — reference — does inferred type propagate?

**Surface A (openpyxl per-cell):**

```json
{
  "value": 45004,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3"
  },
  "children": {
    "f": {
      "text": "A2",
      "attributes": {}
    },
    "v": "45004"
  }
}
```


### date-system-1904

**Recalc status:** **ok**

**Description:** 1904 date system. The current driver's _DATE_EPOCH = datetime(1899,12,30) is hardcoded — would 1904-mode workbooks silently shift by 1462 days?

**Pre-probe expectation:** A1 cell.value should be 43542 (raw serial) or datetime(2023,3,19) if openpyxl knows wb.epoch.

#### Target: `A1` — =DATE(2023,3,19) → serial 43542 in 1904 system

**Surface A (openpyxl per-cell):**

```json
{
  "value": {
    "__datetime__": "2023-03-19T00:00:00"
  },
  "data_type": "d",
  "number_format": "mm-dd-yy",
  "is_date": true,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A1",
    "s": "1"
  },
  "children": {
    "f": {
      "text": "DATE(2023,3,19)",
      "attributes": {}
    },
    "v": "43542"
  }
}
```

#### Target: `A2` — literal 43542

**Surface A (openpyxl per-cell):**

```json
{
  "value": 43542,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2"
  },
  "children": {
    "v": "43542"
  }
}
```

#### Target: `A3` — reference

**Surface A (openpyxl per-cell):**

```json
{
  "value": 43542,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3"
  },
  "children": {
    "f": {
      "text": "A2",
      "attributes": {}
    },
    "v": "43542"
  }
}
```


## Excel TYPE() and CELL() — engine-side type introspection

### type-and-cell-probes

**Recalc status:** **ok**

**Description:** Excel-native introspection of what the engine thinks each cell is. Useful for triangulating against openpyxl's data_type. With SEQUENCE working via xlwings entry, B5/C5 will reflect array type (64 / 'v' respectively).

**Pre-probe expectation:** B1=1, B2=2, B3=4, B4=16, B5=64. C1='v', C2='l', C3='v' (booleans are values), C4='v', C5='v'.

#### Target: `B1` — TYPE of A1

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "B1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "B1"
  },
  "children": {
    "f": {
      "text": "TYPE(A1)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `B2` — TYPE of A2

**Surface A (openpyxl per-cell):**

```json
{
  "value": 2,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "B2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "B2"
  },
  "children": {
    "f": {
      "text": "TYPE(A2)",
      "attributes": {}
    },
    "v": "2"
  }
}
```

#### Target: `B3` — TYPE of A3

**Surface A (openpyxl per-cell):**

```json
{
  "value": 4,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "B3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "B3"
  },
  "children": {
    "f": {
      "text": "TYPE(A3)",
      "attributes": {}
    },
    "v": "4"
  }
}
```

#### Target: `B4` — TYPE of A4

**Surface A (openpyxl per-cell):**

```json
{
  "value": 16,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "B4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "B4"
  },
  "children": {
    "f": {
      "text": "TYPE(A4)",
      "attributes": {}
    },
    "v": "16"
  }
}
```

#### Target: `B5` — TYPE of A5

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "B5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "B5"
  },
  "children": {
    "f": {
      "text": "TYPE(A5)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `C1` — CELL('type', A1)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "v",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C1",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A1)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "C1",
        "ca": "1"
      }
    },
    "v": "v"
  }
}
```

#### Target: `C2` — CELL('type', A2)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "l",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C2",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A2)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "C2",
        "ca": "1"
      }
    },
    "v": "l"
  }
}
```

#### Target: `C3` — CELL('type', A3)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "v",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C3",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A3)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "C3",
        "ca": "1"
      }
    },
    "v": "v"
  }
}
```

#### Target: `C4` — CELL('type', A4)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "v",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C4",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A4)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "C4",
        "ca": "1"
      }
    },
    "v": "v"
  }
}
```

#### Target: `C5` — CELL('type', A5)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "v",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "C5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "C5",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A5)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "C5",
        "ca": "1"
      }
    },
    "v": "v"
  }
}
```


## Blank cell representation

### blank-cell-semantics

**Recalc status:** **ok**

**Description:** How does Excel represent blank cells if there's no runtime-Null variant? Probes truly-untouched vs '=""' vs '=IF(,,)' via TYPE/CELL/IS* introspection, arithmetic/concat/comparison coercions, and VLOOKUP-returning-blank propagation.

**Pre-probe expectation:** Untouched: ISBLANK TRUE, CELL='b', TYPE=1 (Excel treats blank as 0 for TYPE). Numeric/text coercions per spec. VLOOKUP-returning-blank is the load-bearing question: does the result propagate blank semantics, or does Excel coerce on read? gsheets propagates Null through VLOOKUP — Excel almost certainly does NOT, but worth verifying.

#### Target: `A1` — untouched cell — file should have no <c r='A1'>

**Surface A (openpyxl per-cell):**

```json
{
  "value": null,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "_missing": true,
  "_note": "no <c r='A1'> in blank-cell-semantics"
}
```

#### Target: `A2` — =""

**Surface A (openpyxl per-cell):**

```json
{
  "value": null,
  "data_type": "str",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A2",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "\"\"",
      "attributes": {}
    },
    "v": null
  }
}
```

#### Target: `A3` — =IF(,,)

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A3"
  },
  "children": {
    "f": {
      "text": "IF(,,)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A4` — =IF(FALSE, 1, ) — missing arg

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A4"
  },
  "children": {
    "f": {
      "text": "IF(FALSE, 1, )",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `A5` — =VLOOKUP(2, B1:C3, 2, FALSE) — returns blank C2

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "A5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "A5"
  },
  "children": {
    "f": {
      "text": "VLOOKUP(2, B1:C3, 2, FALSE)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F1` — TYPE(A1) — number 1 (treated as 0) or other?

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F1"
  },
  "children": {
    "f": {
      "text": "TYPE(A1)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F2` — CELL("type", A1) — expect "b" for blank

**Surface A (openpyxl per-cell):**

```json
{
  "value": "b",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F2",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A1)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "F2",
        "ca": "1"
      }
    },
    "v": "b"
  }
}
```

#### Target: `F3` — ISBLANK(A1) — TRUE

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F3",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISBLANK(A1)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F4` — ISNUMBER(A1)

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F4",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISNUMBER(A1)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F5` — ISTEXT(A1)

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F5",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISTEXT(A1)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F6` — ISLOGICAL(A1)

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F6"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F6",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISLOGICAL(A1)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F7` — ISERROR(A1)

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F7"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F7",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISERROR(A1)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F8` — N(A1) — numeric coercion of blank

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F8"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F8"
  },
  "children": {
    "f": {
      "text": "N(A1)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F9` — T(A1) — text coercion of blank

**Surface A (openpyxl per-cell):**

```json
{
  "value": null,
  "data_type": "str",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F9"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F9",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "T(A1)",
      "attributes": {}
    },
    "v": null
  }
}
```

#### Target: `F10` — A1+5 — expect 5

**Surface A (openpyxl per-cell):**

```json
{
  "value": 5,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F10"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F10"
  },
  "children": {
    "f": {
      "text": "A1+5",
      "attributes": {}
    },
    "v": "5"
  }
}
```

#### Target: `F11` — "x" & A1 — expect "x"

**Surface A (openpyxl per-cell):**

```json
{
  "value": "x",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F11"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F11",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "\"x\" & A1",
      "attributes": {}
    },
    "v": "x"
  }
}
```

#### Target: `F12` — A1=0 — equality with 0

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F12"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F12",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A1=0",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F13` — A1="" — equality with ""

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F13"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F13",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A1=\"\"",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F14` — A1=FALSE

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F14"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F14",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A1=FALSE",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F15` — COUNTBLANK(A1) — untouched

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F15"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F15"
  },
  "children": {
    "f": {
      "text": "COUNTBLANK(A1)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F16` — COUNTBLANK(A2) — =""

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F16"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F16"
  },
  "children": {
    "f": {
      "text": "COUNTBLANK(A2)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F17` — COUNTBLANK(A3) — =IF(,,)

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F17"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F17"
  },
  "children": {
    "f": {
      "text": "COUNTBLANK(A3)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F18` — COUNTBLANK(A4) — =IF(FALSE,1,)

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F18"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F18"
  },
  "children": {
    "f": {
      "text": "COUNTBLANK(A4)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F19` — COUNTA(A1) — untouched

**Surface A (openpyxl per-cell):**

```json
{
  "value": 0,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F19"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F19"
  },
  "children": {
    "f": {
      "text": "COUNTA(A1)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `F20` — COUNTA(A2) — =""

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F20"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F20"
  },
  "children": {
    "f": {
      "text": "COUNTA(A2)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `F21` — COUNTA(A3) — =IF(,,)

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "F21"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "F21"
  },
  "children": {
    "f": {
      "text": "COUNTA(A3)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `G1` — ISBLANK of VLOOKUP-result — does blank propagate?

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "G1"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "G1",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "ISBLANK(A5)",
      "attributes": {}
    },
    "v": "0"
  }
}
```

#### Target: `G2` — TYPE of VLOOKUP-result

**Surface A (openpyxl per-cell):**

```json
{
  "value": 1,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "G2"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "G2"
  },
  "children": {
    "f": {
      "text": "TYPE(A5)",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `G3` — CELL("type", VLOOKUP-result)

**Surface A (openpyxl per-cell):**

```json
{
  "value": "v",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "G3"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "G3",
    "t": "str",
    "cm": "1"
  },
  "children": {
    "f": {
      "text": "CELL(\"type\", A5)",
      "attributes": {
        "t": "array",
        "aca": "1",
        "ref": "G3",
        "ca": "1"
      }
    },
    "v": "v"
  }
}
```

#### Target: `G4` — (VLOOKUP-result)+5

**Surface A (openpyxl per-cell):**

```json
{
  "value": 5,
  "data_type": "n",
  "number_format": "General",
  "is_date": false,
  "coordinate": "G4"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "G4"
  },
  "children": {
    "f": {
      "text": "A5+5",
      "attributes": {}
    },
    "v": "5"
  }
}
```

#### Target: `G5` — "x" & VLOOKUP-result

**Surface A (openpyxl per-cell):**

```json
{
  "value": "x0",
  "data_type": "s",
  "number_format": "General",
  "is_date": false,
  "coordinate": "G5"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "G5",
    "t": "str"
  },
  "children": {
    "f": {
      "text": "\"x\" & A5",
      "attributes": {}
    },
    "v": "x0"
  }
}
```

#### Target: `G6` — VLOOKUP-result = 0

**Surface A (openpyxl per-cell):**

```json
{
  "value": true,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "G6"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "G6",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A5=0",
      "attributes": {}
    },
    "v": "1"
  }
}
```

#### Target: `G7` — VLOOKUP-result = ""

**Surface A (openpyxl per-cell):**

```json
{
  "value": false,
  "data_type": "b",
  "number_format": "General",
  "is_date": false,
  "coordinate": "G7"
}
```

**Surface C (raw OOXML `<c>` element):**

```json
{
  "attributes": {
    "r": "G7",
    "t": "b"
  },
  "children": {
    "f": {
      "text": "A5=\"\"",
      "attributes": {}
    },
    "v": "0"
  }
}
```


---

## Disagreements catalog

**Entry-point doc for the 2026-05-22 audit session:** [`audit-session-2026-05-22.md`](./audit-session-2026-05-22.md) — comprehensive index of all artifacts + state + queued work.

Fifth pass, 2026-05-22, post-research-agent consolidation. The empirical-probe findings are now cross-validated against official Microsoft sources (MS-XLSX spec, Excel JS API docs, Office support pages, M365 release notes, ECMA-376). Findings labeled **[spec-grounded]** have direct citations into authoritative material; **[empirical-only]** are from probes only, no official source either confirms or contradicts.

**Note:** the probe script regenerates this report from scratch on each run. The catalog below is annotated by hand atop the raw scenario data above. If the script is re-run, restore the catalog from git history.

### Architectural finding (NEW from research): OOXML has two error-encoding paths

Per [MS-XLSX §2.3.6.1.3 "Error Types"](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/1d44a793-c90a-47da-8943-08802dfad1fd) + the [Rich Values](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/8c1f2a3e-2f7b-4eac-baf0-ef2173648b42) section:

**Classic path** (closed-set of 7 errors): `<c t="e"><v>#X!</v></c>` — limited to `#DIV/0!`, `#N/A`, `#NAME?`, `#NULL!`, `#NUM!`, `#REF!`, `#VALUE!`. Backed by `XlCVError` VBA enum.

**Modern path** (rich-value indirection): `<c vm="N"><v>FALLBACK</v></c>` — the cell carries a `vm=` (valueMetadata) attribute pointing into `xl/metadata.xml`'s `XLRICHVALUE` futureMetadata, which references a `CT_RichValueStructure` in `xl/richData/` with `t="_error"` and `errorType=<integer>`. The `<v>` element holds a `CT_RichValueFallback` ([MS-XLSX §2.6.178](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/56b98662-f6e0-4e78-8649-7ec216b10680)) typed `b`/`n`/`e`/`s`; for both `#SPILL!` and `#CALC!`, the chosen fallback is the legacy `#VALUE!` string. Rich-value-aware readers (Excel UI) rehydrate to show the true error; rich-value-unaware readers (our raw-XML reader today; openpyxl) see only the fallback.

**Modern errors via this path:** `#SPILL!` (errorType=8), `#CALC!` (13), `#UNKNOWN!` (11), `#GETTING_DATA`, `#BUSY!`, `#BLOCKED!`, `#CONNECT!`, `#FIELD!`, `#PYTHON!`, `#EXTERNAL!`, `#TIMEOUT!` — at least 11. Specific integer codes for #SPILL!/#CALC!/#UNKNOWN! are public; the rest are documented in the Excel JS API but not in the public MS-XLSX subType enumeration.

**Driver-rework TODO — LANDED in audit-session-2026-05-22 and VERIFIED 2026-05-23 via probe C9.** `RawXmlReader.resolve_vm(vm)` now walks the corrected valueMetadata/futureMetadata/rich-value indirection chain and returns a typed `{symbol, errorType, subType?, extras?}` descriptor. See F26 below for the full chain + complete errorType integer-to-symbol map.

### Category 1 — Excel-as-engine behavior

**F1. Excel auto-applies date numFmt to `=DATE()`, `=NOW()`, `=TODAY()` — matches gsheets.**

Propagates through references AND arithmetic (`=A1+0` inherits). Literal numbers stay General. Schema can treat `numFmt.type` as primary type signal.

**F2. Excel collapses `=IF(,,)` to literal 0 — no propagatable runtime-Null.**

ISBLANK=FALSE, ISTEXT=FALSE, TYPE=1, CELL("type")="v". The `kind: 'null'` schema variant is gsheets-and-Lattice only.

**F3. Excel has a distinct "blank" cell category at the engine level, but it does NOT propagate through formula evaluation.**

- Truly untouched cell: `CELL("type")="b"`, ISBLANK=TRUE, ISTEXT/ISNUMBER/ISLOGICAL/ISERROR all FALSE, polymorphic equality with 0, "", FALSE simultaneously.
- VLOOKUP-of-blank: result is number 0, NOT blank. ISBLANK=FALSE, CELL("type")="v", `"x" & result = "x0"`.

**Excel's blank is a cell-state property. gsheets' Null is a propagatable runtime value.** Concrete divergence: `=ISBLANK(VLOOKUP-of-blank)` returns FALSE on Excel, TRUE on gsheets.

**F4. COUNTBLANK has inclusive semantics that diverge from ISBLANK.**

- `COUNTBLANK(untouched)`=1, `COUNTBLANK("")`=1 (despite ISBLANK FALSE), `COUNTBLANK(IF(,,))`=0 (decayed to 0).
- gsheets COUNTBLANK counts Null cells (=1 for IF(,,)). Real divergence.

**F5. Modern dynamic-array / lambda functions all work when entered via xlwings.formula2.**

SEQUENCE, FILTER, UNIQUE, XLOOKUP, LAMBDA, LET, BYROW, STOCKHISTORY all evaluate correctly. First-run `_xludf.` rewrites were openpyxl-write artifacts.

**F6 [spec-grounded; revised from research]. The OOXML function-name namespace family — five productions per MS-XLSX §2.2.2/2.2.4 ABNF:**

| Prefix | Meaning | Membership |
|---|---|---|
| `_xlfn.<NAME>` | "future function" — modern function defined in MS-XLSX but absent from base ECMA-376 | Closed enumeration. Includes XLOOKUP, SEQUENCE, LAMBDA, LET, BYROW, UNIQUE, TEXTSPLIT, FILTER (also gets `_xlws`), and ~50 others. SUM/IF/VLOOKUP/etc. never get prefixed. |
| `_xlfn._xlws.<NAME>` | "worksheet-only function" — restricted to cell contexts | **Exactly 3 members: FILTER, SORT, PY** (Python in Excel). The `_xlws` namespace marks the worksheet-context restriction empirically; the spec doesn't explain why. |
| `_xlpm.<NAME>` | LAMBDA/LET parameter identifier — prevents collision with workbook-level defined names | Used inside `_xlfn.LAMBDA(_xlpm.x, _xlpm.x+1)` etc. |
| `_xlop.<NAME>` | LAMBDA *optional* parameter identifier (likely used with ISOMITTED) | Present in MS-XLSX ABNF but no prose. We hadn't observed it in probes. |
| `_xludf.<NAME>` | **OFF-SPEC.** Not defined anywhere in MS-XLSX. A writer-side convention (Google Sheets' `_xludf.DUMMYFUNCTION` is the canonical case) for round-tripping unrecognized function names. Excel preserves it on read but the spec is silent. | Open-set; treat as pass-through unknown-function escape hatch. |

**Specific known `_xlfn.` names not in the published spec table but observed in practice:**
- `_xlfn.SINGLE(...)` — the wire-format spelling of the `@` (implicit-intersection-forcer) operator. See F12.
- `_xlfn.ANCHORARRAY(...)` — the wire-format spelling of the `#` (spill-range) operator. So `=TYPE(A1#)` actually serializes as `=_xlfn.TYPE(_xlfn.ANCHORARRAY(A1))`.

Both `SINGLE` and `ANCHORARRAY` are NOT in the MS-XLSX future-function table as of the public spec page (last updated 2024-04). Research-agent verification suggests this is spec lag — Microsoft's implementation emits them; the spec hasn't caught up. **Schema implication:** treat `_xlfn.` as a known-set with margin for spec-undocumented extensions.

**Related but separate surface (NOT in `<f>` formulas):**
- `_xlnm.<NAME>` — built-in defined names (e.g. `_xlnm.Print_Area`). Lives in `<definedName>` elements.
- `_xlchart.`, `_xlpivottable.` — defined-name namespaces for chart and pivot definitions.

**Sources:** [MS-XLSX §2.2.2 Formulas](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/3d025add-118d-4413-9856-ab65712ec1b0), [§2.2.4 Functions (future-function table)](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/5d1b6d44-6fc1-4ecd-8fef-0b27406cc2bf), [`_xlfn.` support page](https://support.microsoft.com/en-us/office/issue-an-xlfn-prefix-is-displayed-in-front-of-a-formula-882f1ef7-68fb-4fcd-8d54-9fbb77fd5025).

**F7. `#NULL!` from non-overlapping intersect — Excel-only.**

`=A1:A10 B11:B20` → `#NULL!`. Member of the **classic 7-error set** (lives at `<c t="e"><v>#NULL!</v>`, backed by `xlErrNull` in `XlCVError`). gsheets has no space-intersect; emits `ERROR` (parse-failure) instead.

**F8 [RESOLVED via research]. `#SPILL!` and `#CALC!` are rich-value errors; our `<v>=#VALUE!` was the CT_RichValueFallback, not the actual error code.**

Per [MS-XLSX §2.3.6.1.3 Error Types](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/1d44a793-c90a-47da-8943-08802dfad1fd) + [Spill subsection](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/7a27b5fb-48a8-4a1c-b67a-2ca5edc07514) + [Calc subsection](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/a4cdc4c3-45b4-45c4-be49-d244f598a538):

- `#SPILL!` = errorType 8, stored as a CT_RichValueStructure in `xl/richData/`
- `#CALC!` = errorType 13, same
- The cell's `<v>` holds a `CT_RichValueFallback` typed `e` — for both, Microsoft writes `#VALUE!` as the fallback string. Rich-value-aware readers (Excel UI) rehydrate; rich-value-unaware readers (our current raw-XML reader; openpyxl) see only the fallback.
- Confirms: this is the **same behavior on Mac and Windows** — not platform-specific. A Windows Excel reading our saved file via `<v>` alone would also see `#VALUE!`.
- Sub-categories of `#SPILL!` and `#CALC!` (documented at the Support-page level — "Spill range isn't blank", "Empty Array", etc.) likely map to `subType` integers in the rich-value structure, but the spec doesn't publish the integer-to-subcategory mapping.

**Corollary:** the VBA `XlCVError` enum [docs](https://learn.microsoft.com/en-us/office/vba/api/excel.xlcverror) has `xlErrSpill=2045` but **no `xlErrCalc` constant**. `#CALC!` lives strictly in rich-value land.

**Driver fix — LANDED 2026-05-22 (D9; see F26).** `RawXmlReader.resolve_vm` now resolves the indirection per spec. Empirical fixture-verification queued as probe C9. **C2 (the "is this Mac-or-Win" question) is closed — it's neither; it's a documented file-format architecture we hadn't fully modeled.**

**F9. LAMBDA at cell boundary returns `#VALUE!`** — distinct from gsheets' `N_A` and the expected `#CALC!`.

**F10. Dynamic-array spill encoding in OOXML.**

- Anchor: `<c cm="1"><f t="array" ref="A1:A5">_xlfn.SEQUENCE(5)</f><v>1</v></c>`
- Recipients: plain `<c><v>` value cells — no `cm`, no `<f>`.

Anchor's `ref` attribute is source of truth. openpyxl drops `cm` and the `ref` — only recoverable via raw XML (Surface C).

**F11 [NEW]. The `#` spill-range operator exposes Excel's array nature.**

From the C5 probe:

| Formula | Value | Notes |
|---|---|---|
| `=TYPE(A1)` | 1 | TYPE sees only the anchor's scalar |
| `=TYPE(A1#)` | **64** | With `#`, TYPE sees the array |
| `=ROWS(A1#)` | 5 | `#` surfaces spill dimensions |
| `=SUM(A1#)` | 15 | Spill-range arithmetic works |

**Schema/matcher implication:** Excel's structural "is this an array?" question is answerable via `=TYPE(anchor#)`. Engine-level introspection complementary to the file-level `cm` + `<f t="array" ref="...">` markers (F10).

**F12 [spec-grounded + empirically verified 2026-05-23]. The `@` operator is a UI affordance, NOT a structural axis in the wire format.**

Per [Range.Formula vs Range.Formula2](https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/range-formula-vs-formula2) and the [dynamic-arrays-in-non-DA-Excel](https://support.microsoft.com/en-us/office/dynamic-array-formulas-in-non-dynamic-aware-excel-696e164e-306b-4282-ae9d-aa88f5502fa2) support page; verified via probe [`scripts/probes/verify-at-operator-persistence.py`](../scripts/probes/verify-at-operator-persistence.py).

**The literal `@` character never appears in saved OOXML.** Verified across three test cases — Excel always uses one of these on-disk forms depending on the formula's structure and whether array-evaluation (AE) and implicit-intersection (IIE) semantics agree:

| Test formula entered | Persisted as | Mechanism |
|---|---|---|
| `=@A1:A5` (AE ≡ IIE: both → A1=10) | `<f>A1:A5</f>` | `@` stripped entirely; non-array `<f>` implies single-value evaluation by default |
| `=@SEQUENCE(5)` (AE ≠ IIE: 1 vs spill 1..5) | `<f>_xlfn.SEQUENCE(5)</f>` | `@` stripped; **absence of `t="array"` attribute** is what enforces single-value evaluation. Top-level `@` over a modern dynamic-array function relies on non-array context to suppress spill. |
| `=SUM(@A1:A5)` (AE ≠ IIE: SUM(10)=10 vs SUM(all)=150) | `<f>SUM(_xlfn.SINGLE(A1:A5))</f>` | `@` serialized as `_xlfn.SINGLE(...)`. Required because the SUM call must receive a scalar — implicit non-array context can't reach inside the call. |
| Legacy CSE (author removed auto-inserted `@`) | `<f t="array">…</f>` | Different scenario from probe; documented behavior. Pre-DA displays as `{=…}`. |

**Key insight (refines the original F12 claim):** `_xlfn.SINGLE` is only used when `@` appears **inside** a sub-expression. At the top level, the absence of `t="array"` on `<f>` is the structural axis that does the work. This means a driver wanting to recover "did the author write `@`?" cannot look only for `_xlfn.SINGLE` — it must also consider non-array-formula context for modern dynamic-array functions.

**The `#` spill-range operator** serializes as `_xlfn.ANCHORARRAY(...)` consistently across all configurations — verified via probe [`verify-anchor-array-persistence.py`](../scripts/probes/verify-anchor-array-persistence.py) against an `=SEQUENCE(5)` anchor in A1:

| Test formula | Persisted as | Notes |
|---|---|---|
| `=TYPE(A1#)` (in B1) | `<f>TYPE(_xlfn.ANCHORARRAY(A1))</f>`, value `64` | Non-array `<f>`; TYPE returns 64 because ANCHORARRAY exposes the array |
| `=SUM(A1#)` (in C1) | `<f>SUM(_xlfn.ANCHORARRAY(A1))</f>`, value `15` | Non-array `<f>`; SUM gets the full range (1+2+3+4+5) |
| `=A1#` (in D1, top-level) | `<c cm="1"><f t="array" ref="D1:D5">_xlfn.ANCHORARRAY(A1)</f><v>1</v></c>` | **The cell becomes its OWN spill anchor** — `cm="1"` + `<f t="array" ref="D1:D5">` propagates the original spill into D1:D5 |

**Key structural difference vs `@`:** the `#` operator persists as `_xlfn.ANCHORARRAY` in ALL three configurations (no stripping). The `@` operator only sometimes uses `_xlfn.SINGLE` (top-level gets stripped). This asymmetry matters for any driver reasoning about formula representation: `#` is structurally explicit; `@` is contextually elided.

**Secondary-spill behavior (worth recording):** when `=A1#` appears at the top level of a formula, the cell *itself* becomes a spill anchor with `cm="1"` and `<f t="array" ref="...">`, mirroring the original spill into the new location. Spill chains are first-class — a driver mapping spill anchors must follow them recursively.

- **xlwings.formula2 stripping `@` is consistent with Excel's own behavior** — NOT an xlwings artifact. The stripping is Excel's `SavedAsArray` heuristic (F21).

**F13 [spec-validated]. `#GETTING_DATA` is a rich-value error (per F8 architecture); not expected to persist to saved xlsx in normal use.**

The audit's "never observed `#GETTING_DATA` in saved file" finding is consistent with documented behavior:
- Microsoft docs for [RTD save behavior](https://learn.microsoft.com/en-us/previous-versions/office/developer/office-xp/aa140060(v=office.10)) describe last-known-good values being saved, not loading state.
- [`#BUSY!` support page](https://support.microsoft.com/en-us/office/how-to-correct-a-busy-error-8bdce02f-9dc0-48b9-9326-49326f294619) describes it as a runtime condition.
- The [Excel JS API GettingDataErrorCellValue](https://learn.microsoft.com/en-us/javascript/api/excel/excel.gettingdataerrorcellvalue?view=excel-js-preview) confirms it's a modern rich-value error (introduced ExcelApi 1.16, ~2022).

**Caveat:** the JS API explicitly permits add-ins to write `#GETTING_DATA` synthetically via `range.valuesAsJson`. So in principle it could land in a saved file via deliberate add-in writes, but not from organic Excel use. **Schema implication:** model as engine-state variant, not a first-class persistable cell-value variant.

**F14. Rich text per-run formatting round-trips faithfully.**

**F15. Manual hyperlinks via `<hyperlinks>` block + relationship; HYPERLINK formula stores URL only in `<f>` text.**

**F16. 1904-epoch driver bug is active.** With auto-format triggering datetime coercion, the driver's hardcoded `_DATE_EPOCH = datetime(1899,12,30)` produces wrong serials for 1904 workbooks. Fix: read `wb.epoch`. **Resolved in A1 lift (excel_driver.py).**

**F17 [NEW from research]. Modern error family inventory.**

Documented in [Excel JS API ErrorCellValue](https://learn.microsoft.com/en-us/javascript/api/excel/excel.errorcellvalue?view=excel-js-preview) and MS-XLSX rich-value sections. At least 11 modern errors beyond the classic 7:

| Code | errorType | Triggered by |
|---|---|---|
| `#SPILL!` | 8 | Dynamic-array spill blocked |
| `#CALC!` | 13 | Calc-engine errors (empty array, recursive lambda, etc.) |
| `#UNKNOWN!` | 11 | Cross-version cells / unrecognized rich-value type |
| `#GETTING_DATA` | (unpublished int) | Async functions in flight (STOCKHISTORY, RTD, Linked Data Types refresh, Power Query) |
| `#BUSY!` | (unpublished int) | Waiting on a resource (linked workbook, image, Python) |
| `#BLOCKED!` | (unpublished int) | Content-policy-blocked function (some XLOOKUP variants under signed-out Mac) |
| `#CONNECT!` | (unpublished int) | External-connection failure |
| `#FIELD!` | (unpublished int) | Linked Data Type missing sub-field |
| `#PYTHON!` | (unpublished int) | Python-in-Excel error |
| `#EXTERNAL!` | (unpublished int) | External-reference failure |
| `#TIMEOUT!` | (unpublished int) | Async-call timeout |

**All of these go through the modern rich-value indirection path (F8 architecture).** Sub-categories are documented on Support pages but the `subType` integer-to-cause mapping is not published. Our probes only triggered `#SPILL!` and `#CALC!` (both downgraded to `<v>=#VALUE!` fallback). The rest are catalogued from JS API docs as documented-but-unprobed; reachability from automated probing varies (some need MS account, some need specific feature setups).

**F18a [NEW from research]. Modern error subType taxonomy (Office.js).**

Sub-categories for each modern error code are documented in the Excel JS API as **string-literal enums**, not integers as we'd expected. (MS-XLSX has integer codes in `xl/richData/`; the JS API exposes the integer→string mapping.) Each error variant has its own `errorSubType` enum:

| Error type | Documented subTypes |
|---|---|
| `Spill` ([7](https://learn.microsoft.com/en-us/javascript/api/excel/excel.spillerrorcellvalue?view=excel-js-preview)) | `Unknown`, `Collision`, `IndeterminateSize`, `WorksheetEdge`, `OutOfMemoryWhileCalc`, `Table`, `MergedCell`. Plus optional `rowCount?`, `columnCount?` (intended spill geometry). |
| `Calc` ([22](https://learn.microsoft.com/en-us/javascript/api/excel/excel.calcerrorcellvalue?view=excel-js-preview)) | `Unknown`, `ArrayOfArrays`, `ArrayOfRanges`, `EmptyArray`, `UnsupportedLifting`, `DataTableReferencedPendingFormula`, `TooManyCells`, `LambdaInCell`, `TooDeeplyNested`, `TextOverflow`, `RequestTooLarge`, `PythonGridQuery`, `PythonPowerQueryDataUploadEtagChanged`, `PythonPowerQueryDataUploadSizeLimitExceeded`, `InvalidPythonObject`, `QueryInCell`, `UninitializedPythonObject`, `ExternalQueryRef`, `ERegexReplaceCharLimit`, `UnexpectedReturnValue`, `FunctionInCell`, `ImageExceedsSizeLimit`. Plus `functionName?: string`. |
| `Busy` ([4](https://learn.microsoft.com/en-us/javascript/api/excel/excel.busyerrorcellvalue?view=excel-js-preview)) | `Unknown`, `ExternalLinksGeneric`, `LoadingImage`, `PlaceholderInFormula` |
| `Field` ([4](https://learn.microsoft.com/en-us/javascript/api/excel/excel.fielderrorcellvalue?view=excel-js-preview)) | `Unknown`, `WebImageMissingFilePart`, `DataProviderError`, `RichValueRelMissingFilePart`. Plus `fieldName?: string`. |
| `Blocked`, `Connect`, `External`, `Python`, `Timeout` | Each has its own subType enum page; not enumerated here |
| `Div0`, `Ref`, `Value`, `Name`, `Num`, `Null`, `NotAvailable`, `GettingData` | Flat — no subType field |

**Special:** `PlaceholderErrorCellValue` surfaces as `#BUSY!` but carries `target: LinkedEntityCellValue | WebImageCellValue` revealing what's en route.

**Schema implication:** sub-categories canonicalize as **string-literal enums**, not integer codes. Microsoft picked strings — stable across versions, debuggable in JSON, "Unknown" present as forward-compat slot. Worth following the precedent.

**F18b [NEW from research]. Dynamic-array timeline.**

(Renumbered from F18 in earlier draft.)



- **2018-09-25:** Dynamic arrays + `@` operator publicly previewed (Office 365 Insiders, Windows).
- **2019-12-10:** Excel for Mac 16.32 (build 19120802) — Mac Production channel gets spill. **Mac shipped before Windows GA.**
- **2020-07-01:** General availability across M365.
- **Excel 2019 / 2016 perpetual:** never received dynamic arrays.
- **Excel 2021 for Mac:** first perpetual Mac SKU with dynamic arrays.
- **Windows perpetual parity:** Excel 2021 / 2024.

(Useful for the calibration deficits doc when describing which features are M365-only vs available in perpetual licenses.)

**F19 [NEW from Office.js research]. The full `Excel.CellValue` discriminated union — Microsoft's published typed cell-value model.**

15 variants ([`Excel.CellValue`](https://learn.microsoft.com/en-us/javascript/api/excel/excel.cellvalue?view=excel-js-preview)):

| Variant | Purpose | Schema-design relevance |
|---|---|---|
| `BooleanCellValue` | `basicValue: boolean` | Direct mapping |
| `DoubleCellValue` | `basicValue: number` + optional `numberFormat: string` | **Dates live here as Doubles with format strings.** No DATE type. |
| `StringCellValue` | `basicValue: string` | Direct mapping |
| `EmptyCellValue` | `type:"Empty"`, `basicValue:""` | Excel's blank representation |
| `ErrorCellValue` | 18 sub-variants, each with own subType (see F18a) | The modern error family |
| `EntityCellValue` | Stocks/Geography card with `properties` tree | Rich data type as cell value |
| `LinkedEntityCellValue` | `EntityCellValue` + `id: LinkedEntityId{serviceId, entityId, culture, domainId?}` | Three-part external-service identity |
| `ArrayCellValue` | `elements: CellValue[][]` flat 2D, no nesting | Spill-range-at-anchor model |
| `ReferenceCellValue` | `reference: number` indexes into `referencedValues[]` | Entity-tree dedup |
| `WebImageCellValue` | URL + altText + attribution | Web-image cell |
| `LocalImageCellValue` [BETA] | Local image | Future |
| `FunctionCellValue` (1.19) | Custom-function reference in a cell | New |
| `FormattedNumberCellValue` [deprecated] | Folded into `DoubleCellValue` in 1.19 | Backward-compat |
| `ValueTypeNotAvailableCellValue` | `type:"NotAvailable"` — this API version can't deserialize | **Forward-compat sentinel.** Carries `basicValue` for old-reader fallback. |
| `ExternalCodeServiceObjectCellValue` [BETA] | External code service result | Future |

**`CellValueExtraProperties`** intersected into every variant: `writable?: boolean`, `writableNote?: string` — per-value tombstone for "this cell is computed/protected, ignore writes."

**Excel.CellValueType enum** (15 string-valued members, same as variant names lowercased): `array`, `boolean`, `double`, `empty`, `entity`, `error`, `externalCodeServiceObject` [BETA], `formattedNumber` [deprecated], `function` [1.19], `linkedEntity`, `localImage` [BETA], `notAvailable`, `reference`, `string`, `webImage`.

**Classic-vs-modern API duality (parallel to OOXML two-path architecture):**
- `Range.valueTypes: RangeValueType[][]` (1.1) returns the old narrow enum: `boolean | double | empty | error | integer | string | richValue | unknown` — collapses all rich types into `"richValue"`.
- `Range.valuesAsJson: CellValue[][]` (1.16) opens up to the typed 15-variant union.

**Schema-design relevance for assay:**

1. **`basicType`/`basicValue` shadow pair** — every rich variant carries the legacy-API equivalent for cross-engine fallback. Direct precedent for assay's "what does an old reader see?" need.
2. **String-literal `errorSubType`** — Microsoft chose strings, not integers. Stable, debuggable, "Unknown" always present as forward-compat slot.
3. **`referencedValues[]` + `ReferenceCellValue`** — entity-property tree deduplication pattern.
4. **`writable` per-value tombstone** — read-only computed cells without separate error type.
5. **`ValueTypeNotAvailable` as forward-compat sentinel** — explicit "newer API knows this; we don't" carrier with `basicValue` fallback.
6. **`LinkedEntityId` three-part identity** — provider × entity × culture for external-service rich values.
7. **`ArrayCellValue` flat (no nesting)** — spill range = ArrayCellValue at anchor + plain DoubleCellValues at spilled positions; no array-of-arrays.
8. **Date-as-Double-with-format-string** — Excel has NO date type. The schema's date-handling choice is a real fork: align with Excel (Double+format) or with gsheets (DATE enum).

**F20 [NEW from VBA research]. `XlErrorChecks` family — the "smart tag / green triangle" error-flag system.**

A separate error-flag system distinct from `#`-prefixed sentinels. Cell still has a value; the engine raises a non-blocking warning. Full enumeration ([XlErrorChecks](https://learn.microsoft.com/en-us/office/vba/api/excel.xlerrorchecks)):

| Constant | Value | Meaning |
|---|---|---|
| `xlEvaluateToError` | 1 | Formula would evaluate to an error |
| `xlTextDate` | 2 | Date stored as text |
| `xlNumberAsText` | 3 | Number stored as text |
| `xlInconsistentFormula` | 4 | Formula differs from neighbors |
| `xlOmittedCells` | 5 | Formula skips adjacent cells |
| `xlUnlockedFormulaCells` | 6 | Unlocked cells with formulas |
| `xlEmptyCellReferences` | 7 | References to empty cells |
| `xlListDataValidation` | 8 | List data validation issue |
| `xlInconsistentListFormula` | 9 | Inconsistent list formula |
| `xlStaleValue` | 12 | Cell contains an uncalculated formula |

These presumably persist in OOXML as `<ignoredError>` elements at sheet level — but Microsoft's docs for that path 404'd. Documented at the VBA layer; wire-format mapping is documented-by-implication only.

**Schema implication:** could be modeled as cell-level *warnings* orthogonal to cell *values*. Out of scope for the cell-value union but potentially relevant for assay's matcher language (assert on warning state).

**F21 [NEW from VBA research]. `Range.SavedAsArray` is Excel's writer-side IIE/AE-equivalence heuristic.**

Tri-state property ([`Range.SavedAsArray`](https://learn.microsoft.com/en-us/office/vba/api/excel.range.savedasarray)). Excel decides AT SAVE TIME whether a Formula2/AE formula gets persisted as `<f t="array">` for pre-DA compat, based on whether IIE and AE would produce the same result. Documented behavior.

**This fully explains D3** (the "non-array formulas coming back with `<f t="array">`" mystery from the audit). When xlwings.formula2 enters a formula in AE-dialect, Excel runs the IIE/AE equivalence check at save; cells where AE ≠ IIE get `<f t="array">`, cells where AE ≡ IIE stay plain. The audit's D3 observation was correct empirical data but the attribution to "xlwings forces array-mode" was wrong — it's Excel's own heuristic.

Round-trip example from docs: `=SQRT(@A1:A4)` set via Formula2 will round-trip to `=SQRT(A1:A4)` when read back via Formula and `SavedAsArray=False` — Excel **actively strips `@` operators it considers redundant**. Writer-side normalization.

**F22 [NEW from VBA research]. OfficeJS `Range.Formula` ≡ VBA `Range.Formula2`, NOT VBA `Range.Formula`.**

Explicit cross-API documentation in the [Range.Formula vs Range.Formula2](https://learn.microsoft.com/en-us/office/vba/excel/concepts/cells-and-ranges/range-formula-vs-formula2) page: *"OfficeJS does not include Range.Formula2. Instead Range.Formula always reports what is present in the formula bar."*

- VBA `Range.Formula` = IIE-dialect (no `@`)
- VBA `Range.Formula2` = AE-dialect (may contain `@`)
- OfficeJS `Range.formula` = AE-dialect (matches VBA Formula2, NOT VBA Formula)

**Cross-tool gotcha for assay:** if we ever do a JS-side driver, `cell.formula` returns a different representation than xlwings/Python via `Range.Formula`. The schema and matcher language need to be precise about which formula representation is being asserted.

**F23 [NEW from VBA research]. `Range.DisplayFormat` is the closest VBA analogue to gsheets `effectiveFormat`.**

Returns a DisplayFormat object reflecting **conditional-formatting overlay** on top of base format ([Range.DisplayFormat](https://learn.microsoft.com/en-us/office/vba/api/excel.range.displayformat)). Documented example: cell with CF that bolds + reds A1 → `Range.Font.Bold = False` but `Range.DisplayFormat.Font.Bold = True`.

**Critical caveats:**
- Computed live from `<dxf>` differential-format entries at calc time, **NOT persisted in OOXML**. The effective format is a runtime derivation.
- `DisplayFormat` doesn't work inside UDFs (returns `#VALUE!`).

**Schema implication:** gsheets' `effectiveFormat` has no static OOXML equivalent — Excel has the data but it lives behind a live API call. Schema may need to treat the effective-format axis as live-engine-only on the Excel side.

**F24 [NEW from VBA research]. `Range.Value2` is the bit-accurate scalar read channel.**

[`Range.Value2`](https://learn.microsoft.com/en-us/office/vba/api/excel.range.value2) differs from `Range.Value` only by not coercing to Currency/Date — dates come back as the underlying double (serial). **`Range.Value2` is the bit-accurate read channel; `Range.Value` is lossily coercing.**

**Driver implication:** the existing `_dt_to_serial` logic essentially replicates what `Range.Value2` already provides. If we ever switch the driver's read path to use xlwings.Range.value2 directly (via `.api.Value2`), we could simplify by getting raw serials without needing `_dt_to_serial`. Not blocking; future driver simplification.

**F25 [NEW from Microsoft Graph research; DRIVER-SURFACE VERDICT: PARTIAL — DEAD on A1 cell-value typing, LIVE on A6/A7/A8 per the 2026-05-23 multi-axis re-eval]. Graph REST Excel API is a lossy strict subset of Office.js for cell-value typing, but exposes operational/coverage ground no other Excel surface provides.**

> **Lead status:** PARTIAL (revised 2026-05-23). Original DEAD verdict was scoped to cell-value typing depth (A1). Multi-axis re-evaluation surfaces three Graph-unique LIVE axes:
> - **A6 function-evaluation primitive:** `POST /workbook/functions/{name}` invokes any Excel function against the workbook without writing into cells. No other Excel surface gives us this.
> - **A7 workbook-source coverage:** the only path to OneDrive/SharePoint cloud-hosted workbooks without downloading.
> - **A8 operational characteristics:** CI-friendly (no local Excel install); session sandboxing via `persistChanges:false`.
>
> See [`driver-surface-leads.md`](./driver-surface-leads.md) for the full per-axis breakdown. Coalescing-session decision: is cloud-hosted-workbook coverage, function-evaluation-primitive, or CI-friendliness load-bearing? If yes, Graph complements (does not replace) the local-file surfaces.

Graph's `workbookRange` resource — in BOTH v1.0 and beta as of 2025-12 — exposes only the pre-2023 narrow cell-value surface. No typed `Excel.CellValue` discriminated union, no `valuesAsJson` / `valuesAsJsonLocal` projection, no `Entity*` / `Array` / `Reference` / `LinkedEntity` cell types. The `valueTypes` enum is the narrow seven (`Unknown|Empty|String|Integer|Double|Boolean|Error`). Modern errors collapse to `#SENTINEL!` strings inside `values`/`text` with no subType breakdown. Linked Data Types flatten to display strings; there is no `EntityCellValue` resource in either version.

**Confirms an architectural claim from F19.** The classic-vs-modern API duality identified at F19 (`Range.valueTypes` vs `Range.valuesAsJson`) is per-API-surface, not per-data-model. Graph is locked at the classic surface in both versions. Office.js's modern CellValue work (2023+) never propagated to Graph; the drift is durable for assay's planning horizon. A Graph-backed driver in assay would be fundamentally lossier than the Office.js driver path (yet-to-be-built) and lossier than the existing xlwings + openpyxl + raw OOXML + D9 surface combination for Entity, LinkedEntity, Array, and modern Error subtypes. **Coalescing conclusion:** Graph should not be a primary cell-value-typing driver, but it can still add ground on A6/A7/A8 if those operational axes are load-bearing.

**Graph-specific surfaces worth recording:**

| Surface | Detail | Schema-design relevance |
|---|---|---|
| Parallel-grid wire shape | `values`, `text`, `formulas`, `formulasLocal`, `formulasR1C1`, `numberFormat` all expose as 2-D arrays of identical dimension. | Durable Microsoft convention. Worth adopting as the canonical on-wire shape regardless of cell-level typing. |
| Locale split | `formulas` vs `formulasLocal`, `address` vs `addressLocal`. Office.js mirrors this. | Canonical schema preserves both axes. |
| Session/persistence model | Three modes — persistent (~5min idle), non-persistent (~7min "view mode" with `persistChanges: false` providing a sandboxed clone), sessionless (each call re-resolves). `workbook-session-id` HTTP header. | Non-persistent mode is a potentially useful primitive for assay probe runs that shouldn't mutate the source workbook. |
| Long-running ops | `Prefer: respond-async` → `202` + polling at `/workbook/operations/{id}` (~30s poll cadence, 4-min documented max). | Out of scope for current assay; worth noting. |
| Published cell cap | ~5M cells per range triggers `null`-property degradation on read and `rangeExceedsLimit` on operations. | The ONE quantitative quota number Microsoft publishes; use as upper-bound sanity check. |
| Workbook functions endpoint | `POST /workbook/functions/{name}` returns `{ "error": null, "value": <scalar> }`. | Differential-calc-engine probing primitive without writing into a workbook. |

**Quota and error landscape (Graph-specific, all qualitative — recorded for the case Graph re-enters scope downstream):**

Microsoft documentation explicitly states throttling is "not defined with simple and universal limit numbers"; backoff is signaled exclusively via the `Retry-After` header. Required second-level error codes clients must handle (sample): `tooManyRequestsUncategorized`, `invalidSessionAccessConflict`, `invalidSessionReCreatable`, `rangeExceedsLimit`, `payloadTooLargeUncategorized`, `requestAborted`, `transientFailure`, plus a dozen more `*Uncategorized` variants. Concurrent writes are explicitly discouraged ("often the cause of throttling, timeout, merge conflict") — sequential is the documented contract. `502/badGateway` and `503/serviceUnavailable` on sessionful requests imply session recreation.

**Why this finding still matters even though Graph is a dead-end driver:**

1. **Confirms F19's architectural model is durable**: classic-vs-modern is per-API-surface, not per-data-model. Establishes which leads are *expected* to be lossy (anything anchored to the pre-2023 narrow surface).
2. **Establishes the ceiling**: any driver claiming "the engine sees X" must produce more than Graph does; otherwise it isn't gaining ground.
3. **Reference for downstream client modeling** (out of scope for the audit but documented for completeness): if assay ever needs to test "what does a Graph-using client SEE about a workbook?" — i.e., as the *target* of a compat assertion rather than as a driver path — the lossy projection above is the model. Not the schema's job; the *assertion fixture's* job.

**Citations:**

- [workbookRange (v1.0)](https://learn.microsoft.com/en-us/graph/api/resources/workbookrange?view=graph-rest-1.0)
- [workbookRange (beta)](https://learn.microsoft.com/en-us/graph/api/resources/workbookrange?view=graph-rest-beta)
- [Excel API overview](https://learn.microsoft.com/en-us/graph/api/resources/excel)
- [Workbook best practices](https://learn.microsoft.com/en-us/graph/workbook-best-practice)
- [Workbook error handling](https://learn.microsoft.com/en-us/graph/workbook-error-handling)

**F26 [NEW from OOXML metadata.xml research; spec-grounded + empirically verified via probe C9, 2026-05-23]. The complete `vm=` dereferencing chain + errorType integer mapping.**

Closes the architecture sketched in the "OOXML has two error-encoding paths" finding above with concrete spec citations + a complete errorType integer-to-symbol table. Driver code (D9 — `RawXmlReader.resolve_vm`) lifted + verified against a `#SPILL!` fixture (`PASS: resolve_vm(1) = {symbol: "#SPILL!", errorType: 8, subType: 1, extras: {colOffset: 2, rwOffset: 2}}`).

**The indirection chain** (per [MS-XLSX §2.2.4.4 Metadata](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/3dd44d53-847b-402f-a8c7-41a85024caf7) + ECMA-376 §18.9 + [§2.3.6.1.3 Error Types](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/1d44a793-c90a-47da-8943-08802dfad1fd)) — **corrected during C9 verification:**

```
cell @vm (1-based per ECMA-376 §18.3.1.4)
  -> xl/metadata.xml: valueMetadata/bk[vm-1]/rc (t=1-based metadataType index, v=0-based futureMetadata-block index)
  -> metadataTypes/metadataType[t]/@name (e.g. "XLRICHVALUE" for the error path; "XLDAPR" for dynamic-array spill anchors)
  -> futureMetadata[name="XLRICHVALUE"]/bk[v]/extLst/ext/rvb/@i (0-based rv index)
  -> xl/richData/rdRichValue.xml: rv[i]
  -> rv/@s (0-based)
  -> xl/richData/rdRichValueStructure.xml: s[s_idx]
  -> s/@t == "_error" AND child <k> / <v> pairs (errorType, subType, ...)
```

**Important correction vs the original OOXML agent's pseudocode:** the agent's chain went `vm -> futureMetadata[XLRICHVALUE]/bk[vm-1]` directly, skipping the `<valueMetadata>` lookup layer. Probe C9 revealed this: cells use `@vm` to index into `<valueMetadata>`, whose `<rc t v>` records carry both the metadataType (1-based via `t`) AND the futureMetadata-block index within that type (0-based via `v`). A single `vm` index can point to XLRICHVALUE (error rich value) OR XLDAPR (dynamic-array properties) depending on the `rc/@t`. The driver must walk the full 4-hop chain.

**Case-sensitivity bug also surfaced by C9:** Excel for Mac saves the rich-value parts in lowercase (`rdrichvalue.xml`, `rdrichvaluestructure.xml`); Windows uses camelCase (`rdRichValue.xml`, `rdRichValueStructure.xml`). Zip lookups are case-sensitive. The driver now reads via `_read_part_case_insensitive`.

**Full errorType integer → symbol map** (per [§2.3.6.1.1-.10](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/1d44a793-c90a-47da-8943-08802dfad1fd) per-error sub-sections):

| errorType | Symbol | Extra KVPs in structure |
|---|---|---|
| 4 | `#NAME?` | — |
| 8 | `#SPILL!` | `colOffset` (i), `rwOffset` (i) |
| 9 | `#CONNECT!` | — |
| 10 | `#BLOCKED!` | — |
| 11 | `#UNKNOWN!` | — |
| 12 | `#FIELD!` | `field` (s) |
| 13 | `#CALC!` | — |
| 14 | `#BUSY!` | — |
| 17 | `#BUSY!` (waiting sub-form) | `targetValue` (r) |
| 18 | `#EXTERNAL!` (e.g. `#PYTHON!` display variant) | — |
| 19 | `#TIMEOUT!` | — |

Integers 0-3, 5-7, 15-16 are reserved/unallocated as of MS-XLSX 29.1 (May 2026).

**`CT_RichValueFallback` ([§2.6.178](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/56b98662-f6e0-4e78-8649-7ec216b10680))** on the cell `<v>` element carries the legacy scalar with optional `t` attribute (`ST_RichValueFallbackType = {b, n, e, s}`, default `n`). For modern errors the fallback is typically `t="e"` with text `#VALUE!` — what rich-value-unaware readers see, matching F8's empirical observation.

**Driver implementation (D9 — landed in audit-session-2026-05-22 lift):**

[`RawXmlReader.resolve_vm(vm: int)`](../python/excel_driver.py) returns a typed descriptor for a cell's modern-error rich value: `{symbol, errorType, subType?, extras?}`. Returns `None` for non-error rich values (Linked Data Types, web images) or missing/malformed indirection. Lazy: walks the three rich-value parts on first invocation per workbook.

Minimum file set for `_error` resolution: **3 parts** — `xl/metadata.xml` + `xl/richData/rdRichValue.xml` + `xl/richData/rdRichValueStructure.xml`. `rdRichValueTypes.xml` and `richValueRels.xml` are only needed if extending coverage to Linked Data Types or web images.

**Spec gaps captured during the research (forward to schema-design + future probes):**

1. **`subType` integer-to-string map is not normatively published.** MS-XLSX §2.3.6.1.3: *"subType ... Integer, used internally to differentiate help topic identifiers."* The OfficeJS-exposed strings (`Collision`, `EmptyArray`, `TooBig`, `InvalidIntersection`, `UncalcedColumn`, `TableSpill`, `MergedCell`, etc.) ship in the `@microsoft/office-js` TypeScript definitions but no MS spec ties an integer to those strings. The driver preserves `subType` as a raw int; consumers surface it for telemetry + round-trip only.
2. **`#EXTERNAL!` (errorType=18)** carries no language tag in OOXML — the displayed `#PYTHON!` vs other variants is determined by the external-code-service identity, not encoded in the rich-value KVP. Driver cannot recover the language without the external-link manifest.
3. **`vm` 1-based-ness** is documented in ECMA-376 §18.9.2 (referenced normatively by MS-XLSX §2.2.4.4) but not restated in MS-XLSX itself. The implementation assumes 1-based per the citation chain.

**Empirical verification status: VERIFIED 2026-05-23 via probe C9.** Probe at [`scripts/probes/verify-d9-resolve-vm.py`](../scripts/probes/verify-d9-resolve-vm.py): builds `=SEQUENCE(3,3)` + B2-blocker fixture via xlwings (Mac), reads back via `RawXmlReader.resolve_vm(1)`, asserts `{symbol: "#SPILL!", errorType: 8}`. **PASS** — also empirically confirms `extras: {colOffset: 2, rwOffset: 2}` (spill-geometry KVPs from F26's per-error column). The two corrections above (valueMetadata-layer indirection + case-insensitive part lookup) came out of the verification cycle; the original implementation failed in both ways before the fixes.

**Citations:**

- [§2.2.4.4 Metadata (XLRICHVALUE/XLDAPR ext binding)](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/3dd44d53-847b-402f-a8c7-41a85024caf7)
- [§2.1.10 Rich Value Data part](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/896934fd-8df7-43f4-b154-2d39371c270d)
- [§2.1.11 Rich Value Structure part](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/d90f6d91-d868-4b94-9d26-ec3b1492cec6)
- [§2.6.175 CT_RichValue (s = 0-based structure index)](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/b8d7927a-79b4-4f2c-b76b-3a6e9cd7ad40)
- [§2.6.176 CT_RichValueBlock (i = 0-based rv index)](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/57149561-5faf-4660-95fb-140ba011990a)
- [§2.6.178 CT_RichValueFallback](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/56b98662-f6e0-4e78-8649-7ec216b10680)
- [§2.6.180 CT_RichValueStructure](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/7dfa3a06-e4c8-4aa8-acd5-359a16cb3dbc)
- [§2.6.163 CT_Key](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/a6955ad1-aef8-4ea2-b754-909220e4439e)
- [§2.6.198 CT_Value](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/80ad02f0-01ed-4145-9b3a-9732db22eba8)
- [§2.7.34 ST_RichValueFallbackType](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/46096203-87f2-48f5-84ff-bf80d6ba8511)
- [§2.4.83 rvb](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/d54dccb6-2ecc-475d-97fe-4a9ae5d3f94e)
- [§2.3.6.1.3 Error Types (parent)](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/1d44a793-c90a-47da-8943-08802dfad1fd) — per-error sub-sections at §2.3.6.1.1-.10

### Category 2 — Surface A vs Surface C disagreements

**D1.** openpyxl normalizes `t="str"` → `data_type="s"`. Acceptable.

**D2.** Excel normalizes default OOXML attributes on save (`t="n"` stripped, `t="inlineStr"` → `t="s"` + sharedStrings).

**D3 [FULLY EXPLAINED via F21]. `xlwings.formula2` enters formulas in AE-dialect; Excel's `Range.SavedAsArray` heuristic decides on save whether to persist `<f t="array">`.**

Per F21: Excel runs an IIE/AE equivalence check at save time. Formulas where AE ≠ IIE get `<f t="array">`; formulas where AE ≡ IIE stay plain. The earlier attribution to "xlwings forces array-mode" was wrong — it's Excel's documented `SavedAsArray` behavior. The audit's empirical observation stands; the attribution is now correct.

Lingering observation: even formulas like `=NotARealFunction()` (no array semantics) came back with `<f t="array">` in our run. Per Excel's documented behavior, these should be plain IIE. Possible explanations: (a) Excel-for-Mac version-specific quirk; (b) xlwings.formula2 entry triggers AE-mode unconditionally and Excel persists what it received. Tagged as observation; not blocking.

**D4 [reattributed]. `@` stripping is Excel-native behavior, NOT an xlwings artifact.**

Per F12: Excel's documented translation rule strips `@` on save when AE ≡ IIE. xlwings.formula2 inherits this. (Previously attributed to xlwings; now correctly traced to Excel.)

**D5.** 1904-epoch bug — see F16. **Resolved in A1 lift.**

**D6.** `<f>` content has no `=` prefix.

**D7.** Spill anchor has `cm` and `<f t="array" ref="...">`; recipients are plain value cells. Per F6, the function name inside `<f>` will be `_xlfn.<NAME>` for modern functions.

**D8.** openpyxl returns `cell.value = None` for `T(blank)` etc. — OOXML has `<v>null</v>` (empty element). Schema should treat as `""`, not missing.

**D9 [LANDED 2026-05-22; VERIFIED 2026-05-23 via probe C9].** The `vm=` attribute dereferencing chain — see F26 for the complete spec citations + corrected 4-hop chain + integer-to-symbol map. Implementation in [`RawXmlReader.resolve_vm`](../python/excel_driver.py); minimum-file-set is `xl/metadata.xml` + `xl/richData/rdRichValue.xml` + `xl/richData/rdRichValueStructure.xml`. Linked Data Types and web images still unrecoverable (would need extension to `rdRichValueTypes.xml` and `richValueRels.xml`) but modern errors now resolve correctly across both Excel-for-Windows and Excel-for-Mac (probe C9 confirms on Mac-authored fixture).

### Category 3 — Calibration deficits remaining

(Significantly shorter than pre-research. Research-agent resolved most of the prior list.)

**C2 [RESOLVED].** `#SPILL!` / `#CALC!` mystery — resolved by research. Not a Mac-vs-Win divergence; documented MS-XLSX rich-value fallback architecture we hadn't modeled. Removed from open deficits.

**C3.** Linked Data Types — still needs MS account + signed-in M365 + active data service. Adjacent: F17 catalogs ~10 other modern errors that need triggered probes to validate the rich-value path end-to-end.

**C4 [DOWNGRADED].** Cross Mac/Windows save differences — research suggests these are minimal for the specific cases we tested (`#SPILL!`/`#CALC!` rich-value architecture is documented identical on both platforms). Other Mac/Win differences remain possible but no longer load-bearing for the audit.

**C6.** True pre-365 `@` semantics — per F12, the `@` is a UI affordance only; the wire format never contains it. Pre-365 Excel opening a 365-authored file: per documented behavior, either reads identically (plain IIE form), shows as `{=…}` (legacy CSE form), or errors `#NAME!` via `_xlfn.SINGLE` / `_xlfn.ANCHORARRAY`. **Documented; doesn't require empirical probe.**

**C7.** COUNTBLANK / COUNTA on spilled-Null and VLOOKUP-Null on Excel side — quick probe to mirror gsheets-side data. Still useful for completeness; not blocking.

~~**C8**~~ **FULLY VERIFIED 2026-05-23.** Both wire forms empirically observed:
- `_xlfn.SINGLE` via [verify-at-operator-persistence.py](../scripts/probes/verify-at-operator-persistence.py): appears in `<f>SUM(_xlfn.SINGLE(A1:A5))</f>` for the `=SUM(@A1:A5)` case. At top level (e.g. `=@SEQUENCE(5)`), `@` is stripped and the non-array `<f>` marker handles single-value evaluation — F12 updated with the empirical three-form story.
- `_xlfn.ANCHORARRAY` via [verify-anchor-array-persistence.py](../scripts/probes/verify-anchor-array-persistence.py): appears in all three test configurations (`=TYPE(A1#)`, `=SUM(A1#)`, `=A1#`). Unlike `@`, the `#` operator is structurally explicit — `_xlfn.ANCHORARRAY` always appears in the saved formula. Also confirmed: top-level `=A1#` creates a secondary spill anchor (`cm="1"` + `<f t="array" ref="D1:D5">`), propagating the original spill.

---

## Research-agent validation summary

Five focused research agents dispatched against authoritative sources (MS-XLSX spec, Excel JS API docs, M365 release notes, Office support pages, ECMA-376, Google Workspace docs). All five returned.

**Findings validated empirically vs spec — alignment:**
- F1 (date numFmt auto-application): consistent with documented behavior; no contradictions found.
- F5 (modern functions work): timeline + namespace family fully validated.
- F7 (#NULL! intersect): classic 7-error set documented; behavior matches.
- F10 (spill anchor/recipient encoding): consistent with documented CT_RichValueStructure architecture.
- F12 (`@` operator): reattributed to Excel itself (was: xlwings); now fully spec-grounded.

**Findings revised by research:**
- F6 (namespace family): expanded from 4 to 5 prefix productions; `_xludf.` revealed as OFF-SPEC; `_xlop.` newly discovered; specific `_xlfn.SINGLE`/`_xlfn.ANCHORARRAY` names identified.
- F8 (#SPILL!/#CALC!): mystery resolved — rich-value architecture, not platform-specific.
- F13 (#GETTING_DATA): consistent with documented RTD/STOCKHISTORY save behavior; spec-validated.

**Findings extended by research:**
- NEW F17: full modern-error-family inventory (11+ codes).
- NEW F18: dynamic-array timeline.
- NEW architectural section: classic-vs-rich-value error encoding paths.
- NEW D9: vm-dereference TODO for the driver — **LANDED 2026-05-22**, see F26.
- NEW F25 (post-2026-05-22 dispatch): Microsoft Graph Excel REST API is locked at classic-narrow surface (no `valuesAsJson` in v1.0 or beta); fundamentally lossier than Office.js.
- NEW F26 (post-2026-05-22 dispatch): complete `vm=` dereferencing chain + errorType integer-to-symbol map (11 codes resolved); D9 driver implementation landed in same session.

**Gaps flagged for future SME/research (if found):**
- Exact `subType` integers for `#SPILL!`/`#CALC!` sub-categories — **confirmed by F26 research to be unpublished**. MS-XLSX §2.3.6.1.3 explicitly defers; OfficeJS string enums ship in TypeScript definitions but no integer-to-string map exists in any normative source.
- `_xlfn.SINGLE` and `_xlfn.ANCHORARRAY` not in published MS-XLSX future-function table — possibly spec lag.
- `_xludf.` ↔ `_xlfn.` promotion contract not documented.
- Excel-for-Web vs desktop OOXML differences not separately documented.
- Apps Script `SpreadsheetApp` surface (gsheets-side) — **closed as G6**. No Google-authoritative polymorphic-Null terminology; A1 is a REST subset; only A4 R1C1 notation remains a unique live axis after A5 was deprioritized and A6 custom-function probes were dropped.

---

## Summary — confidence assessment

After four probe passes + nine-thread research-agent cross-validation against official sources (MS-XLSX, Excel JS API, M365 release notes, VBA reference, Office support, ECMA-376, Google Workspace docs, Microsoft Graph reference):

**Spec-grounded with empirical confirmation:**
- F1 date numFmt inference + propagation
- F2-F4 Null/blank/COUNTBLANK semantics (engine-level; gsheets divergence axes clean)
- F5 + F6 modern function support + 5-prefix namespace family (`_xlfn.`/`_xlfn._xlws.`/`_xlpm.`/`_xlop.`/`_xludf.`)
- F7 `#NULL!` intersect (classic 7-error set)
- F8 `#SPILL!`/`#CALC!` rich-value architecture (mystery closed)
- F9 LAMBDA cell-boundary error code
- F10 spill anchor/recipient encoding
- F11 `#` spill-range operator + array-introspection
- F12 `@` operator UI-only / `_xlfn.SINGLE` wire-format
- F13 `#GETTING_DATA` runtime-only / save behavior
- F14-F15 hyperlinks, rich text, booleans
- F16 1904 driver bug (fixed in A1 lift)
- F17 modern-error-family inventory (11+ codes)
- F18a modern-error subType taxonomy (string-literal enums; 7 Spill, 22 Calc, 4 Busy, 4 Field, plus others)
- F18b dynamic-array timeline (Mac 2019-12; M365 GA 2020-07)
- F19 `Excel.CellValue` 15-variant type system (Microsoft's published typed cell-value model)
- F20 `XlErrorChecks` family (10 codes — VBA-layer warning system)
- F21 `Range.SavedAsArray` writer heuristic (fully explains D3)
- F22 OfficeJS `Range.Formula` ≡ VBA `Range.Formula2` (cross-API gotcha)
- F23 `Range.DisplayFormat` ≈ gsheets `effectiveFormat` (live-computed, not persisted)
- F24 `Range.Value2` bit-accurate read channel (driver simplification opportunity)
- F25 Microsoft Graph REST API drift from Office.js (classic-narrow only; both v1.0 and beta)
- F26 complete `vm=` dereferencing chain + errorType integer-to-symbol map (11 codes)

**External calibration still required:**
- C3 Linked Data Types (MS account)
- ~~C8 Confirm `_xlfn.SINGLE`/`ANCHORARRAY` presence in our probe files~~ **FULLY VERIFIED 2026-05-23.** Both observed via dedicated probes; see closure note above.
- ~~C9~~ **PASSED 2026-05-23.** Probe at [`scripts/probes/verify-d9-resolve-vm.py`](../scripts/probes/verify-d9-resolve-vm.py): `resolve_vm(1)` → `{symbol: "#SPILL!", errorType: 8, subType: 1, extras: {colOffset: 2, rwOffset: 2}}`. Verification cycle surfaced two implementation bugs (valueMetadata-layer indirection + case-insensitive part lookup); both fixed before PASS. F26 chain updated to reflect the correct 4-hop indirection.

**Driver-fidelity gaps (audit done; rework pending):**
- D1, D2, D3, D7, D8 — known; specific behaviors documented.
- D5 — fixed in A1 lift.
- D9 — `vm` dereferencing into rich-value table — **LANDED 2026-05-22; VERIFIED 2026-05-23 via C9**.

**Five clean two-engine divergences confirmed:**

| Test | Excel | gsheets |
|---|---|---|
| `=ISBLANK(VLOOKUP-of-blank)` | FALSE | TRUE |
| `=CELL("type", IF(,,))` | `"v"` | `"b"` |
| `=COUNTBLANK(IF(,,))` | 0 | 1 |
| `=COUNTA(IF(,,))` | 1 | 0 |
| `=A1:A10 B11:B20` (intersect) | `#NULL!` (classic) | `#ERROR` (parse) |
| Bare `=LAMBDA(x, x+1)` | `#VALUE!` | `#N/A` with message |

**Engine behaviors aligned (NOT divergences):**

- Date numFmt auto-application
- Polymorphic equality of blank/Null (= 0, = "", = FALSE all TRUE)
- Polymorphic coercion (numeric → 0, text → "")
- Modern function support (with different namespacing systems)
- Rich text per-run formatting (per-run colors/bold/italic; gsheets adds per-run links Excel lacks)
