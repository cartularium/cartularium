// data shaping for the per-dv detail page

import { ALL_PLATFORMS, type CellValue } from "../format/values.js";
import { normalizeToGrid } from "../format/parse.js";
import type { DvEntry, TestInfo } from "./load.js";
import { buildEngineCells, formatValueCompact } from "./format.js";
import { renderPage } from "./templates.js";
import { subjectHref } from "./subjects.js";

const INDEX_HREF = "../..";

export function renderDvDetail(
  dv: DvEntry,
  testIndex: Map<string, TestInfo>,
  fixtureIndex: Map<string, Map<string, unknown>>,
): string {
  const clusterEngines = new Set(dv.engines);

  const testRows = dv.tests.map((tid) => {
    const t = testIndex.get(tid);
    if (!t) return { id: tid, missing: true };

    const canonicalGrid = normalizeToGrid(t.expect as CellValue | CellValue[] | CellValue[][]);
    return {
      id: t.id,
      missing: false,
      formula: t.formula,
      canonical: formatValueCompact(canonicalGrid),
      cells: buildEngineCells(t, fixtureIndex.get(tid), canonicalGrid, clusterEngines),
    };
  });

  const subjects = dv.subjects.map((name) => ({ name, href: subjectHref(name, INDEX_HREF) }));

  return renderPage(
    "dv",
    { title: `${dv.id} — ${dv.summary}`, relPath: INDEX_HREF },
    { dv, allEngines: ALL_PLATFORMS, clusterEngines, testRows, subjects },
  );
}
