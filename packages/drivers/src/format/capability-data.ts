// Capability DATA (the report-only half) — the per-engine capability files + their
// readers + the descriptor projection. This is driver-facing: it moves to
// `@cartularium/drivers` with the drivers (ratified §3.3). The rewrite ADAPTERS
// (reconcileFeatures / applyAdapter) are the generation-layer half and stay in
// assay (`capabilities.ts`), importing this module's data.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Platform } from "./values.js";
import type { CapabilityDescriptor, FeatureFidelity } from "../drivers/driver.js";

// native = runs as-is, wrapped = adapter applied first, absent = skip
export type FeatureSupport = "native" | "wrapped" | "absent";

export interface FeatureCapability {
  support: FeatureSupport;
  /** adapter primitive (only when support === "wrapped") */
  adapter?: AdapterName;
  /** adapter parameters; shape depends on the adapter */
  from?: string;
  to?: string;
  prepend?: string;
  note?: string;
}

export type AdapterName = "arrayformula-wrap" | "rename-fn" | "prepend";

export interface CapabilityFile {
  engine: Platform;
  description?: string;
  features: Record<string, FeatureCapability>;
}

const CAPABILITY_CACHE = new Map<Platform, CapabilityFile>();

// search order: ASSAY_CAPABILITIES_DIR, cwd/capabilities, package-root/capabilities
function capabilitiesRoot(): string {
  const env = process.env.ASSAY_CAPABILITIES_DIR;
  if (env) return env;
  const cwd = join(process.cwd(), "capabilities");
  if (existsSync(cwd)) return cwd;
  const here = fileURLToPath(import.meta.url);
  const pkgRoot = join(dirname(here), "..", "..", "capabilities");
  return pkgRoot;
}

export function loadCapability(engine: Platform): CapabilityFile {
  const cached = CAPABILITY_CACHE.get(engine);
  if (cached) return cached;
  const path = join(capabilitiesRoot(), `${engine}.json`);
  if (!existsSync(path)) {
    throw new Error(`Missing capabilities file: ${path}`);
  }
  const data = JSON.parse(readFileSync(path, "utf8")) as CapabilityFile;
  CAPABILITY_CACHE.set(engine, data);
  return data;
}

/**
 * Project an engine's capability FILE into the report-only CapabilityDescriptor
 * (ratified §3.3): the file's `support` (native|wrapped|absent) maps to the
 * descriptor's `FeatureFidelity` (native|partial|absent). `wrapped` → `partial`:
 * the engine can't run it as-is but it's achievable via the generation layer's
 * adapter rewrite — the adapter itself stays a generation fact, out of the
 * descriptor. Drivers delegate `capabilities()` here.
 */
export function capabilityDescriptorFor(engine: Platform): CapabilityDescriptor {
  const file = loadCapability(engine);
  const features: Record<string, FeatureFidelity> = {};
  for (const [id, cap] of Object.entries(file.features)) {
    features[id] = cap.support === "wrapped" ? "partial" : cap.support;
  }
  return { features };
}

/** test helper — clears the in-memory capability cache */
export function clearCapabilityCache(): void {
  CAPABILITY_CACHE.clear();
}
