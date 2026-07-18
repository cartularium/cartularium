#!/usr/bin/env node
// Copies the editor SPA's dist/ tree into sheets-wiki's public/edit/.
// Runs after Quartz build (which has already emitted public/edit/edit-index.json)
// and after write-redirects.mjs. Preserves edit-index.json by merging rather
// than replacing the directory.

import { cpSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, "..", "..", "sheets-wiki-editor", "dist")
const DST = join(HERE, "..", "public", "edit")

const SRC_INDEX = join(SRC, "index.html")
if (!existsSync(SRC_INDEX)) {
  console.error(`copy-editor: editor dist/index.html not found at ${SRC_INDEX}`)
  console.error("  did you build @cartularium/sheets-wiki-editor first?")
  process.exit(1)
}

mkdirSync(DST, { recursive: true })
// copy with force: true to overwrite editor's own files (index.html, assets/);
// edit-index.json (only emitted by Quartz, not present in editor dist/)
// is left alone.
cpSync(SRC, DST, { recursive: true, force: true })
console.log(`copy-editor: ${SRC} -> ${DST}`)
