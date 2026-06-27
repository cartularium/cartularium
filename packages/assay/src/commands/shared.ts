// parseArgs config + helpers shared across commands
// every option for every command lives in one parseArgs block; modules read what they need

import { parseArgs } from "node:util";
import { existsSync, globSync } from "node:fs";
import { createDriver } from "@cartularium/drivers";
import type { Driver } from "@cartularium/drivers";
import { isPlatform } from "../format/values.js";
import { getAccessToken } from "../auth.js";

const parsed = parseArgs({
  allowPositionals: true,
  options: {
    platform: { type: "string", short: "p", default: "gsheets,excel,lattice,ironcalc,hyperformula" },
    "spreadsheet-id": { type: "string", short: "s" },
    json: { type: "boolean", default: false },
    tags: { type: "string" },
    missing: { type: "boolean", default: false },
    verbose: { type: "boolean", short: "v", default: false },
    quiet: { type: "boolean", short: "q", default: false },
    "allow-missing": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
    // benchmark
    authority: { type: "string", default: "gsheets,excel" },
    target: { type: "string" },
    consensus: { type: "string" },
    "loose-errors": { type: "boolean", default: false },
    "dump-consensus": { type: "string" },
    "by-function": { type: "boolean", default: false },
    "rollup-csv": { type: "string" },
    "exclusions-csv": { type: "string" },
    // scaffold
    category: { type: "string" },
    "ref-dir": { type: "string" },
    uncovered: { type: "boolean", default: false },
    // check
    mode: { type: "string" },
    accept: { type: "boolean", default: false },
    // matrix
    view: { type: "string" },
    limit: { type: "string" },
    "seed-catalogue": { type: "string" },
    force: { type: "boolean", default: false },
    // catalogue
    build: { type: "string" },
    "catalogue-dir": { type: "string" },
    "tests-dir": { type: "string" },
    serve: { type: "boolean", default: false },
    port: { type: "string" },
    // manifest
    output: { type: "string" },
    // seed-fork-annotations
    now: { type: "string" },
    // annotation-coverage
    annotations: { type: "string" },
    // history
    record: { type: "boolean", default: false },
    inspect: { type: "string" },
    since: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    "skip-versions": { type: "boolean", default: false },
    trigger: { type: "string" },
    note: { type: "string" },
    "history-dir": { type: "string" },
    // preview-worker
    "base-url": { type: "string" },
    token: { type: "string" },
    "runner-id": { type: "string" },
    "poll-ms": { type: "string" },
    "timeout-ms": { type: "string" },
    "work-dir": { type: "string" },
    once: { type: "boolean", default: false },
  },
});

export const values = parsed.values;
export const positionals = parsed.positionals;

// no positionals → glob tests/*.yaml; otherwise resolve each positional, expanding globs
export function resolveFiles(args: string[]): string[] {
  if (args.length === 0) return globSync("tests/*.yaml").sort();
  const out: string[] = [];
  for (const p of args) {
    if (p.includes("*") || p.includes("?")) out.push(...globSync(p));
    else if (existsSync(p)) out.push(p);
    else out.push(p); // pass through; loader gives the better error
  }
  return out.sort();
}

export function parsePlatforms(): string[] {
  return (values.platform as string).split(",").map((s) => s.trim());
}

export function parseTags(): string[] | undefined {
  return values.tags
    ? (values.tags as string).split(",").map((s) => s.trim())
    : undefined;
}

// CLI glue: build each platform's createDriver config from flags + `assay login`,
// then construct + init. The construction asymmetry (which platform needs what) lives
// in createDriver (the type); this layer only sources the config values + inits.
export async function buildDrivers(platforms: string[], workbookPath?: string): Promise<Driver[]> {
  const drivers: Driver[] = [];
  for (const platform of platforms) {
    if (!isPlatform(platform)) {
      console.error(`Unknown platform: ${platform}`);
      process.exit(1);
    }
    if (platform === "gsheets") {
      const DEFAULT_SPREADSHEET_ID = "1QCumjdFqQO8SYnXhKwI2AJevhnb_JsXqjMTLCoPnOmo";
      const spreadsheetId =
        (values["spreadsheet-id"] as string) ||
        process.env.ASSAY_SPREADSHEET_ID ||
        DEFAULT_SPREADSHEET_ID;
      const token = await getAccessToken();
      if (!token) {
        console.error("Not authenticated. Run: assay login");
        process.exit(1);
      }
      drivers.push(createDriver("gsheets", { spreadsheetId, accessToken: token }));
    } else if (platform === "excel") {
      drivers.push(createDriver("excel", { verbose: values.verbose as boolean, workbookPath: workbookPath ?? null }));
    } else {
      drivers.push(createDriver(platform));
    }
  }
  for (const driver of drivers) await driver.init();
  return drivers;
}

// merge per-suite `requires:` blocks into a single record; returns null if none have any
export function mergeRequires(
  suites: Array<{ dir: string; requires?: Record<string, string> }>,
): { requires: Record<string, string>; baseDir: string } | null {
  const merged: Record<string, string> = {};
  let baseDir = ".";
  let found = false;
  for (const s of suites) {
    if (!s.requires) continue;
    found = true;
    baseDir = s.dir;
    for (const [name, source] of Object.entries(s.requires)) merged[name] = source;
  }
  return found ? { requires: merged, baseDir } : null;
}

export interface SuiteTally {
  ok: number;
  driverIssue: number;
  skipped: number;
  total: number;
  ms: number;
}

export function printPlatformSummary(platform: string, perSuite: Record<string, SuiteTally>): void {
  const suites = Object.entries(perSuite);
  if (suites.length === 0) return;
  const totals = suites.reduce(
    (acc, [, s]) => ({
      ok: acc.ok + s.ok,
      driverIssue: acc.driverIssue + s.driverIssue,
      skipped: acc.skipped + s.skipped,
      total: acc.total + s.total,
      ms: acc.ms + s.ms,
    }),
    { ok: 0, driverIssue: 0, skipped: 0, total: 0, ms: 0 },
  );
  const dMsg = totals.driverIssue > 0 ? `  ${totals.driverIssue} drv-issue` : "";
  const sMsg = totals.skipped > 0 ? `  ${totals.skipped} skip` : "";
  const secs = (totals.ms / 1000).toFixed(1);
  console.log(`  ${platform.padEnd(12)} ${totals.ok}/${totals.total} ok${dMsg}${sMsg}   ${secs}s`);
}

export function progress(msg: string): void {
  if (!process.stdout.isTTY) return;
  process.stdout.write("\r" + msg.padEnd(process.stdout.columns || 80).slice(0, (process.stdout.columns || 80) - 1));
}

export function clearProgress(): void {
  if (!process.stdout.isTTY) return;
  process.stdout.write("\r" + " ".repeat((process.stdout.columns || 80) - 1) + "\r");
}
