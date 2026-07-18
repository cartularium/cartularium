// static checks on test yaml — broadcasting intent and bare error-strings

import { lintSuites, printLintReport } from "../lint.js";
import { resolveFiles } from "./shared.js";

export function lint(args: string[]): void {
  const files = resolveFiles(args);
  if (!files.length) {
    console.error("lint: no test files matched (looked in tests/*.yaml)");
    process.exit(1);
  }
  const issues = lintSuites(files);
  printLintReport(issues);
  if (issues.length > 0) process.exit(1);
}
