#!/usr/bin/env bash
# Build a static export and publish it to the gh-pages branch.
# GitHub Pages must be set to "Deploy from a branch: gh-pages / (root)".
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_URL="$(git remote get-url origin)"
REPO_NAME="$(basename -s .git "$REPO_URL")"

rm -rf out
PAGES_BASE_PATH="/$REPO_NAME" npx next build
touch out/.nojekyll   # keep GitHub Pages from ignoring the _next/ folder

cd out
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f -q "$REPO_URL" gh-pages
rm -rf .git
echo "Published to gh-pages."
