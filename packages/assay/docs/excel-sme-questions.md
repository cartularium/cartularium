# Excel calibration questions — SME ping

Draft for review. Bundle of questions an Excel SME can answer. Estimated 20-30 minutes of their time if they answer all; any subset is useful.

Companion: [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) — full audit findings, attach when sending.

---

## Context (to send)

I'm building **assay** — a compatibility-audit tool that runs the same spreadsheet formulas across 8 engines (Excel, Google Sheets, LibreOffice, HyperFormula, IronCalc, Lattice, Formulas, Pycel) and catalogs where they diverge. Output is an evidence-anchored compatibility reference for spreadsheet developers.

Over the past few sessions I've done an empirical audit of Excel via xlwings + openpyxl + raw OOXML XML reads. About 80% of the behaviors I care about are now nailed down. The remaining 20% I can't resolve from my position — I'm on Excel-for-Mac, don't have a Microsoft account signed into M365 with Linked Data Types active, and can't easily get to a Windows install.

Hoping you can help close out the calibration deficits below. Any subset is enormously useful; please don't feel obliged to answer all of them.

**Your Excel version + platform would be useful to know upfront** (M365 sub vs perpetual; Windows vs Mac; rough version number) since several questions are version-sensitive.

---

## What I've already empirically verified (so you don't waste time re-confirming)

Just FYI — these are settled by my probes:

- Date numFmt auto-application on `=DATE()` / `=NOW()` / `=TODAY()`, propagating through references and arithmetic
- Modern dynamic-array + lambda functions (SEQUENCE, FILTER, UNIQUE, XLOOKUP, LAMBDA, LET, BYROW) all evaluate correctly when entered through Excel's own parser
- Four-namespace OOXML function-prefix family: `_xlfn.<NAME>`, `_xlfn._xlws.<NAME>` (worksheet-bound), `_xlpm.<param>` (LAMBDA parameter names), `_xludf.<NAME>` (unknown user-defined fallback)
- `#NULL!` from non-overlapping intersect (`=A1:A10 B11:B20`)
- LAMBDA at cell boundary (bare `=LAMBDA(x, x+1)` without a call) returns `#VALUE!`
- The `#` spill-range operator: `=TYPE(A1#)` returns 64 (array); `=ROWS(A1#)`, `=SUM(A1#)` work as expected
- Dynamic-array spill anchor encoding: `<c cm="1"><f t="array" ref="A1:A5">...</f>`; recipients are plain `<c><v>` value cells
- `=IF(,,)` collapses to literal 0 in Excel (no runtime-Null; ISBLANK=FALSE, TYPE=1, CELL("type")="v")
- Excel's "blank" is a cell-state property that decays through formula evaluation — VLOOKUP returning a blank cell yields 0, not a propagated blank
- Polymorphic equality of a truly-blank cell: `=A1=0`, `=A1=""`, `=A1=FALSE` all return TRUE simultaneously
- Rich text per-run formatting round-trips faithfully through write → recalc → read
- Hyperlinks have two distinct file-level encodings (sheet-level `<hyperlinks>` block vs `=HYPERLINK()` formula text)
- 1904-vs-1900 date system works (workbook epoch setting flips serial numbers by 1462)

If anything in this list looks **wrong** to you, please flag — those are findings I'd revisit.

---

## Open questions

### Q1. `#SPILL!` and `#CALC!` error codes (highest-priority)

In my Excel-for-Mac, the following produce `#VALUE!` instead of `#SPILL!` and `#CALC!`:

- **Blocked spill:** `=SEQUENCE(5)` in cell C1 with the string "obstacle" in C3 (inside what should be the spill range C1:C5). The cell at C1 ends up with `<v>#VALUE!</v>` in the saved file. I tried both ordering (obstacle first, then formula) AND post-formula obstacle (let SEQUENCE spill first, then drop "obstacle" into a recipient) — both produce `#VALUE!`, never `#SPILL!`.
- **Empty array result:** `=FILTER(A1:A5, FALSE)` where A1:A5 has values. Always produces `#VALUE!` in the file, never `#CALC!`.

Modern functions otherwise work fine (SEQUENCE spills correctly when nothing's in the way; FILTER works when the condition isn't all-FALSE).

**Asks:**
- (a) On your Excel (please note version + platform), what does the SAVED file's `<v>` contain for these two scenarios?
- (b) Does the Excel UI show `#SPILL!` / `#CALC!` for these cases on your version? If the UI shows one thing but the saved file shows another, that's a UI-vs-file-format quirk worth noting.
- (c) Were `#SPILL!` and `#CALC!` added in a specific M365 build, with older Mac builds lacking them? If so, what versions emit which codes?

