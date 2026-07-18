#!/usr/bin/env python3
"""Verify what the `#` (spill-range) operator persists as in the OOXML wire
format. Standing claim (F12): `#` serializes as `_xlfn.ANCHORARRAY(...)`.

Closes the second half of calibration deficit C8 — the first half
(`_xlfn.SINGLE` for `@`) was empirically confirmed by
verify-at-operator-persistence.py. This probe targets `_xlfn.ANCHORARRAY`
directly.

Cases:
  Setup: A1 = =SEQUENCE(5) (spills into A1:A5 with values 1..5)
  B1 = =TYPE(A1#)  — `#` inside a function call; should force ANCHORARRAY
  C1 = =SUM(A1#)   — same reasoning; another function call
  D1 = =A1#        — top-level `#` reference; may behave differently
                     (parallel of how top-level @ behaved in the @ probe)

Run: cd packages/assay && uv run python scripts/probes/verify-anchor-array-persistence.py
"""

from __future__ import annotations

import re
import sys
import time
import zipfile
from pathlib import Path

import xlwings as xw


CASES = [
    ("B1", "=TYPE(A1#)", "# inside function call (TYPE)"),
    ("C1", "=SUM(A1#)", "# inside function call (SUM)"),
    ("D1", "=A1#", "# at top level"),
]


def main() -> int:
    xlsx_path = Path("/tmp/assay-probe-anchor-array.xlsx")
    if xlsx_path.exists():
        xlsx_path.unlink()

    print(f"[1/2] Building fixture: {xlsx_path}")
    app = xw.App(visible=False, add_book=False)
    try:
        wb = app.books.add()
        try:
            ws = wb.sheets[0]
            # Anchor: =SEQUENCE(5) spills A1:A5 with 1..5
            ws.range("A1").formula2 = "=SEQUENCE(5)"
            wb.app.calculate()
            time.sleep(0.3)
            # Now use the # spill-range operator in three configurations
            for cell, formula, _ in CASES:
                try:
                    ws.range(cell).formula2 = formula
                except Exception as e:
                    print(f"  WARN: formula2 entry failed for {cell}: {e}")
            wb.app.calculate()
            time.sleep(0.3)
            wb.save(str(xlsx_path))
        finally:
            wb.close()
    finally:
        app.quit()
    print(f"      Wrote {xlsx_path.stat().st_size} bytes\n")

    print(f"[2/2] Inspecting saved sheet XML")
    with zipfile.ZipFile(xlsx_path) as z:
        sheet_xml = z.read("xl/worksheets/sheet1.xml").decode("utf8")

    saw_anchorarray = False
    saw_hash = False
    for cell, formula, dialect_note in CASES:
        print(f"\n  Case {cell}: {formula}  — {dialect_note}")
        m = re.search(rf'<c r="{cell}"[^>]*>(.*?)</c>', sheet_xml, re.DOTALL)
        if not m:
            print(f"    NO CELL FOUND in saved sheet (entry likely failed)")
            continue
        cell_xml = m.group(0)
        print(f"    persisted: {cell_xml}")
        f_match = re.search(r'<f[^>]*>(.*?)</f>', cell_xml, re.DOTALL)
        if not f_match:
            print(f"    no <f> element — value-only cell")
            continue
        formula_text = f_match.group(1)
        has_hash = "#" in formula_text
        has_anchor = "_xlfn.ANCHORARRAY" in formula_text
        if has_hash:
            print(f"    -> contains literal '#' character")
            saw_hash = True
        if has_anchor:
            print(f"    -> contains _xlfn.ANCHORARRAY — wire-form for `#` operator")
            saw_anchorarray = True
        if not has_hash and not has_anchor:
            print(f"    -> # stripped; persisted via some other mechanism")

    print()
    if saw_anchorarray and not saw_hash:
        print(f"PASS: _xlfn.ANCHORARRAY observed in saved file. The `#` operator's"
              f" wire-format spelling is confirmed; combined with the @ probe this"
              f" closes calibration deficit C8 empirically.")
        return 0
    if saw_hash:
        print(f"FAIL: literal '#' character appears in saved formula text. The"
              f" claim that `#` doesn't persist literally is FALSE.")
        return 1
    print(f"UNCLEAR: no `#` and no _xlfn.ANCHORARRAY observed. Investigate"
          f" what Excel persisted instead (possibly `<f t='array'>` markers or"
          f" stripping similar to the top-level @ case).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
