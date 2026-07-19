// The authored-intent feature vocabulary (capabilities decision record,
// 2026-07-18): a case's `features:` tag means "this case poses a question
// about X" — an index over cases, never a gate and never an engine claim.
// The registry is closed: a new name enters only by editing this list in
// the same change that first uses it, so a typo'd tag is a loud rejection
// at parse/preview time rather than a silently unindexed case.

export const ASSAY_FEATURES = [
  "broadcasting",
  "dynamic-arrays",
  "external-io",
  "higher-order-lambda",
  "lambda",
  "let-bindings",
  "regex",
] as const;

export type AssayFeature = (typeof ASSAY_FEATURES)[number];

export function isKnownAssayFeature(name: string): name is AssayFeature {
  return (ASSAY_FEATURES as readonly string[]).includes(name);
}