### Q2. Linked Data Types (Stocks, Geography, Image)

I can't probe these — no MS account with the data service active.

**Asks:**
- (a) Approximate OOXML wire-format structure for a `=Stocks.MSFT.Price` cell — what does the `<c>` element look like? What's in `xl/richData/`?
- (b) Does `cell.value` via openpyxl return the display string (e.g., "Apple Inc.") or the structured record reference?
- (c) On Windows, `Range.api.LinkedDataTypeState` — what values does it take? Is it reachable through Mac AppleEvents at all?
- (d) Any `_xlfn.` namespacing for the Linked-Data-Type access functions (like `=A1.Price` style)?

### Q3. Mac vs Windows save-format differences

I've documented these behaviors on Excel-for-Mac:

- `xlwings.formula2` forces dynamic-array entry — every formula gets `cm="1"` and `<f t="array" ref="...">` on save, even formulas that aren't arrays
- openpyxl writes `t="n"` explicitly for number cells; Excel-for-Mac strips it on save (defaults to omitted)
- openpyxl writes plain strings as `t="inlineStr"`; Excel-for-Mac rewrites to `t="s"` + sharedStrings entry
- LAMBDA parameter names get `_xlpm.` namespace prefix in the saved file

**Asks:**
- (a) Does Excel-for-Windows do the same normalizations on save?
- (b) Any other Mac-vs-Windows OOXML drift you've encountered? (specific attribute orderings, schema versions, etc.)

### Q4. Pre-365 `@` operator behavior

The `@` operator (implicit intersection forcer) is a 365-era addition.

**Ask:** when a 365-authored file containing `=@A1:A5` is opened in a pre-365 Excel:
- Does the `@` get stripped silently?
- Does the formula error?
- Or does pre-365 happen to handle the syntax somehow?

(Just need to know what happens; I can document the answer in the catalog.)

### Q5. `#GETTING_DATA` reachability in saved files

Excel emits `#GETTING_DATA` while async functions (STOCKHISTORY, WEBSERVICE, Power Query refresh) are in flight at the engine level.

**Ask:** have you ever seen `#GETTING_DATA` persist in a SAVED xlsx file (not just live engine state)? In my probes Excel always resolves to a final state (data or error) before save. Want to confirm whether the file format ever carries it, or it's strictly live-engine state.

### Q6. `_xludf.` prefix triggers

My finding: when openpyxl writes a bare formula like `=SEQUENCE(5)`, Excel-for-Mac on file-open rewrites it to `=_xludf.SEQUENCE(5)` and emits `#NAME?` — because openpyxl writes the bare name but Excel expects the namespaced `_xlfn.SEQUENCE`. When the same formula is entered through xlwings.formula2 (using Excel's own parser), the correct `_xlfn.` prefix is applied.

**Asks:**
- (a) Is `_xludf.` strictly a "preserve unrecognized function name" fallback? Are there other situations that trigger it?
- (b) Does it persist in the file forever, or does Excel "promote" `_xludf.<NAME>` to `_xlfn.<NAME>` if that function becomes recognized in a future version?
- (c) Have you seen `_xludf.` applied to anything other than a modern dynamic-array / lambda function written bare?

### Q7. Sub-flavors of `#SPILL!` and `#CALC!`

Modern Excel UI distinguishes sub-categories:

- `#SPILL!`: "Spill range isn't blank", "Spill range too big", "Out of memory", "Spill range in table"
- `#CALC!`: "Empty array", "Recursive lambda", "Async error"

**Ask:** do these sub-categories ever surface in the saved file's `<v>` content as distinguishing strings, or is `<v>` always just `#SPILL!` / `#CALC!` regardless of cause? (Excel docs are vague on this; never seen wire-format evidence either way.)

---

## Optional: spot-check on the full catalog

If you have time, the full audit findings are in [`excel-driver-fidelity.md`](./excel-driver-fidelity.md) (attached). Sections worth a glance for sanity-check:

- **F1 (date numFmt propagation):** does this match what you'd expect from Excel? Any cases where it WOULDN'T propagate that I'm missing?
- **F3 (blank-cell decay through VLOOKUP):** confirming this is universal Excel behavior, not Mac-specific?
- **F11 (`#` operator behavior):** anything I'm missing about how to introspect spill ranges?
- **F16 (1904-epoch hardcoded bug in my driver):** straightforward bug fix on my end; just confirming the diagnosis.

---

## How to respond

Slack/email/whatever is easiest for you. Even partial answers (e.g., just Q1 or just Q2) are very useful — these are independent. If something's outside your expertise, just say so and I'll find someone else.

Thanks!
