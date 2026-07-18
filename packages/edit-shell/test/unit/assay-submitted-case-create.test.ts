import { describe, expect, it, vi } from "vitest"
import app from "../../src/index"

describe("submitted case creation", () => {
  it("returns the draft response when the immediate D1 readback misses the inserted row", async () => {
    const assayPreviewPut = vi.fn(async () => undefined)
    const inserted: unknown[][] = []
    const env = {
      ALLOWED_ORIGINS: "https://sheets.wiki",
      ASSAY_MAINTAINERS: "Astral1119",
      CANONICAL_OWNER: "cartularium",
      CANONICAL_REPO: "cartularium",
      COOKIE_DOMAIN: ".sheets.wiki",
      GITHUB_APP_ID: "1",
      RATE_LIMIT: {
        get: vi.fn(async () => null),
        put: vi.fn(async () => undefined),
      },
      SESSIONS: {
        get: vi.fn(async (key: string) => {
          if (key !== "test-session") return null
          return JSON.stringify({
            user_login: "Astral1119",
            user_id: 73253308,
            user_token: "ghu_test",
            token_expiry: Date.now() + 60_000,
            fork_repo: null,
          })
        }),
        put: vi.fn(async () => undefined),
        delete: vi.fn(async () => undefined),
      },
      ASSAY_PREVIEW: {
        put: assayPreviewPut,
      },
      ASSAY_PREVIEW_DB: {
        prepare(sql: string) {
          const statement = {
            values: [] as unknown[],
            bind(...values: unknown[]) {
              this.values = values
              return this
            },
            async run() {
              if (sql.includes("INSERT INTO assay_submitted_cases")) {
                inserted.push(this.values)
                return { success: true }
              }
              throw new Error(`Unexpected run SQL: ${sql}`)
            },
            async first() {
              if (sql.includes("SELECT * FROM assay_submitted_cases WHERE id = ?")) {
                return null
              }
              throw new Error(`Unexpected first SQL: ${sql}`)
            },
          }
          return statement
        },
      },
    }

    const response = await app.fetch(
      new Request("https://sheets.wiki/api/edit/assay/submitted-cases", {
        method: "POST",
        headers: {
          Cookie: "__cart_sess=test-session",
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractVersion: 1,
          draftId: "draft/Astral1119/readback-lag",
          case: {
            id: "submitted/readback-lag",
            subject: "SUM",
            name: "readback-lag",
            category: "value",
            formula: "=SUM(2,2)",
            expect: 4,
          },
        }),
      }),
      env,
    )

    expect(response.status).toBe(201)
    const body = await response.json() as {
      submittedCase: {
        id: string
        draftId: string
        localCaseId: string
        ownerId: string
        status: string
        requestedPlatforms: string[]
        canonicalCaseId: string | null
      }
    }
    expect(body.submittedCase).toMatchObject({
      draftId: "draft/Astral1119/readback-lag",
      localCaseId: "submitted/readback-lag",
      ownerId: "Astral1119",
      status: "draft",
      requestedPlatforms: ["excel", "gsheets"],
      canonicalCaseId: null,
    })
    expect(body.submittedCase.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(inserted).toHaveLength(1)
    expect(assayPreviewPut).toHaveBeenCalledWith(
      expect.stringMatching(/^assay\/submitted-cases\/[0-9a-f-]{36}\/case\.v1\.json$/),
      expect.stringContaining('"draftId":"draft/Astral1119/readback-lag"'),
      { httpMetadata: { contentType: "application/json" } },
    )
  })

  it("returns the queued preview job when the immediate D1 job readback misses the inserted row", async () => {
    const assayPreviewPut = vi.fn(async () => undefined)
    const inserted: unknown[][] = []
    const submittedCaseRow = {
      id: "submitted-case-id",
      owner_id: "Astral1119",
      draft_id: "draft/Astral1119/readback-lag",
      local_case_id: "submitted/readback-lag",
      status: "draft",
      case_hash: "a".repeat(64),
      input_contract_version: 1,
      case_schema_version: 2,
      requested_platforms_json: JSON.stringify(["excel", "gsheets"]),
      case_r2_key: "assay/submitted-cases/submitted-case-id/case.v1.json",
      source: "sheets-wiki",
      canonical_case_id: null,
      accepted_result_id: null,
      created_at: "2026-05-16T00:00:00.000Z",
      updated_at: "2026-05-16T00:00:00.000Z",
      submitted_at: null,
      accepted_at: null,
      rejected_at: null,
      error_code: null,
      error_message: null,
    }
    const env = {
      ALLOWED_ORIGINS: "https://sheets.wiki",
      ASSAY_MAINTAINERS: "Astral1119",
      CANONICAL_OWNER: "cartularium",
      CANONICAL_REPO: "cartularium",
      COOKIE_DOMAIN: ".sheets.wiki",
      GITHUB_APP_ID: "1",
      RATE_LIMIT: {
        get: vi.fn(async () => null),
        put: vi.fn(async () => undefined),
      },
      SESSIONS: {
        get: vi.fn(async (key: string) => {
          if (key !== "test-session") return null
          return JSON.stringify({
            user_login: "Astral1119",
            user_id: 73253308,
            user_token: "ghu_test",
            token_expiry: Date.now() + 60_000,
            fork_repo: null,
          })
        }),
        put: vi.fn(async () => undefined),
        delete: vi.fn(async () => undefined),
      },
      ASSAY_PREVIEW: {
        get: vi.fn(async () => ({
          json: async () => ({
            contractVersion: 1,
            case: {
              id: "submitted/readback-lag",
              subject: "SUM",
              name: "readback-lag",
              category: "value",
              formula: "=SUM(2,2)",
              expect: 4,
            },
          }),
        })),
        put: assayPreviewPut,
      },
      ASSAY_PREVIEW_DB: {
        prepare(sql: string) {
          const statement = {
            values: [] as unknown[],
            bind(...values: unknown[]) {
              this.values = values
              return this
            },
            async run() {
              if (sql.includes("INSERT INTO assay_preview_jobs")) {
                inserted.push(this.values)
                return { success: true }
              }
              throw new Error(`Unexpected run SQL: ${sql}`)
            },
            async first() {
              if (sql.includes("SELECT * FROM assay_submitted_cases WHERE id = ? AND owner_id = ?")) {
                return submittedCaseRow
              }
              if (sql.includes("SELECT * FROM assay_preview_jobs WHERE id = ?")) {
                return null
              }
              throw new Error(`Unexpected first SQL: ${sql}`)
            },
          }
          return statement
        },
      },
    }

    const response = await app.fetch(
      new Request("https://sheets.wiki/api/edit/assay/submitted-cases/submitted-case-id/preview-jobs", {
        method: "POST",
        headers: {
          Cookie: "__cart_sess=test-session",
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priority: 10 }),
      }),
      env,
    )

    expect(response.status).toBe(202)
    const body = await response.json() as {
      job: {
        id: string
        submittedCaseId: string
        draftId: string
        caseId: string
        ownerId: string
        state: string
        priority: number
        requestedPlatforms: string[]
      }
    }
    expect(body.job).toMatchObject({
      submittedCaseId: "submitted-case-id",
      draftId: "draft/Astral1119/readback-lag",
      caseId: "submitted/readback-lag",
      ownerId: "Astral1119",
      state: "queued",
      priority: 10,
      requestedPlatforms: ["excel", "gsheets"],
    })
    expect(body.job.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(inserted).toHaveLength(1)
    expect(assayPreviewPut).toHaveBeenCalledWith(
      expect.stringMatching(/^assay-preview\/inputs\/[0-9a-f-]{36}\.json$/),
      expect.stringContaining('"submitted/readback-lag"'),
      { httpMetadata: { contentType: "application/json" } },
    )
  })
})
