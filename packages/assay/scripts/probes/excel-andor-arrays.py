#!/usr/bin/env python3
"""One-shot probe: AND/OR transparency over array literals and ranges (Excel).

Mirror of gsheets-andor-arrays.mjs — design input for lattice's
AND/OR-over-List ruling (findings-batch 2026-06-12).

Run: cd packages/assay && uv run python scripts/probes/excel-andor-arrays.py
"""

from __future__ import annotations

import tempfile
from pathlib import Path

import xlwings as xw

SETUP = [
    ("B1", 0),
    ("B2", 1),
    ("B3", "a"),
    ("B4", True),
]

PROBES = [
    ("A1", "=AND({0})", "and-array-single-falsey"),
    ("A2", "=AND({1,0})", "and-array-mixed"),
    ("A3", "=AND({1,2})", "and-array-all-truthy"),
    ("A4", "=OR({0})", "or-array-single-falsey"),
    ("A5", "=OR({0,0})", "or-array-all-falsey"),
    ("A6", "=OR({0,1})", "or-array-mixed"),
    ("A7", "=AND({1,NA()})", "and-array-with-error"),
    ("A8", '=AND({"a"})', "and-array-text-only"),
    ("A9", '=AND({1,"a"})', "and-array-num-and-text"),
    ("A10", "=AND(0)", "and-scalar-baseline"),
    ("A11", "=AND(B1:B2)", "and-range-0-1"),
    ("A12", "=AND(B2:B4)", "and-range-1-text-true"),
    ("A13", "=AND(B3:B3)", "and-range-text-only"),
    ("A14", "=OR(B1:B1)", "or-range-just-0"),
    ("A15", "=OR(B3:B3)", "or-range-text-only"),
]


def main() -> None:
    app = xw.App(visible=False, add_book=False)
    try:
        book = app.books.add()
        sheet = book.sheets[0]
        for cell, value in SETUP:
            sheet.range(cell).value = value
        for cell, formula, _ in PROBES:
            sheet.range(cell).formula = formula
        app.calculate()
        for cell, formula, label in PROBES:
            value = sheet.range(cell).value
            print(f"{cell:<4} {label:<26} {formula:<18} => {value!r}")
        book.close()
    finally:
        app.quit()


if __name__ == "__main__":
    main()
