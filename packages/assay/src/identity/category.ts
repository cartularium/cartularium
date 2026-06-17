import type { Category } from "../format/catalogue.js";

/** The canonical set of volatile function subjects. Single source of truth —
 * `deriveCategory` maps these to category "volatile", and the benchmark's
 * non-value-lane derivation reuses it (don't re-list the literals elsewhere). */
export const VOLATILE_SUBJECTS = new Set(["RAND", "RANDBETWEEN", "RANDARRAY", "NOW", "TODAY"]);

export interface CategoryInput {
  subject: string;
  status?: string;
  expect?: unknown;
}

export function deriveCategory(input: CategoryInput): Category {
  if (input.status === "volatile" || VOLATILE_SUBJECTS.has(input.subject)) return "volatile";
  if (isPlainObject(input.expect)) {
    const keys = Object.keys(input.expect);
    if (keys.length === 1 && keys[0] === "shape") return "shape";
    if (keys.length === 1 && keys[0] === "error") return "error-code";
  }
  if (input.expect !== undefined) return "value";
  throw new Error(`category is required for observed-only case ${input.subject}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
