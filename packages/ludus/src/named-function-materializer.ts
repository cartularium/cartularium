import {
  createNamedFunctionInliner,
  googleSheetsSyntax,
  NamedFunctionInlineError,
  type NamedFunctionInlineOptions,
} from "@cartularium/formula-syntax";
import type { Snapshot } from "./snapshot.js";

const MAX_TOTAL_FORMULA_CHARACTERS = 1_000_000;
export const NAMED_FUNCTION_ACCEPTANCE_LIMITS = {
  maxDefinitions: 256,
  maxDepth: 20,
  maxFormulaLength: 50_000,
  maxTotalFormulaCharacters: MAX_TOTAL_FORMULA_CHARACTERS,
} as const;

type MaterializerOptions = NamedFunctionInlineOptions & {
  maxTotalFormulaCharacters?: number;
};

export function inlineSnapshotNamedFunctions(
  snapshot: Snapshot,
  options: MaterializerOptions = {},
): Snapshot {
  const output = structuredClone(snapshot);
  const {
    maxTotalFormulaCharacters = NAMED_FUNCTION_ACCEPTANCE_LIMITS.maxTotalFormulaCharacters,
    protectedIdentifiers: additionalProtectedIdentifiers = [],
    ...inlineOptions
  } = options;
  const protectedIdentifiers = [
    ...snapshot.namedRanges.map((range) => range.name),
    ...additionalProtectedIdentifiers,
  ];
  const inliner = createNamedFunctionInliner(snapshot.namedFunctions, googleSheetsSyntax, {
    maxDefinitions: NAMED_FUNCTION_ACCEPTANCE_LIMITS.maxDefinitions,
    maxDepth: NAMED_FUNCTION_ACCEPTANCE_LIMITS.maxDepth,
    maxFormulaLength: NAMED_FUNCTION_ACCEPTANCE_LIMITS.maxFormulaLength,
    ...inlineOptions,
    protectedIdentifiers,
  });
  let totalFormulaCharacters = 0;

  for (const sheet of output.sheets) {
    for (const row of sheet.cells) {
      for (const cell of row) {
        const formula = cell?.ue?.formulaValue;
        if (!formula) continue;
        const result = inliner.inline(formula);
        cell.ue!.formulaValue = result.formula;
        totalFormulaCharacters += result.formula.length;
        if (totalFormulaCharacters > maxTotalFormulaCharacters) {
          throw new NamedFunctionInlineError(
            "expansion-limit",
            `expanded workbook has more than ${maxTotalFormulaCharacters} formula characters`,
          );
        }
      }
    }
  }
  output.namedFunctions = [];
  return output;
}
