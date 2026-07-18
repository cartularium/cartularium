import { describe, expect, it, beforeEach, vi } from "vitest"
import { editShell, AuthRequiredError, EditShellError } from "./edit-shell"

describe("editShell.getMe", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns user info on 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ login: "alice", id: 42, fork_repo: "alice/cartularium" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const me = await editShell.getMe()
    expect(me).toEqual({ login: "alice", id: 42, fork_repo: "alice/cartularium" })
  })

  it("throws AuthRequiredError on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "no_session" }), { status: 401 }),
    )
    await expect(editShell.getMe()).rejects.toBeInstanceOf(AuthRequiredError)
  })
})

describe("editShell.getFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns server-decoded content from response", async () => {
    // edit-shell decodes base64 server-side; the response content is plain UTF-8.
    const content = "# SUMIF\n\nReturns a conditional sum.\n"
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ content, sha: "abc123" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    const file = await editShell.getFile("content/function/SUMIF.md")
    expect(file.content).toBe(content)
    expect(file.sha).toBe("abc123")
    expect(file.path).toBe("content/function/SUMIF.md")
  })

  it("throws EditShellError with status 404 on not_found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "not_found" }), { status: 404 }),
    )
    const err = await editShell.getFile("content/function/MISSING.md").catch((e) => e)
    expect(err.status).toBe(404)
    expect(err.message).toMatch(/404|not.found/i)
  })

  it("throws AuthRequiredError on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    )
    await expect(editShell.getFile("content/function/SUMIF.md")).rejects.toBeInstanceOf(AuthRequiredError)
  })
})

describe("editShell.saveDraft", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("sends content as PUT body and returns result", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ branch: "draft/alice/abc", commit_sha: "newsha", content_sha: "contentsha" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    const result = await editShell.saveDraft("content/function/SUMIF.md", "# new content")
    expect(result.commit_sha).toBe("newsha")
    expect(result.branch).toBe("draft/alice/abc")
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/contents/content%2Ffunction%2FSUMIF.md",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ content: "# new content" }),
      }),
    )
  })

  it("forwards optional branch and message", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ branch: "my-branch", commit_sha: "sha1", content_sha: "sha2" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    await editShell.saveDraft("content/function/SUMIF.md", "body", {
      branch: "my-branch",
      message: "my message",
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ content: "body", branch: "my-branch", message: "my message" }),
      }),
    )
  })

  it("re-throws AuthRequiredError on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    )
    await expect(editShell.saveDraft("p", "c")).rejects.toBeInstanceOf(AuthRequiredError)
  })
})

describe("editShell.uploadAsset", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("posts FormData with the file and returns { url, key }", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ url: "https://assets.sheets.wiki/abc/foo.png", key: "abc/foo.png" }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    )
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "foo.png", {
      type: "image/png",
    })
    const result = await editShell.uploadAsset(file)
    expect(result).toEqual({ url: "https://assets.sheets.wiki/abc/foo.png", key: "abc/foo.png" })
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/assets",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: expect.any(FormData),
      }),
    )
    const init = fetchSpy.mock.calls[0]![1] as RequestInit
    expect((init.body as FormData).get("file")).toBe(file)
  })

  it("throws AuthRequiredError on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    )
    const file = new File([new Uint8Array([0x89, 0x50])], "x.png", { type: "image/png" })
    await expect(editShell.uploadAsset(file)).rejects.toBeInstanceOf(AuthRequiredError)
  })

  it("throws EditShellError on 4xx with the server's error code in the message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "too_large" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const file = new File([new Uint8Array([0x89, 0x50])], "huge.png", { type: "image/png" })
    const err = await editShell.uploadAsset(file).catch((e) => e)
    expect(err).toBeInstanceOf(EditShellError)
    expect(err.status).toBe(413)
    expect(err.message).toMatch(/413 too_large/)
  })
})

describe("editShell.listDrafts", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /api/edit/drafts and returns the drafts array", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          drafts: [
            {
              branch: "draft/x/SUMIF",
              slug: "SUMIF",
              commit_sha: "abc",
              updated_at: "2026-05-03T00:00:00Z",
              files: [],
              added: 0,
              removed: 0,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    const result = await editShell.listDrafts()
    expect(result.drafts).toHaveLength(1)
    expect(result.drafts[0]!.slug).toBe("SUMIF")
    expect(fetchSpy).toHaveBeenCalledWith("/api/edit/drafts", expect.any(Object))
  })

  it("throws AuthRequiredError on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    )
    await expect(editShell.listDrafts()).rejects.toBeInstanceOf(AuthRequiredError)
  })
})

describe("editShell.listDraftFiles", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("GETs /api/edit/drafts/<encoded-branch>/files and returns files", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          files: [{ path: "packages/sheets-wiki/content/function/SUMIF.md", added: 3, removed: 1 }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    const result = await editShell.listDraftFiles("draft/alice/SUMIF")
    expect(result.files).toHaveLength(1)
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/drafts/draft%2Falice%2FSUMIF/files",
      expect.any(Object),
    )
  })
})

