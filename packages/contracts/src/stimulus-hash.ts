// The assay-stimulus-v1 payload — the SHARED pre-hash byte construction for
// the stimulus hash (stability substrate, approved 2026-07-18, decision
// point 3). It lives in contracts so assay and edit-shell hash identical
// bytes with their own crypto (node:crypto there, WebCrypto here); the
// adversarial review found edit-shell's previous verbatim hash copy, and a
// copy is exactly what drifts.
//
// The stimulus is WHAT AN ENGINE IS ASKED TO DO: resolved formula, resolved
// grid, declared environment demands — pre-adapter, excluding every lens,
// classification, capability, and presentation field. The schema is
// normative and versioned; a field-set change is an explicit epoch event.

/** Strict canonical JSON: code-unit-sorted keys, no undefined, no
 * non-finite numbers, no sparse arrays, plain objects only. */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null"

  switch (typeof value) {
    case "string":
    case "boolean":
      return JSON.stringify(value)
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(`canonicalJson cannot encode non-finite number ${String(value)}`)
      }
      return JSON.stringify(value)
    case "undefined":
      throw new Error("canonicalJson cannot encode undefined")
    case "bigint":
    case "function":
    case "symbol":
      throw new Error(`canonicalJson cannot encode ${typeof value}`)
  }

  if (Array.isArray(value)) {
    const items: string[] = []
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) {
        throw new Error("canonicalJson cannot encode sparse arrays")
      }
      items.push(canonicalJson(value[index]))
    }
    return `[${items.join(",")}]`
  }

  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(
        `canonicalJson cannot encode non-plain object ${Object.prototype.toString.call(value)}`,
      )
    }
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a === b ? 0 : a < b ? -1 : 1,
    )
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`
  }

  throw new Error(`canonicalJson cannot encode ${typeof value}`)
}

/** The grid coercion assay's parser applies before hashing: error-code
 * strings become {error} cells. Callers holding RAW authored grids (the
 * edit-shell preview) must coerce for byte parity with the parsed corpus. */
export function coerceStimulusGrid(
  grid: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(grid)) {
    if (v === null || v === undefined) out[k] = null
    else if (typeof v === "string" && v.startsWith("#") && /^#[A-Z0-9/!?]+!?$/.test(v)) {
      out[k] = { error: v }
    } else out[k] = v
  }
  return out
}

/** The canonical pre-hash string. sha256 it (hex, `sha256:` prefixed) to get
 * the stimulus hash. */
export function stimulusPayload(raw: {
  formula: unknown
  grid?: unknown
  environment?: unknown
}): string {
  const stimulus: Record<string, unknown> = { formula: raw.formula }
  if (raw.grid !== undefined) stimulus.grid = raw.grid
  if (raw.environment !== undefined) stimulus.environment = raw.environment
  return canonicalJson({ version: "assay-stimulus-v1", stimulus })
}
