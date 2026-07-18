// data shaping for the catalogue index page

import type { DvEntry } from "./load.js";
import { renderPage } from "./templates.js";

export function renderIndex(dvs: DvEntry[]): string {
  const totalTests = dvs.reduce((s, d) => s + d.testCount, 0);
  const causeCounts: Record<string, number> = {};
  const engineCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  for (const d of dvs) {
    causeCounts[d.cause] = (causeCounts[d.cause] ?? 0) + 1;
    categoryCounts[d.category] = (categoryCounts[d.category] ?? 0) + 1;
    for (const e of d.engines) engineCounts[e] = (engineCounts[e] ?? 0) + 1;
  }

  const dvsForTemplate = dvs.map((d) => ({
    ...d,
    searchBlob: [d.id, d.summary, d.cause, d.category, ...d.engines, ...d.subjects]
      .join(" ")
      .toLowerCase(),
  }));

  return renderPage(
    "index",
    { title: "Fork catalogue — assay", relPath: ".", current: "index" },
    {
      dvs: dvsForTemplate,
      dvCount: dvs.length,
      totalTests,
      seeded: dvs[0]?.seeded ?? "—",
      engineOptions: Object.keys(engineCounts).sort(),
      causeOptions: Object.keys(causeCounts).sort(),
      categoryOptions: Object.keys(categoryCounts).sort(),
      engineCounts,
      causeCounts,
      categoryCounts,
    },
  );
}
