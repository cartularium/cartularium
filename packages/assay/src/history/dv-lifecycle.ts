// diff current clusters vs existing DV-####.yaml entries → events + auto-seed

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as YAML from "yaml";
import type { ForkCluster } from "../fork-matrix.js";
import { clusterKey } from "../divergences/cluster.js";
import type { Platform } from "../format/values.js";
import type { Cause } from "../format/catalogue.js";
import type { DvEventRow } from "./types.js";

interface DvFile {
  id: string;
  cause: Cause;
  engines: Platform[];
  behavior: { signature: string };
  "test-count": number;
  status?: "vanished";
  "vanished-at"?: string;
  [k: string]: unknown;
}

// events here lack run_id + ts (the orchestrator stamps those); otherwise
// shape matches dv_events.jsonl rows exactly
export type DvEventDraft = Omit<DvEventRow, "run_id" | "ts">;

export interface DvDelta {
  events: DvEventDraft[];
  seedActions: Array<{ dv_id: string; cluster: ForkCluster; path: string }>;
  statusActions: Array<{ dv_id: string; path: string; kind: "vanish" | "resurrect" }>;
}

// reads divergences/DV-*.yaml and computes the delta. caller is responsible
// for applying seedActions (writing yaml files) under the same lock that
// guards history writes
export function diffClusters(
  clusters: ForkCluster[],
  divergencesDir: string,
): DvDelta {
  const existing = loadExistingDvs(divergencesDir);
  const byKey = new Map<string, DvFile>();
  const pathById = new Map<string, string>();
  for (const dv of existing) {
    byKey.set(clusterKey({ cause: dv.cause, engines: dv.engines, signature: dv.behavior.signature }), dv);
    pathById.set(dv.id, join(divergencesDir, `${dv.id}.yaml`));
  }

  const events: DvDelta["events"] = [];
  const seedActions: DvDelta["seedActions"] = [];
  const statusActions: DvDelta["statusActions"] = [];
  const matched = new Set<string>();

  const idWidth = Math.max(4, ...existing.map((d) => d.id.replace(/^DV-/, "").length));
  let nextNum = existing.length === 0 ? 1 : Math.max(...existing.map((d) => parseInt(d.id.replace(/^DV-/, ""), 10))) + 1;

  for (const c of clusters) {
    const key = clusterKey({ cause: c.cause, engines: c.engines, signature: c.behaviorSignature });
    const dv = byKey.get(key);
    if (!dv) {
      const newId = `DV-${String(nextNum++).padStart(idWidth, "0")}`;
      seedActions.push({ dv_id: newId, cluster: c, path: join(divergencesDir, `${newId}.yaml`) });
      events.push({ dv_id: newId, event: "seeded", test_count: c.testCount, delta: 0, fingerprint: key });
      continue;
    }
    matched.add(dv.id);
    // resurrect: a previously-vanished DV is matching again — strip status fields
    if (dv.status === "vanished") {
      statusActions.push({ dv_id: dv.id, path: pathById.get(dv.id)!, kind: "resurrect" });
    }
    const prev = dv["test-count"];
    if (c.testCount === prev) {
      events.push({ dv_id: dv.id, event: "confirmed", test_count: c.testCount, delta: 0, fingerprint: key });
    } else if (c.testCount > prev) {
      events.push({ dv_id: dv.id, event: "grown", test_count: c.testCount, delta: c.testCount - prev, fingerprint: key });
    } else {
      events.push({ dv_id: dv.id, event: "shrunk", test_count: c.testCount, delta: c.testCount - prev, fingerprint: key });
    }
  }

  for (const dv of existing) {
    if (matched.has(dv.id)) continue;
    const key = clusterKey({ cause: dv.cause, engines: dv.engines, signature: dv.behavior.signature });
    events.push({ dv_id: dv.id, event: "vanished", test_count: 0, delta: -dv["test-count"], fingerprint: key });
    // only emit a status writeback if the YAML doesn't already say vanished
    if (dv.status !== "vanished") {
      statusActions.push({ dv_id: dv.id, path: pathById.get(dv.id)!, kind: "vanish" });
    }
  }

  return { events, seedActions, statusActions };
}

// round-trip the YAML to add or strip status fields without touching anything else
export function applyStatusActions(actions: DvDelta["statusActions"], today: string): void {
  for (const a of actions) {
    const doc = YAML.parseDocument(readFileSync(a.path, "utf8"));
    if (a.kind === "vanish") {
      doc.set("status", "vanished");
      doc.set("vanished-at", today);
    } else {
      doc.delete("status");
      doc.delete("vanished-at");
    }
    writeFileSync(a.path, doc.toString());
  }
}

export function applySeedActions(
  actions: DvDelta["seedActions"],
  today: string,
): void {
  for (const a of actions) {
    const c = a.cluster;
    const entry = {
      id: a.dv_id,
      summary: `TODO auto-seeded — ${c.engines.join(", ")} (${c.cause}) — ${c.subjects.slice(0, 3).join(", ")}${c.subjects.length > 3 ? `, +${c.subjects.length - 3} more` : ""}`,
      cause: c.cause,
      category: c.category,
      engines: c.engines,
      behavior: { signature: c.behaviorSignature },
      "test-count": c.testCount,
      subjects: c.subjects,
      tests: c.testIds,
      seeded: today,
      "last-confirmed": today,
    };
    writeFileSync(a.path, YAML.stringify(entry));
  }
}

function loadExistingDvs(dir: string): DvFile[] {
  if (!existsSync(dir)) return [];
  const out: DvFile[] = [];
  for (const f of readdirSync(dir)) {
    if (!/^DV-\d+\.yaml$/.test(f)) continue;
    const data = YAML.parse(readFileSync(join(dir, f), "utf8")) as DvFile;
    out.push(data);
  }
  return out;
}
