import { fetchMock } from "cloudflare:test"

const JSON_HEADERS = { "content-type": "application/json" }

// undici MockAgent's body matcher receives the request body as a string (or
// Uint8Array if binary). Wrap a JSON-shape predicate so callers can write
// `(parsed) => parsed.code === "x"` without re-doing the parse boilerplate.
function jsonBodyMatcher(predicate: (parsed: any) => boolean) {
  return (body: unknown): boolean => {
    try {
      const text =
        typeof body === "string"
          ? body
          : new TextDecoder().decode(body as Uint8Array)
      return predicate(JSON.parse(text))
    } catch {
      return false
    }
  }
}

export const githubHandlers = {
  exchangeCodeOk(opts: { expectCode?: string } = {}) {
    fetchMock
      .get("https://github.com")
      .intercept({
        path: "/login/oauth/access_token",
        method: "POST",
        ...(opts.expectCode !== undefined && {
          body: jsonBodyMatcher((p) => p.code === opts.expectCode),
        }),
      })
      .reply(
        200,
        JSON.stringify({
          access_token: "ghu_test_user_token",
          token_type: "bearer",
          expires_in: 28800,
          refresh_token: "ghr_test_refresh",
          refresh_token_expires_in: 15897600,
          scope: "",
        }),
        { headers: JSON_HEADERS },
      )
  },
  exchangeCodeBadCode() {
    fetchMock
      .get("https://github.com")
      .intercept({ path: "/login/oauth/access_token", method: "POST" })
      .reply(
        200,
        JSON.stringify({ error: "bad_verification_code", error_description: "..." }),
        { headers: JSON_HEADERS },
      )
  },
  getAuthenticatedUser(login = "alice", id = 12345) {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: "/user", method: "GET" })
      .reply(
        200,
        JSON.stringify({ login, id, name: login, type: "User" }),
        { headers: JSON_HEADERS },
      )
  },
  getRepoForkExists(forkOwner: string, repo = "cartularium") {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${forkOwner}/${repo}`, method: "GET" })
      .reply(
        200,
        JSON.stringify({
          full_name: `${forkOwner}/${repo}`,
          fork: true,
          parent: { full_name: `cartularium/${repo}` },
        }),
        { headers: JSON_HEADERS },
      )
  },
  getRepoNotFound(forkOwner: string, repo = "cartularium") {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${forkOwner}/${repo}`, method: "GET" })
      .reply(404, JSON.stringify({ message: "Not Found" }), { headers: JSON_HEADERS })
  },
  createFork(forkOwner: string, repo = "cartularium") {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/cartularium/${repo}/forks`, method: "POST" })
      .reply(
        202,
        JSON.stringify({ full_name: `${forkOwner}/${repo}`, fork: true }),
        { headers: JSON_HEADERS },
      )
  },
  getContent(
    owner: string,
    repo: string,
    path: string,
    content: string,
    sha = "abc123",
    ref?: string,
  ) {
    // Octokit URL-encodes slashes inside the {path} segment, so the intercept
    // must match the encoded form (e.g. `packages%2Fsheets-wiki%2F...`).
    const encodedPath = encodeURIComponent(path)
    // Octokit appends `?ref=<branch>` when a ref is supplied; the wire form
    // URL-encodes the ref value. Match either form via the optional `ref` arg.
    const suffix = ref ? `?ref=${encodeURIComponent(ref)}` : ""
    // GitHub returns base64-encoded UTF-8 bytes, so encode via the same
    // unescape(encodeURIComponent(...)) dance used by the write path to
    // support non-ASCII payloads (em-dashes, CJK, etc.).
    const b64 = btoa(unescape(encodeURIComponent(content)))
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/contents/${encodedPath}${suffix}`,
        method: "GET",
      })
      .reply(
        200,
        JSON.stringify({
          type: "file",
          encoding: "base64",
          size: content.length,
          name: path.split("/").pop(),
          path,
          content: b64.match(/.{1,60}/g)!.join("\n") + "\n",
          sha,
          url: "",
          git_url: "",
          html_url: "",
          download_url: "",
        }),
        { headers: JSON_HEADERS },
      )
  },
  getContentMissing(owner: string, repo: string, path: string, ref?: string) {
    const encodedPath = encodeURIComponent(path)
    // Octokit appends `?ref=<branch>` when a ref is supplied; the wire form
    // URL-encodes the ref value. Match either form via the optional `ref` arg.
    const suffix = ref ? `?ref=${encodeURIComponent(ref)}` : ""
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/contents/${encodedPath}${suffix}`, method: "GET" })
      .reply(404, JSON.stringify({ message: "Not Found" }), { headers: JSON_HEADERS })
  },
  putContentNotFound(owner: string, repo: string, path: string) {
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
        method: "PUT",
      })
      .reply(404, JSON.stringify({ message: "Not Found" }), { headers: JSON_HEADERS })
  },
  putContent(
    owner: string,
    repo: string,
    path: string,
    sha = "newsha456",
    opts: { expectBase64Content?: boolean; expectNonEmptyMessage?: boolean } = {},
  ) {
    // Octokit URL-encodes path placeholders on the wire — encode here to match.
    const wantsBodyCheck =
      opts.expectBase64Content || opts.expectNonEmptyMessage
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
        method: "PUT",
        ...(wantsBodyCheck && {
          body: jsonBodyMatcher((p) => {
            if (opts.expectBase64Content) {
              if (typeof p.content !== "string") return false
              // Base64 charset incl. padding.
              if (!/^[A-Za-z0-9+/]+=*$/.test(p.content)) return false
            }
            if (opts.expectNonEmptyMessage) {
              if (typeof p.message !== "string" || p.message.length === 0) {
                return false
              }
            }
            return true
          }),
        }),
      })
      .reply(
        200,
        JSON.stringify({
          content: { sha, path, name: path.split("/").pop() },
          commit: { sha: "commit-sha-789" },
        }),
        { headers: JSON_HEADERS },
      )
  },
  getRefMissing(owner: string, repo: string, ref: string) {
    // Octokit URL-encodes the {ref} placeholder fully on the wire (including
    // the slash between "heads" and the branch). Normalize: decode any
    // pre-encoded segments the caller supplied, then re-encode the whole ref.
    const wireRef = encodeURIComponent(decodeURIComponent(ref))
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/git/ref/${wireRef}`, method: "GET" })
      .reply(404, JSON.stringify({ message: "Not Found" }), { headers: JSON_HEADERS })
  },
  getRefExists(owner: string, repo: string, ref: string, sha = "default-sha") {
    const wireRef = encodeURIComponent(decodeURIComponent(ref))
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/git/ref/${wireRef}`, method: "GET" })
      .reply(
        200,
        JSON.stringify({ ref: `refs/${decodeURIComponent(ref)}`, object: { sha, type: "commit" } }),
        { headers: JSON_HEADERS },
      )
  },
  getDefaultBranchSha(owner: string, repo: string, sha = "main-sha") {
    // Wire form: "heads/main" → "heads%2Fmain" after Octokit encodes.
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/git/ref/heads%2Fmain`, method: "GET" })
      .reply(
        200,
        JSON.stringify({ ref: "refs/heads/main", object: { sha, type: "commit" } }),
        { headers: JSON_HEADERS },
      )
  },
  createRef(owner: string, repo: string) {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/git/refs`, method: "POST" })
      .reply(201, JSON.stringify({}), { headers: JSON_HEADERS })
  },
  createRefConflict(owner: string, repo: string) {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/git/refs`, method: "POST" })
      .reply(
        422,
        JSON.stringify({ message: "Reference already exists" }),
        { headers: JSON_HEADERS },
      )
  },
  listBranches(owner: string, repo: string, branches: Array<{ name: string; sha?: string }>) {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/branches?per_page=100`, method: "GET" })
      .reply(
        200,
        JSON.stringify(
          branches.map((b) => ({
            name: b.name,
            commit: { sha: b.sha ?? "sha-" + b.name },
          })),
        ),
        { headers: JSON_HEADERS },
      )
  },
  getCommit(owner: string, repo: string, sha: string, dateIso = "2026-04-28T00:00:00Z") {
    fetchMock
      .get("https://api.github.com")
      .intercept({ path: `/repos/${owner}/${repo}/commits/${sha}`, method: "GET" })
      .reply(
        200,
        JSON.stringify({
          sha,
          commit: { author: { date: dateIso }, message: "edit" },
        }),
        { headers: JSON_HEADERS },
      )
  },
  compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string,
    files: Array<{ filename: string; additions: number; deletions: number }>,
    opts: {
      headCommitDate?: string
      // Override ahead_by/commits for squash tests. Default: 1 commit when
      // files exist (existing tests). For squash flow, callers pass multiple
      // commits to exercise the actual squash path.
      commits?: Array<{ sha: string; date?: string }>
      mergeBaseSha?: string
    } = {},
  ) {
    // Octokit's `compareCommitsWithBasehead` URL-encodes the entire
    // `{basehead}` placeholder — slashes in the head branch become `%2F`,
    // and the literal `...` separator is preserved as-is by encodeURIComponent.
    const basehead = encodeURIComponent(`${base}...${head}`)
    const headCommitDate = opts.headCommitDate ?? "2026-05-03T12:00:00Z"
    const commits =
      opts.commits ??
      (files.length > 0
        ? [{ sha: "head" + head, date: headCommitDate }]
        : [])
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/compare/${basehead}`,
        method: "GET",
      })
      .reply(
        200,
        JSON.stringify({
          ahead_by: commits.length,
          behind_by: 0,
          status: commits.length > 0 ? "ahead" : "identical",
          merge_base_commit: {
            sha: opts.mergeBaseSha ?? `${base}-tip`,
          },
          // commits sorted oldest → newest; the last entry is the branch tip.
          // listDraftBranches reads its date; squashDraftBranch reads its
          // sha. Tests that want to exercise multi-commit squash should pass
          // the `commits` option explicitly.
          commits: commits.map((c) => ({
            sha: c.sha,
            commit: {
              author: {
                date: c.date ?? headCommitDate,
                name: "tester",
                email: "t@t",
              },
            },
          })),
          files: files.map((f) => ({
            filename: f.filename,
            additions: f.additions,
            deletions: f.deletions,
            changes: f.additions + f.deletions,
            status: "modified",
          })),
        }),
        { headers: JSON_HEADERS },
      )
  },
  // Squash flow uses the lower-level git data API. These three handlers
  // intercept the read-tree, write-commit, and force-update-ref calls in
  // squashDraftBranch. Default values are placeholders chosen so multiple
  // tests can use the helpers without coordinating SHAs.
  getGitCommit(owner: string, repo: string, sha: string, treeSha = "tree-sha") {
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/git/commits/${sha}`,
        method: "GET",
      })
      .reply(
        200,
        JSON.stringify({
          sha,
          tree: { sha: treeSha },
          message: "autosave commit",
          parents: [{ sha: "prev-sha" }],
        }),
        { headers: JSON_HEADERS },
      )
  },
  createGitCommit(owner: string, repo: string, newSha = "squashed-sha") {
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/git/commits`,
        method: "POST",
      })
      .reply(
        201,
        JSON.stringify({
          sha: newSha,
          tree: { sha: "tree-sha" },
          parents: [{ sha: "merge-base-sha" }],
        }),
        { headers: JSON_HEADERS },
      )
  },
  updateGitRef(owner: string, repo: string, ref: string) {
    // Octokit URL-encodes the ENTIRE `:ref` placeholder when calling
    // PATCH /repos/.../git/refs/{ref} — so "heads/draft/foo/bar" becomes
    // "heads%2Fdraft%2Ffoo%2Fbar" on the wire. Match that exact form here
    // (the same encoding pattern as compareCommits's basehead).
    const encodedRef = encodeURIComponent(ref)
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/git/refs/${encodedRef}`,
        method: "PATCH",
      })
      .reply(
        200,
        JSON.stringify({
          ref: `refs/${ref}`,
          object: { sha: "squashed-sha", type: "commit" },
        }),
        { headers: JSON_HEADERS },
      )
  },
  createPullRequest(number = 42, opts: { expectHead?: string } = {}) {
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/cartularium/cartularium/pulls`,
        method: "POST",
        ...(opts.expectHead !== undefined && {
          body: jsonBodyMatcher((p) => p.head === opts.expectHead),
        }),
      })
      .reply(
        201,
        JSON.stringify({
          number,
          html_url: `https://github.com/cartularium/cartularium/pull/${number}`,
        }),
        { headers: JSON_HEADERS },
      )
  },
  createPullRequestAlreadyExists() {
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/cartularium/cartularium/pulls`,
        method: "POST",
      })
      .reply(
        422,
        JSON.stringify({
          message: "Validation Failed",
          errors: [
            {
              resource: "PullRequest",
              code: "custom",
              message: "A pull request already exists for alice:draft/alice/x.",
            },
          ],
          documentation_url:
            "https://docs.github.com/rest/pulls/pulls#create-a-pull-request",
        }),
        { headers: JSON_HEADERS },
      )
  },
  // Octokit serializes `?head=alice:draft/...&state=open` with the value
  // URL-encoded; undici's `query` matcher takes the decoded form.
  listPullRequestsByHead(
    forkOwner: string,
    branch: string,
    prs: Array<{ number: number; title?: string; body?: string | null }>,
  ) {
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/cartularium/cartularium/pulls`,
        method: "GET",
        query: { head: `${forkOwner}:${branch}`, state: "open" },
      })
      .reply(
        200,
        JSON.stringify(
          prs.map((pr) => ({
            number: pr.number,
            html_url: `https://github.com/cartularium/cartularium/pull/${pr.number}`,
            title: pr.title ?? "",
            body: pr.body ?? "",
            state: "open",
            head: { ref: branch, sha: "head-sha" },
          })),
        ),
        { headers: JSON_HEADERS },
      )
  },
  updatePullRequest(number: number) {
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/cartularium/cartularium/pulls/${number}`,
        method: "PATCH",
      })
      .reply(
        200,
        JSON.stringify({
          number,
          html_url: `https://github.com/cartularium/cartularium/pull/${number}`,
        }),
        { headers: JSON_HEADERS },
      )
  },
  // The create-PR response always carries `mergeable: null` (GitHub computes
  // this asynchronously), so the route polls `pulls.get` once after a short
  // delay. `mergeable` here is the value GitHub has resolved by that time:
  //   true  → clean merge → route returns 200
  //   false → conflicts   → route returns 409 with pr_url + pr_number
  //   null  → still computing → route optimistically returns 200 (the SPA
  //          can surface a real conflict toast on a later refresh)
  getPullRequest(
    number: number,
    mergeable: boolean | null,
    opts: { owner?: string; repo?: string } = {},
  ) {
    const owner = opts.owner ?? "cartularium"
    const repo = opts.repo ?? "cartularium"
    fetchMock
      .get("https://api.github.com")
      .intercept({
        path: `/repos/${owner}/${repo}/pulls/${number}`,
        method: "GET",
      })
      .reply(
        200,
        JSON.stringify({
          number,
          html_url: `https://github.com/${owner}/${repo}/pull/${number}`,
          mergeable,
          mergeable_state: mergeable === false ? "dirty" : "clean",
          state: "open",
        }),
        { headers: JSON_HEADERS },
      )
  },
}
