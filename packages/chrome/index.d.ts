// type declarations for @cartularium/chrome — companion to index.js

export type Sigil = "int" | "ext"

export interface Imprint {
  label: string
  slug: string
}

export interface Engine {
  label: string
  tier: "primary" | "comparison"
  order: number
}

export interface ImprintsRegistry {
  version: number
  imprints: Record<string, Imprint>
}

export interface EnginesRegistry {
  version: number
  engines: Record<string, Engine>
}

export const IMPRINTS: ImprintsRegistry
export const ENGINES: EnginesRegistry

export const TOPBAR_TEMPLATE: string
export const DRAWER_TEMPLATE: string
export const FOOTER_TEMPLATE: string
export const RELATED_TEMPLATE: string
export const TOC_RAIL_TEMPLATE: string
export const TOC_GUTTER_TEMPLATE: string
export const TOC_FAB_TEMPLATE: string
export const ERROR_404_TEMPLATE: string

export function render(template: string, data: object): string
export function imprintFor(host: string): Imprint | undefined
export function sigilFor(currentHost: string, targetHost: string): Sigil | null
export function imprintsExcluding(host: string): Array<{
  host: string
  label: string
  slug: string
  href: string
}>
export function enginesByTier(tier: "primary" | "comparison"): Array<{
  name: string
  label: string
  tier: "primary" | "comparison"
  order: number
}>

export interface CrossPropertyUrls {
  home: string
  wiki: string
  assay: string
}
export function crossPropertyUrls(): CrossPropertyUrls
export function urlForHost(host: string): string
