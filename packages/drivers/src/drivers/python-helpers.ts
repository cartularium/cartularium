// shared helpers for python-backed drivers

import { execSync } from "node:child_process";

// invokes `<script> --version` via uv; returns trimmed stdout, or null on failure
export function probePythonVersion(scriptPath: string, projectRoot: string, timeoutMs = 30000): string | null {
  try {
    const out = execSync(`uv run python "${scriptPath}" --version`, {
      cwd: projectRoot,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: timeoutMs,
    }).toString().trim();
    return out || null;
  } catch {
    return null;
  }
}
