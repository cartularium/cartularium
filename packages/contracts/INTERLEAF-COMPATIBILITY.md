# Interleaf Compatibility Feed

> Audience: implementers working on Interleaf, Assay, Lattice, and future Formulary integrations.

Interleaf needs cross-platform compatibility facts, but it should not be the source of truth for them. Interleaf owns formula text parsing, target printing, and dialect-specific diagnostics. Assay owns observed engine behavior and should be the evidence source for whether a function or construct is native, absent, partial, context-dependent, or external-service-backed on each platform.

## Boundary

- **Assay owns compatibility evidence.** Fixtures, overrides, capability files, semantic domains, support levels, and divergence records stay in Assay.
- **Contracts owns the exported schema.** Shared compatibility data should be described here before it is consumed by Interleaf, sheets.wiki, Formulary, or Lattice.
- **Interleaf consumes a compact feed.** Interleaf should not read Assay's full test corpus at runtime. It needs a small generated artifact for diagnostics and conservative transpilation decisions.
- **Lattice stays semantic.** Lattice can share IR and evaluation semantics, but Excel/Google Sheets surface syntax and host-specific print decisions remain Interleaf-side.

## Proposed Shape

The compatibility feed should be generated from Assay once the relevant Assay surfaces stabilize. The first useful shape is function-oriented:

```ts
interface FormulaCompatibilityManifest {
  schemaVersion: number
  generatedAt: string
  platforms: string[]
  functions: Record<string, FunctionCompatibilityEntry>
}

interface FunctionCompatibilityEntry {
  name: string
  platforms: Record<string, PlatformFunctionSupport>
  tags?: string[]
  evidence?: CompatibilityEvidenceRef[]
}

type PlatformSupport =
  | "native"
  | "absent"
  | "partial"
  | "external-service"
  | "context-required"
  | "design-pending"

interface PlatformFunctionSupport {
  support: PlatformSupport
  note?: string
  causes?: string[]
}

interface CompatibilityEvidenceRef {
  source: "assay"
  ref: string
  url?: string
}
```

## Initial Consumers

- **Interleaf** uses the feed to decide when formula text would print into a target dialect that cannot run it. Example: `IMPORTXML` from Google Sheets to Excel should produce an unsupported-function diagnostic.
- **sheets.wiki** can use the same feed for engine badges once it is richer than the current function-page frontmatter.
- **Formulary** can use the same feed to choose installation/package guidance and warn about unsupported host functions.

## Temporary Interleaf Seed

Until Assay can emit this feed, Interleaf may keep a deliberately small local metadata seed for high-confidence cases already reflected in Assay capability data and corpus tests. That seed is transitional and should not grow into the canonical compatibility database.
