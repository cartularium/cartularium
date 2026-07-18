import yaml from "js-yaml"

export type Frontmatter = Record<string, unknown>

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)(?:\r?\n)?---\r?\n?/

export function parseFrontmatter(markdown: string): Frontmatter | null {
  const match = markdown.match(FRONTMATTER_RE)
  if (!match) return null
  try {
    const parsed = yaml.load(match[1]!)
    if (parsed === null || parsed === undefined) return {}
    if (typeof parsed !== "object" || Array.isArray(parsed)) return null
    return parsed as Frontmatter
  } catch {
    return null
  }
}

// Deep equality good enough for YAML scalars + arrays of scalars.
// (Locked frontmatter values in P1 are strings or string arrays; this won't
// be asked to compare nested objects.)
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as object)
    const bk = Object.keys(b as object)
    if (ak.length !== bk.length) return false
    return ak.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    )
  }
  return false
}

export function diffLockedFields(
  before: Frontmatter | null,
  after: Frontmatter | null,
  lockedKeys: readonly string[],
): string[] {
  const changed: string[] = []
  for (const key of lockedKeys) {
    const a = before ? before[key] : undefined
    const b = after ? after[key] : undefined
    if (!deepEqual(a, b)) changed.push(key)
  }
  return changed
}
