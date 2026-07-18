// latest row per (test_id|engine) wins; to_hash=null = cell removed

import type { Platform } from "../format/values.js";
import type { FixtureChangeRow } from "./types.js";
import { readJsonl } from "./io.js";

export interface FixtureCell {
  hash: string;
  value: unknown;
}

// canonical key format for fixture-state Maps. lives here so writers
// (record.ts) and readers stay in sync. test_ids never contain '|'
export function cellKey(test_id: string, engine: Platform): string {
  return `${test_id}|${engine}`;
}

export function parseCellKey(key: string): { test_id: string; engine: Platform } {
  const sep = key.indexOf("|");
  return { test_id: key.slice(0, sep), engine: key.slice(sep + 1) as Platform };
}

export function replayFixtureChanges(
  path: string,
  upToRunId?: string,
): Map<string, FixtureCell> {
  return replayRows(readJsonl<FixtureChangeRow>(path), upToRunId);
}

// rows assumed in chronological order (append-only contract)
export function replayRows(
  rows: FixtureChangeRow[],
  upToRunId?: string,
): Map<string, FixtureCell> {
  const state = new Map<string, FixtureCell>();
  for (const row of rows) {
    if (upToRunId !== undefined && row.run_id > upToRunId) break;
    const key = cellKey(row.test_id, row.engine);
    if (row.to_hash === null) {
      state.delete(key);
    } else {
      state.set(key, { hash: row.to_hash, value: row.to_value });
    }
  }
  return state;
}
