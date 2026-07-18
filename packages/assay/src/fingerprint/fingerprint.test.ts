import { describe, expect, it } from "vitest";
import type { Extent, Outcome, RichGridValue } from "../format/values.js";
import { richGridsEqual } from "../format/equality.js";
import {
  FPV,
  compareStability,
  fingerprintOutcome,
  fingerprintValue,
  isStabilityComparable,
  quantizeNumberFpv1,
} from "./index.js";

const cell = (primitive: Record<string, unknown>) => ({ primitive }) as never;
const num = (v: number) => cell({ kind: "number", value: v });
const str = (v: string) => cell({ kind: "string", value: v });

function valueOutcome(grid: RichGridValue, extent?: Extent): Outcome {
  return {
    kind: "value",
    grid,
    extent: extent ?? { rows: grid.length, cols: grid[0]?.length ?? 0 },
  };
}

const fp = (o: Outcome) => fingerprintOutcome(o);
const obs = (o: Outcome, fpv = FPV) => ({ fingerprint: fp(o), fpv, outcome: o });

describe("fingerprint fpv1", () => {
  it("quantizes strictly finer than tolerance, so a match implies comparator equality", () => {
    // same 12-sig-digit bin -> same encoding, and always cellsEqual
    expect(quantizeNumberFpv1(1.0000000000001)).toBe(quantizeNumberFpv1(1.0000000000002));
    // -0 and 0 are one value
    expect(quantizeNumberFpv1(-0)).toBe("0");
    expect(quantizeNumberFpv1(Number.NaN)).toBe("NaN");
  });

  it("boundary straddle: within tolerance, different fingerprints, escalation says stable", () => {
    const a = valueOutcome([[num(1.0000000000549)]]);
    const b = valueOutcome([[num(1.0000000000551)]]);
    expect(fp(a)).not.toBe(fp(b)); // the residual the hash cannot absorb
    expect(richGridsEqual((a as never as { grid: RichGridValue }).grid, (b as never as { grid: RichGridValue }).grid)).toBe(true);
    expect(compareStability(obs(a), obs(b))).toBe("stable"); // escalated, not concluded from hashes
  });

  it("NFC: composed and decomposed text share a fingerprint AND compare equal", () => {
    const composed = valueOutcome([[str("caf\u00e9")]]);
    const decomposed = valueOutcome([[str("cafe\u0301")]]);
    expect(fp(composed)).toBe(fp(decomposed));
    expect(compareStability(obs(composed), obs(decomposed))).toBe("stable");
    // case is genuinely produced content — preserved
    expect(fp(valueOutcome([[str("A")]]))).not.toBe(fp(valueOutcome([[str("a")]])));
  });

  it("extent is load-bearing beyond the cell list", () => {
    const grid: RichGridValue = [[num(1)]];
    expect(fp(valueOutcome(grid, { rows: 1, cols: 1 }))).not.toBe(
      fp(valueOutcome(grid, { rows: 1, cols: 2 })),
    );
  });

  it("blank and null stay distinct; a hole is blank", () => {
    const hole = valueOutcome([[null]] as never);
    const runtimeNull = valueOutcome([[cell({ kind: "null" })]]);
    expect(fp(hole)).not.toBe(fp(runtimeNull));
    expect(compareStability(obs(hole), obs(runtimeNull))).toBe("changed"); // escalation preserves D8.β
  });

  it("real change is changed", () => {
    expect(compareStability(obs(valueOutcome([[num(1)]])), obs(valueOutcome([[num(2)]])))).toBe("changed");
  });

  it("unavailable materialization is unresolved, never changed", () => {
    const a = obs(valueOutcome([[num(1)]]));
    const b = { fingerprint: fp(valueOutcome([[num(2)]])), fpv: FPV };
    expect(compareStability(a, b)).toBe("unresolved");
  });

  it("fingerprint versions never compare across the boundary", () => {
    const a = valueOutcome([[num(1)]]);
    expect(compareStability(obs(a, 1), obs(a, 2))).toBe("incomparable");
  });

  it("opaque matches claim type-tag stability only", () => {
    const spark1 = valueOutcome([[cell({ kind: "opaque", type_tag: "sparkline", content: "series-A" })]]);
    const spark2 = valueOutcome([[cell({ kind: "opaque", type_tag: "sparkline", content: "series-B" })]]);
    expect(fp(spark1)).toBe(fp(spark2)); // content is no-data
    expect(fp(spark1)).not.toBe(fp(valueOutcome([[cell({ kind: "opaque", type_tag: "image" })]])));
  });

  it("classic and extended errors unify by sentinel", () => {
    const classic = valueOutcome([[cell({ kind: "error", sentinel: "#N/A" })]]);
    const extended = valueOutcome([[cell({ kind: "extended-error", sentinel: "#N/A", error_type: 42 })]]);
    expect(fp(classic)).toBe(fp(extended));
  });

  it("non-value identity projections: noise is not identity", () => {
    expect(fp({ kind: "infra", detail: "HTTP 429" })).toBe(
      fp({ kind: "infra", detail: "HTTP 429: retry after 30s", retryable: true }),
    );
    expect(fp({ kind: "crashed", channel: "timeout", detail: "60s elapsed" })).toBe(
      fp({ kind: "crashed", channel: "timeout", detail: "90s elapsed" }),
    );
    expect(fp({ kind: "crashed", channel: "timeout" })).not.toBe(fp({ kind: "crashed", channel: "process-death" }));
    expect(fp({ kind: "rejected", reason: "bad arg", code: "E1" })).toBe(
      fp({ kind: "rejected", reason: "bad argument count", code: "E1" }),
    );
    expect(fp({ kind: "rejected", reason: "bad arg" })).not.toBe(fp({ kind: "rejected", reason: "other" }));
    // classes never collide even with empty identities
    expect(fp({ kind: "infra", detail: "x" })).not.toBe(fp({ kind: "driver-error", detail: "x" }));
  });

  it("engine-stability membership: operational outcomes are gaps, not drift", () => {
    expect(isStabilityComparable({ kind: "value", grid: [], extent: { rows: 0, cols: 0 } })).toBe(true);
    expect(isStabilityComparable({ kind: "rejected", reason: "r" })).toBe(true);
    expect(isStabilityComparable({ kind: "crashed", channel: "timeout" })).toBe(true);
    for (const o of [
      { kind: "pending" },
      { kind: "skipped", cause: "capability" },
      { kind: "driver-error", detail: "d" },
      { kind: "infra", detail: "i" },
      { kind: "unclassified", raw: 1 },
    ] as Outcome[]) {
      expect(isStabilityComparable(o)).toBe(false);
    }
  });

  it("fingerprints value outcomes deterministically", () => {
    const grid: RichGridValue = [[num(1), str("x")], [cell({ kind: "boolean", value: true }), null as never]];
    const a = fingerprintValue(grid, { rows: 2, cols: 2 });
    const b = fingerprintValue(grid, { rows: 2, cols: 2 });
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
  });
});
