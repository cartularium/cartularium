const TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

export interface SessionRecord {
  user_login: string
  user_id: number
  user_token: string
  token_expiry: number
  fork_repo: string | null
}

export function newSessionId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

export async function createSession(
  ns: KVNamespace,
  record: SessionRecord,
): Promise<string> {
  const id = newSessionId()
  await ns.put(id, JSON.stringify(record), { expirationTtl: TTL_SECONDS })
  return id
}

export async function loadSession(
  ns: KVNamespace,
  id: string,
): Promise<SessionRecord | null> {
  const raw = await ns.get(id)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionRecord
  } catch {
    return null
  }
}

export async function destroySession(ns: KVNamespace, id: string): Promise<void> {
  await ns.delete(id)
}

export async function updateSession(
  ns: KVNamespace,
  id: string,
  patch: Partial<SessionRecord>,
): Promise<SessionRecord | null> {
  const current = await loadSession(ns, id)
  if (!current) return null
  const next = { ...current, ...patch }
  await ns.put(id, JSON.stringify(next), { expirationTtl: TTL_SECONDS })
  return next
}

function base64url(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}
