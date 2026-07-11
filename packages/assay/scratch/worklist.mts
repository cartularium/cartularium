// generate the deep-dive work-list: uncovered forks per suite, with partition detail
import { writeFileSync, mkdirSync } from "node:fs";
import { computeForkCoverage } from "@cartularium/contracts";
import type { AssayForkAnnotationV1 } from "@cartularium/contracts";
import { buildManifestV5 } from "../src/manifest/build-v5.js";
import { loadDvs, loadFixtureOutcomes, loadTests } from "../src/catalogue-site/load.js";
import { dvsToSeedRows } from "../src/catalogue-site/fork-annotation-seed.js";

const now = new Date().toISOString();
const dvs = loadDvs("divergences");
const tests = loadTests("tests");
const outcomes = loadFixtureOutcomes("fixtures", tests);
const manifest = buildManifestV5({ dvs, tests, outcomes, generatedAt: now });

const { rows } = dvsToSeedRows(dvs, now);
const annotations: AssayForkAnnotationV1[] = rows.map((r: any) => ({
  id: r.id,
  author_id: r.author_id,
  content: r.content,
  cause: r.cause ?? undefined,
  scope: JSON.parse(r.scope_json),
  status: r.status,
  verified_by: null,
  verified_at: null,
  created_at: now,
  updated_at: now,
}));

const report = computeForkCoverage(manifest, annotations);
const testByRef = new Map([...tests.values()].map((t) => [t.ref, t]));

type Item = {
  ref: string;
  suite: string;
  subject: string;
  name: string;
  formula: string;
  tags?: string[];
  partition: { engines: string[]; values: unknown[] }[];
};

const bySuite = new Map<string, Item[]>();
for (const ref of report.uncoveredForks) {
  const entry = manifest.tests[ref];
  if (!entry) continue;
  const t = testByRef.get(ref);
  const item: Item = {
    ref,
    suite: entry.suite,
    subject: entry.subject,
    name: entry.name,
    formula: t?.formula ?? "",
    tags: entry.tags,
    partition: entry.partition.map((c) => ({ engines: c.engines, values: c.values })),
  };
  const list = bySuite.get(entry.suite) ?? [];
  list.push(item);
  bySuite.set(entry.suite, list);
}

mkdirSync("scratch/worklist", { recursive: true });
const summary: Record<string, number> = {};
for (const [suite, items] of [...bySuite.entries()].sort()) {
  summary[suite] = items.length;
  writeFileSync(`scratch/worklist/${suite}.json`, JSON.stringify(items, null, 1));
}
writeFileSync("scratch/worklist/_summary.json", JSON.stringify({ totals: report.totals, bySuite: summary }, null, 2));
console.log(JSON.stringify({ totals: report.totals, bySuite: summary }, null, 2));
