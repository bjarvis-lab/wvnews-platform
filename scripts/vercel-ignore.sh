#!/usr/bin/env bash
# Vercel ignoreCommand — skip the build when the only changed file is
# the ingested-stories.json artifact written by the GitHub Actions
# content-refresh cron. That cron runs every 15 minutes; without this
# we'd burn ~96 deployments/day rebuilding the site for no real change.
#
# Vercel convention for ignoreCommand:
#   exit 0  → skip the build (Vercel marks the deploy as "Ignored")
#   exit 1  → proceed with the build
#
# Real product commits change other files, so they always exit 1 and
# deploy normally.

set -euo pipefail

# Compare the head of this branch against the previous commit. On a
# fresh deploy (e.g. first commit, force-push) HEAD^ may not exist —
# in that case we play it safe and build.
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "[vercel-ignore] no previous commit available; building."
  exit 1
fi

diff_files="$(git diff --name-only HEAD^ HEAD)"

if [ -z "$diff_files" ]; then
  echo "[vercel-ignore] no files changed in this commit; building."
  exit 1
fi

# Anything that isn't the ingest artifact?
other_files="$(echo "$diff_files" | grep -v '^src/data/ingested-stories\.json$' || true)"

if [ -z "$other_files" ]; then
  echo "[vercel-ignore] only ingested-stories.json changed — skipping build."
  exit 0
fi

echo "[vercel-ignore] non-ingest changes detected — building. Files:"
echo "$other_files"
exit 1
