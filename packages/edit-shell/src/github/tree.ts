import { userClient } from "./client"

export interface ReadFileParams {
  token: string
  owner: string
  repo: string
  path: string
  ref?: string
}

export interface FileResult {
  content: string
  sha: string
}

export async function readFile(p: ReadFileParams): Promise<FileResult | null> {
  const gh = userClient(p.token)
  try {
    const r = await gh.repos.getContent({
      owner: p.owner,
      repo: p.repo,
      path: p.path,
      ref: p.ref,
    })
    if (Array.isArray(r.data) || r.data.type !== "file") {
      throw new Error("not_a_file")
    }
    const b64 = (r.data.content as string).replace(/\n/g, "")
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const content = new TextDecoder("utf-8", { fatal: false, ignoreBOM: false }).decode(bytes)
    return { content, sha: r.data.sha }
  } catch (e: any) {
    if (e?.status === 404) return null
    throw e
  }
}
