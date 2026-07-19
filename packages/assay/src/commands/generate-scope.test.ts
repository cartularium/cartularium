import { describe, expect, it } from "vitest";
import { runScope } from "./generate.js";

describe("generate run scope", () => {
  it("marks only an unfiltered run as full", () => {
    expect(runScope(false, 0, 0)).toEqual({ kind: "full" });
    expect(runScope(true, 0, 0)).toEqual({ kind: "subset" });
    expect(runScope(false, 2, 0)).toEqual({ kind: "subset" });
    expect(runScope(false, 0, 1)).toEqual({ kind: "subset" });
    expect(runScope(true, 1, 1)).toEqual({ kind: "subset" });
  });
});
