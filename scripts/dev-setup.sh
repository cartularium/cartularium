#!/usr/bin/env bash
# Idempotent setup for cartularium local dev.
#
# - Ensures ~/.config/cartularium/dev/edit-shell.dev.vars exists (seeded from
#   the in-repo .dev.vars.example on first run).
# - Generates ASSAY_RUNNER_TOKEN if the seeded copy left it empty.
# - Symlinks this worktree's packages/edit-shell/.dev.vars to the shared file.
#
# Safe to run multiple times. Safe to run from any worktree.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLE="$REPO_ROOT/packages/edit-shell/.dev.vars.example"
WORKTREE_DEV_VARS="$REPO_ROOT/packages/edit-shell/.dev.vars"
SHARED_DIR="$HOME/.config/cartularium/dev"
SHARED_FILE="$SHARED_DIR/edit-shell.dev.vars"

if [ ! -f "$EXAMPLE" ]; then
  echo "error: expected example file at $EXAMPLE" >&2
  exit 1
fi

mkdir -p "$SHARED_DIR"

if [ ! -f "$SHARED_FILE" ]; then
  cp "$EXAMPLE" "$SHARED_FILE"
  chmod 600 "$SHARED_FILE"

  # Auto-generate ASSAY_RUNNER_TOKEN if the example leaves it empty.
  if grep -q "^ASSAY_RUNNER_TOKEN=$" "$SHARED_FILE"; then
    token="$(openssl rand -hex 32)"
    # macOS sed: -i requires an empty extension argument
    sed -i.tmp "s|^ASSAY_RUNNER_TOKEN=$|ASSAY_RUNNER_TOKEN=$token|" "$SHARED_FILE"
    rm -f "$SHARED_FILE.tmp"
    echo "Generated ASSAY_RUNNER_TOKEN (32 random bytes)."
  fi

  echo
  echo "Created shared dev secrets file at:"
  echo "  $SHARED_FILE"
  echo
  echo "Fill in your GitHub App credentials there (GITHUB_APP_CLIENT_ID,"
  echo "GITHUB_APP_CLIENT_SECRET, GITHUB_APP_PRIVATE_KEY), then re-run"
  echo "this script to symlink it into this worktree."
  exit 0
fi

# Shared file exists. Symlink the worktree's .dev.vars to it.
if [ -L "$WORKTREE_DEV_VARS" ]; then
  current_target="$(readlink "$WORKTREE_DEV_VARS")"
  if [ "$current_target" = "$SHARED_FILE" ]; then
    echo "Already linked: $WORKTREE_DEV_VARS -> $SHARED_FILE"
    exit 0
  fi
  echo "Replacing existing symlink (was: $current_target)"
  rm "$WORKTREE_DEV_VARS"
elif [ -f "$WORKTREE_DEV_VARS" ]; then
  backup="$WORKTREE_DEV_VARS.bak.$(date +%Y%m%d-%H%M%S)"
  mv "$WORKTREE_DEV_VARS" "$backup"
  echo "Backed up existing .dev.vars to:"
  echo "  $backup"
  echo "(Compare against the shared file if you had per-worktree overrides.)"
fi

ln -s "$SHARED_FILE" "$WORKTREE_DEV_VARS"
size_bytes="$(wc -c < "$SHARED_FILE" | tr -d ' ')"
echo "Linked: $WORKTREE_DEV_VARS -> $SHARED_FILE ($size_bytes bytes)"
