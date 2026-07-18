# Assay Preview Runner

The preview runner polls edit-shell for submitted assay preview jobs, runs compatible jobs locally,
and uploads versioned results. It is designed for unattended hosts, but each host should advertise
only the platforms it can actually run in that environment.

## Contracts

The runner currently speaks preview input contract `1` and preview result contract `1`.
Contract discovery lives at:

- `GET /api/edit/assay/contracts`
- `GET /api/edit/assay-runner/contracts`

Submitted-case contract `1` intentionally covers narrow formula cases: formula, grid, expectation,
features, and tags. Future richer scenarios such as named functions, workbook state,
platform-specific setup, volatile behavior, external effects, and benchmarking should arrive through
new submitted-case/input/result contract versions plus runner capability negotiation. Do not extend
v1 with unversioned ad hoc fields.

## Platform Strategy

The default production review lane is:

```text
excel,gsheets
```

That lane is the target for maintainer review because Excel and Google Sheets are the reference
engines most users care about. HyperFormula remains useful for cheap smoke jobs and can be pinned
explicitly on hosts that are not ready for Excel or Google credentials.

`assay preview-worker` resolves platforms in this order:

1. `--platform` / `-p`
2. `ASSAY_RUNNER_PLATFORMS`
3. `excel,gsheets`

Examples:

```sh
assay preview-worker --platform excel,gsheets
ASSAY_RUNNER_PLATFORMS=hyperformula assay preview-worker
```

The runner refuses to start if asked to advertise a known assay platform that is not implemented for
preview jobs.

## Host Setup

Required environment:

- `ASSAY_RUNNER_TOKEN`: bearer token for `/api/edit/assay-runner/*`
- `ASSAY_RUNNER_BASE_URL`: defaults to `https://sheets.wiki/api/edit`
- `ASSAY_RUNNER_ID`: optional stable host id; defaults to hostname
- `ASSAY_RUNNER_PLATFORMS`: optional platform override
- `ASSAY_SPREADSHEET_ID`: optional Google Sheets scratch spreadsheet
- `ASSAY_GOOGLE_CREDENTIALS_PATH`: optional path to Google OAuth client credentials JSON
- `ASSAY_GOOGLE_CREDENTIALS_JSON`: optional inline Google OAuth client credentials JSON

Google Sheets requires `assay login` or `ASSAY_GOOGLE_TOKEN_JSON`, OAuth client credentials for
refresh, and a scratch spreadsheet the runner identity can edit. Prefer a runner-owned scratch
spreadsheet pinned by `ASSAY_SPREADSHEET_ID`; relying on the code default is brittle because the
runner identity may not have access.

Excel requires the macOS GUI session and Python/xlwings setup from `assay setup`.

## macOS Excel Automation

Excel evaluation uses xlwings/appscript, so macOS TCC Automation permissions decide whether the
process may control Microsoft Excel. When permission is missing, Excel failures commonly surface as:

```text
OSERROR: -1743
MESSAGE: The user has declined permission.
```

Do not assume an SSH-launched Python process can control Excel. A production host can split lanes
so headless-safe work runs unattended while Excel runs from a GUI/TCC-permitted context:

- Headless-safe worker: `--platform hyperformula`, unattended and restartable.
- GUI review worker: `--platform excel,gsheets`, started by a GUI app or supervisor that has
  Automation permission to control Excel.

Supervision should ensure exactly one `preview-worker --platform excel,gsheets` process is active
for the review lane.

The Excel driver honors `ASSAY_EXCEL_TMPDIR` for experiments and falls back to system temp if macOS
blocks the Excel container temp directory, but Excel may still require GUI file-access prompts for
workbooks outside its container.

## Operations

Use launchd or another supervisor; do not rely on an SSH shell staying alive. A healthy runner should:

- build successfully with `pnpm --filter assay build`
- typecheck with `pnpm --filter assay check`
- reach `GET /api/edit/assay-runner/contracts` with its bearer token
- report `ok` from `GET /api/edit/assay-runner/status`, or `degraded` only when known stale
  `claimed`/`running` jobs need attention
- pass an `excel,gsheets` preview smoke from the GUI/TCC-permitted context
- heartbeat claimed jobs before running them
- upload either a completed result or a failed result with diagnostics

Stale `claimed` or `running` jobs are returned to the queue by the edit-shell claim endpoint after
the claim timeout.

Runner-token status check:

```sh
assay preview-status
assay preview-status --json
```

`preview-status` reads `ASSAY_RUNNER_TOKEN` and `ASSAY_RUNNER_BASE_URL`, calls the runner-token
status endpoint, prints a compact operator summary, and exits `0` for `ok` or `2` for `degraded`.
That makes it suitable for launchd/watchdog scripts and cron-style alert checks. The JSON payload
contains aggregate queue counts, platform-set counts, per-runner summaries, and a capped list of
stale jobs. The maintainer session equivalent is `GET /api/edit/assay/runner-status`.

Raw endpoint check:

```sh
curl -fsS \
  -H "Authorization: Bearer $ASSAY_RUNNER_TOKEN" \
  "$ASSAY_RUNNER_BASE_URL/assay-runner/status"
```

## Runbook Shape

Keep one host-local runbook that records the concrete checkout path, environment file path,
supervisor labels, log paths, and restart commands for that host. Do not rely on memory or terminal
history for production runner operations.

A production host should have:

- a clean checkout pinned to `main`
- a private environment file that is not inside the git checkout
- one unattended worker for headless-safe platforms
- one GUI/TCC-permitted worker for Excel-backed review work, when Excel is enabled
- a watchdog or supervisor that starts a missing worker but does not start duplicates
- a latest status snapshot written by `assay preview-status`
- retained logs for worker stdout/stderr, watchdog stdout/stderr, and status-command failures

Suggested operator checks:

```sh
git -C "$CHECKOUT_DIR" status --short
git -C "$CHECKOUT_DIR" log --oneline -1
pnpm --filter assay run build
pnpm --filter assay run check
assay preview-status
pgrep -fl "preview-worker"
```

Restart policy:

- Restart a lane when its code or environment changed, when the process is absent, or after a
  known-stuck state has been inspected.
- Do not restart Excel/GSheets in a tight loop just because the queue is `degraded`; stale jobs are
  returned to the queue by the claim path, and Excel may require a GUI/TCC-permitted session.
- Prefer archiving old patch/smoke artifacts into a dated host-local folder over deleting them
  during a live incident.
