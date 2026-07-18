// data shaping for the agreement-over-time page. (target, refs) selection
// mirrors compare so muscle memory carries between pages

import { ALL_PLATFORMS } from "../format/values.js";
import type { AgreementHistory } from "../history/agreement.js";
import { COMPARE_PRESETS } from "./presets.js";
import { renderPage } from "./templates.js";

export function renderHistory(ah: AgreementHistory): string {
  // data is fetched, not inlined — keeps the page small as runs accumulate
  return renderPage(
    "history",
    { title: "Agreement over time — assay", relPath: "..", current: "history", scripts: ["assets/history.js"] },
    {
      runCount: ah.runs.length,
      allEngines: ALL_PLATFORMS,
      presets: COMPARE_PRESETS,
    },
  );
}
