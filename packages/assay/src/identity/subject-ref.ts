const FUNCTION_SUBJECT_RE = /^[A-Z][A-Z0-9_.]*$/;
const SAFE_SUBJECT_REF_RE = /^[A-Za-z0-9_.:-]+$/;
const RESERVED_SUBJECT_REF_PREFIXES = ["preview:"];

// The subject→ref translation map that used to live here was FROZEN on
// 2026-07-18 (stability substrate, decision point 1: ids are fully
// declared). Its one-time home is scripts/materialize-subject-refs.mjs,
// which wrote every derived ref into the corpus as an explicit
// `subjectRef:`. Live derivation is now pure — explicit ref, or the
// subject as its own ref when it is ref-safe — so no edit here can ever
// re-key a case. The identity lockfile CI catches any regression.

export function deriveSubjectRef(subject: string, explicit?: string): string {
  if (explicit !== undefined) {
    validateSubjectRef(explicit);
    return explicit;
  }
  if (FUNCTION_SUBJECT_RE.test(subject)) return subject;
  if (SAFE_SUBJECT_REF_RE.test(subject) && !subject.includes("/")) {
    validateSubjectRef(subject);
    return subject;
  }
  throw new Error(`subject ${JSON.stringify(subject)} needs explicit subjectRef`);
}

export function validateSubjectRef(subjectRef: string): void {
  if (
    !SAFE_SUBJECT_REF_RE.test(subjectRef) ||
    subjectRef.includes("/") ||
    RESERVED_SUBJECT_REF_PREFIXES.some((prefix) => subjectRef.startsWith(prefix))
  ) {
    throw new Error(`invalid subjectRef ${JSON.stringify(subjectRef)}`);
  }
}
