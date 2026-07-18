#!/usr/bin/env python3
"""Probe C9 — empirical fixture verification of RawXmlReader.resolve_vm.

Generates a workbook containing a real modern error (#SPILL!) via xlwings,
saves it, then reads via RawXmlReader and confirms resolve_vm returns the
expected typed descriptor.

Pass criterion (per the spec-grounded F26 mapping):
  - resolve_vm(vm) returns dict with symbol="#SPILL!" and errorType=8.

Run: cd packages/assay && uv run python scripts/probes/verify-d9-resolve-vm.py

Exits 0 on pass, 1 on fail. Prints the resolved descriptor on either outcome.

macOS PREREQUISITE — Apple Events automation permission. xlwings drives
Excel via AppleScript on macOS, which requires the calling app (Terminal,
iTerm, your IDE, etc.) to have Automation access to Microsoft Excel.
Grant via System Settings → Privacy & Security → Automation. First run
will fail with `aem.aemsend.EventError: ... -1743 ("The user has declined
permission.")` until the toggle is on.
"""

from __future__ import annotations

import sys
import time
import zipfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]  # packages/assay/
sys.path.insert(0, str(PROJECT_ROOT / "python"))

import xlwings as xw  # noqa: E402

from excel_driver import RawXmlReader  # noqa: E402


def dump_diagnostics(xlsx_path: Path) -> None:
    """Print A1's raw <c> XML, list xl/* parts, and dump metadata.xml +
    rich-value parts if present. For diagnosing why resolve_vm didn't match.
    """
    with zipfile.ZipFile(xlsx_path) as z:
        names = z.namelist()
        print("\n--- ZIP contents (xl/*) ---")
        for n in sorted(n for n in names if n.startswith("xl/")):
            print(f"  {n}")

        # Find the first sheet
        sheet_paths = [n for n in names if n.startswith("xl/worksheets/sheet")]
        if sheet_paths:
            sheet_xml = z.read(sheet_paths[0]).decode("utf8")
            print(f"\n--- {sheet_paths[0]} (first 2000 chars) ---")
            print(sheet_xml[:2000])

        for part in ("xl/metadata.xml", "xl/richData/rdRichValue.xml",
                     "xl/richData/rdRichValueStructure.xml"):
            if part in names:
                print(f"\n--- {part} ---")
                print(z.read(part).decode("utf8"))
            else:
                print(f"\n--- {part}: NOT PRESENT ---")


def build_spill_fixture(path: Path) -> None:
    """Open a workbook, write =SEQUENCE(3,3) into A1, THEN write a blocker
    at B2 to force a #SPILL!, save, close.

    Cross-platform xlwings notes:
      - `.api.Formula2` is Windows COM only; on Mac it silently no-ops.
      - `.formula` maps to VBA Range.Formula = IIE-dialect on both
        platforms — that enters SEQUENCE in implicit-intersection mode,
        which just returns the first value (1) instead of spilling.
      - **`.formula2` is the xlwings cross-platform attribute that maps
        to AE-dialect / dynamic-array entry.** This is what the existing
        excel-driver-fidelity.py probe uses.

    Order matters (per audit notes in excel-driver-fidelity.py:172):
      Pre-writing the obstacle causes xlwings.formula2 to restrict the
      array to single-cell at set time. The fix is to enter the spilling
      formula FIRST, then write the obstacle AFTER — Excel's recalc on
      save then emits #SPILL!.
    """
    app = xw.App(visible=False, add_book=False)
    try:
        wb = app.books.add()
        try:
            ws = wb.sheets[0]
            # 1. Enter SEQUENCE first, via formula2 for proper AE-dialect /
            #    dynamic-array entry. It spills A1:C3 with values 1..9.
            ws.range("A1").formula2 = "=SEQUENCE(3,3)"
            # 2. Write obstacle into B2 AFTER the spill is established.
            #    On save, Excel's recalc detects the conflict and converts
            #    A1 to #SPILL!.
            ws.range("B2").value = "blocker"
            # Force calc + small settle. wb.app.calculate works on Mac.
            wb.app.calculate()
            time.sleep(0.5)
            wb.save(str(path))
        finally:
            wb.close()
    finally:
        app.quit()


def read_a1_vm(xlsx_path: Path) -> tuple[int | None, str | None]:
    """Return (vm_index, fallback_v) from A1 in the saved workbook."""
    with RawXmlReader(str(xlsx_path)) as reader:
        # Sheet name when Excel creates a fresh workbook is locale-dependent.
        # Find the first sheet by iterating the known paths.
        sheet_names = list(reader._sheet_paths.keys())  # type: ignore[attr-defined]
        if not sheet_names:
            return None, None
        cell = reader.get_cell(sheet_names[0], "A1")
        if cell is None:
            return None, None
        # The fallback <v> isn't captured in RawCellData currently; we only
        # need vm for the resolve_vm call.
        return cell.vm, None


def main() -> int:
    # Persistent path so the fixture survives the run for inspection.
    xlsx_path = Path("/tmp/assay-probe-c9-spill.xlsx")
    if xlsx_path.exists():
        xlsx_path.unlink()
    print(f"[1/3] Building fixture: {xlsx_path}")
    build_spill_fixture(xlsx_path)
    print(f"      Wrote {xlsx_path.stat().st_size} bytes")

    print("[2/3] Reading A1 via RawXmlReader")
    vm, _ = read_a1_vm(xlsx_path)
    print(f"      A1 @vm = {vm!r}")
    if vm is None:
        print("FAIL: A1 has no @vm attribute. Either Excel didn't use the "
              "rich-value path for #SPILL!, or the file structure differs "
              "from what F26 assumes.")
        dump_diagnostics(xlsx_path)
        print(f"\nFixture retained at: {xlsx_path}")
        return 1

    print("[3/3] Resolving vm → modern-error descriptor")
    with RawXmlReader(str(xlsx_path)) as reader:
        result = reader.resolve_vm(vm)
    print(f"      resolve_vm({vm}) = {result!r}")

    if result is None:
        print("FAIL: resolve_vm returned None. Possible causes:")
        print("  - vm out of bounds (off-by-one between 0-based + 1-based)")
        print("  - rdRichValue.xml or rdRichValueStructure.xml namespace "
              "mismatch")
        print("  - {*}rv / {*}s / {*}k / {*}v wildcard failed to match")
        print("  - structure t attribute is not '_error' (LDT instead?)")
        dump_diagnostics(xlsx_path)
        print(f"\nFixture retained at: {xlsx_path}")
        return 1

    if result.get("symbol") == "#SPILL!" and result.get("errorType") == 8:
        print("PASS: resolve_vm returned #SPILL! / errorType=8 as expected.")
        extras = result.get("extras")
        if extras is not None:
            print(f"      extras (colOffset/rwOffset expected): {extras}")
        print(f"      Fixture retained at: {xlsx_path}")
        return 0

    print(f"FAIL: resolve_vm returned unexpected descriptor: {result}")
    print(f"      Expected symbol='#SPILL!', errorType=8")
    dump_diagnostics(xlsx_path)
    print(f"\nFixture retained at: {xlsx_path}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
