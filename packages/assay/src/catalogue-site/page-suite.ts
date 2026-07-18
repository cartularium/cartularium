// data shaping for the per-suite index page (test/suite/<suite>/index.html)

import { testIdTail, type DvEntry, type TestInfo } from "./load.js";
import { renderPage } from "./templates.js";
import { subjectHref } from "./subjects.js";

const INDEX_HREF = "../../..";

export interface SuiteRow {
  id: string;
  idTail: string;
  href: string;
  subject: string;
  subjectHref: string;
  formula: string;
  category: string;
  divergenceCount: number;
}

export function renderSuiteIndex(
  suite: string,
  tests: TestInfo[],
  testToDvs: Map<string, DvEntry[]>,
): string {
  const rows: SuiteRow[] = tests.map((t) => ({
    id: t.ref,
    idTail: t.name ?? testIdTail(t.ref, suite),
    href: `../../${t.ref}/`,
    subject: t.subject,
    subjectHref: subjectHref(t.subject, INDEX_HREF),
    formula: t.formula,
    category: t.category,
    divergenceCount: (testToDvs.get(t.id) ?? []).length,
  }));
  const divergent = rows.filter((r) => r.divergenceCount > 0).length;

  return renderPage(
    "suite",
    { title: `${suite} — assay`, relPath: INDEX_HREF },
    {
      suite,
      rows,
      total: rows.length,
      divergent,
    },
  );
}
