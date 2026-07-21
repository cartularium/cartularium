export function shouldInlineNamedFunctions(
  spreadsheetId: string,
  mode: string | undefined,
  canarySpreadsheetIds: string | undefined,
): boolean {
  if (mode === "inline") return true;
  if (!canarySpreadsheetIds) return false;
  return canarySpreadsheetIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(spreadsheetId);
}
