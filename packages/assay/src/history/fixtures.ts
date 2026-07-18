// flat snapshot of every fixture entry, keyed via cellKey

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { FixtureEntry, FixtureFile } from "../fixtures.js";
import { ALL_PLATFORMS } from "../format/values.js";
import type { Platform } from "../format/values.js";
import { cellKey } from "./replay.js";

export interface FixtureSnapshot {
  cells: Map<string, FixtureEntry>;
  fileCount: number;
}

export function snapshotFixtures(fixturesDir: string): FixtureSnapshot {
  const cells = new Map<string, FixtureEntry>();
  let fileCount = 0;
  if (!existsSync(fixturesDir)) return { cells, fileCount };

  const allowed = new Set<Platform>(ALL_PLATFORMS);
  for (const suite of readdirSync(fixturesDir)) {
    const suitePath = join(fixturesDir, suite);
    let entries: string[];
    try { entries = readdirSync(suitePath); } catch { continue; }
    for (const f of entries) {
      if (!f.endsWith(".json")) continue;
      const engine = f.replace(/\.json$/, "") as Platform;
      if (!allowed.has(engine)) continue;
      let fx: FixtureFile;
      try {
        fx = JSON.parse(readFileSync(join(suitePath, f), "utf8")) as FixtureFile;
      } catch { continue; }
      fileCount++;
      for (const [tid, entry] of Object.entries(fx.results ?? {})) {
        cells.set(cellKey(tid, engine), entry);
      }
    }
  }
  return { cells, fileCount };
}
