export interface CaseKeyLike {
  id: string;
  semanticHash?: string;
}

// The single chokepoint for "which key identifies a case". Since the
// stability substrate (approved 2026-07-18, decision points 1-2) the key is
// the DECLARED id — the public ref — everywhere: ledger rows, fixture v2
// entries, annotation scopes, citations. semanticHash is retired from the
// identity role; it remains on TestCase only as the transitional key of
// v1 fixture files (hibernated engines) until the hibernation item lands.
export function caseKey(test: CaseKeyLike): string {
  return test.id;
}
