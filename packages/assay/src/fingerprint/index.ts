export { normalizeCirculatingText } from "./normalize.js";
export {
  FPV,
  encodeCirculatingCellFpv1,
  fingerprintOutcome,
  fingerprintValue,
  isStabilityComparable,
  quantizeNumberFpv1,
  type Fingerprint,
} from "./encode.js";
export {
  circulatingGridsEqual,
  compareStability,
  isOperationalGap,
  type ObservationRef,
  type StabilityVerdict,
} from "./stability.js";
