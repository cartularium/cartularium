import { existsSync, readFileSync } from "node:fs"
import { findAndReplace as mdastFindReplace } from "mdast-util-find-and-replace"
import type { Html, Root } from "mdast"
import {
  assertSupportedManifestVersion,
  type ManifestV4,
  type ManifestV4TestEntry,
} from "@cartularium/contracts"
import { escapeHTML } from "../../util/escape"
import type { QuartzTransformerPlugin } from "../types"

export type AssayRefMode = "public" | "editor" | "review" | "degraded"

export interface Options {
  manifestPath?: string
  manifest?: AssayManifest
  mode?: AssayRefMode
  assayBaseUrl?: string
}

export type ResolvedAssayRef =
  | { ref: string; url: string; state: "resolved"; test: ManifestV4TestEntry }
  | { ref: string; url: ""; state: "preview" | "missing" }

export type AssayManifest = Pick<ManifestV4, "version" | "tests" | "aliases" | "tombstones">

const ASSAY_REF_RE = /\{\{assay\s+([^}]+?)\s*\}\}/g
const DEFAULT_ASSAY_BASE = "https://assay.sheets.wiki"
const STRICT_LOAD_MODES = new Set<AssayRefMode>(["public", "review"])

export const AssayRefs: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = userOpts ?? {}
  const mode = normalizeMode(opts.mode ?? process.env.CARTULARIUM_ASSAY_REF_MODE)
  const manifest = opts.manifest ?? loadAssayManifest(opts.manifestPath, mode)
  const assayBaseUrl = opts.assayBaseUrl ?? DEFAULT_ASSAY_BASE

  return {
    name: "AssayRefs",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            mdastFindReplace(tree, [
              [
                ASSAY_REF_RE,
                (_value: string, raw: string) =>
                  renderAssayRef(raw.trim(), manifest, mode, assayBaseUrl),
              ],
            ])
          }
        },
      ]
    },
  }
}

export function resolveAssayRefForTest(
  raw: string,
  manifest: AssayManifest,
  mode: AssayRefMode,
): ResolvedAssayRef {
  return resolveAssayRef(raw, manifest, mode)
}

function resolveAssayRef(
  raw: string,
  manifest: AssayManifest | null,
  mode: AssayRefMode,
): ResolvedAssayRef {
  const ref = raw.trim()
  if (ref.startsWith("preview:")) {
    if (mode === "public") throw new Error(`preview refs are not allowed in public builds: ${ref}`)
    if (mode === "review") {
      throw new Error(`preview refs are not supported in review mode yet: ${ref}`)
    }
    return { ref, url: "", state: "preview" }
  }

  if (!manifest) {
    if (mode === "editor" || mode === "degraded") return { ref, url: "", state: "missing" }
    throw new Error(`assay manifest is unavailable while resolving ref: ${ref}`)
  }

  assertSupportedManifestVersion(manifest.version, "assay manifest")
  const alias = manifest.aliases?.[ref]
  const canonicalRef = alias?.target ?? ref

  if (manifest.tombstones?.[canonicalRef] || manifest.tombstones?.[ref]) {
    throw new Error(`assay ref is tombstoned: ${ref}`)
  }

  const test = manifest.tests?.[canonicalRef]
  if (!test) {
    if (mode === "degraded" || mode === "editor") return { ref, url: "", state: "missing" }
    throw new Error(`unknown assay ref: ${ref}`)
  }

  return { ref: canonicalRef, url: test.url, state: "resolved", test }
}

function renderAssayRef(
  raw: string,
  manifest: AssayManifest | null,
  mode: AssayRefMode,
  assayBaseUrl: string,
): Html {
  const resolved = resolveAssayRef(raw, manifest, mode)
  if (resolved.state !== "resolved") {
    const degradedClass = mode === "degraded" ? " assay-ref--degraded" : ""
    const degradedAttrs =
      mode === "degraded"
        ? ` data-assay-ref-mode="degraded" data-cartularium-release-blocker="assay-ref-degraded"`
        : ""
    return {
      type: "html",
      value:
        `<span class="assay-ref assay-ref--${resolved.state}${degradedClass}" ` +
        `data-assay-ref="${escapeHTML(resolved.ref)}"${degradedAttrs}>` +
        `assay: ${escapeHTML(resolved.ref)}</span>`,
    }
  }

  const href = absolutizeAssayUrl(resolved.url, assayBaseUrl)
  return {
    type: "html",
    value:
      `<a class="assay-ref" href="${escapeHTML(href)}" ` +
      `data-assay-ref="${escapeHTML(resolved.ref)}">` +
      `assay: ${escapeHTML(resolved.ref)}</a>`,
  }
}

function loadAssayManifest(path: string | undefined, mode: AssayRefMode): AssayManifest | null {
  try {
    if (!path) throw new Error("manifestPath is required")
    if (!existsSync(path)) throw new Error(`manifest not found at ${path}`)

    const manifest = JSON.parse(readFileSync(path, "utf-8")) as AssayManifest
    assertSupportedManifestVersion(manifest.version, path)
    return manifest
  } catch (err) {
    if (STRICT_LOAD_MODES.has(mode)) {
      throw new Error(`[AssayRefs] failed to load assay manifest: ${(err as Error).message}`)
    }
    console.warn(`[AssayRefs] failed to load assay manifest: ${(err as Error).message}`)
    return null
  }
}

function normalizeMode(raw: string | undefined): AssayRefMode {
  if (raw === "editor" || raw === "review" || raw === "degraded" || raw === "public") return raw
  if (raw !== undefined) {
    throw new Error(`unknown assay ref mode: ${raw}`)
  }
  return "public"
}

function absolutizeAssayUrl(rawUrl: string, assayBaseUrl: string): string {
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl
  return `${assayBaseUrl.replace(/\/+$/, "")}/${rawUrl.replace(/^\/+/, "")}`
}
