import { colLetter } from "../src/api.js";
import type { CellSnap, ExtendedValue, Snapshot } from "../src/snapshot.js";

// per-cell verdicts, most severe first
export type CellVerdict =
  | "value-mismatch" // computed values differ materially
  | "error-mismatch" // both errored, different error type
  | "presence-mismatch" // computed value on one side only
  | "render-mismatch" // same computed value, different rendered string
  | "float-drift" // numbers differ within 1e-9 relative — noteworthy, not damning
  | "volatile" // formula is time/random-dependent; diff is informational
  | "match";

export interface CellDiff {
  sheet: string;
  a1: string;
  verdict: CellVerdict;
  formula?: string;
  original: { ev?: ExtendedValue; fv?: string };
  rehydrated: { ev?: ExtendedValue; fv?: string };
}

export interface DiffReport {
  counts: Record<CellVerdict, number>;
  cellsCompared: number;
  missingSheets: string[];
  diffs: CellDiff[]; // everything except matches
}

const VOLATILE = /\b(NOW|TODAY|RAND|RANDBETWEEN|RANDARRAY)\s*\(/i;

export function diffSnapshots(original: Snapshot, rehydrated: Snapshot): DiffReport {
  const report: DiffReport = {
    counts: {
      "value-mismatch": 0,
      "error-mismatch": 0,
      "presence-mismatch": 0,
      "render-mismatch": 0,
      "float-drift": 0,
      volatile: 0,
      match: 0,
    },
    cellsCompared: 0,
    missingSheets: [],
    diffs: [],
  };

  const rehydratedByTitle = new Map(rehydrated.sheets.map((s) => [s.title, s]));

  for (const sheet of original.sheets) {
    const other = rehydratedByTitle.get(sheet.title);
    if (!other) {
      report.missingSheets.push(sheet.title);
      continue;
    }
    const rows = Math.max(sheet.cells.length, other.cells.length);
    for (let r = 0; r < rows; r++) {
      const cols = Math.max(sheet.cells[r]?.length ?? 0, other.cells[r]?.length ?? 0);
      for (let c = 0; c < cols; c++) {
        const a = sheet.cells[r]?.[c] ?? null;
        const b = other.cells[r]?.[c] ?? null;
        if (!a && !b) continue;
        report.cellsCompared++;
        const verdict = compareCell(a, b);
        report.counts[verdict]++;
        if (verdict !== "match") {
          report.diffs.push({
            sheet: sheet.title,
            a1: `${colLetter(c)}${r + 1}`,
            verdict,
            formula: a?.ue?.formulaValue,
            original: { ev: a?.ev, fv: a?.fv },
            rehydrated: { ev: b?.ev, fv: b?.fv },
          });
        }
      }
    }
  }

  const severity: Record<CellVerdict, number> = {
    "value-mismatch": 0,
    "error-mismatch": 1,
    "presence-mismatch": 2,
    "render-mismatch": 3,
    "float-drift": 4,
    volatile: 5,
    match: 6,
  };
  report.diffs.sort((x, y) => severity[x.verdict] - severity[y.verdict]);
  return report;
}

function compareCell(a: CellSnap | null, b: CellSnap | null): CellVerdict {
  if (a?.ue?.formulaValue && VOLATILE.test(a.ue.formulaValue)) return "volatile";

  const evVerdict = compareEffective(a?.ev, b?.ev);
  if (evVerdict !== "match") return evVerdict;
  if ((a?.fv ?? "") !== (b?.fv ?? "")) return "render-mismatch";
  return "match";
}

function compareEffective(a?: ExtendedValue, b?: ExtendedValue): CellVerdict {
  if (!a && !b) return "match";
  if (!a || !b) return "presence-mismatch";
  if (a.errorValue || b.errorValue) {
    if (!a.errorValue || !b.errorValue) return "value-mismatch";
    return a.errorValue.type === b.errorValue.type ? "match" : "error-mismatch";
  }
  if (a.numberValue !== undefined && b.numberValue !== undefined) {
    if (Object.is(a.numberValue, b.numberValue)) return "match";
    const scale = Math.max(Math.abs(a.numberValue), Math.abs(b.numberValue), 1);
    return Math.abs(a.numberValue - b.numberValue) / scale < 1e-9
      ? "float-drift"
      : "value-mismatch";
  }
  if (a.stringValue !== undefined || b.stringValue !== undefined) {
    return a.stringValue === b.stringValue ? "match" : "value-mismatch";
  }
  if (a.boolValue !== undefined || b.boolValue !== undefined) {
    return a.boolValue === b.boolValue ? "match" : "value-mismatch";
  }
  return "match";
}
