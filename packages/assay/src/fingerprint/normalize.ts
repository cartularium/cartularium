// The ONE circulating-text normalization, shared by the fingerprint encoding
// and the comparator (approved design §4: fingerprint equality must imply
// comparator equality at the same version and rung — two normalizations
// would let a hash match contradict an escalated comparison).
//
// NFC only. Case and whitespace are PRESERVED: both evidence-grade engines
// treat NFC≡NFD under `=` (so byte-comparing manufactures divergence), but
// case and whitespace are genuinely produced content an engine can differ on
// (fingerprint doc 2026-06-15 §3, live-probed).

export function normalizeCirculatingText(s: string): string {
  return s.normalize("NFC");
}
