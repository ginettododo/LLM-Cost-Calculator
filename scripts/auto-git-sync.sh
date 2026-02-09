#!/usr/bin/env bash

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${AUTO_SYNC_BRANCH:-main}"
REMOTE="${AUTO_SYNC_REMOTE:-origin}"
RUN_CHECKS="${AUTO_SYNC_RUN_CHECKS:-1}"
LOG_PREFIX="[auto-sync]"

cd "$REPO_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "$LOG_PREFIX Not a git repository: $REPO_DIR"
  exit 1
fi

if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  echo "$LOG_PREFIX Remote '$REMOTE' not found"
  exit 1
fi

LOCK_DIR=".git/.auto-sync-lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "$LOG_PREFIX Another sync is already running"
  exit 0
fi
trap 'rmdir "$LOCK_DIR" >/dev/null 2>&1 || true' EXIT

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "$LOG_PREFIX Current branch is '$CURRENT_BRANCH'. Expected '$BRANCH'. Skipping."
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "$LOG_PREFIX Changes detected, preparing commit"

  if [ "$RUN_CHECKS" = "1" ]; then
    echo "$LOG_PREFIX Running tests and build"
    npm run test
    npm run build
  fi

  git add -A
  if git diff --cached --quiet; then
    echo "$LOG_PREFIX No staged changes after add"
    exit 0
  fi

  COMMIT_MSG="chore(auto): sync $(date '+%Y-%m-%d %H:%M:%S')"
  git commit -m "$COMMIT_MSG"
fi

git fetch "$REMOTE" "$BRANCH"

if ! git pull --rebase "$REMOTE" "$BRANCH"; then
  git rebase --abort || true
  echo "$LOG_PREFIX Rebase failed. Resolve conflicts manually."
  exit 1
fi

git push "$REMOTE" "$BRANCH"
echo "$LOG_PREFIX Push completed"
