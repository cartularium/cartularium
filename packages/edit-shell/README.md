# @cartularium/edit-shell

Cloudflare Worker that powers the inline contribution flow for sheets.wiki and assay.sheets.wiki. Provides authenticated GitHub-backed endpoints under `/api/edit/*` on each property.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/edit/health` | smoke test |
| `GET` | `/api/edit/auth/login?redirect=...` | start GitHub App OAuth |
| `GET` | `/api/edit/auth/callback` | exchange code → session |
| `GET` | `/api/edit/auth/me` | current user |
| `POST` | `/api/edit/auth/logout` | clear session |
| `GET` | `/api/edit/contents/:path` | read file from canonical |
| `PUT` | `/api/edit/contents/:path` | write file to draft branch in user's fork |
| `GET` | `/api/edit/drafts` | list user's draft branches |
| `POST` | `/api/edit/pr` | open PR from fork to canonical |
| `POST` | `/api/edit/assets` | upload image to R2, content-addressed |
| `GET` | `/api/edit/assay/contracts` | discover assay API, payload, and error-envelope versions |
| `GET` | `/api/edit/assay/runner-status` | maintainer-only assay runner queue and stale-job status |
| `GET` | `/api/edit/assay/submitted-cases?status=...` | list submitted-case review summaries for the current user |
| `POST` | `/api/edit/assay/submitted-cases` | store a valid draft-local assay case before canonical acceptance |
| `GET` | `/api/edit/assay/submitted-cases/:id` | read submitted-case review detail without loading full R2 payloads |
| `POST` | `/api/edit/assay/submitted-cases/:id/preview-jobs` | enqueue a preview job anchored to a submitted case |
| `GET` | `/api/edit/assay/submitted-cases/:id/runs/latest` | read the latest preview job, result row summary, and R2 payload anchored to a submitted case |
| `POST` | `/api/edit/assay/submitted-cases/:id/submit` | mark a draft-local case ready for review |
| `POST` | `/api/edit/assay/submitted-cases/:id/accept` | accept a submitted case after a compatible completed preview result |
| `POST` | `/api/edit/assay/submitted-cases/:id/reject` | reject a submitted case with reviewer diagnostics |
| `GET` | `/api/edit/assay/submitted-cases/:id/pr-proposal` | export accepted case as PR-ready assay test YAML and PR body |
| `POST` | `/api/edit/assay/submitted-cases/:id/pr` | materialize an accepted case into a maintainer PR without fixtures |
| `POST` | `/api/edit/assay/preview-jobs` | enqueue an assay preview job for runner evaluation |
| `GET` | `/api/edit/assay/cases/:caseId/runs/latest?draftId=...` | read the latest draft-local preview job, result row summary, and R2 payload |
| `GET` | `/api/edit/assay-runner/contracts` | runner-side contract and capability discovery |
| `GET` | `/api/edit/assay-runner/status` | runner-token queue, platform, stale-job, and runner summary |
| `POST` | `/api/edit/assay-runner/jobs/claim` | claim a compatible queued assay preview job |
| `POST` | `/api/edit/assay-runner/jobs/:jobId/heartbeat` | refresh a claim and mark a job claimed/running |
| `POST` | `/api/edit/assay-runner/jobs/:jobId/result` | upload a claimed assay preview result |

## Assay Contracts

Assay APIs start at version `1`. Discovery endpoints return the currently accepted submitted-case, preview-input, and preview-result contract versions. Submitted cases are stored as draft-local records in D1 and their payloads live in R2 under `assay/submitted-cases/<submittedCaseId>/case.v1.json`. Preview jobs created from submitted cases carry `submittedCaseId`, so draft-local results remain associated with the submitted case before canonical acceptance. Result uploads write both the R2 payload and an `assay_preview_results` D1 row for history and lookup.

Submitted-case contract `1` is intentionally narrow: formula, grid, expectation, features, and tags. Richer future cases such as named functions, workbook state, platform-specific setup, volatile behavior, external effects, and benchmarks should use new submitted-case/input/result contract versions plus runner capability negotiation rather than ad hoc fields in v1.

If `requestedPlatforms` is omitted, submitted cases default to the maintainer review lane `excel,gsheets`. Contract discovery also exposes this default. HyperFormula remains available for explicit smoke jobs and hosts that are not ready for Excel/GSheets.

Submitted-case lifecycle is explicit: `draft` or `rejected` cases can be submitted, `submitted` cases can be rejected, and `submitted` cases can be accepted only after a completed result exists at the current preview-result contract version. Acceptance stores a `canonicalCaseId` separately from the opaque submitted-case id. `ASSAY_MAINTAINERS` is a comma-separated GitHub login allowlist; maintainers can review all submitted cases and accept/reject cases from other users, while non-maintainers can only see their own submissions. Review list/detail responses include the latest preview job/result summary plus a compact `reviewReferences` block with submitted-case D1/R2 handles, accepted-result D1/R2 handles when present, the relevant preview-job D1/input R2 handles, and the case hash. Latest-run responses include the preview job metadata, a result row summary when one exists, and the raw result R2 payload so editor/review tools can inspect outputs without loading the submitted-case detail response itself.

Accepted cases can be exported as PR proposals or materialized into maintainer pull requests. The proposal contains one assay test YAML target, PR-body provenance, and maintainer references for the submitted case, accepted preview result, preview job, and R2 objects. The PR endpoint writes only YAML to a maintainer fork branch and opens or updates a GitHub PR. It does not contain fixture files; fixture generation remains a maintainer review step.

`POST /api/edit/assay/submitted-cases` rejects malformed cases before storage using the versioned error envelope:

```json
{
  "error": {
    "code": "invalid_submitted_case",
    "message": "Submitted case is not valid enough to store.",
    "requestId": "abc123def456",
    "details": [{ "field": "case.formula", "message": "Formula must start with '='." }]
  }
}
```

Runner claim requests include `supportedInputContracts` and may include `supportedResultContracts`. If the runner cannot accept the current result contract, the API returns `{ "job": null }` rather than assigning an incompatible job. Claimed jobs should heartbeat while evaluating; the heartbeat can move the job to `running`, and stale `claimed` or `running` jobs are returned to the queue after the claim timeout. `GET /api/edit/assay-runner/status` exposes queue counts, platform-set counts, runner summaries, and capped stale-job details to runner tokens. Maintainers can view the same payload through `GET /api/edit/assay/runner-status`.

## Authentication

- GitHub App with user-to-server token flow. User installs the App once on their account; subsequent `/auth/login` round-trips issue user-to-server tokens for the same App.
- Tokens stored server-side in KV; the browser only sees an opaque session cookie scoped to `Domain=.sheets.wiki`.
- All mutating endpoints require both the session cookie and a whitelisted `Origin` header.

## Develop

```sh
pnpm --filter @cartularium/edit-shell dev
pnpm --filter @cartularium/edit-shell test
```

## Deploy

See `internal/edit-shell-deploy.md` for the secrets checklist and one-time setup.

## License

MIT.
