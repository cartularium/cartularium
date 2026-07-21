import assert from "node:assert/strict";
import test from "node:test";
import { runCleanupSafeSmoke } from "./smoke-lifecycle.js";

test("submits and removes the created smoke spreadsheet", async () => {
  const calls: string[] = [];
  const spreadsheetId = await runCleanupSafeSmoke({
    create: async () => {
      calls.push("create");
      return "sheet-1";
    },
    submit: async (id) => {
      calls.push(`submit:${id}`);
    },
    remove: async (id) => {
      calls.push(`remove:${id}`);
      return true;
    },
  });

  assert.equal(spreadsheetId, "sheet-1");
  assert.deepEqual(calls, ["create", "submit:sheet-1", "remove:sheet-1"]);
});

test("removes the spreadsheet after a submission failure", async () => {
  let removed = false;
  await assert.rejects(
    runCleanupSafeSmoke({
      create: async () => "sheet-2",
      submit: async () => {
        throw new Error("production refused canary");
      },
      remove: async () => {
        removed = true;
        return true;
      },
    }),
    /production refused canary/,
  );
  assert.equal(removed, true);
});

test("reports both submission and cleanup failures", async () => {
  await assert.rejects(
    runCleanupSafeSmoke({
      create: async () => "sheet-3",
      submit: async () => {
        throw new Error("production refused canary");
      },
      remove: async () => false,
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, 2);
      assert.match(String(error.errors[0]), /production refused canary/);
      assert.match(String(error.errors[1]), /failed to delete smoke spreadsheet: sheet-3/);
      return true;
    },
  );
});
