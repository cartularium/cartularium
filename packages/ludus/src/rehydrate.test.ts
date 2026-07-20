import assert from "node:assert/strict";
import test from "node:test";
import { rehydrate } from "./rehydrate.js";
import type { Snapshot } from "./snapshot.js";

test("refuses to silently drop named functions", async () => {
  const snapshot: Snapshot = {
    spreadsheetId: "source",
    title: "source",
    namedRanges: [],
    namedFunctions: [{ name: "F", definition: "LAMBDA(x,x)" }],
    sheets: [],
  };

  await assert.rejects(rehydrate(snapshot, "scratch"), /cannot preserve named functions/);
});
