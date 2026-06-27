// emit the one-time D1 seed for the fork-annotation store (CP3 increment #3, 3c)
//
// Reads the in-repo divergence YAML (loadDvs) and writes idempotent UPSERT SQL that a MAINTAINER
// applies to edit-shell's ASSAY_PREVIEW_DB:
//   node build/cli.js seed-fork-annotations --output build/seed-fork-annotations.sql
//   wrangler d1 execute cartularium-assay-preview --local|--remote --file=build/seed-fork-annotations.sql
// One published, auto-seeded row per DV. See annotation-store-design-2026-06-20.md §5. The mapping
// + SQL live in ../catalogue-site/fork-annotation-seed.ts (pure, tested); this is thin CLI glue.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { loadDvs } from "../catalogue-site/load.js";
import { dvsToSeedRows, buildSeedSql } from "../catalogue-site/fork-annotation-seed.js";
import { values } from "./shared.js";

export function seedForkAnnotations(): void {
  const catalogueDir = (values["catalogue-dir"] as string | undefined) ?? "divergences";
  const output = values["output"] as string | undefined;
  const now = (values["now"] as string | undefined) ?? new Date().toISOString();

  try {
    const dvs = loadDvs(catalogueDir);
    const { rows, warnings } = dvsToSeedRows(dvs, now);
    for (const w of warnings) console.error(`seed-fork-annotations: ${w}`);
    const sql = buildSeedSql(rows);

    if (output) {
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, sql);
      console.error(`seed-fork-annotations: wrote ${rows.length} rows to ${output}`);
    } else {
      process.stdout.write(sql);
    }
  } catch (e) {
    console.error(`seed-fork-annotations: ${(e as Error).message}`);
    process.exit(1);
  }
}
