// temp workbook creation for suites with `requires`
// shells out to `formulary install` to materialise named-function packages

import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

// resolved relative to assay's location in the sandbox layout
const FORMULARY_CLI = join(
  dirname(fileURLToPath(import.meta.url)),
  "..", "..", "formulary", "packages", "cli", "dist", "main.js",
);

export interface WorkbookResult {
  path: string;
  tmpDir: string;
}

export async function createWorkbook(
  requires: Record<string, string>,
  suiteDir: string,
): Promise<WorkbookResult> {
  const tmpDir = mkdtempSync(join(tmpdir(), "assay-wb-"));
  const wbPath = join(tmpDir, "workbook.xlsx");

  for (const [name, source] of Object.entries(requires)) {
    const pkgDir = join(suiteDir, source);
    const isFirst = name === Object.keys(requires)[0];
    const createFlag = isFirst ? " --create" : ""; // first install creates the workbook

    try {
      execSync(
        `node "${FORMULARY_CLI}" install "${pkgDir}" "${wbPath}"${createFlag}`,
        { stdio: "pipe", timeout: 30000 },
      );
    } catch (e: unknown) {
      const err = e as { stderr?: Buffer };
      const msg = err.stderr?.toString() || String(e);
      rmSync(tmpDir, { recursive: true, force: true });
      throw new Error(`Failed to install package "${name}" from ${pkgDir}: ${msg}`);
    }
  }

  return { path: wbPath, tmpDir };
}

export function cleanupWorkbook(result: WorkbookResult): void {
  try {
    rmSync(result.tmpDir, { recursive: true, force: true });
  } catch {
    // tmpdir may already be gone
  }
}
