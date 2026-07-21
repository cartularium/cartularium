# ludus

"LeetCode for spreadsheets": practice problems with automated judging, in real Google
Sheets. Live: https://ludus.sheets.wiki (Pages project `ludus`) + judge Worker
`ludus-judge` (D1 `ludus`). Spec: `internal/specs/ludus/product-and-judge.md`.
Authoring guide: `docs/authoring.md` — read it before touching `problems/`.

- One YAML per problem in `problems/` is the single source: site pages, template
  sheets, the worker bundle, and `expected` outputs are all generated from it.
  `problems/drafts/` holds unaccepted candidates; builds read `problems/`
  non-recursively, so drafts ship nowhere.
- CLIs run as judge@cartularium.org. Login: `pnpm --filter @cartularium/ludus run
  login` — `run` is required; bare `pnpm login` collides with pnpm's builtin. Token
  `~/.ludusrc.json`, OAuth client `credentials.json` (both untracked).
- Commands: `oracle [--check]`, `template`, `judge <yaml> <sheet>`, `build:site`,
  `dev:worker`, `check`, `check:worker`.
- After a Worker deploy, run `verify:live` and `canary:named-functions smoke`.
  Both commands create and delete their source spreadsheets. The named-function
  canary also retains `create`, `submit <sheet-id>`, and `delete <sheet-id>` for
  rollout-gate diagnosis.
- Regenerating a template mints a new spreadsheet id, so the deployed site's copy
  links and the worker's problem bundle go stale together — always redeploy both
  (authoring guide, loop step 5).
- Hidden cases are public in this repo by design (open-solutions posture). They are
  redacted from the site build and the API boundary; keep it that way.
- `results/` is gitignored evidence output. `spike/` is the historical W0
  rehydration-fidelity spike.