describe("editShell.submitDraft", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns success on 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ number: 12, url: "https://github.com/x/y/pull/12", mergeable: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )
    const r = await editShell.submitDraft({
      branch: "draft/x/SUMIF",
      title: "fix",
      body: "y",
    })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.number).toBe(12)
      expect(r.url).toBe("https://github.com/x/y/pull/12")
      expect(r.mergeable).toBe(true)
    }
  })

  it("returns conflict on 409 with pr_url", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "conflict",
          pr_url: "https://github.com/x/y/pull/13",
          pr_number: 13,
          message: "PR has merge conflicts",
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      ),
    )
    const r = await editShell.submitDraft({
      branch: "draft/x/SUMIF",
      title: "fix",
      body: "y",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.kind).toBe("conflict")
      if (r.kind === "conflict") {
        expect(r.prUrl).toBe("https://github.com/x/y/pull/13")
        expect(r.prNumber).toBe(13)
      }
    }
  })

  it("throws AuthRequiredError on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    )
    await expect(
      editShell.submitDraft({ branch: "draft/x/SUMIF", title: "fix", body: "y" }),
    ).rejects.toBeInstanceOf(AuthRequiredError)
  })

  it("returns error result on other non-ok statuses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const r = await editShell.submitDraft({
      branch: "draft/x/SUMIF",
      title: "fix",
      body: "y",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.kind).toBe("error")
      if (r.kind === "error") {
        expect(r.status).toBe(429)
        expect(r.message).toMatch(/429 rate_limited/)
      }
    }
  })
})

describe("editShell assay APIs", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("creates a submitted assay case with contract version and candidate payload", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          submittedCase: {
            id: "case-1",
            status: "draft",
            requestedPlatforms: ["excel", "gsheets"],
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    )

    const result = await editShell.createSubmittedCase({
      contractVersion: 1,
      draftId: "draft/alice/assay-sum",
      case: {
        id: "submitted/sum",
        subject: "SUM",
        name: "sum",
        category: "value",
        formula: "=SUM(2,2)",
        expect: 4,
      },
    })

    expect(result.submittedCase.id).toBe("case-1")
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/assay/submitted-cases",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          contractVersion: 1,
          draftId: "draft/alice/assay-sum",
          case: {
            id: "submitted/sum",
            subject: "SUM",
            name: "sum",
            category: "value",
            formula: "=SUM(2,2)",
            expect: 4,
          },
        }),
      }),
    )
  })

  it("queues a submitted-case preview job with priority", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ job: { id: "job-1", state: "queued" } }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const result = await editShell.previewSubmittedCase("case-1", { priority: 10 })

    expect(result.job.id).toBe("job-1")
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/assay/submitted-cases/case-1/preview-jobs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ priority: 10 }),
      }),
    )
  })

  it("accepts a completed submitted case with a canonical public ref", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ submittedCase: { id: "case-1", status: "accepted" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    const result = await editShell.acceptSubmittedCase("case-1", {
      canonicalCaseId: "SUM/sum-proof",
    })

    expect(result.submittedCase.status).toBe("accepted")
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/assay/submitted-cases/case-1/accept",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ canonicalCaseId: "SUM/sum-proof" }),
      }),
    )
  })

  it("fetches submitted-case latest preview payloads", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          job: { id: "job-1", state: "completed" },
          resultSummary: { id: "result-1", resultR2Key: "assay-preview/results/job-1.json" },
          result: {
            contractVersion: 1,
            jobId: "job-1",
            candidateHash: "hash-1",
            platforms: { excel: { state: "succeeded", result: [[4]], expected: [[4]], passed: true } },
            diagnostics: [],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    const result = await editShell.getSubmittedCaseLatestRun("case-1")

    expect(result.resultSummary?.id).toBe("result-1")
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/assay/submitted-cases/case-1/runs/latest",
      expect.objectContaining({ credentials: "include" }),
    )
  })

  it("fetches draft-local latest preview payloads", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ job: null, resultSummary: null, result: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    await editShell.getDraftCaseLatestRun("case/slash", "draft/alice/proof")

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/edit/assay/cases/case%2Fslash/runs/latest?draftId=draft%2Falice%2Fproof",
      expect.objectContaining({ credentials: "include" }),
    )
  })

  it("surfaces versioned assay API errors in EditShellError messages", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: "invalid_submitted_case",
            message: "Submitted case is not valid enough to store.",
            requestId: "abc123",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    )

    const err = await editShell.createSubmittedCase({
      contractVersion: 1,
      draftId: "draft/alice/bad",
      case: {
        id: "submitted/bad",
        subject: "SUM",
        category: "value",
        formula: "SUM(2,2)",
      },
    }).catch((e) => e)

    expect(err).toBeInstanceOf(EditShellError)
    expect(err.message).toContain("invalid_submitted_case")
    expect(err.message).toContain("Submitted case is not valid enough to store.")
    expect(err.requestId).toBe("abc123")
  })
})
