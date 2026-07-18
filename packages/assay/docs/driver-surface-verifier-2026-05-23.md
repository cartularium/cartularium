# Driver-surface verifier pass — 2026-05-23

Scope: verify the driver-surface claims that a pickup agent would use for assay coalescing. This pass checks whether each claimed surface exposes ground, whether the current driver actually reaches it, and where public scalar output still collapses richer internal data.

## Verdict

The driver-surface inventory is safe to use as the pickup entry point after the cleanup in this pass.

- **Excel OOXML / D9:** LIVE. `RawXmlReader.resolve_vm()` is implemented and fixture-verified by C9 on a Mac-authored `#SPILL!` workbook. It is reachable as a helper and returns rich modern-error descriptors. Public scalar output still does not emit those descriptors; coalescing must decide that boundary.
- **GSheets REST / B:** LIVE. The live probe was rerun against the known-access spreadsheet `1csVwyDpFvJ1RgggJ6uEDhsFGKXa1HfJVGNBz7lLTjuU` and regenerated [`gsheets-celldata-probes.md`](./gsheets-celldata-probes.md) at `2026-05-23T20:22:35.094Z`. `spreadsheets.get?includeGridData=true` exposes `userEnteredValue`, `effectiveValue`, `formattedValue`, `hyperlink`, `textFormatRuns`, and `effectiveFormat`.
- **Microsoft Graph Excel REST / F25:** PARTIAL. Dead as a primary A1 cell-value-typing driver because Graph exposes only the narrow range model (`values`, `text`, `valueTypes`, formulas, numberFormat), not Office.js `valuesAsJson` / `Excel.CellValue`. Live on A6/A7/A8 if function-evaluation, cloud-hosted workbook coverage, or CI operation are load-bearing.
- **Apps Script SpreadsheetApp / G6:** PARTIAL, narrowed to A4 only. `Range.getFormulasR1C1()` is the unique live surface. A5 triggers are deprioritized for current assay scope. A6 custom-function probe injection is dropped: official docs constrain custom functions to argument/return-range behavior and a 30s timeout.

## Live checks

- `node scripts/probes/gsheets-celldata.mjs` with `ASSAY_SPREADSHEET_ID=1csVwyDpFvJ1RgggJ6uEDhsFGKXa1HfJVGNBz7lLTjuU` completed, wrote a new report, and deleted its temp sheet.
- `uv run python scripts/probes/verify-d9-resolve-vm.py` was rerun manually after Codex's Apple Events timeout and passed. Fresh result: `resolve_vm(1) = {'symbol': '#SPILL!', 'errorType': 8, 'subType': 1, 'extras': {'colOffset': '2', 'rwOffset': '2'}}`; retained fixture: `/tmp/assay-probe-c9-spill.xlsx`.

## Source checks

- Google Sheets API `CellData` officially exposes `userEnteredValue`, `effectiveValue`, `formattedValue`, `effectiveFormat`, `hyperlink`, and `textFormatRuns`: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/cells
- Apps Script custom functions are constrained to returned cells/adjacent overflow, deterministic argument behavior, and a 30-second timeout: https://developers.google.com/apps-script/guides/sheets/functions
- Apps Script `Range.getFormulasR1C1()` returns formulas in R1C1 notation, with `null` for cells with no formula: https://developers.google.com/apps-script/reference/spreadsheet/range#getformulasr1c1
- Microsoft Graph `workbookRange` exposes the classic grid fields (`values`, `text`, `valueTypes`, `formulas`, `formulasR1C1`, `numberFormat`): https://learn.microsoft.com/en-us/graph/api/resources/workbookrange?view=graph-rest-1.0
- Microsoft Graph workbook functions can be invoked via `/workbook/functions/{name}` and return a function result object: https://learn.microsoft.com/en-us/graph/api/resources/workbook?view=graph-rest-1.0
- Office.js `Range.valuesAsJson` is the richer Microsoft-published typed-cell surface and supports data types beyond `Range.values`: https://learn.microsoft.com/en-us/javascript/api/excel/excel.interfaces.rangedata?view=excel-js-preview#valuesasjson

## Cleanup performed

- Removed stale "C9 queued / D9 unverified" language from handoff docs and code comments.
- Corrected the stale F25 conclusion that Graph adds no ground; it is PARTIAL, not a dead lead.
- Corrected G6 to Apps Script A4-only after dropping A6 and deprioritizing A5.
- Marked pre-lift `values.batchGet` claims as historical and clarified the current GSheets `spreadsheets.get` path.
- Clarified that GSheets `RichCell.kind` is a wire/provenance signal, not a complete semantic value discriminator; `=""` and `=IF(,,)` can have identical CellData without side-channel probes.
- Enabled `rich_text=True` in the production Excel openpyxl read path so the internal `CellRichText` capture path is actually reachable.

## Residual risks

- D9 is verified for `#SPILL!`; the other modern-error codes remain spec-grounded until each gets its own fixture.
- Current public driver outputs still collapse rich internal data to scalar `CellValue`; coalescing must decide what becomes public.
- GSheets CellData alone cannot generally distinguish formula-returned empty string from formula-returned Null. Use side-channel probes such as `ISBLANK`, `ISTEXT`, `COUNTBLANK`, or `COUNTA` when that distinction is load-bearing.
- Office.js remains the highest-value pending Excel surface for typed cell values.
