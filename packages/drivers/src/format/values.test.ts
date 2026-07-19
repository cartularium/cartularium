import { describe, expect, it } from "vitest";
import type { Outcome } from "./values.js";

type ExecutionLimitOutcome = Extract<
  Outcome,
  { kind: "skipped"; cause: "execution-limit" }
>;

describe("execution-limit outcomes", () => {
  it("requires a limit payload", () => {
    // @ts-expect-error execution-limit skips require a mechanism-bearing limit payload
    const outcome: ExecutionLimitOutcome = { kind: "skipped", cause: "execution-limit" };
    expect(outcome).toEqual({ kind: "skipped", cause: "execution-limit" });
  });

  it("round-trips the structured limit through JSON unchanged", () => {
    const outcome: Outcome = {
      kind: "skipped",
      cause: "execution-limit",
      limit: { mechanism: "interactive-grant" },
    };

    expect(JSON.parse(JSON.stringify(outcome))).toEqual(outcome);
  });
});
