import { userClient } from "./client"

export interface ForkParams {
  token: string
  forkOwner: string
  canonical: { owner: string; repo: string }
}

export interface ForkResult {
  full_name: string
  existed: boolean
}

export async function findOrCreateFork(p: ForkParams): Promise<ForkResult> {
  const gh = userClient(p.token)
  try {
    const r = await gh.repos.get({ owner: p.forkOwner, repo: p.canonical.repo })
    if (r.data.fork) {
      return { full_name: r.data.full_name, existed: true }
    }
    // Conflicting repo of the same name that isn't a fork — fall through to create with a different name?
    // For v1, treat as error: contributors with a conflicting repo will need to pick a different fork.
    throw new Error("repo_conflict_not_a_fork")
  } catch (e: any) {
    if (e?.status !== 404) throw e
  }

  const created = await gh.repos.createFork({
    owner: p.canonical.owner,
    repo: p.canonical.repo,
  })
  return { full_name: created.data.full_name, existed: false }
}
