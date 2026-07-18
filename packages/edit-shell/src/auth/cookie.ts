export const SESSION_COOKIE = "__cart_sess"
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60

export interface SerializeOptions {
  // Cookie Domain attribute. When empty, the Domain= attribute is omitted and
  // the cookie scopes to the response's host (default browser behavior).
  // Production sets this to ".sheets.wiki" for cross-subdomain reach. Local
  // dev leaves it empty so the cookie sticks to localhost.
  domain: string
  // Whether the cookie is being set on a Secure (https) response. When false,
  // the Secure flag is omitted so localhost http can carry the cookie.
  secure: boolean
  clear?: boolean
}

export function serializeSessionCookie(value: string, opts: SerializeOptions): string {
  const maxAge = opts.clear ? 0 : THIRTY_DAYS_SECONDS
  const parts: string[] = [`${SESSION_COOKIE}=${value}`]
  if (opts.domain) parts.push(`Domain=${opts.domain}`)
  parts.push("Path=/", `Max-Age=${maxAge}`)
  if (opts.secure) parts.push("Secure")
  parts.push("HttpOnly", "SameSite=Lax")
  return parts.join("; ")
}

export function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null
  const parts = header.split(";")
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=")
    if (k === name) return rest.join("=") || ""
  }
  return null
}
