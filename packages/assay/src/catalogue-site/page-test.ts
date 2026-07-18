// data shaping for the per-test detail page

import type { CellValue } from "../format/values.js";
import { normalizeToGrid } from "../format/parse.js";
import { testIdTail, type DvEntry, type TestInfo } from "./load.js";
import { buildEngineCells, formatValueCompact } from "./format.js";
import { renderPage } from "./templates.js";
import { subjectHref } from "./subjects.js";

const INDEX_HREF = "../../..";

export function renderTestDetail(
  test: TestInfo,
  fixtures: Map<string, unknown>,
  owningDvs: DvEntry[],
): string {
  const canonicalGrid = normalizeToGrid(test.expect as CellValue | CellValue[] | CellValue[][]);
  const cells = buildEngineCells(test, fixtures, canonicalGrid);
  const subject = { name: test.subject, href: subjectHref(test.subject, INDEX_HREF) };
  const idTail = test.name ?? testIdTail(test.ref, test.suite);
  const suiteHref = `../../suite/${test.suite}/`;

  return renderPage(
    "test",
    { title: `${test.ref} — ${test.subject}`, relPath: INDEX_HREF },
    {
      test,
      idTail,
      suiteHref,
      subject,
      canonical: formatValueCompact(canonicalGrid),
      cells,
      owningDvs,
    },
  );
}
