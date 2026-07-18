import type { AssayCellValue } from "@cartularium/contracts"

export type FormattedCellKind = "null" | "number" | "string" | "boolean" | "error"

export interface FormattedCell {
  display: string
  kind: FormattedCellKind
}

export function formatCell(value: AssayCellValue | null | undefined): FormattedCell {
  if (value === null || value === undefined) return { display: "—", kind: "null" }
  if (typeof value === "number") return { display: String(value), kind: "number" }
  if (typeof value === "boolean") return { display: value ? "TRUE" : "FALSE", kind: "boolean" }
  if (typeof value === "string") return { display: `"${value}"`, kind: "string" }
  if (typeof value === "object" && "error" in value) return { display: value.error, kind: "error" }
  return { display: String(value), kind: "string" }
}
