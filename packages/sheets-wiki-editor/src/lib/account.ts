// Derives the small `Account` shape Chrome consumes from a github login.
// Initials are taken from up to two segments split on `-._`.
// Falls back to "?" when the login has no usable characters.
export interface Account {
  handle: string
  initials: string
}

export function accountFromLogin(login: string): Account {
  const initials =
    login
      .split(/[-._]/)
      .filter(Boolean)
      .map((s) => s[0]!.toUpperCase())
      .slice(0, 2)
      .join("") || "?"
  return { handle: login, initials }
}
