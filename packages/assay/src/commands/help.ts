export function help(): void {
  console.log(`
assay — cross-platform spreadsheet formula test runner

Commands:
  assay generate <files...>       Evaluate formulas live, save results as fixtures
  assay run <files...>            Compare test expectations against fixtures (fast, offline)
  assay benchmark <files...>      Build a consensus benchmark from agreeing engines, score others
  assay scaffold <FUNC>...        Emit starter YAML tests for one or more functions
  assay coverage                  Report function-coverage of the test corpus vs the universe
  assay validate <files...>       Re-evaluate live and check for drift from existing fixtures
  assay check --mode=resolutions  Compare per-override \`recorded:\` baselines against current
                                  fixtures; flag drift. \`--accept\` rewrites the baselines.
  assay lint <files...>           Static checks (e.g. array-literal tests must declare
                                  broadcasting intent per schema §4).
  assay matrix <files...>         Verdict-free agreement matrix over observed Outcomes:
                                  pairwise co-classing, per-engine capability + fork
                                  profile, recurring fork-shapes. Reads fixtures.
                                  Use --view=headline|pairwise|engines|forks.
                                  --seed-catalogue <dir> writes DV-####.yaml (override-based,
                                  quarantined — retires with the authoring layer).
  assay catalogue --build <dir>   Render the seeded divergence catalogue
                                  (divergences/DV-*.yaml) to a browsable static site.
  assay manifest                  Emit the function manifest (engine status, DV refs,
                                  test ids) keyed by function name. Defaults to stdout;
                                  --output <path> writes to a file. Also emitted as
                                  manifest.json by \`assay catalogue\`.
  assay preview <input> [output]  Run one submitted-case preview input JSON and write
                                  normalized preview output JSON. First-pass preview
                                  engines: gsheets, excel, hyperformula.
  assay preview-status            Fetch runner queue/status health from edit-shell.
                                  Exits 0 for ok, 2 for degraded. Use --json for the
                                  raw status payload.
  assay preview-worker            Poll the edit-shell preview queue, run claimed jobs,
                                  and upload result JSON. Defaults to sheets.wiki and
                                  excel,gsheets unless --platform or
                                  ASSAY_RUNNER_PLATFORMS is set.
  assay history --record          Append a snapshot to history/: hashes every
                                  fixture, diffs DV catalogue, writes capability
                                  snapshot. Auto-seeds new clusters; marks
                                  vanished DVs (status: vanished). Flags:
                                  --dry-run, --skip-versions, --note,
                                  --trigger=cron|manual|pr (default manual).
  assay history --inspect <run>   Show one run's deltas. <run> is a run_id, a
                                  unique prefix, or "latest".
  assay history --since <date>    List runs whose run_id is at or after <date>.
  assay login                     Authenticate with Google (for GSheets driver)
  assay setup                     Install xlwings + ironcalc via uv

Arguments:
  When no files are given, defaults to tests/*.yaml.

Options:
  -p, --platform <platforms>      Comma-separated: gsheets,excel,lattice,ironcalc,
                                  hyperformula,libreoffice,formulas,pycel
                                  (default: gsheets,excel,lattice,ironcalc,hyperformula)
  -s, --spreadsheet-id <id>       Google Sheets spreadsheet ID
      --missing                   Only (re)generate fixtures that are absent or errored
      --dry-run                   For validate, report fixture drift without updating files
      --allow-missing             Do not fail 'run' when a fixture is missing
      --json                      Output results as JSON
      --tags <tags>               Comma-separated tags to filter tests
      --base-url <url>             Edit-shell API base for preview worker/status
      --token <token>              Runner bearer token; defaults to ASSAY_RUNNER_TOKEN
      --runner-id <id>             Runner id; defaults to hostname
      --poll-ms <ms>               Preview-worker idle poll interval
      --timeout-ms <ms>            Hard per-job preview child-process timeout
      --work-dir <path>            Preview-worker scratch directory
      --once                       Claim at most one job, then exit
  -v, --verbose                   Show debug / per-test output
  -q, --quiet                     Minimal output
  -h, --help                      Show this help

Benchmark options:
      --authority <list>          Engines whose agreement defines consensus (default: gsheets,excel)
      --target <list>             Engines to score vs consensus (default: all non-authority)
      --consensus <strict|any>    strict (default, ≥2 authorities must agree) or any (match
                                  any authority; auto-selected when --authority has 1 engine)
      --loose-errors              Any error matches any error (default: strict error codes)
      --dump-consensus <path>     Write the consensus set to a JSON file
      --by-function               Show per-function × per-engine pass-rate table
      --rollup-csv <path>         Write per-function rollup to CSV
      --exclusions-csv <path>     Write benchmark exclusions (with reasons) to CSV

Scaffold options:
      --category <Name>           Scaffold all functions in a category (e.g. Date, Info)
      --uncovered                 Scaffold every uncovered function in the universe
      --ref-dir <path>            Directory with excel/gsheets_functions.tsv
                                  (default: ../lattice/spec/reference)

Examples:
  assay login
  assay setup
  assay generate -p gsheets -s SPREADSHEET_ID        # defaults to tests/*.yaml
  assay generate -p excel --missing
  assay run                                          # compact summary
  assay run -v                                       # full per-test detail
  assay run --json > results.json
  assay validate -p hyperformula --dry-run           # regeneration check without fixture writes
  assay benchmark --exclusions-csv /tmp/excl.csv
  assay validate -p gsheets,excel -s SPREADSHEET_ID
`);
}
