export const ALL_PLATFORMS = [
  "gsheets",
  "excel",
  "lattice",
  "ironcalc",
  "hyperformula",
  "libreoffice",
  "formulas",
  "pycel",
] as const

export type Platform = (typeof ALL_PLATFORMS)[number]

export function isPlatform(value: string): value is Platform {
  return (ALL_PLATFORMS as readonly string[]).includes(value)
}
