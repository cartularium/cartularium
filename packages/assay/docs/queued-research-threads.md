# Queued research threads (for future sessions)

> **STATUS (2026-05-22): ALL THREE THREADS CLOSED.** Dispatched as a follow-up pass in the same session — Thread 1 (Graph) + Thread 3 (OOXML) via subagent, Thread 2 (Apps Script) via primary agent after subagent came back blocked on no-network sandbox. Findings synthesized into:
> - **F25** in [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) (Graph drift from Office.js)
> - **F26** in [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) + D9 driver code in [`python/excel_driver.py`](../python/excel_driver.py) (OOXML vm-dereference chain)
> - **G6** in [`gsheets-driver-fidelity.md`](./gsheets-driver-fidelity.md) (Apps Script confirms no Google terminology for polymorphic-Null)
>
> Entry-point doc for the closure: [`audit-session-2026-05-22.md`](./audit-session-2026-05-22.md) §"Completed research threads".
>
> The prompt-engineering patterns below are preserved for use as templates for any future research-agent dispatch.

Three Excel surfaces and one gsheets surface identified as worth pulling on during the 2026-05-22 audit session, but not dispatched. Each entry below contains a ready-to-fire research-agent prompt; copy + paste into an Agent tool invocation when picking up.

**Source-constraint convention:** every prompt restricts the agent to official Microsoft / Google / spec sources only. Folk-knowledge sources (third-party blogs, Stack Overflow, Reddit) are explicitly out of scope — they're the unreliability that drove assay's audit work in the first place.

---

## Thread 1: Microsoft Graph Excel REST API

**Why this thread matters:** Microsoft's cloud-based REST endpoints for Excel are likely 1:1 with Office.js, but might have drift. Used by Power Automate / cloud integrations. Could surface Graph-specific quirks or expose drift between the JS API and the REST API.

**Priority:** medium. Office.js is the primary reference for the typed cell-value model; Graph is the REST projection. If they're 1:1, no new ground; if they drift, useful.

### Agent prompt

```
You're researching the Microsoft Graph Excel REST API for an open-source spreadsheet
compatibility audit (assay, by cartularium). Goal: identify whether the Graph REST API
exposes a typed cell-value model that drifts from Excel.js, and catalog anything
Graph-specific worth knowing.

**Context — what we've already established:**

- Excel.js (Office.js) `Excel.CellValue` is a 15-variant discriminated union including
  EntityCellValue, LinkedEntityCellValue, ArrayCellValue, ReferenceCellValue, etc.
- Modern error subTypes (Spill: 7, Calc: 22, Busy: 4, Field: 4, etc.) are string-literal
  enums in the JS API.
- The classic-vs-modern API duality is codified in Office.js: Range.valueTypes returns
  the old narrow enum (collapsing to "richValue"); Range.valuesAsJson opens up to the
  15-variant union.

**Research questions:**

1. Does the Microsoft Graph Excel REST API expose a typed cell-value model? What
   endpoints? Is it parallel to Office.js or different shape?
2. If parallel: 1:1 with Office.js's Excel.CellValue, or are there drifts?
3. What endpoints exist for cell-level reads/writes? (e.g.,
   `GET /me/drive/items/{id}/workbook/worksheets/{id}/range(address='A1')` —
   what does the response shape look like?)
4. Are there Graph-specific error responses, throttling, or quota patterns
   relevant for the assay quota-profiling work?
5. Are Linked Data Types accessible via Graph in a way that doesn't require an
   MS account signed into M365 (e.g., does Graph permit deeper introspection)?

**Source constraints:** official Microsoft only.
- learn.microsoft.com/en-us/graph/api/resource-worksheet
- learn.microsoft.com/en-us/graph/api/resource-range
- learn.microsoft.com/en-us/graph/api/resource-workbook
- learn.microsoft.com/en-us/graph/excel-throttling-limits
- The Graph reference for Excel-related types
Avoid third-party blogs, Stack Overflow, Reddit.

**Return format (under 700 words):**
- Findings: bulleted claims with confidence levels.
- Citations: URLs.
- Comparison to Office.js: where they're 1:1, where they drift.
- Schema-design relevance: anything in Graph that would inform assay's canonical
  schema beyond what Office.js already shows us.
```

---

## Thread 2: Apps Script `SpreadsheetApp` (gsheets-side)

**Why this thread matters:** Google's JS-based scripting environment. Different layer from the REST API. Exposes things like `Range.isBlank()`, `Range.getDisplayValue()`, `Range.getValue()`, `Range.getValues()`, `Range.getFormula()`. Apps Script docs are typically more developer-facing than the REST docs. **Most promising gsheets thread for filling in the documentation gaps the audit found** — Google's REST docs were essentially silent on engine semantics.

