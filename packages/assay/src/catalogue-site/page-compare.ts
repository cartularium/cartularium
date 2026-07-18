// data shaping for the engine-comparison page

import { ALL_PLATFORMS } from "../format/values.js";
import { COMPARE_PRESETS } from "./presets.js";
import type { DvEntry, TestInfo } from "./load.js";
import { renderPage } from "./templates.js";

export function renderCompare(
  testIndex: Map<string, TestInfo>,
  fixtureIndex: Map<string, Map<string, unknown>>,
  testToDvs: Map<string, DvEntry[]>,
): string {
  const corpus = {
    engines: ALL_PLATFORMS,
    tests: [] as Array<{
      id: string;
      subject: string;
      formula: string;
      suite: string;
      expect: unknown;
      vals: Record<string, unknown>;
      causes: Record<string, string>;
      dvs: string[];
    }>,
  };
  for (const [tid, t] of testIndex) {
    const fx = fixtureIndex.get(tid);
    const vals: Record<string, unknown> = {};
    for (const eng of ALL_PLATFORMS) {
      const v = fx?.get(eng);
      if (v !== undefined) vals[eng] = v;
    }
    if (Object.keys(vals).length === 0) continue;
    const causes: Record<string, string> = {};
    for (const [eng, ov] of Object.entries(t.overrides)) causes[eng] = ov.cause;
    corpus.tests.push({
      id: tid,
      subject: t.subject,
      formula: t.formula,
      suite: t.suite,
      expect: t.expect,
      vals,
      causes,
      dvs: (testToDvs.get(tid) ?? []).map((d) => d.id),
    });
  }
  corpus.tests.sort((a, b) => a.id.localeCompare(b.id));

  // stop literal `</script>` in fixture data from closing the embed early
  const corpusJson = JSON.stringify(corpus).replace(/<\/script/gi, "<\\/script");

  return renderPage(
    "compare",
    { title: "Engine comparison", relPath: "..", current: "compare", scripts: ["assets/compare.js"] },
    { allEngines: ALL_PLATFORMS, presets: COMPARE_PRESETS, corpusJson },
  );
}
