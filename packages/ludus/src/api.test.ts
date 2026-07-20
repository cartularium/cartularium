import assert from "node:assert/strict";
import test from "node:test";
import {
  exportSpreadsheetXlsx,
  readBoundedResponse,
  setTokenProvider,
  UnsupportedWorkbookError,
} from "./api.js";

setTokenProvider(async () => "test-token");

test("rejects a declared XLSX body above the compressed-size limit", async () => {
  const response = new Response(new Uint8Array([1]), { headers: { "content-length": "5" } });
  await assert.rejects(readBoundedResponse(response, 4), UnsupportedWorkbookError);
});

test("rejects a streamed XLSX body above the compressed-size limit", async () => {
  const response = new Response(new Uint8Array([1, 2, 3, 4, 5]));
  await assert.rejects(readBoundedResponse(response, 4), UnsupportedWorkbookError);
});

test("returns a body within the compressed-size limit", async () => {
  const response = new Response(new Uint8Array([1, 2, 3]));
  assert.deepEqual(await readBoundedResponse(response, 4), new Uint8Array([1, 2, 3]));
});

test("retries transient XLSX export failures", async () => {
  const waits: number[] = [];
  let calls = 0;
  const bytes = await exportSpreadsheetXlsx("source", {
    fetch: async () => {
      calls++;
      if (calls === 1) return new Response("busy", { status: 429, headers: { "retry-after": "2" } });
      if (calls === 2) return new Response("down", { status: 503 });
      return new Response(new Uint8Array([1, 2, 3]));
    },
    sleep: async (ms) => {
      waits.push(ms);
    },
  });

  assert.deepEqual(bytes, new Uint8Array([1, 2, 3]));
  assert.equal(calls, 3);
  assert.deepEqual(waits, [2000, 3000]);
});

test("classifies stable export denial as unsupported", async () => {
  await assert.rejects(
    exportSpreadsheetXlsx("source", {
      fetch: async () => new Response("forbidden", { status: 403 }),
      sleep: async () => {},
    }),
    UnsupportedWorkbookError,
  );
});
