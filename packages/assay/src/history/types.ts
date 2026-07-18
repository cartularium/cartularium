// on-disk row schemas for history/. design notes in internal/roadmap.md

import type { Platform } from "../format/values.js";
import type { Cause } from "../format/catalogue.js";

export interface RunRow {
  // iso-8601 utc + short hash suffix to disambiguate same-second runs
  run_id: string;
  trigger: "cron" | "manual" | "pr";
  // null on engines we can't probe (e.g. gsheets until sentinels ship)
  engine_versions: Partial<Record<Platform, string | null>>;
  // points at history/capabilities-snapshots/<hash>.json
  capabilities_hash: string;
  test_count: number;
  dv_count: number;
  fixture_change_count: number;
  note?: string;
}

export interface DvEventRow {
  run_id: string;
  ts: string;
  dv_id: string;
  event: "seeded" | "confirmed" | "grown" | "shrunk" | "vanished" | "reseeded";
  test_count: number;
  // signed: + grown, − shrunk, 0 confirmed/seeded
  delta: number;
  fingerprint: string;
}

// from_*: null on baseline (first observation); to_*: null on removal
export interface FixtureChangeRow {
  run_id: string;
  ts: string;
  test_id: string;
  engine: Platform;
  from_hash: string | null;
  to_hash: string | null;
  from_value: unknown;
  to_value: unknown;
}

export type { Cause };
