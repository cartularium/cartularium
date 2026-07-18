// honor X-Forwarded-Host when either the request URL host or the forwarded
// claim is localhost-shaped (covers wrangler dev, which synthesizes c.req.url
// from wrangler.toml routes). only trusting localhost-shaped values bounds
// the blast radius on production traffic.

const LOCALHOST_HOST = /^(localhost|127\.0\.0\.1)(:\d+)?$/

function isLocalhostRequest(host: string): boolean {
  return LOCALHOST_HOST.test(host)
}

interface OriginContext {
  req: {
    url: string
    header(name: string): string | undefined
  }
}

export function requestOrigin(c: OriginContext): string {
  const reqUrl = new URL(c.req.url)
  const forwardedHost = c.req.header("X-Forwarded-Host")
  if (forwardedHost && (isLocalhostRequest(reqUrl.host) || isLocalhostRequest(forwardedHost))) {
    const forwardedProto = c.req.header("X-Forwarded-Proto") ?? "http"
    return `${forwardedProto}://${forwardedHost}`
  }
  return `${reqUrl.protocol}//${reqUrl.host}`
}
