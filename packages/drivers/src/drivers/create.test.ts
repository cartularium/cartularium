import { describe, it, expect } from "vitest";
import { createDriver } from "./create.js";
import { ExcelDriver } from "./excel.js";
import { GSheetsDriver } from "./gsheets.js";
import { HyperFormulaDriver } from "./hyperformula.js";
import { capabilityDescriptorFor } from "../format/capability-data.js";

// createDriver constructs (no init), so these are side-effect-free.
describe("createDriver", () => {
  it("constructs the right driver class per platform", () => {
    expect(createDriver("excel")).toBeInstanceOf(ExcelDriver);
    expect(createDriver("gsheets", { spreadsheetId: "x", accessToken: "t" })).toBeInstanceOf(
      GSheetsDriver,
    );
    expect(createDriver("hyperformula")).toBeInstanceOf(HyperFormulaDriver);
  });

  it("each constructed driver reports its own platform", () => {
    const pures = ["excel", "hyperformula", "ironcalc", "formulas", "pycel", "libreoffice", "lattice"] as const;
    for (const p of pures) expect(createDriver(p).platform).toBe(p);
    expect(createDriver("gsheets", { spreadsheetId: "x", accessToken: "t" }).platform).toBe("gsheets");
  });

  it("passes Excel config through", () => {
    const d = createDriver("excel", { verbose: true, workbookPath: "/tmp/wb.xlsx" });
    expect(d).toBeInstanceOf(ExcelDriver);
    expect(d.platform).toBe("excel");
  });
});

describe("capabilities() / capabilityDescriptorFor", () => {
  it("projects the file's support to the report-only descriptor (wrapped → partial)", () => {
    const d = capabilityDescriptorFor("gsheets");
    expect(d.features["dynamic-arrays"]).toBe("native");
    expect(d.features.broadcasting).toBe("partial"); // file: wrapped (arrayformula-wrap)
    expect(d.features["structured-refs"]).toBe("absent");
    // No "wrapped" leaks into the descriptor.
    expect(Object.values(d.features)).not.toContain("wrapped");
  });

  it("a driver's capabilities() returns its platform descriptor", () => {
    const d = createDriver("gsheets", { spreadsheetId: "x", accessToken: "t" });
    expect(d.capabilities()).toEqual(capabilityDescriptorFor("gsheets"));
  });
});
