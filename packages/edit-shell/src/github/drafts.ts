import { userClient } from "./client"

export interface ListDraftsParams {
  token: string
  owner: string
  repo: string
  userLogin: string
}

export interface DraftFile {
  path: string
  added: number
  removed: number
}

export interface DraftEntry {
  branch: string
  slug: string
  commit_sha: string
  updated_at: string
  files: DraftFile[]
  added: number
  removed: number
}

// compare carries head commit metadata, so we read updated_at from the last
// entry instead of a separate getCommit call.
async function compareDraftToMain(
  gh: ReturnType<typeof userClient>,
  owner: string,
  repo: string,
  branch: string,
): Promise<{ files: DraftFile[]; updated_at: string }> {
  const compare = await gh.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `main...${branch}`,
  })
  const files = (compare.data.files ?? []).map((f) => ({
    path: f.filename,
    added: f.additions,
    removed: f.deletions,
  }))
  const commits = compare.data.commits ?? []
  const head = commits[commits.length - 1]
  const updated_at = head?.commit?.author?.date ?? ""
  return { files, updated_at }
}

export async function listDraftBranches(p: ListDraftsParams): Promise<DraftEntry[]> {
  const gh = userClient(p.token)
  const prefix = `draft/${p.userLogin}/`
  const branches = await gh.repos.listBranches({
    owner: p.owner,
    repo: p.repo,
    per_page: 100,
  })
  const drafts = branches.data.filter((b) => b.name.startsWith(prefix))
  const enriched = await Promise.all(
    drafts.map(async (b) => {
      const { files, updated_at } = await compareDraftToMain(gh, p.owner, p.repo, b.name)
      const added = files.reduce((s, f) => s + f.added, 0)
      const removed = files.reduce((s, f) => s + f.removed, 0)
      return {
        branch: b.name,
        slug: b.name.slice(prefix.length),
        commit_sha: b.commit.sha,
        updated_at,
        files,
        added,
        removed,
      }
    }),
  )
  return enriched
}

export async function listDraftFiles(
  p: ListDraftsParams & { branch: string },
): Promise<DraftFile[]> {
  const gh = userClient(p.token)
  const { files } = await compareDraftToMain(gh, p.owner, p.repo, p.branch)
  return files
}
