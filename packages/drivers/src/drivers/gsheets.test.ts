import { describe, expect, it } from "vitest";
import {
  applyBlankVerdicts,
  collectProbeCandidates,
  colLetter,
  richCellToRichValue,
  type ProbeCandidate,
  type RichCell,
  type RichGrid,
} from "./gsheets.js";

function cell(kind: RichCell["kind"], scalar: RichCell["scalar"] = null): RichCell {
  return { scalar, kind };
}

describe("colLetter", () => {
  it("maps 0-based indices to A1 letters", () => {
    expect(colLetter(0)).toBe("A");
    expect(colLetter(25)).toBe("Z");
    expect(colLetter(26)).toBe("AA");
    expect(colLetter(27)).toBe("AB");
    expect(colLetter(45)).toBe("AT"); // read-window last column
  });
});

describe("collectProbeCandidates", () => {
  // The canonical AA1 read-window origin (top=1, left=27 = col AA).
  const aa1 = (title: string) => ({ title, top: 1, left: 27 });

  it("flags only blank/null/spill-null cells, with read-window-relative coords", () => {
    // Mirrors the SPLIT("a,,b") row spilling from the AA1 read-window origin:
    // AA1="a", AB1=blank (ambiguous), AC1="b".
    const grid: RichGrid = [[cell("string", "a"), cell("blank"), cell("string", "b")]];
    const candidates = collectProbeCandidates([grid], [aa1("assay-t0")]);
    expect(candidates).toEqual([
      { gridIndex: 0, row: 0, col: 1, sheetTitle: "assay-t0", coord: "AB1" },
    ]);
  });

  it("includes null and spill-null, skips typed values, errors, and absent cells", () => {
    const grid: RichGrid = [
      [cell("number", 1), cell("null"), null],
      [cell("error", { error: "#N/A" }), cell("spill-null"), cell("boolean", true)],
    ];
    const coords = collectProbeCandidates([grid], [aa1("s")]).map((c) => c.coord);
    expect(coords).toEqual(["AB1", "AB2"]); // null at row0/col1 -> AB1; spill-null at row1/col1 -> AB2
  });

  it("maps coords from a TILED origin (not just AA1)", () => {
    // A lump tiled at (top=21, left=1 = col A): cell (r=0,c=1) → B21, (r=1,c=0) → A22.
    const grid: RichGrid = [
      [cell("string", "x"), cell("blank")],
      [cell("null"), null],
    ];
    const coords = collectProbeCandidates([grid], [{ title: "h0", top: 21, left: 1 }]).map(
      (c) => c.coord,
    );
    expect(coords).toEqual(["B21", "A22"]);
  });

  it("returns nothing when no cell is ambiguous (probe is skipped upstream)", () => {
    const grid: RichGrid = [[cell("number", 42), cell("string", "x")]];
    expect(collectProbeCandidates([grid], [aa1("s")])).toEqual([]);
  });

  it("carries the matching sheet title per grid index", () => {
    const grids: RichGrid[] = [[[cell("blank")]], [[cell("null")]]];
    const cands = collectProbeCandidates(grids, [aa1("t0"), aa1("t1")]);
    expect(cands.map((c) => c.sheetTitle)).toEqual(["t0", "t1"]);
  });
});

describe("applyBlankVerdicts", () => {
  const candAt = (row: number, col: number): ProbeCandidate => ({
    gridIndex: 0,
    row,
    col,
    sheetTitle: "s",
    coord: `${colLetter(26 + col)}${row + 1}`,
  });

  it("ISBLANK=false reclassifies the cell to empty string, preserving wire provenance", () => {
    const grid: RichGrid = [[cell("blank")]];
    applyBlankVerdicts([grid], [candAt(0, 0)], [false]);
    const c = grid[0][0]!;
    expect(c.scalar).toBe(""); // promotion -> {kind:"string", value:""}
    expect(c.semantic_null).toBe(false);
    expect(c.kind).toBe("blank"); // wire_kind unchanged
  });

  it("ISBLANK=true keeps the scalar null and annotates semantic_null, preserving wire kind", () => {
    const grid: RichGrid = [[cell("blank")]];
    applyBlankVerdicts([grid], [candAt(0, 0)], [true]);
    const c = grid[0][0]!;
    expect(c.scalar).toBe(null);
    expect(c.semantic_null).toBe(true);
    expect(c.kind).toBe("blank"); // wire_kind unchanged; primitive null is set in richCellToRichValue
  });

  it("inconclusive (undefined) verdict leaves the cell completely untouched", () => {
    const grid: RichGrid = [[cell("blank")]];
    applyBlankVerdicts([grid], [candAt(0, 0)], [undefined]);
    const c = grid[0][0]!;
    expect(c.scalar).toBe(null);
    expect(c.semantic_null).toBeUndefined();
    expect(c.kind).toBe("blank");
  });

  it("maps each verdict to its own candidate independently", () => {
    const grid: RichGrid = [[cell("blank"), cell("blank"), cell("blank")]];
    applyBlankVerdicts([grid], [candAt(0, 0), candAt(0, 1), candAt(0, 2)], [true, false, undefined]);
    expect(grid[0][0]!.semantic_null).toBe(true);
    expect(grid[0][1]!.scalar).toBe("");
    expect(grid[0][1]!.semantic_null).toBe(false);
    expect(grid[0][2]!.semantic_null).toBeUndefined();
  });
});

describe("richCellToRichValue — D8.β primitive promotion", () => {
  it("promotes a probed-true wire blank to a null primitive (not blank)", () => {
    const c: RichCell = { scalar: null, kind: "blank", semantic_null: true };
    const rv = richCellToRichValue(c);
    expect(rv.primitive).toEqual({ kind: "null" });
    expect(rv.engine).toMatchObject({ platform: "gsheets", wire_kind: "blank", semantic_null: true });
  });

  it("a probed-false blank carries a string-empty primitive", () => {
    const c: RichCell = { scalar: "", kind: "blank", semantic_null: false };
    const rv = richCellToRichValue(c);
    expect(rv.primitive).toEqual({ kind: "string", value: "" });
    expect(rv.engine).toMatchObject({ wire_kind: "blank", semantic_null: false });
  });

  it("an unprobed wire blank stays a blank primitive", () => {
    const c: RichCell = { scalar: null, kind: "blank" };
    const rv = richCellToRichValue(c);
    expect(rv.primitive).toEqual({ kind: "blank", reason: "untouched" });
    expect((rv.engine as { semantic_null?: boolean }).semantic_null).toBeUndefined();
  });
});
