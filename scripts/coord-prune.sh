#!/usr/bin/env bash
# scripts/coord-prune.sh
# Interactively prunes stale worktrees (>14 days since last commit, no open PR).
# Excludes worktrees explicitly marked `status: parked` in their .coord-status.md.
#
# Branch deletion: attempts `git branch -d` (safe — refuses if unmerged).
# Never auto-prompts for `-D`; if `-d` refuses, prints the explicit command for the user.

set -euo pipefail

if (( BASH_VERSINFO[0] < 4 )); then
  echo "Error: bash 4+ required (have $BASH_VERSION). Install via 'brew install bash'." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
CURRENT_WT="$REPO_ROOT"

# Enumerate all worktrees; first entry is main (used as relative-path basis); subsequent are candidates.
MAIN_PATH=""
WORKTREE_PATHS=()
i=0
while IFS= read -r line; do
  case "$line" in
    "worktree "*)
      i=$((i + 1))
      path="${line#worktree }"
      if [ "$i" -eq 1 ]; then
        MAIN_PATH="$path"
      else
        WORKTREE_PATHS+=("$path")
      fi
      ;;
  esac
done < <(git -C "$REPO_ROOT" worktree list --porcelain)

if [ "${#WORKTREE_PATHS[@]}" -eq 0 ]; then
  echo "No non-main worktrees to consider."
  exit 0
fi

# Helpers (duplicated from coord-status.sh to keep scripts independent).
days_since() {
  local d="$1"
  local epoch_then epoch_now
  if epoch_then="$(date -j -f "%Y-%m-%d" "$d" "+%s" 2>/dev/null)"; then :; else
    epoch_then="$(date -d "$d" "+%s" 2>/dev/null || echo 0)"
  fi
  epoch_now="$(date "+%s")"
  echo $(( (epoch_now - epoch_then) / 86400 ))
}

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

# Identify candidates.
CANDIDATES=()
for wt in "${WORKTREE_PATHS[@]}"; do
  branch="$(git -C "$wt" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")"
  commit_date="$(git -C "$wt" log -1 --format=%cd --date=short HEAD 2>/dev/null || true)"
  [ -z "$commit_date" ] && continue

  # Exclude parked.
  status_file="$wt/.coord-status.md"
  if [ -f "$status_file" ]; then
    status="$(get_field "$status_file" status)"
    [ "$status" = "parked" ] && continue
  fi

  days="$(days_since "$commit_date")"
  [ "$days" -le 14 ] && continue

  # Check open PR via gh (if available).
  if command -v gh >/dev/null 2>&1; then
    pr_count="$(gh pr list --head "$branch" --state open --json number 2>/dev/null | grep -c '"number"' || true)"
    [ "$pr_count" -gt 0 ] && continue
  fi

  CANDIDATES+=("$wt|$branch|$commit_date")
done

if [ "${#CANDIDATES[@]}" -eq 0 ]; then
  echo "No stale-candidate worktrees found."
  exit 0
fi

echo "Stale-candidate worktrees (>14 days last commit, no open PR):"
for entry in "${CANDIDATES[@]}"; do
  IFS='|' read -r wt branch commit_date <<< "$entry"
  rel="${wt#$MAIN_PATH/}"
  [ "$rel" = "$wt" ] && rel="."
  echo "  $rel (branch $branch, last commit $commit_date)"
done
echo

# Interactive prompts.
for entry in "${CANDIDATES[@]}"; do
  IFS='|' read -r wt branch commit_date <<< "$entry"
  rel="${wt#$MAIN_PATH/}"
  [ "$rel" = "$wt" ] && rel="."

  # Safety: bail if cwd is inside this candidate.
  if [ "$CURRENT_WT" = "$wt" ]; then
    echo "Skipping $rel — current working directory is inside this worktree."
    continue
  fi

  read -p "Remove $rel (branch $branch, last touch $commit_date, no open PR)? [y/N] " response
  case "$response" in
    y|Y|yes|YES)
      git -C "$REPO_ROOT" worktree remove "$wt"
      echo "  Removed worktree $rel."

      # Safe branch delete.
      if git -C "$REPO_ROOT" branch -d "$branch" 2>/dev/null; then
        echo "  Deleted branch $branch (was merged)."
      else
        echo "  Branch $branch has unmerged commits and was NOT deleted."
        echo "  If you're sure, run:  git branch -D $branch"
      fi
      ;;
    *)
      echo "  Skipped $rel."
      ;;
  esac
done

echo
echo "Done."
