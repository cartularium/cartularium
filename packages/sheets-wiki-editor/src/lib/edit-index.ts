// Loads /edit-index.json once and caches in module scope. The JSON is emitted
// by sheets-wiki at build time (see packages/sheets-wiki/quartz/plugins/emitters/editIndex.tsx).
// Version-asserted via @cartularium/contracts.

import {
  assertSupportedEditIndexVersion,
  type EditIndex,
  type EditIndexEntry,
} from "@cartularium/contracts"

export interface LoadedEditIndex {
  raw: EditIndex
  entries: readonly EditIndexEntry[]
  findEntry(slug: string): EditIndexEntry | undefined
}

// Quartz's EditIndex emitter writes to public/edit/edit-index.json
// (see packages/sheets-wiki/quartz/plugins/emitters/editIndex.tsx).
const INDEX_URL = "/edit/edit-index.json"

let cached: Promise<LoadedEditIndex> | undefined

export async function loadEditIndex(): Promise<LoadedEditIndex> {
  if (!cached) cached = doLoad()
  return cached
}

async function doLoad(): Promise<LoadedEditIndex> {
  const res = await fetch(INDEX_URL, { credentials: "same-origin" })
  if (!res.ok) {
    throw new Error(`failed to load edit-index: ${res.status} ${res.statusText}`)
  }
  const raw = (await res.json()) as EditIndex
  assertSupportedEditIndexVersion(raw, INDEX_URL)
  const bySlug = new Map(raw.entries.map((e) => [e.slug, e]))
  return {
    raw,
    entries: raw.entries,
    findEntry(slug: string) {
      return bySlug.get(slug)
    },
  }
}

// Test-only: reset module-scoped cache between tests
export function _resetForTests(): void {
  cached = undefined
}
