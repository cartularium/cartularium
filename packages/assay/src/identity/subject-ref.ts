const FUNCTION_SUBJECT_RE = /^[A-Z][A-Z0-9_.]*$/;
const SAFE_SUBJECT_REF_RE = /^[A-Za-z0-9_.:-]+$/;
const RESERVED_SUBJECT_REF_PREFIXES = ["preview:"];

const SUBJECT_REF_MAP: Record<string, string> = {
  "op:+": "op:add",
  "op:-": "op:subtract",
  "op:*": "op:multiply",
  "op:/": "op:divide",
  "op:^": "op:power",
  "op:&": "op:concat",
  "op:=": "op:eq",
  "op:<>": "op:ne",
  "op:<": "op:lt",
  "op:<=": "op:lte",
  "op:>": "op:gt",
  "op:>=": "op:gte",
  TRUE: "lit:boolean",
  FALSE: "lit:boolean",
};

export function deriveSubjectRef(subject: string, explicit?: string): string {
  if (explicit !== undefined) {
    validateSubjectRef(explicit);
    return explicit;
  }
  const mapped = SUBJECT_REF_MAP[subject];
  if (mapped) return mapped;
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
