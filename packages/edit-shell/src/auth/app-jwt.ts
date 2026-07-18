export interface AppJwtParams {
  appId: string
  privateKeyPem: string
}

export async function generateAppJwt(params: AppJwtParams): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const payload = {
    iat: now - 30, // 30s clock skew tolerance per GitHub recommendation
    exp: now + 570, // ~9.5-minute lifetime; total iat→exp = 600s (GitHub's max)
    iss: params.appId,
  }

  const headerB64 = b64url(JSON.stringify(header))
  const payloadB64 = b64url(JSON.stringify(payload))
  const signingInput = `${headerB64}.${payloadB64}`

  const key = await importRs256Key(params.privateKeyPem)
  const sigBytes = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  )
  const sigB64 = b64urlBytes(new Uint8Array(sigBytes))
  return `${signingInput}.${sigB64}`
}

async function importRs256Key(pem: string): Promise<CryptoKey> {
  const base64 = pem
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, "")
    .replace(/-----END (RSA )?PRIVATE KEY-----/, "")
    .replace(/\s+/g, "")
  const der = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  )
}

function b64url(s: string): string {
  return b64urlBytes(new TextEncoder().encode(s))
}

function b64urlBytes(bytes: Uint8Array): string {
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}
