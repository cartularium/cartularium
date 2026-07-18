export interface ExchangeParams {
  clientId: string
  clientSecret: string
  code: string
}

export interface ExchangeResult {
  access_token: string
  expires_in: number
  refresh_token: string
}

export async function exchangeCodeForUserToken(p: ExchangeParams): Promise<ExchangeResult> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: p.clientId, client_secret: p.clientSecret, code: p.code }),
  })
  const body = (await res.json()) as Record<string, unknown>
  if ("error" in body) {
    throw new Error(`github_oauth_error: ${body.error}`)
  }
  return {
    access_token: body.access_token as string,
    expires_in: body.expires_in as number,
    refresh_token: body.refresh_token as string,
  }
}

export async function fetchAuthenticatedUser(token: string): Promise<{ login: string; id: number }> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "cartularium-edit-shell",
    },
  })
  if (!res.ok) throw new Error(`github_user_${res.status}`)
  const body = (await res.json()) as { login: string; id: number }
  return { login: body.login, id: body.id }
}
