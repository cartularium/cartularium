import { describe, it, expect } from "vitest";
import type { RichGridValue } from "../../format/values.js";
import { liftScalarGrid } from "../lift.js";
import { routeByExtent } from "./read-model.js";
import {
  compositeProbeFormula,
  parseProbeReading,
  probeExtent,
  type ProbeSubject,
} from "./probe.js";

// A phase-1 host: returns whatever scalar the composite probe "measured".
function probeSubject(reading: string): ProbeSubject {
  return {
    async evaluate(): Promise<RichGridValue> {
      return liftScalarGrid([[reading]], "gsheets");
    },
  };
}

describe("compositeProbeFormula — scalar-collapsing extent probe", () => {
  it("wraps the formula in the LET probe (doc §5.2)", () => {
    expect(compositeProbeFormula("=SEQUENCE(50)")).toBe(
      '=LET(_r,SEQUENCE(50),"d:"&ROWS(_r)&"x"&COLUMNS(_r)&";n:"&COUNTA(_r)&";b:"&COUNTBLANK(_r))',
    );
  });
  it("strips a leading '=' and tolerates one without", () => {
    expect(compositeProbeFormula("SEQUENCE(50)")).toContain("LET(_r,SEQUENCE(50),");
  });
});

describe("parseProbeReading", () => {
  it("parses extent + blank census", () => {
    expect(parseProbeReading("d:50x1;n:50;b:0")).toEqual({
      extent: { rows: 50, cols: 1 },
      nonBlank: 50,
      blank: 0,
    });
    expect(parseProbeReading("d:3x4;n:10;b:2")).toEqual({
      extent: { rows: 3, cols: 4 },
      nonBlank: 10,
      blank: 2,
    });
  });
  it("returns null for a non-reading scalar (e.g. an error propagated into the probe)", () => {
    expect(parseProbeReading("#REF!")).toBeNull();
    expect(parseProbeReading("garbage")).toBeNull();
  });
});

describe("probeExtent — phase 1, feeding routeByExtent", () => {
  it("a small extent routes to materialize", async () => {
    const r = await probeExtent(probeSubject("d:1x1;n:1;b:0"), "=1+1");
    expect(r).toMatchObject({ extent: { rows: 1, cols: 1 } });
    expect(routeByExtent(r!.extent).route).toBe("materialize");
  });

  it("a mid extent (50×1) also routes to materialize (within budget; T0/T1 collapsed)", async () => {
    const r = await probeExtent(probeSubject("d:50x1;n:50;b:0"), "=SEQUENCE(50)");
    expect(routeByExtent(r!.extent).route).toBe("materialize");
  });

  it("a MONSTER is measured as a scalar and routed to DIGEST — never materialized", async () => {
    // The whole point: ROWS(SEQUENCE(1e6)) collapses to a scalar; the grid is
    // never placed. The budget gate fires on the known extent.
    const r = await probeExtent(probeSubject("d:1000000x1;n:1000000;b:0"), "=SEQUENCE(1000000)");
    expect(r!.extent.rows).toBe(1_000_000);
    expect(routeByExtent(r!.extent, { maxMaterializeCells: 1000 }).route).toBe("digest");
  });

  it("carries the blank census (trailing-blank disambiguation, E4/E5)", async () => {
    const r = await probeExtent(probeSubject("d:10x1;n:7;b:3"), "=FILTER(A1:A10,B1:B10)");
    expect(r).toMatchObject({ nonBlank: 7, blank: 3 });
  });

  it("returns null when F errors into the probe cell (fall back to the safety net)", async () => {
    const errorSubject: ProbeSubject = {
      async evaluate(): Promise<RichGridValue> {
        return liftScalarGrid([[{ error: "#REF!" }]], "gsheets");
      },
    };
    expect(await probeExtent(errorSubject, "=1/0")).toBeNull();
  });
});
