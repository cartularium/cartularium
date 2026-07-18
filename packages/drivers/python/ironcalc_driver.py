"""ironcalc driver — evaluates formulas via the `ironcalc` python package.

protocol matches the other python drivers:
  single: [task.json, result.json]
  batch:  --batch [tasks.json, results.json]

fresh model per task (no state leak); 20×20 spill window read.

precision caveat: ironcalc's python bindings only expose `get_formatted_cell_value`,
which returns the display string (~10 sig-digits for general-format numbers).
full-precision doubles aren't reachable without decoding the binary icalc format.
near-threshold numeric mismatches under assay's 1e-10 tolerance are driver artefacts.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from typing import Any

import ironcalc


# excel/sheets 1900 date system (with the 1900-02-29 leap-year bug);
# day 0 = 1899-12-30 so serials line up with excel/sheets outputs.
_DATE_EPOCH = datetime(1899, 12, 30)


def _parse_formatted_number(raw: str) -> float:
    # undo ironcalc's auto-applied format. ironcalc only exposes
    # `get_formatted_cell_value`, and function outputs (PMT, TBILLEQ, …) are
    # hard-formatted as `$#,##0.00` etc. — `get_cell_content` returns the
    # formula, not the value, so we have to round-trip through the display string.
    s = raw.strip()
    neg = False
    if s.startswith("(") and s.endswith(")"):  # accounting negatives
        neg = True
        s = s[1:-1]
    if s.startswith("-"):
        neg = True
        s = s[1:]
    s = s.replace("$", "").replace("£", "").replace("€", "").replace(",", "").strip()
    if s.endswith("%"):
        v = float(s[:-1]) / 100.0
    else:
        v = float(s)
    return -v if neg else v


# en-locale date/datetime format ironcalc emits for date/datetime cells
_DATE_FMT_RE = re.compile(
    r"^(?P<mon>\d{1,2})/(?P<day>\d{1,2})/(?P<year>\d{4})"
    r"(?:,\s*(?P<h>\d{1,2}):(?P<m>\d{2})(?::(?P<s>\d{2}))?\s*(?P<ampm>AM|PM))?$"
)


def _parse_formatted_date(raw: str) -> float:
    # '3/15/2025' → excel serial (float)
    m = _DATE_FMT_RE.match(raw.strip())
    if not m:
        raise ValueError(raw)
    year = int(m.group("year"))
    mon = int(m.group("mon"))
    day = int(m.group("day"))
    h = m.group("h")
    if h is not None:
        hour = int(h)
        if m.group("ampm") == "PM" and hour != 12:
            hour += 12
        elif m.group("ampm") == "AM" and hour == 12:
            hour = 0
        minute = int(m.group("m"))
        sec = int(m.group("s") or "0")
        dt = datetime(year, mon, day, hour, minute, sec)
    else:
        dt = datetime(year, mon, day)
    return (dt - _DATE_EPOCH).total_seconds() / 86400.0


# AA1 — cols A-Z reserved for grid: cells. 1-indexed (ironcalc convention).
TARGET_ROW = 1
TARGET_COL = 27
SPILL_ROWS = 20
SPILL_COLS = 20


_CELL_REF_RE = re.compile(r"^([A-Z]+)(\d+)$")


def col_letter_to_index(letters: str) -> int:
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - ord("A") + 1)
    return n


def parse_cell_ref(ref: str) -> tuple[int, int]:
    m = _CELL_REF_RE.match(ref.upper())
    if not m:
        raise ValueError(f"Invalid cell reference: {ref}")
    return int(m.group(2)), col_letter_to_index(m.group(1))


def make_model() -> Any:
    return ironcalc.create("assay", "en", "UTC", "en")


def cell_to_value(model: Any, sheet: int, row: int, col: int) -> Any:
    ctype = model.get_cell_type(sheet, row, col)
    type_name = str(ctype).rsplit(".", 1)[-1]
    raw = model.get_formatted_cell_value(sheet, row, col)

    if type_name in ("Empty", "Empty()"):
        return None
    if type_name == "ErrorValue":
        return {"error": raw}
    if type_name == "Number":
        if raw == "":
            return None
        # fast path: general Number, parse as int-or-float
        try:
            if "." in raw or "e" in raw.lower():
                return float(raw)
            return int(raw)
        except ValueError:
            pass
        # formatted Number: currency / percent / accounting
        try:
            return _parse_formatted_number(raw)
        except ValueError:
            pass
        # date / datetime as string
        try:
            return _parse_formatted_date(raw)
        except ValueError:
            pass
        return raw  # unknown format — leak as string
    if type_name == "LogicalValue":
        return raw.upper() == "TRUE"
    if type_name == "Text":
        return raw
    return raw if raw != "" else None


def read_result(model: Any) -> list[list[Any]]:
    grid: list[list[Any]] = []
    for dr in range(SPILL_ROWS):
        row: list[Any] = []
        for dc in range(SPILL_COLS):
            val = cell_to_value(model, 0, TARGET_ROW + dr, TARGET_COL + dc)
            row.append(val)
        grid.append(row)

    # trim trailing all-null cols
    max_cols = 0
    for row in grid:
        for c in range(len(row) - 1, -1, -1):
            if row[c] is not None:
                max_cols = max(max_cols, c + 1)
                break
    if max_cols == 0:
        max_cols = 1
    grid = [row[:max_cols] for row in grid]

    # trim trailing all-null rows
    max_rows = 0
    for r in range(len(grid) - 1, -1, -1):
        if any(cell is not None for cell in grid[r]):
            max_rows = r + 1
            break
    if max_rows == 0:
        max_rows = 1
    grid = grid[:max_rows]

    return grid


def evaluate_one(formula: str, grid: dict[str, Any]) -> dict[str, Any]:
    try:
        model = make_model()

        for ref, val in (grid or {}).items():
            row, col = parse_cell_ref(ref)
            if val is None:
                continue
            if isinstance(val, bool):
                model.set_user_input(0, row, col, "TRUE" if val else "FALSE")
            elif isinstance(val, dict) and "error" in val:
                model.set_user_input(0, row, col, val["error"])
            else:
                model.set_user_input(0, row, col, str(val))

        model.set_user_input(0, TARGET_ROW, TARGET_COL, formula)
        model.evaluate()
        return {"result": read_result(model)}
    except Exception as e:  # noqa: BLE001
        return {"error": f"{type(e).__name__}: {e}"}


def main() -> int:
    args = sys.argv[1:]
    if args and args[0] == "--version":
        from importlib.metadata import PackageNotFoundError, version
        try:
            print(version("ironcalc"))
        except PackageNotFoundError:
            print(getattr(ironcalc, "__version__", "") or "")
        return 0
    batch = False
    if args and args[0] == "--batch":
        batch = True
        args = args[1:]

    if len(args) != 2:
        print("usage: ironcalc_driver.py [--version | [--batch] <task.json> <result.json>]", file=sys.stderr)
        return 2

    task_path, result_path = args

    with open(task_path, encoding="utf8") as f:
        data = json.load(f)

    if batch:
        results = [evaluate_one(t.get("formula", ""), t.get("grid") or {}) for t in data]
        with open(result_path, "w", encoding="utf8") as f:
            json.dump(results, f)
    else:
        res = evaluate_one(data.get("formula", ""), data.get("grid") or {})
        with open(result_path, "w", encoding="utf8") as f:
            json.dump(res, f)

    return 0


if __name__ == "__main__":
    sys.exit(main())
