import { userClient } from "./client"

export interface SquashDraftParams {
  token: string
  forkOwner: string
  forkRepo: string
  branch: string
  baseBranch: string
  message: string
}

export interface SquashDraftResult {
  squashed: boolean
  tip_sha: string
}

// just-squash, not rebase: drift between fork/main and canonical/main stays
// visible in the PR. rebasing here could introduce conflicts the contributor
// has no way to resolve from the editor.
export async function squashDraftBranch(p: SquashDraftParams): Promise<SquashDraftResult> {
  const gh = userClient(p.token)

  const compare = await gh.repos.compareCommitsWithBasehead({
    owner: p.forkOwner,
    repo: p.forkRepo,
    basehead: `${p.baseBranch}...${p.branch}`,
  })
  const aheadBy = compare.data.ahead_by ?? 0
  const tipShaFromCompare =
    compare.data.commits[compare.data.commits.length - 1]?.sha
  // aheadBy <= 1: nothing to squash; idempotent no-op for re-submits.
  if (aheadBy <= 1 || !tipShaFromCompare) {
    return { squashed: false, tip_sha: tipShaFromCompare ?? "" }
  }

  const mergeBaseSha = compare.data.merge_base_commit?.sha
  if (!mergeBaseSha) {
    throw new Error("compare did not return merge_base_commit")
  }

  const tipCommit = await gh.git.getCommit({
    owner: p.forkOwner,
    repo: p.forkRepo,
    commit_sha: tipShaFromCompare,
  })
  const treeSha = tipCommit.data.tree.sha

  const newCommit = await gh.git.createCommit({
    owner: p.forkOwner,
    repo: p.forkRepo,
    message: p.message,
    tree: treeSha,
    parents: [mergeBaseSha],
  })

  await gh.git.updateRef({
    owner: p.forkOwner,
    repo: p.forkRepo,
    ref: `heads/${p.branch}`,
    sha: newCommit.data.sha,
    force: true,
  })

  return { squashed: true, tip_sha: newCommit.data.sha }
}
