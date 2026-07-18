#!/usr/bin/env bash
# Sync Cloudflare Pages "Build watch paths" declaratively from
# scripts/cf-pages-watch.json. The dashboard's only-on-watched-paths
# default is silent: pushes to main that don't touch a listed glob
# are skipped without warning, which has bitten us on monorepo refactors
# (e.g. an editor PR that doesn't touch packages/sheets-wiki/*).
#
# Requires:
#   CLOUDFLARE_API_TOKEN  — token with Pages:Edit on the target account
#                           (Account → Cloudflare Pages → Edit)
#   CLOUDFLARE_ACCOUNT_ID — the account that owns the Pages projects
#                           (find in dashboard URL, or via --list which
#                            will refuse without it)
#
# Usage:
#   scripts/cf-pages-sync-watch.sh --list           # list projects + current paths
#   scripts/cf-pages-sync-watch.sh --dry-run        # preview diff for all projects in JSON
#   scripts/cf-pages-sync-watch.sh                  # apply for all projects
#   scripts/cf-pages-sync-watch.sh sheets-wiki      # apply for one project
#   scripts/cf-pages-sync-watch.sh --dry-run sheets-wiki

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${HERE}/.." && pwd)"
CONFIG="${HERE}/cf-pages-watch.json"
API="https://api.cloudflare.com/client/v4"

# Auto-source repo-root .env if it exists (gitignored; expected to hold
# CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID). Lets you avoid re-exporting
# every shell. Existing env vars win — sourcing won't overwrite them.
if [[ -f "${REPO_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env"
  set +a
fi

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing dep: $1" >&2; exit 2; }; }
need curl
need jq

token="${CLOUDFLARE_API_TOKEN:-}"
account="${CLOUDFLARE_ACCOUNT_ID:-}"

if [[ -z "$token" ]]; then
  echo "set CLOUDFLARE_API_TOKEN (Pages:Edit scope)" >&2
  exit 2
fi
if [[ -z "$account" ]]; then
  echo "set CLOUDFLARE_ACCOUNT_ID (find in CF dashboard URL or via /accounts)" >&2
  exit 2
fi

dry_run=false
target=""
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    --list)
      curl -fsS \
        -H "Authorization: Bearer ${token}" \
        "${API}/accounts/${account}/pages/projects" \
        | jq -r '.result[] | "\(.name)\n  current path_includes: \(.source.config.path_includes // [] | tojson)"'
      exit 0
      ;;
    -*) echo "unknown flag: $arg" >&2; exit 2 ;;
    *) target="$arg" ;;
  esac
done

# Build list of projects to sync.
if [[ -n "$target" ]]; then
  projects=("$target")
else
  mapfile -t projects < <(jq -r 'to_entries[] | select(.key | startswith("_") | not) | .key' "$CONFIG")
fi

exit_code=0
for project in "${projects[@]}"; do
  desired_json="$(jq -c --arg p "$project" '.[$p].path_includes // empty' "$CONFIG")"
  if [[ -z "$desired_json" || "$desired_json" == "null" ]]; then
    echo "${project}: no entry in $(basename "$CONFIG") — skipping" >&2
    exit_code=1
    continue
  fi

  # Fetch the full project so we can preserve every other source.config
  # field (production_branch, path_excludes, preview_*, etc.) when we PATCH.
  current_project="$(curl -fsS \
    -H "Authorization: Bearer ${token}" \
    "${API}/accounts/${account}/pages/projects/${project}")"

  current_json="$(echo "$current_project" | jq -c '.result.source.config.path_includes // []')"

  if [[ "$current_json" == "$desired_json" ]]; then
    echo "${project}: already in sync (${current_json})"
    continue
  fi

  echo "${project}:"
  echo "  current: ${current_json}"
  echo "  desired: ${desired_json}"

  if $dry_run; then
    echo "  (dry-run, not applying)"
    continue
  fi

  new_source_config="$(echo "$current_project" \
    | jq -c --argjson p "$desired_json" '.result.source.config | .path_includes = $p')"
  body="$(jq -nc --argjson sc "$new_source_config" '{source:{config:$sc}}')"
  resp="$(curl -fsS -X PATCH \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    --data "$body" \
    "${API}/accounts/${account}/pages/projects/${project}")"

  if [[ "$(echo "$resp" | jq -r '.success')" == "true" ]]; then
    echo "  ✓ updated"
  else
    echo "  ✗ failed: $(echo "$resp" | jq -c '.errors // .')"
    exit_code=1
  fi
done

exit "$exit_code"
