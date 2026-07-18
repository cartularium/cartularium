#!/usr/bin/env python3
"""L-4 Excel dimension probe, take 2: error-transparent reads.

xlwings .value on macOS returns None for error cells, so excel-grid-dims.py
read every #REF!/#SPILL! as "(empty)". Here every probe cell gets a companion
diagnostic =IF(ISERROR(x),"ERR "&ERROR.TYPE(x),"VAL "&x) and =FORMULATEXT(x)
so we see what was stored and what it evaluated to.

ERROR.TYPE: 1 #NULL! 2 #DIV/0! 3 #VALUE! 4 #REF! 5 #NAME? 6 #NUM! 7 #N/A
            9 #SPILL! 14 #CALC!

Run: cd packages/assay && uv run python scripts/probes/excel-grid-dims2.py
"""

from __future__ import annotations

import xlwings as xw

# (probe_cell, formula, label) — diagnostics go in the two columns to the right
# of the listed diag_base cell.
PROBES = [
    ("A1", "=OFFSET(A1,-1,0)", "offset-above-top", "E1"),
    ("A2", "=OFFSET(A2,1048576,0)", "offset-past-bottom", "E2"),
    ("A3", "=OFFSET(XFD1,0,1)", "offset-past-right", "E3"),
    ("A4", '=INDIRECT("A1048577")', "indirect-out-rows", "E4"),
    ("A5", '=INDIRECT("XFE1")', "indirect-out-cols", "E5"),
    ("A6", "=INDEX(B:B,1048577)", "index-past-dims", "E6"),
    ("A7", "=A1048577", "point-ref-out-rows", "E7"),
    ("A8", "=XFE1", "point-ref-out-cols", "E8"),
    ("A9", "=SUM(A1048570:A1048580)", "range-straddles-bottom", "E9"),
    ("A10", "=ROWS(C2:C)", "rows-gsheets-open-rect", "E10"),
    ("A11", "=ROWS(B:B)", "rows-open-col-sanity", "E11"),
]

SPILL_PROBES = [
    ("A1048570", "=SEQUENCE(10)", "spill-past-bottom", "E12"),
    ("XFA1", "=SEQUENCE(1,5)", "spill-past-right", "E13"),
]


def main() -> None:
    app = xw.App(visible=False, add_book=False)
    try:
        book = app.books.add()
        sheet = book.sheets[0]
        sheet.range("B1").value = 10

        entered: list[tuple[str, str, str, str]] = []
        for probe, formula, label, diag in PROBES + SPILL_PROBES:
            try:
                sheet.range(probe).formula2 = formula
                entered.append((probe, formula, label, diag))
            except Exception as e:  # noqa: BLE001
                print(f"{probe:<10} {label:<24} {formula:<26} => ENTRY REJECTED: {str(e)[:90]}")

        for probe, _formula, _label, diag in entered:
            sheet.range(diag).formula2 = (
                f'=IF(ISERROR({probe}),"ERR "&ERROR.TYPE({probe}),"VAL "&{probe})'
            )
            sheet.range(diag).offset(0, 1).formula2 = f"=FORMULATEXT({probe})"

        app.calculate()

        for probe, formula, label, diag in entered:
            verdict = sheet.range(diag).value
            stored = sheet.range(diag).offset(0, 1).value
            print(f"{probe:<10} {label:<24} {formula:<26} => {verdict!r:<12} stored={stored!r}")

        book.close()
    finally:
        app.quit()


if __name__ == "__main__":
    main()
