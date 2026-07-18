#!/usr/bin/env bash
# scripts/coord-status.sh
# Aggregates per-worktree .coord-status.md frontmatter into a unified view.
# Followed by `cat`ing the authored sections of internal/COORDINATION.md.
#
# Usage: bash scripts/coord-status.sh [--brief]
#
# --brief: one-line summary for predev banner. Local-only (no `gh` calls).
# Default: full report including stale-candidate detection (uses `gh` if available).

set -euo pipefail

if (( BASH_VERSINFO[0] < 4 )); then
  echo "Error: bash 4+ required (have $BASH_VERSION). Install via 'brew install bash'." >&2
  exit 1
fi

BRIEF=0
[ "${1:-}" = "--brief" ] && BRIEF=1

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$REPO_ROOT" ]; then
  echo "Not in a git repo." >&2; exit 1
fi

# Discover all worktree paths (first entry = main).
WORKTREE_PATHS=()
while IFS= read -r line; do
  case "$line" in
    "worktree "*) WORKTREE_PATHS+=("${line#worktree }") ;;
  esac
done < <(git worktree list --porcelain)
MAIN_PATH="${WORKTREE_PATHS[0]}"

# Frontmatter helpers.
get_field() {
  local file="$1" field="$2"
  awk -v f="$field" '
    /^---$/ { in_fm = !in_fm; next }
    in_fm {
      if (match($0, "^" f ":")) {
        val = substr($0, length(f) + 2)
        sub(/^[ ]+/, "", val); sub(/[ ]+$/, "", val)
        print val; exit
      }
    }
  ' "$file" 2>/dev/null
}

get_list() {
  local file="$1" field="$2"
  awk -v f="$field" '
    /^---$/ { in_fm = !in_fm; next }
    in_fm && match($0, "^" f ":") { in_list = 1; next }
    in_fm && in_list && /^  - / {
      val = substr($0, 5)
      sub(/^[ ]+/, "", val); sub(/[ ]+$/, "", val)
      print val; next
    }
    in_fm && in_list && !/^  / { in_list = 0 }
  ' "$file" 2>/dev/null
}

# Cross-platform days-since-ISO-date.
days_since() {
  local d="$1"
  local epoch_then epoch_now
  if epoch_then="$(date -j -f "%Y-%m-%d" "$d" "+%s" 2>/dev/null)"; then :; else
    epoch_then="$(date -d "$d" "+%s" 2>/dev/null || echo 0)"
  fi
  epoch_now="$(date "+%s")"
  echo $(( (epoch_now - epoch_then) / 86400 ))
}

# Has-open-PR check via gh. Returns 0 = has open PR, 1 = none, 2 = skipped.
has_open_pr() {
  local branch="$1"
  [ "$BRIEF" -eq 1 ] && return 2
  command -v gh >/dev/null 2>&1 || return 2
  local count
  count="$(gh pr list --head "$branch" --state open --json number 2>/dev/null | grep -c '"number"' || true)"
  [ "$count" -gt 0 ] && return 0 || return 1
}

# Categorize each worktree.
HOT=()             # rel|branch|status|last_touch|pr
PARKED_DONE=()     # rel|branch|status|last_touch
UNREGISTERED=()    # rel|branch|commit_date
STALE_CANDIDATES=()  # rel|branch|commit_date|claimed_status

for wt in "${WORKTREE_PATHS[@]}"; do
  rel="${wt#$MAIN_PATH/}"
  [ "$rel" = "$wt" ] && rel="."
  status_file="$wt/.coord-status.md"
  branch="$(git -C "$wt" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")"
  commit_date="$(git -C "$wt" log -1 --format=%cd --date=short HEAD 2>/dev/null || true)"

  if [ ! -f "$status_file" ]; then
    UNREGISTERED+=("$rel|$branch|$commit_date")
    # Stale check for unregistered (default mode only).
    if [ "$BRIEF" -eq 0 ] && [ -n "$commit_date" ]; then
      days="$(days_since "$commit_date")"
      if [ "$days" -gt 14 ]; then
        if has_open_pr "$branch"; then :; else
          STALE_CANDIDATES+=("$rel|$branch|$commit_date|unregistered")
        fi
      fi
    fi
    continue
  fi

  status="$(get_field "$status_file" status)"
  last_touch="$(get_field "$status_file" last_touch)"
  pr="$(get_field "$status_file" pr)"

  is_stale=0
  if [ "$BRIEF" -eq 0 ] && [ "$status" != "parked" ] && [ -n "$commit_date" ]; then
    days="$(days_since "$commit_date")"
    if [ "$days" -gt 14 ]; then
      if has_open_pr "$branch"; then :; else
        is_stale=1
        STALE_CANDIDATES+=("$rel|$branch|$commit_date|$status")
      fi
    fi
  fi

  case "$status" in
    in_progress|waiting|blocked)
      if [ "$is_stale" -eq 1 ]; then :; else
        HOT+=("$rel|$branch|$status|$last_touch|$pr")
      fi
      ;;
    parked|done)
      PARKED_DONE+=("$rel|$branch|$status|$last_touch")
      ;;
    *)
      PARKED_DONE+=("$rel|$branch|${status:-unknown}|$last_touch")
      ;;
  esac
