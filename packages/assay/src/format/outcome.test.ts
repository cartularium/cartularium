import { describe, it, expect } from "vitest";
import {
  isEngineAttributable,
  outcomeGrid,
  outcomeErrorText,
  extentOf,
  valueOutcome,
  legacyToOutcome,
  type Outcome,
  type RichGridValue,
} from "./values.js";

const grid: RichGridValue = [
  [{ primitive: { kind: "number", value: 1 }, engine: { platform: "excel" } }],
];

describe("§6.6 Outcome helpers", () => {
  it("isEngineAttributable — value/rejected/crashed/pending in; skipped/driver-error/infra/unclassified out", () => {
    const inn: Outcome[] = [
      { kind: "value", grid, extent: { rows: 1, cols: 1 } },
      { kind: "rejected", reason: "x" },
      { kind: "crashed", channel: "host-wedge" },
      { kind: "pending" },
    ];
    const out: Outcome[] = [
      { kind: "skipped", cause: "capability" },
      { kind: "driver-error", detail: "bug" },
      { kind: "infra", detail: "quota" },
      { kind: "unclassified", raw: {} },
    ];
    for (const o of inn) expect(isEngineAttributable(o)).toBe(true);
    for (const o of out) expect(isEngineAttributable(o)).toBe(false);
  });

  it("outcomeGrid — grid only for value", () => {
    expect(outcomeGrid({ kind: "value", grid, extent: { rows: 1, cols: 1 } })).toBe(grid);
    expect(outcomeGrid({ kind: "rejected", reason: "x" })).toBeUndefined();
    expect(outcomeGrid({ kind: "skipped", cause: "policy" })).toBeUndefined();
  });

  it("outcomeErrorText — message for error-ish, undefined for value/skipped/pending", () => {
    expect(outcomeErrorText({ kind: "rejected", reason: "calc-limit" })).toBe("calc-limit");
    expect(outcomeErrorText({ kind: "crashed", channel: "timeout", detail: "10s" })).toBe(
      "crashed[timeout]: 10s",
    );
    expect(outcomeErrorText({ kind: "crashed", channel: "host-wedge" })).toBe("crashed[host-wedge]");
    expect(outcomeErrorText({ kind: "infra", detail: "429" })).toBe("429");
    expect(outcomeErrorText({ kind: "driver-error", detail: "our bug" })).toBe("our bug");
    expect(outcomeErrorText({ kind: "value", grid, extent: { rows: 1, cols: 1 } })).toBeUndefined();
    expect(outcomeErrorText({ kind: "skipped", cause: "policy" })).toBeUndefined();
    expect(outcomeErrorText({ kind: "pending" })).toBeUndefined();
  });

  it("extentOf / valueOutcome — derive extent from the grid", () => {
    expect(extentOf(grid)).toEqual({ rows: 1, cols: 1 });
    const o = valueOutcome(grid);
    expect(o).toMatchObject({ kind: "value", grid, extent: { rows: 1, cols: 1 } });
  });

  it("legacyToOutcome — best-effort lift of the legacy {result,error,driverIssue,skipped} shape", () => {
    expect(legacyToOutcome({ result: grid })).toMatchObject({ kind: "value", extent: { rows: 1, cols: 1 } });
    expect(legacyToOutcome({ skipped: "needs-spill" })).toEqual({
      kind: "skipped",
      cause: "policy",
      reason: "needs-spill",
    });
    expect(legacyToOutcome({ error: "bad name", driverIssue: true })).toEqual({
      kind: "driver-error",
      detail: "bad name",
    });
    expect(legacyToOutcome({ error: "#NUM!" })).toEqual({ kind: "rejected", reason: "#NUM!" });
    expect(legacyToOutcome({ error: "aborted: upstream quota/auth failure" })).toMatchObject({
      kind: "infra",
      retryable: true,
    });
    expect(legacyToOutcome({})).toMatchObject({ kind: "unclassified" });
  });
});
