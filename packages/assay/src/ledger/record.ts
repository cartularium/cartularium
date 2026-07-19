// `assay generate --record` support: preflight, declared conditions, and
// run assembly (approved design §3; the recorded pipeline of the charter's
// evidence commitments). Because ledger rows are order-insensitive, the run
// row is appended AFTER the sweeps complete, carrying the real observation
// windows — rows stay immutable, nothing is patched.

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Platform } from "../format/values.js";
import type { EngineRunInfo } from "./types.js";
import { snapshotCapabilities } from "./io.js";

/** The closed declared-conditions schema (decision point 5): locale plus
 * the three calc settings, per engine. The operator declares them; a
 * recorded run refuses to guess. */
export interface DeclaredConditions {
  locale: string;
  calc: { epoch: string; iterative: boolean; precision: string };
}

export function parseConditionsFile(
  path: string,
  platforms: Platform[],
): Record<string, DeclaredConditions> {
  if (!existsSync(path)) throw new Error(`--conditions: ${path} not found`);
  const raw = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  const out: Record<string, DeclaredConditions> = {};
  for (const platform of platforms) {
    const c = raw[platform];
    if (!c || typeof c !== "object") {
      throw new Error(`--conditions: missing declaration for ${platform}`);
    }
    const cc = c as Record<string, unknown>;
    const calc = cc.calc as Record<string, unknown> | undefined;
    if (
      typeof cc.locale !== "string" ||
      !calc ||
      typeof calc.epoch !== "string" ||
      typeof calc.iterative !== "boolean" ||
      typeof calc.precision !== "string"
    ) {
      throw new Error(
        `--conditions: ${platform} must declare { locale, calc: { epoch, iterative, precision } } — the closed D-row set`,
      );
    }
    const extra = Object.keys(cc).filter((k) => k !== "locale" && k !== "calc");
    if (extra.length > 0) {
      throw new Error(`--conditions: ${platform} carries undeclared keys ${extra.join(", ")} — the set is closed`);
    }
    out[platform] = {
      locale: cc.locale,
      calc: { epoch: calc.epoch, iterative: calc.iterative, precision: calc.precision },
    };
  }
  return out;
}

/** Recording requires clean committed inputs: the recorded sha must identify
 * what actually executed — the corpus, drivers, and contracts. In-flight
 * work elsewhere in the monorepo does not change what ran. */
export function preflightCorpusCommit(repoRoot: string): string {
  const dirty = execSync(
    "git status --porcelain -- packages/assay packages/drivers packages/contracts",
    { cwd: repoRoot, encoding: "utf8" },
  ).trim();
  if (dirty !== "") {
    throw new Error(
      "--record requires the assay/drivers/contracts trees to be committed (corpus_commit must identify what ran):\n" + dirty,
    );
  }
  return execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
}

export function driverIdentity(driversDir: string, corpusCommit: string): string {
  const pkg = JSON.parse(readFileSync(join(driversDir, "package.json"), "utf8")) as { version: string };
  return `@cartularium/drivers@${pkg.version}+${corpusCommit.slice(0, 12)}`;
}

export interface SweepWindow {
  from: string;
  to: string;
}

export function engineRunInfo(args: {
  driversDir: string;
  historyDir: string;
  corpusCommit: string;
  engineVersion: string | null;
  conditions: DeclaredConditions;
}): EngineRunInfo {
  const capabilities = snapshotCapabilities(join(args.driversDir, "capabilities"), args.historyDir);
  return {
    driver: driverIdentity(args.driversDir, args.corpusCommit),
    engine_version: args.engineVersion,
    ...(capabilities === null ? {} : { capabilities }),
    conditions: args.conditions,
    capacity_events: [],
  };
}
