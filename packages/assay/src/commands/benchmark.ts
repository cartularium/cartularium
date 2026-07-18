// score engines against a consensus of agreeing engines

import { writeFileSync } from "node:fs";
import { ALL_PLATFORMS, type Platform } from "../format/values.js";
import {
  consensusAsFixture,
  printBenchmark,
  printFunctionRollup,
  rollupAsCsv,
  rollupByFunction,
  runBenchmark,
} from "../benchmark.js";
import { parseTags, resolveFiles, values } from "./shared.js";

export function benchmark(args: string[]): void {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("benchmark: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const tags = parseTags();
  const authority = (values.authority as string)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as Platform[];

  const defaultTargets = ALL_PLATFORMS.filter((p) => !authority.includes(p));
  const targetSpec = (values.target as string | undefined) ?? defaultTargets.join(",");
  const target = targetSpec
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as Platform[];

  if (authority.length < 1) {
    console.error("benchmark: --authority must list at least 1 platform");
    process.exit(1);
  }

  const strictErrors = !(values["loose-errors"] as boolean);
  const consensusRaw = values.consensus as string | undefined;
  // single-authority benchmark is "any-match" by construction; otherwise default to strict
  const consensusMode: "strict" | "any" =
    consensusRaw === "any" ? "any"
    : consensusRaw === "strict" ? "strict"
    : authority.length === 1 ? "any"
    : "strict";
  if (consensusRaw && consensusRaw !== "strict" && consensusRaw !== "any") {
    console.error(`benchmark: --consensus must be "strict" or "any" (got "${consensusRaw}")`);
    process.exit(1);
  }
  if (consensusMode === "strict" && authority.length < 2) {
    console.error("benchmark: strict consensus needs ≥2 authorities (pass --consensus any)");
    process.exit(1);
  }

  if (!values.json) console.log(
    `authority:    ${authority.join(", ")}\n` +
      `targets:      ${target.join(", ")}\n` +
      `consensus:    ${consensusMode}\n` +
      `error match:  ${strictErrors ? "strict (codes must match)" : "loose (any error matches any error)"}\n` +
      `suites:       ${files.length}`,
  );

  const result = runBenchmark(files, { authority, target, strictErrors, consensusMode, tags });

  if (values.json) console.log(JSON.stringify(result, null, 2));
  else printBenchmark(result, values.verbose as boolean);

  if (values["by-function"] as boolean) {
    const rollup = rollupByFunction(result);
    if (values.json) console.log(JSON.stringify(rollup, null, 2));
    else printFunctionRollup(rollup);
  }

  const csvPath = values["rollup-csv"] as string | undefined;
  if (csvPath) {
    const rollup = rollupByFunction(result);
    writeFileSync(csvPath, rollupAsCsv(rollup));
    console.log(`\nWrote per-function rollup CSV → ${csvPath}`);
  }

  const dump = values["dump-consensus"] as string | undefined;
  if (dump) {
    writeFileSync(dump, JSON.stringify(consensusAsFixture(result), null, 2) + "\n");
    console.log(`\nWrote consensus fixture → ${dump}`);
  }

  const exclCsv = values["exclusions-csv"] as string | undefined;
  if (exclCsv) {
    const rows = ["suite,test,reason,detail"];
    for (const e of result.exclusions) {
      const d = (e.detail ?? "").replace(/"/g, '""');
      rows.push(`"${e.suite}","${e.test}","${e.reason}","${d}"`);
    }
    writeFileSync(exclCsv, rows.join("\n") + "\n");
    console.log(`\nWrote exclusions CSV → ${exclCsv}`);
  }
}
