# Assay History Runs

The weekly `assay-history` workflow records engine drift by regenerating fixtures, running `assay history --record`, and opening a review branch.

## GitHub-Hosted Coverage

The scheduled workflow can run engines that are available on GitHub-hosted Ubuntu:

- `ironcalc`
- `hyperformula`
- `formulas`
- `pycel`
- `libreoffice`
- `gsheets`, when OAuth secrets are configured

Google Sheets needs these repository secrets:

- `ASSAY_GOOGLE_CREDENTIALS_JSON`: OAuth client JSON, matching the local `credentials.json` shape.
- `ASSAY_GOOGLE_TOKEN_JSON`: Token JSON, matching local `~/.assayrc.json`.
- `ASSAY_SPREADSHEET_ID`: Optional spreadsheet ID. If omitted, Assay uses its default shared test spreadsheet.

If the Google secrets are missing, the cron logs a notice and continues with local engines.

## Pull Requests

The workflow pushes a branch named `assay/history-cron-YYYY-MM-DD`. Opening the PR requires one of:

- Repository settings that allow GitHub Actions to create pull requests.
- An `ASSAY_PR_TOKEN` secret with permission to create pull requests.

If PR creation is not permitted, the branch can still exist even when the PR step reports a failure.

## Excel

Excel cannot run on GitHub-hosted runners because the driver needs a desktop Microsoft Excel installation through `xlwings`. Excel history runs should use a dedicated Office-capable machine or self-hosted runner.

The manual `assay-excel-history` workflow is wired for a self-hosted runner with these labels:

- `self-hosted`
- `assay-excel`

That runner must have Microsoft Excel installed and usable by `xlwings`.

For local/manual Excel fixture refresh:

```sh
node build/cli.js generate -p excel
node build/cli.js history --record --trigger=manual --note "excel refresh"
```
