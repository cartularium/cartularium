#!/usr/bin/env python3
"""L-4 design input: sheet-dimension semantics (Excel).

Mirror of gsheets-grid-dims*.mjs. Excel's grid is fixed 1048576x16384 —
probe how the boundary reads: shape queries over open ranges, references
at/past the edge, OFFSET/INDIRECT/INDEX out of bounds, spill past the edge,
and whether past-edge addresses parse at all.

Run: cd packages/assay && uv run python scripts/probes/excel-grid-dims.py
"""

from __future__ import annotations

import xlwings as xw

PROBES = [
    ("A1", "=ROWS(B:B)", "rows-open-col"),
    ("A2", "=COLUMNS(1:1)", "cols-open-row"),
    ("A3", "=ROWS(C2:C)", "rows-open-rect"),  # may not parse in Excel
    ("A4", "=OFFSET(A1,-1,0)", "offset-above-top"),
    ("A5", "=OFFSET(A1,1048576,0)", "offset-past-bottom"),
    ("A6", "=OFFSET(XFD1,0,1)", "offset-past-right"),
    ("A7", '=INDIRECT("A1048577")', "indirect-out-rows"),
    ("A8", '=INDIRECT("XFE1")', "indirect-out-cols"),
    ("A9", "=INDEX(B:B,1048576)", "index-at-last-row"),
    ("A10", "=INDEX(B:B,1048577)", "index-past-dims"),
    ("A11", "=SUM(XFD:XFD)", "open-col-at-edge"),
    ("A12", "=ROWS(B1:B1048576)", "rows-concrete-full-col"),
]

# Formulas whose ADDRESSES are out of the address space — Excel may reject at entry.
PARSE_PROBES = [
    ("C1", "=A1048577", "point-ref-out-rows"),
    ("C2", "=XFE1", "point-ref-out-cols"),
    ("C3", "=SUM(A1048570:A1048580)", "range-straddles-bottom"),
]

# Spill probes: anchor in-bounds, result would cross the edge.
SPILL_PROBES = [
    ("A1048570", "=SEQUENCE(10)", "spill-past-bottom"),   # rows 1048570..1048579 > max
    ("XFA1", "=SEQUENCE(1,5)", "spill-past-right"),       # cols XFA..XFE > XFD
]


def show(v) -> str:
    if v is None:
        return "(empty)"
    return repr(v)


def main() -> None:
    app = xw.App(visible=False, add_book=False)
    try:
        book = app.books.add()
        sheet = book.sheets[0]
        sheet.range("B1").value = 10
        sheet.range("B2").value = 20

        print("=== formula probes ===")
        for cell, formula, label in PROBES:
            try:
                sheet.range(cell).formula2 = formula
            except Exception as e:  # noqa: BLE001
                print(f"{cell:<5} {label:<26} {formula:<28} => ENTRY REJECTED: {str(e)[:90]}")
                continue
        app.calculate()
        for cell, formula, label in PROBES:
            try:
                v = sheet.range(cell).value
            except Exception as e:  # noqa: BLE001
                v = f"READ ERROR: {str(e)[:60]}"
            print(f"{cell:<5} {label:<26} {formula:<28} => {show(v)}")

        print("\n=== past-address-space parse probes ===")
        for cell, formula, label in PARSE_PROBES:
            try:
                sheet.range(cell).formula2 = formula
                app.calculate()
                print(f"{cell:<5} {label:<26} {formula:<28} => {show(sheet.range(cell).value)}")
            except Exception as e:  # noqa: BLE001
                print(f"{cell:<5} {label:<26} {formula:<28} => ENTRY REJECTED: {str(e)[:90]}")

        print("\n=== spill-past-edge probes ===")
        for cell, formula, label in SPILL_PROBES:
            try:
                sheet.range(cell).formula2 = formula
                app.calculate()
                print(f"{cell:<10} {label:<22} {formula:<18} => {show(sheet.range(cell).value)}")
            except Exception as e:  # noqa: BLE001
                print(f"{cell:<10} {label:<22} {formula:<18} => ENTRY REJECTED: {str(e)[:90]}")

        book.close()
    finally:
        app.quit()


if __name__ == "__main__":
    main()
