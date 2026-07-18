import { Hono } from "hono"
import type { Env } from "../env"
import { listDraftBranches, listDraftFiles } from "../github/drafts"

const app = new Hono<{ Bindings: Env }>()

app.get("/", async (c) => {
  const fork = c.var.session.fork_repo
  if (!fork) return c.json({ drafts: [] })
  const [owner, repo] = fork.split("/")
  if (!owner || !repo) return c.json({ error: "bad_fork_repo" }, 500)
  const drafts = await listDraftBranches({
    token: c.var.session.user_token,
    owner,
    repo,
    userLogin: c.var.session.user_login,
  })
  return c.json({ drafts })
})

// `:branch{.+}` matches a single (URL-encoded) path segment — the SPA must
// `encodeURIComponent` the branch name so its slashes don't get split off as
// separate route segments by Hono's trie router (same pattern as `contents`).
// The literal `/files` suffix lets the `{.+}` regex use a positive lookahead
// to disambiguate this route from `GET /` (the drafts index).
app.get("/:branch{.+}/files", async (c) => {
  const fork = c.var.session.fork_repo
  if (!fork) return c.json({ error: "no_fork" }, 400)
  const [owner, repo] = fork.split("/")
  if (!owner || !repo) return c.json({ error: "bad_fork_repo" }, 500)
  // Hono decodes path params with `decodeURI` (not `decodeURIComponent`), so
  // `%2F` survives — decode explicitly to recover the raw branch name.
  const branch = decodeURIComponent(c.req.param("branch"))
  // Restrict to branches the session user owns. Without this, any logged-in
  // user could enumerate diffs against arbitrary branches in their fork via
  // the `compareCommitsWithBasehead` call below — draft/<userLogin>/* is the
  // session user's namespace by convention.
  const prefix = `draft/${c.var.session.user_login}/`
  if (!branch.startsWith(prefix)) return c.json({ error: "forbidden" }, 403)
  const files = await listDraftFiles({
    token: c.var.session.user_token,
    owner,
    repo,
    userLogin: c.var.session.user_login,
    branch,
  })
  return c.json({ files })
})

export default app