**Priority:** high. The audit found gsheets has a propagatable runtime-Null that Google's REST API doesn't document. Apps Script may surface this.

### Agent prompt

```
You're researching Google Apps Script's SpreadsheetApp API for an open-source spreadsheet
compatibility audit (assay, by cartularium). The audit found gsheets has a runtime-Null
value that propagates through formulas (e.g. ISBLANK(VLOOKUP-of-blank) returns TRUE),
but Google's official REST API documentation is essentially silent on this — the
ISBLANK help page even contradicts the empirical behavior. Apps Script may surface what
the REST docs hide.

**Context — what we've empirically established about gsheets:**

- Null is a propagatable runtime value distinct from cell-state blank.
- =IF(,,) produces Null. ISBLANK returns TRUE on Null. CELL("type", Null) returns "b".
- Null survives VLOOKUP and ARRAYFORMULA. "x" & Null = "x" (not "x0").
- The wire format has at least 4 shapes for "blank-ish" cells:
  untouched-outside-region (no rowData), untouched-inside-region (empty {} CellData),
  direct =IF(,,) (formulaValue but no effectiveValue), spill-recipient-with-Null
  (no formulaValue, no effectiveValue).
- gsheets COUNTBLANK(IF(,,)) = 1; COUNTA(IF(,,)) = 0. Both differ from Excel.

**Research questions:**

1. `Range.isBlank()` semantics in Apps Script — does it propagate through formulas
   (return TRUE for a cell that resulted from VLOOKUP-of-blank)? Or does it test
   cell-state only?
2. `Range.getValue()` vs `Range.getDisplayValue()` vs `Range.getValues()` — what
   does each return for a cell containing `=IF(,,)`? For a spill-recipient-with-Null?
3. `Range.getFormula()` — does Apps Script expose the formula-vs-no-formula
   distinction we found at the API level?
4. Is the polymorphic-runtime-Null we identified acknowledged in Apps Script docs?
   Search for "blank", "null", "ISBLANK", "empty cell", "missing value".
5. ARRAYFORMULA in Apps Script — is the anchor/recipient model documented anywhere?
6. Are there Apps Script methods that surface the structural shapes the REST API
   exposes (presence of userEnteredValue, effectiveValue, etc.)?

**Source constraints:** official Google only.
- developers.google.com/apps-script/reference/spreadsheet/range
- developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
- Google Workspace help center articles
- Apps Script TypeScript definitions if available

Avoid third-party blogs, Stack Overflow, Reddit.

**Return format (under 700 words):**
- Findings: bulleted claims with confidence levels.
- Citations: URLs.
- Direct comparison: where Apps Script confirms / contradicts / extends what the
  REST API and help center say about Null and blank semantics.
- Schema-design relevance: if Apps Script names or describes the polymorphic Null
  we found, capture the canonical terminology.

The big question: does Apps Script give us Google-authoritative naming for the
runtime-Null concept that the audit empirically established but Google's REST docs
don't acknowledge?
```

---

## Thread 3: OOXML `metadata.xml` / `futureMetadata` blocks

**Why this thread matters:** the indirection target for `vm=` and `cm=` attributes captured in A3's `RawXmlReader`. We have the indices but haven't dug into what they point to. Knowing the structure **directly unblocks D9** — the outstanding driver TODO to dereference `vm=` into the rich-value structure table.

**Priority:** medium-high. D9 is the next driver-engineering work item; this research grounds it.

### Agent prompt

```
You're researching the OOXML `xl/metadata.xml` part and `xl/richData/` parts for an
open-source spreadsheet compatibility audit (assay, by cartularium). The audit found
modern Excel errors (#SPILL!=8, #CALC!=13, #UNKNOWN!=11, and ~8 others) live as
"rich values" in `xl/richData/rdRichValueStructure.xml`, referenced from cells via
a `vm=` (value metadata) attribute that indexes into `xl/metadata.xml`'s
`<futureMetadata>` blocks. Our driver captures `vm=` but doesn't dereference it.

**Context — what we've established:**

- `cm=` (cell metadata) marks spill anchors of dynamic-array formulas; references
  `<futureMetadata name="XLDAPR">` or similar.
- `vm=` (value metadata) is the rich-value indirection used for modern error codes,
  Linked Data Types, and possibly other rich values; references
  `<futureMetadata name="XLRICHVALUE">`.
- The `<v>` element on a cell with `vm=` holds a CT_RichValueFallback — a legacy
  scalar value (typically `#VALUE!` for modern errors) for rich-value-unaware readers.

**Research questions:**

