import { describe, expect, it } from "vitest";
import {
  caseKey,
  canonicalJson,
  deriveCategory,
  derivePublicRef,
  deriveSubjectRef,
  parseAssayRef,
  semanticHashForCase,
} from "./index.js";

describe("assay v3 identity", () => {
  it("derives function public refs", () => {
    expect(deriveSubjectRef("EXPAND")).toBe("EXPAND");
    expect(derivePublicRef({ subject: "EXPAND", name: "pad-value" })).toBe("EXPAND/pad-value");
  });

  it("maps operator and literal subjects to path-safe refs", () => {
    expect(deriveSubjectRef("op:+")).toBe("op:add");
    expect(deriveSubjectRef("op:/")).toBe("op:divide");
    expect(deriveSubjectRef("TRUE")).toBe("lit:boolean");
  });

  it("requires explicit subjectRef for unknown non-path-safe subjects", () => {
    expect(() => deriveSubjectRef("feature:has/slash")).toThrow(/subjectRef/);
  });

  it("rejects invalid public names", () => {
    expect(() => derivePublicRef({ subject: "EXPAND", name: "Pad Value" })).toThrow(/name/);
  });

  it("parses canonical and preview refs", () => {
    const previewHash = "9e091174".padEnd(64, "0");

    expect(parseAssayRef("EXPAND/pad-value")).toEqual({
      kind: "canonical",
      ref: "EXPAND/pad-value",
    });
    expect(parseAssayRef(`preview:${previewHash}`)).toEqual({ kind: "preview", hash: previewHash });
  });

  it("rejects preview-prefixed subject refs", () => {
    expect(() => deriveSubjectRef("preview:subject")).toThrow(/subjectRef/);
    expect(() =>
      derivePublicRef({
        subject: "EXPAND",
        subjectRef: "preview:subject",
        name: "pad-value",
      }),
    ).toThrow(/subjectRef/);
  });

  it("rejects malformed preview refs", () => {
    expect(() => parseAssayRef("preview:9e091174")).toThrow(/preview/);
    expect(() => parseAssayRef("preview:")).toThrow(/preview/);
    expect(() => parseAssayRef(`preview:${"g".repeat(64)}`)).toThrow(/preview/);
  });

  it("validates canonical refs component-wise", () => {
    expect(parseAssayRef("op:add/addition")).toEqual({
      kind: "canonical",
      ref: "op:add/addition",
    });
    expect(() => parseAssayRef("EXPAND/pad-value/extra")).toThrow(/assay ref/);
    expect(() => parseAssayRef("EXPAND/Pad Value")).toThrow(/name/);
    expect(() => parseAssayRef("bad ref/pad-value")).toThrow(/subjectRef/);
  });

  it("derives categories", () => {
    expect(deriveCategory({ subject: "SUM", expect: 6 })).toBe("value");
    expect(deriveCategory({ subject: "IFERROR", expect: { error: "#N/A" } })).toBe("error-code");
    expect(deriveCategory({ subject: "FILTER", expect: { shape: [2, 3] } })).toBe("shape");
    expect(deriveCategory({ subject: "RAND", expect: { ge: 0, lt: 1 } })).toBe("volatile");
  });

  it("computes semantic hashes independent of names and feature order", () => {
    const a = semanticHashForCase({
      subject: "EXPAND",
      name: "pad-value",
      formula: "=EXPAND({1,2}, 2, 3, 0)",
      expect: [
        [1, 2, 0],
        [0, 0, 0],
      ],
      features: ["dynamic-arrays", "broadcasting"],
    });
    const b = semanticHashForCase({
      subject: "EXPAND",
      name: "renamed-pad-value",
      formula: "=EXPAND({1,2}, 2, 3, 0)",
      expect: [
        [1, 2, 0],
        [0, 0, 0],
      ],
      features: ["broadcasting", "dynamic-arrays"],
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("uses semantic hash as v3 case key", () => {
    const test = {
      id: "EXPAND/pad-value",
      subject: "EXPAND",
      subjectRef: "EXPAND",
      name: "pad-value",
      category: "value",
      formula: "=EXPAND({1,2}, 2, 3, 0)",
      expect: [
        [1, 2, 0],
        [0, 0, 0],
      ],
      semanticHash: "sha256:abc123",
    };
    expect(caseKey(test)).toBe("sha256:abc123");
  });

  it("orders canonical JSON object keys by code unit", () => {
    expect(canonicalJson({ _: 1, "-": 2, Z: 3 })).toBe('{"-":2,"Z":3,"_":1}');
  });

  it("rejects non-JSON values that would collide in canonical JSON", () => {
    expect(() => canonicalJson([undefined])).toThrow(/undefined/);
    expect(() => canonicalJson(Number.NaN)).toThrow(/non-finite/);
    expect(() => canonicalJson(Infinity)).toThrow(/non-finite/);
    expect(() => canonicalJson(new Map())).toThrow(/non-plain object/);
    expect(() => canonicalJson(new Date("2026-05-10T00:00:00.000Z"))).toThrow(
      /non-plain object/,
    );
    expect(() => canonicalJson(/EXPAND/)).toThrow(/non-plain object/);
  });
});
