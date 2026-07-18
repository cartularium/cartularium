#!/usr/bin/env python3
"""Verify what the `@` (implicit-intersection-forcer) operator persists as
in the OOXML wire format.

The standing claim (F12 in excel-driver-fidelity.md) was: Excel translates
`@` to `_xlfn.SINGLE(...)` at save time. First-attempt probe with =@A1:A5
revealed this is incomplete: Excel actively STRIPS the `@` when the AE-
dialect form (with @) and IIE-dialect form (without @) are equivalent
(the documented Range.SavedAsArray heuristic — F21).

This probe tests three cases to clarify what actually persists:
  Case 1: =@A1:A5 in D1 — AE ≡ IIE (both produce A1) → expect @ stripped
  Case 2: =SUM(@A1:A5) in F1 — AE returns SUM(10)=10, IIE sums all = 150
          → genuinely diverges; @ MUST persist somehow
  Case 3: =@SEQUENCE(5) in H1 — AE returns 1, IIE spills → diverges; same

After this run we'll know the actual persistence story across the
equivalence/divergence boundary.

Run: cd packages/assay && uv run python scripts/probes/verify-at-operator-persistence.py
"""

from __future__ import annotations

import re
import sys
import time
import zipfile
from pathlib import Path

import xlwings as xw


CASES = [
    ("D1", "=@A1:A5", "AE ≡ IIE (both → A1=10)"),
    ("F1", "=SUM(@A1:A5)", "AE → SUM(10)=10; IIE → SUM(all)=150"),
    ("H1", "=@SEQUENCE(5)", "AE → 1; IIE would spill 1..5"),
]


def main() -> int:
    xlsx_path = Path("/tmp/assay-probe-at-operator.xlsx")
    if xlsx_path.exists():
        xlsx_path.unlink()

    print(f"[1/2] Building fixture: {xlsx_path}")
    app = xw.App(visible=False, add_book=False)
    try:
        wb = app.books.add()
        try:
            ws = wb.sheets[0]
            ws.range("A1:A5").value = [[10], [20], [30], [40], [50]]
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
        has_at = "@" in formula_text
        has_single = "_xlfn.SINGLE" in formula_text
        marker = "    -> "
        if has_at:
            print(f"{marker}contains literal '@' character")
        if has_single:
            print(f"{marker}contains _xlfn.SINGLE — AE-dialect persistence form")
        if not has_at and not has_single:
            print(f"{marker}@ STRIPPED entirely; formula saved without IIE-forcer")

    print()
    print("Interpretation:")
    print("  - D1 stripped: AE≡IIE equivalence → SavedAsArray=False heuristic")
    print("  - F1, H1: if _xlfn.SINGLE appears, this confirms Excel uses it as")
    print("    the persistence form when AE genuinely differs from IIE.")
    print("  - If F1/H1 also strip @ but produce different values, the @ semantics")
    print("    are recorded via some other mechanism (cm/vm metadata, <f t='array'>).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
