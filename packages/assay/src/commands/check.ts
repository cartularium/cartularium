// compare per-override `recorded:` baselines against current fixtures

import { acceptDrift, printDriftReport, scanResolutions } from "../resolutions.js";
import { resolveFiles, values } from "./shared.js";

export function check(args: string[]): void {
  const mode = (values.mode as string | undefined) ?? "offline";
  if (mode !== "resolutions") {
    console.error(`check: only --mode=resolutions is implemented (got --mode=${mode}).`);
    console.error("       --mode=offline|live planned during verb consolidation; use `assay run` / `assay validate` for now.");
    process.exit(2);
  }

  const files = resolveFiles(args);
  if (!files.length) {
    console.error("check: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }

  const accept = values.accept as boolean;
  const verbose = values.verbose as boolean;

  const scan = scanResolutions(files);
  printDriftReport(scan, verbose);

  if (accept) {
    if (scan.counts.drift === 0) {
      console.log("\n--accept: no drift to apply.");
      return;
    }
    const { filesWritten, entriesAccepted } = acceptDrift(scan);
    console.log(`\n--accept: rewrote ${entriesAccepted} \`recorded:\` value(s) across ${filesWritten.length} file(s).`);
    for (const f of filesWritten) console.log(`  ${f}`);
  } else if (scan.counts.drift > 0) {
    console.log(`\nRun with --accept to update \`recorded:\` baselines for the entries above.`);
    process.exit(1);
  }
}
