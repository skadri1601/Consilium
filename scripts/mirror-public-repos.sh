#!/usr/bin/env bash
set -euo pipefail

MONOREPO_OWNER="skadri1601"
MONOREPO_NAME="Consilium"
MONOREPO_SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"
MONOREPO_SHORT="${MONOREPO_SHA:0:7}"
MONOREPO_URL="https://github.com/${MONOREPO_OWNER}/${MONOREPO_NAME}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

if [[ -z "${MIRROR_PAT:-}" ]]; then
  echo "ERROR: MIRROR_PAT env var is required (a GitHub PAT with Contents:write on the 4 public repos)" >&2
  exit 1
fi

mirror_bot_name="consilium-mirror-bot"
mirror_bot_email="mirror@myconsilium.xyz"

TARGETS=(
  "packages/cli|consilium-cli|true"
  "packages/sdk|consilium-js|false"
  "packages/python-sdk|consilium-python|false"
  "apps/vscode-extension|consilium-vscode|true"
)

vendor_shared() {
  local target_dir="$1"
  mkdir -p "${target_dir}/src/_shared/debates"
  cp "${REPO_ROOT}/packages/shared/src/debates/"*.ts "${target_dir}/src/_shared/debates/"
}

patch_tsconfig_paths() {
  local tsconfig="$1"
  [[ -f "$tsconfig" ]] || return 0
  python3 - "$tsconfig" <<'PY'
import json, sys
path = sys.argv[1]
with open(path) as f:
    cfg = json.load(f)
co = cfg.setdefault("compilerOptions", {})
co.setdefault("baseUrl", ".")
paths = co.setdefault("paths", {})
paths["@consilium/shared"] = ["./src/_shared/debates/index.ts"]
paths["@consilium/shared/debates"] = ["./src/_shared/debates/index.ts"]
with open(path, "w") as f:
    json.dump(cfg, f, indent=2)
    f.write("\n")
PY
}

patch_package_json_for_npm() {
  local pkg="$1"
  local repo_name="$2"
  python3 - "$pkg" "$repo_name" <<'PY'
import json, re, sys
path, repo_name = sys.argv[1], sys.argv[2]
with open(path) as f:
    pkg = json.load(f)
pkg["license"] = "MIT"
pkg["repository"] = {
    "type": "git",
    "url": f"https://github.com/skadri1601/{repo_name}.git",
}
pkg["bugs"] = {"url": f"https://github.com/skadri1601/{repo_name}/issues"}
pkg["homepage"] = f"https://github.com/skadri1601/{repo_name}#readme"

scripts = pkg.get("scripts", {})
for name, cmd in list(scripts.items()):
    new_cmd = re.sub(r'(^|\s|&&\s*)pnpm\s+([a-zA-Z0-9:_-]+)', r'\1npm run \2', cmd)
    if new_cmd != cmd:
        scripts[name] = new_cmd
if scripts:
    pkg["scripts"] = scripts

with open(path, "w") as f:
    json.dump(pkg, f, indent=2)
    f.write("\n")
PY
}

rewrite_monorepo_urls() {
  local target_dir="$1"
  local repo_name="$2"
  find "$target_dir" -type f \
    \( -name '*.md' -o -name '*.json' -o -name '*.toml' \
       -o -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \
       -o -name '*.yml' -o -name '*.yaml' -o -name '*.py' \) \
    -not -path '*/node_modules/*' -not -path '*/.git/*' \
    -exec sed -i \
      -e "s|github.com/${MONOREPO_OWNER}/${MONOREPO_NAME}|github.com/${MONOREPO_OWNER}/${repo_name}|g" \
      {} +
}

write_mit_license() {
  local target_dir="$1"
  cat > "${target_dir}/LICENSE" <<'LICENSE'
MIT License

Copyright (c) 2026 Consilium

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
LICENSE
}

copy_release_workflow() {
  local target_dir="$1"
  local repo_name="$2"
  local src="${REPO_ROOT}/scripts/mirror/release-workflows/${repo_name}.yml"
  if [[ -f "$src" ]]; then
    mkdir -p "${target_dir}/.github/workflows"
    cp "$src" "${target_dir}/.github/workflows/release.yml"
  fi
}

sync_one() {
  local source_rel="$1"
  local target_repo="$2"
  local needs_shared="$3"

  echo "=== Syncing ${source_rel} -> ${target_repo} ==="

  local target_dir="${WORKDIR}/${target_repo}"
  local remote="https://x-access-token:${MIRROR_PAT}@github.com/${MONOREPO_OWNER}/${target_repo}.git"

  mkdir -p "$target_dir"
  cd "$target_dir"
  git init --quiet --initial-branch=main
  git remote add origin "$remote"

  if git ls-remote --heads origin main | grep -q main; then
    git fetch --quiet --depth=1 origin main
    git reset --quiet --hard FETCH_HEAD
  fi

  find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

  rsync -a \
    --exclude='.git/' \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='build/' \
    --exclude='out/' \
    --exclude='__pycache__/' \
    --exclude='.turbo/' \
    --exclude='.next/' \
    --exclude='*.tsbuildinfo' \
    "${REPO_ROOT}/${source_rel}/" "${target_dir}/"

  if [[ "$needs_shared" == "true" ]]; then
    vendor_shared "$target_dir"
    patch_tsconfig_paths "${target_dir}/tsconfig.json"
  fi

  rewrite_monorepo_urls "$target_dir" "$target_repo"

  if [[ -f "${target_dir}/package.json" ]]; then
    patch_package_json_for_npm "${target_dir}/package.json" "$target_repo"
  fi

  write_mit_license "$target_dir"
  copy_release_workflow "$target_dir" "$target_repo"

  git config user.name "$mirror_bot_name"
  git config user.email "$mirror_bot_email"
  git add -A

  if git diff --cached --quiet; then
    echo "  (no changes)"
    cd "$REPO_ROOT"
    return 0
  fi

  git commit --quiet -m "sync from ${MONOREPO_NAME}@${MONOREPO_SHORT}

Source: ${MONOREPO_URL}/tree/${MONOREPO_SHA}/${source_rel}
"
  git push --quiet origin main
  echo "  pushed to ${target_repo}"

  cd "$REPO_ROOT"
}

for entry in "${TARGETS[@]}"; do
  IFS='|' read -r source_rel target_repo needs_shared <<< "$entry"
  sync_one "$source_rel" "$target_repo" "$needs_shared"
done

echo "=== All mirrors synced ==="