done

# Counts.
HOT_COUNT=${#HOT[@]}
BLOCKED_COUNT=0
for entry in "${HOT[@]}"; do
  IFS='|' read -r _ _ s _ _ <<< "$entry"
  [ "$s" = "blocked" ] && BLOCKED_COUNT=$((BLOCKED_COUNT + 1))
done
UNREGISTERED_COUNT=${#UNREGISTERED[@]}
STALE_COUNT=${#STALE_CANDIDATES[@]}

# Brief mode.
if [ "$BRIEF" -eq 1 ]; then
  printf "[coord] %d hot, %d blocked, %d unregistered. (pnpm coord:status for stale candidates + detail)\n" \
    "$HOT_COUNT" "$BLOCKED_COUNT" "$UNREGISTERED_COUNT"
  exit 0
fi

# Default mode: full output.
NOW="$(date "+%Y-%m-%d %H:%M %Z")"
WIP_CAP=3
echo "=== Cartularium coordination — as of $NOW ==="
echo
echo "WIP: $HOT_COUNT hot / $WIP_CAP cap (soft)"
echo

if [ "$HOT_COUNT" -gt 0 ]; then
  echo "Active worktrees:"
  for entry in "${HOT[@]}"; do
    IFS='|' read -r rel branch status last_touch pr <<< "$entry"
    echo "  $rel ($branch) — $status, touched $last_touch"
    [ -n "$pr" ] && [ "$pr" != "—" ] && echo "    pr: $pr"
  done
  echo
fi

if [ "${#PARKED_DONE[@]}" -gt 0 ]; then
  echo "Parked / done worktrees (registered, not hot):"
  for entry in "${PARKED_DONE[@]}"; do
    IFS='|' read -r rel branch status last_touch <<< "$entry"
    echo "  $rel ($branch) — $status, touched $last_touch"
  done
  echo
fi

if [ "$UNREGISTERED_COUNT" -gt 0 ]; then
  echo "Unregistered worktrees (no .coord-status.md):"
  for entry in "${UNREGISTERED[@]}"; do
    IFS='|' read -r rel branch commit_date <<< "$entry"
    echo "  $rel ($branch) — last commit $commit_date"
  done
  echo
fi

if [ "$STALE_COUNT" -gt 0 ]; then
  echo "Stale-candidate worktrees (>14 days, no open PR):"
  for entry in "${STALE_CANDIDATES[@]}"; do
    IFS='|' read -r rel branch commit_date status <<< "$entry"
    echo "  $rel ($branch) — last commit $commit_date ($status)"
  done
  echo
fi

# Ownership overlap detection: exact-string duplicate claims.
declare -A OWNED_CLAIMS
for wt in "${WORKTREE_PATHS[@]}"; do
  status_file="$wt/.coord-status.md"
  [ ! -f "$status_file" ] && continue
  rel="${wt#$MAIN_PATH/}"
  [ "$rel" = "$wt" ] && rel="."
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    if [ -n "${OWNED_CLAIMS[$p]:-}" ]; then
      OWNED_CLAIMS["$p"]="${OWNED_CLAIMS[$p]}, $rel"
    else
      OWNED_CLAIMS["$p"]="$rel"
    fi
  done < <(get_list "$status_file" owned_paths)
done

OVERLAP_LINES=""
for path in "${!OWNED_CLAIMS[@]}"; do
  case "${OWNED_CLAIMS[$path]}" in
    *", "*) OVERLAP_LINES+="  $path claimed by ${OWNED_CLAIMS[$path]}"$'\n' ;;
  esac
done

if [ -n "$OVERLAP_LINES" ]; then
  echo "Ownership warnings (exact-string duplicate claims):"
  printf "%s" "$OVERLAP_LINES"
  echo
fi

# Cat authored COORDINATION.md from main.
COORD_FILE="$MAIN_PATH/internal/COORDINATION.md"
if [ -f "$COORD_FILE" ]; then
  echo "--- authored sections from internal/COORDINATION.md follow ---"
  echo
  cat "$COORD_FILE"
else
  echo "(no internal/COORDINATION.md at $COORD_FILE — run Task 6 to seed it)"
fi
