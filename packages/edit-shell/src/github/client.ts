import { Octokit } from "@octokit/rest"

export function userClient(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: "cartularium-edit-shell",
  })
}
