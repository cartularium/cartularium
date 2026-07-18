#!/usr/bin/env node
// verifies the assay → sheets-wiki manifest contract was honored end-to-end
// in the CI build. structural invariants only, so the check is robust against
// data churn (function names, DV ids, engine sets can change without breaking
// this script as long as the data flow itself works).
//
// the version assertion happens inside sheets-wiki's build (assertSupportedManifestVersion
// in functionData.ts); a version mismatch fails that build before this script runs.
// here we additionally verify the merged data made it through to rendered output.

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const FUNCTIONS_JSON = "packages/sheets-wiki/public/functions.json"

function fail(msg) {
  console.error(`integration smoke check failed: ${msg}`)
  process.exit(1)
}

if (!existsSync(FUNCTIONS_JSON)) {
  fail(`${FUNCTIONS_JSON} not emitted; sheets-wiki build did not produce the functions index`)
}

const data = JSON.parse(readFileSync(FUNCTIONS_JSON, "utf-8"))
const fns = data.functions

if (!Array.isArray(fns) || fns.length === 0) {
  fail(`${FUNCTIONS_JSON} has no functions array or it is empty`)
}

// `via: DV-####` on an engineStatus entry can only come from the manifest;
// lattice TSVs set `status: available` with no `via`. presence here proves
// the manifest was loaded, parsed, and merged into per-page data.
const withVia = fns.filter((f) =>
  Object.values(f.engineStatus || {}).some((e) => typeof e?.via === "string"),
)

if (withVia.length === 0) {
  fail(
    "no function has manifest-derived `via` field on its engineStatus. " +
      "the assay manifest did not flow through to the rendered output. " +
      "check that packages/assay/build/site/manifest.json exists before the sheets-wiki build, " +
      "and that sheets-wiki's quartz.config.ts manifestPath resolves to it.",
  )
}

console.log(
  `integration smoke ok: ${fns.length} functions emitted, ${withVia.length} carry manifest-derived DV references`,
)

// edit-wiki SPA artifacts
const editIndexHtml = join("packages", "sheets-wiki", "public", "edit", "index.html")
if (!existsSync(editIndexHtml)) {
  fail(`missing ${editIndexHtml}`)
}

const editIndexJsonPath = join("packages", "sheets-wiki", "public", "edit", "edit-index.json")
if (!existsSync(editIndexJsonPath)) {
  fail(`missing ${editIndexJsonPath}`)
}

let editIndexJson
try {
  editIndexJson = JSON.parse(readFileSync(editIndexJsonPath, "utf8"))
} catch (e) {
  fail(`${editIndexJsonPath} is not valid JSON: ${e.message}`)
}

if (editIndexJson.version !== 1) {
  fail(`edit-index.json version is ${editIndexJson.version}, expected 1`)
}

if (!Array.isArray(editIndexJson.entries) || editIndexJson.entries.length === 0) {
  fail(`edit-index.json has no entries`)
}

console.log(
  `integration-smoke: edit-wiki artifacts ok (${editIndexJson.entries.length} index entries)`,
)
