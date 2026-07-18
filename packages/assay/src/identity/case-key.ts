export interface CaseKeyLike {
  id: string;
  semanticHash?: string;
}

export function caseKey(test: CaseKeyLike): string {
  return test.semanticHash ?? test.id;
}
