import { deriveSubjectRef, validateSubjectRef } from "./subject-ref.js";

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const PREVIEW_REF_PREFIX = "preview:";
const PREVIEW_HASH_RE = /^[0-9a-f]{64}$/;

export interface PublicRefInput {
  subject: string;
  subjectRef?: string;
  name: string;
}

export type ParsedAssayRef = { kind: "canonical"; ref: string } | { kind: "preview"; hash: string };

export function validateCaseName(name: string): void {
  if (!NAME_RE.test(name)) throw new Error(`invalid assay case name ${JSON.stringify(name)}`);
}

export function derivePublicRef(input: PublicRefInput): string {
  validateCaseName(input.name);
  return `${deriveSubjectRef(input.subject, input.subjectRef)}/${input.name}`;
}

export function parseAssayRef(raw: string): ParsedAssayRef {
  if (raw.startsWith(PREVIEW_REF_PREFIX)) {
    const hash = raw.slice(PREVIEW_REF_PREFIX.length);
    if (!PREVIEW_HASH_RE.test(hash)) {
      throw new Error(`invalid preview assay ref ${JSON.stringify(raw)}`);
    }
    return { kind: "preview", hash };
  }

  const parts = raw.split("/");
  if (parts.length !== 2) {
    throw new Error(`invalid assay ref ${JSON.stringify(raw)}`);
  }
  const [subjectRef, name] = parts;
  validateSubjectRef(subjectRef);
  validateCaseName(name);
  return { kind: "canonical", ref: raw };
}