1. **`xl/metadata.xml` structure** per MS-XLSX spec:
   - The `<metadataTypes>` element — what's in it? List of named metadata types
     like XLDAPR, XLRICHVALUE.
   - The `<metadata>` and `<futureMetadata>` element structures — what they contain.
   - How `cm=` and `vm=` integer indices map to entries.

2. **`xl/richData/rdRichValueStructure.xml` structure:**
   - Schema of `CT_RichValueStructure` entries — fields, attributes, KVPs.
   - How an entry with `t="_error"` is encoded (errorType integer + subType integer
     + other fields).
   - Mapping from integer codes back to error names (we have errorType=8→#SPILL!,
     13→#CALC!, 11→#UNKNOWN!; what's the rest?)

3. **Relationship parts:** `xl/richData/_rels/rdRichValueStructure.xml.rels` and
   any sibling parts (`rdRichValueTypes.xml`, `rdRichValues.xml`,
   `rdRichValueRel.xml`). What's in each?

4. **Integer subType mapping:** the Excel JS API exposes subTypes as strings
   ("Collision", "EmptyArray", etc.). The OOXML side presumably has integer codes.
   Is the integer-to-string mapping published anywhere?

5. **Driver implementation guidance:** what's the minimum set of files to read +
   parse for a driver to resolve `vm=` into the full modern-error code?
   (a) Read metadata.xml to map vm index → futureMetadata block
   (b) Read rdRichValueStructure.xml to find the rich value at that index
   (c) Decode errorType + subType integers to canonical strings

**Source constraints:** official Microsoft only.
- learn.microsoft.com/en-us/openspecs/office_standards/ms-xlsx/ (especially
  sections on Cells, Cell Metadata, Metadata, Rich Values, Error Types,
  CT_RichValueStructure, CT_RichValueFallback)
- The ECMA-376 spec
- Office Open XML reference

Avoid third-party blogs, Stack Overflow, Reddit.

**Return format (under 900 words):**
- Findings: bulleted claims with confidence levels.
- Citations: URLs with spec section anchors.
- **Implementation outline**: pseudo-code or numbered steps for a driver that
  resolves `vm=` → error code. This is the key deliverable; D9 driver work needs it.
- Spec excerpts: short normative passages (<200 chars each) from MS-XLSX that
  define the metadata/rich-value indirection.
- Gaps: anywhere the spec is silent (especially: the subType integer mapping).
```

---

## Lower-priority threads (recorded but not prioritized)

These came up during the audit but were not pursued. Recorded here for completeness.

### XLL C API (Excel C SDK)

- Legacy C-level interface for high-performance add-ins.
- Has its own type system (`XLOPER12` with type codes for num/str/bool/int/err/multi/missing/nil/sref/ref/etc.).
- Heavily used in finance/quant tools.
- Could surface "what Microsoft thinks the engine's primitive types are" — interesting precedent but old and may not reflect modern Excel's type model.

### Open XML SDK (.NET)

- Microsoft's typed wrapper around MS-XLSX. C# classes that mirror the spec.
- Sometimes documents OOXML details the spec page is silent on.
- Could fill in gaps like the `_xludf.` promotion contract or vm integer mapping (overlaps with thread 3).

### Power Query M language

- Different type system from cell values (records, lists, tables, durations, etc.).
- Orthogonal to formula audit; relevant if assay's scope extends to data-pipeline tooling.

### Excel Data Model / Power Pivot / DAX

- Excel's embedded tabular database.
- CUBE() functions reference it.
- Stored in `xl/model/`.
- Affects schema only if cube-reference cells need accommodating.

### XLSB (binary format)

- Same logical model as XLSX, different encoding.
- No new ground for cell-value semantics.

### Excel for Web

- Subset of Office.js + Microsoft Graph.
- Probably no new ground.

### VSTO (.NET add-in SDK)

- Uses VBA-like object model with .NET types.
- Probably redundant with VBA research.

---

## How to fire a research thread

1. Read the thread's prompt section above.
2. Dispatch via the Agent tool:
   ```
   Agent({
     subagent_type: "general-purpose",
     description: "Research <thread name>",
     prompt: "<prompt body from this doc>",
     run_in_background: true,
   })
   ```
3. When the agent completes, consolidate findings into the appropriate catalog:
   - Excel findings → [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) (add F-series finding)
   - gsheets findings → [`gsheets-driver-fidelity.md`](./gsheets-driver-fidelity.md) (add G-series finding)
   - Thread 3 also closes D9 (vm dereferencing) if the implementation outline is clear enough
4. Update [`audit-session-2026-05-22.md`](./audit-session-2026-05-22.md) (or create a new session-summary doc) to reflect the thread's completion.
