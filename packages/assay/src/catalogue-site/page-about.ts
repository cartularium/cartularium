// data shaping for the about page (mostly static prose)

import type { DvEntry } from "./load.js";
import { renderPage } from "./templates.js";

export function renderAbout(dvs: DvEntry[], testCount: number): string {
  const totalTests = dvs.reduce((s, d) => s + d.testCount, 0);
  return renderPage(
    "about",
    { title: "About — assay catalogue", relPath: "..", current: "about", scripts: [] },
    {
      dvCount: dvs.length,
      testCount,
      totalTests,
      seeded: dvs[0]?.seeded ?? "—",
    },
  );
}
