// per-engine cell construction + compact value formatting used by the dv + test
// detail pages. classifyEngineResult lives in format/ since it's pure data-layer
// logic (also consumed by the manifest builder).

import { ALL_PLATFORMS, type GridValue, type Platform } from "../format/values.js";
import { classifyEngineResult, type Verdict } from "../format/classify.js";
import type { TestInfo } from "./load.js";

export { classifyEngineResult, type Verdict };

export interface EngineCell {
  engine: Platform;
  verdict: Verdict["kind"];
  inCluster: boolean;
  value: string;
  title: string;
}

export function buildEngineCells(
  test: TestInfo,
  fixtures: Map<string, unknown> | undefined,
  canonicalGrid: GridValue,
  clusterEngines?: Set<string>,
): EngineCell[] {
  return ALL_PLATFORMS.map((engine) => {
    const fx = fixtures?.get(engine);
    const verdict = classifyEngineResult(engine, fx, canonicalGrid, test.overrides[engine]);
    const titleParts: string[] = [`${engine}: ${verdict.label}`];
    if (verdict.kind !== "no-data") titleParts.push(JSON.stringify(fx));
    if (test.overrides[engine]) titleParts.push(`override.cause=${test.overrides[engine].cause}`);
    return {
      engine,
      verdict: verdict.kind,
      inCluster: clusterEngines?.has(engine) ?? false,
      value: fx === undefined ? "—" : formatValueCompact(fx),
      title: titleParts.join(" — "),
    };
  });
}

// uses excel array-literal syntax: `{a, b, c}` row, `{a; b; c}` column,
// `{a, b; c, d}` 2D. orientation visible. larger grids collapse to `[M×N]`
// (square brackets mark a meta-summary, not a value).
export function formatValueCompact(v: unknown): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "object" && !Array.isArray(v) && "error" in (v as Record<string, unknown>)) {
    return String((v as { error: string }).error);
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return "{}";
    if (Array.isArray(v[0])) {
      const grid = v as unknown[][];
      if (grid.length === 1 && grid[0].length === 1) return formatValueCompact(grid[0][0]);
      const rows = grid.length, cols = grid[0]?.length ?? 0;
      if (rows * cols <= 4) {
        const body = grid.map((row) => row.map(formatValueCompact).join(", ")).join("; ");
        return `{${body}}`;
      }
      return `[${rows}×${cols}]`;
    }
    return v.length <= 4 ? `{${(v as unknown[]).map(formatValueCompact).join(", ")}}` : `[${v.length}]`;
  }
  if (typeof v === "string") return v.length > 24 ? v.slice(0, 22) + "…" : v;
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return String(v);
    if (Math.abs(v) < 1e-4 && v !== 0) return v.toExponential(3);
    if (Number.isInteger(v) && Math.abs(v) < 1e7) return String(v);
    const s = String(v);
    return s.length > 12 ? v.toPrecision(6) : s;
  }
  return String(v);
}
