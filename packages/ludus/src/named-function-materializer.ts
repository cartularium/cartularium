import {
  createNamedFunctionInliner,
  googleSheetsSyntax,
  NamedFunctionInlineError,
  type NamedFunctionInlineOptions,
} from "@cartularium/formula-syntax";
import type { Snapshot } from "./snapshot.js";

const MAX_TOTAL_FORMULA_CHARACTERS = 1_000_000;

export function inlineSnapshotNamedFunctions(
  snapshot: Snapshot,
  options: NamedFunctionInlineOptions & { maxTotalFormulaCharacters?: number } = {},
): Snapshot {
  const output = structuredClone(snapshot);
  const protectedIdentifiers = [
    ...snapshot.namedRanges.map((range) => range.name),
    ...(options.protectedIdentifiers ?? []),
  ];
  const inliner = createNamedFunctionInliner(
    snapshot.namedFunctions,
    googleSheetsSyntax,
    { ...options, protectedIdentifiers },
  );
  let totalFormulaCharacters = 0;

  for (const sheet of output.sheets) {
    for (const row of sheet.cells) {
      for (const cell of row) {
        const formula = cell?.ue?.formulaValue;
        if (!formula) continue;
        const result = inliner.inline(formula);
        cell.ue!.formulaValue = result.formula;
        totalFormulaCharacters += result.formula.length;
        const max = options.maxTotalFormulaCharacters ?? MAX_TOTAL_FORMULA_CHARACTERS;
        if (totalFormulaCharacters > max) {
          throw new NamedFunctionInlineError(
            "expansion-limit",
            `expanded workbook has more than ${max} formula characters`,
          );
        }
      }
    }
  }
  output.namedFunctions = [];
  return output;
}
