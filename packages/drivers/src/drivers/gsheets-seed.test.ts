import { describe, it, expect } from "vitest";
import { partitionSeeds } from "./gsheets.js";

// Headless unit test of the RAW/USER_ENTERED routing (D1/D6). The live API
// behaviour (RAW keeps "3" text; USER_ENTERED parses the sentinel into a real
// errorValue) was validated live in a prior session and is owed a re-confirm once
// a gsheets token is available — see the commit message.

describe("partitionSeeds — RAW/USER_ENTERED type routing (D1/D6)", () => {
  it("literals go RAW; errors + the formula go USER_ENTERED", () => {
    const { raw, userEntered } = partitionSeeds(
      "t0",
      { A1: 3, B1: "3", C1: "#DIV/0!", D1: { error: "#DIV/0!" }, E1: true, F1: null },
      "=SUM(A1:E1)",
      "AA1",
    );
    // RAW: number, number-looking text, error-looking text, boolean (F1 blank skipped)
    expect(raw).toEqual([
      { range: "'t0'!A1", values: [[3]] },
      { range: "'t0'!B1", values: [["3"]] },
      { range: "'t0'!C1", values: [["#DIV/0!"]] },
      { range: "'t0'!E1", values: [[true]] },
    ]);
    // USER_ENTERED: the real error seed (sentinel) then the target formula
    expect(userEntered).toEqual([
      { range: "'t0'!D1", values: [["#DIV/0!"]] },
      { range: "'t0'!AA1", values: [["=SUM(A1:E1)"]] },
    ]);
  });

  it("a blank seed is not written; the target formula always is", () => {
    const { raw, userEntered } = partitionSeeds("t0", { A1: null }, "=1+1", "AA1");
    expect(raw).toEqual([]);
    expect(userEntered).toEqual([{ range: "'t0'!AA1", values: [["=1+1"]] }]);
  });

  it("a number-looking text and a real error land in different buckets", () => {
    const { raw, userEntered } = partitionSeeds(
      "t0",
      { A1: "#DIV/0!", B1: { error: "#DIV/0!" } },
      "=A1",
      "AA1",
    );
    expect(raw).toEqual([{ range: "'t0'!A1", values: [["#DIV/0!"]] }]); // text via RAW
    expect(userEntered[0]).toEqual({ range: "'t0'!B1", values: [["#DIV/0!"]] }); // real error via UE
  });
});
