#!/usr/bin/env bash
# Consilium CLI installer.
#
# Usage:
#   curl -fsSL https://install.myconsilium.xyz | sh
#   curl -fsSL https://install.myconsilium.xyz | bash -s -- --version 0.4.0
#
# Detects an existing Node toolchain (pnpm > npm > yarn > bun) and installs
# @myconsilium/cli globally. If none is present, downloads the prebuilt
# standalone binary for the current platform from the latest GitHub release.

set -euo pipefail

PACKAGE="@myconsilium/cli"
BIN_NAME="consilium"
GITHUB_OWNER="skadri1601"
GITHUB_REPO="Consilium"
DEFAULT_INSTALL_DIR="${HOME}/.local/bin"

log() {
  printf '\033[36m[consilium]\033[0m %s\n' "$1"
}

err() {
  printf '\033[31m[consilium]\033[0m %s\n' "$1" >&2
}

want_version=""
prefer_binary=false
install_dir="${DEFAULT_INSTALL_DIR}"

while [ $# -gt 0 ]; do
  case "$1" in
    --version)
      want_version="$2"; shift 2 ;;
    --version=*)
      want_version="${1#--version=}"; shift ;;
    --binary)
      prefer_binary=true; shift ;;
    --install-dir)
      install_dir="$2"; shift 2 ;;
    --install-dir=*)
      install_dir="${1#--install-dir=}"; shift ;;
    -h|--help)
      cat <<EOF
Consilium CLI installer

Options:
  --version <ver>     Install a specific version (default: latest)
  --binary            Force standalone binary download (skip Node detection)
  --install-dir <dir> Where to drop the standalone binary (default: ${DEFAULT_INSTALL_DIR})
  -h, --help          Show this help

After install, run:  ${BIN_NAME}
EOF
      exit 0 ;;
    *)
      err "Unknown option: $1"; exit 2 ;;
  esac
done

detect_platform() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"
  case "${os}" in
    Linux)   os="linux" ;;
    Darwin)  os="darwin" ;;
    *)       err "Unsupported OS: ${os}"; return 1 ;;
  esac
  case "${arch}" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)             err "Unsupported architecture: ${arch}"; return 1 ;;
  esac
  printf '%s-%s\n' "${os}" "${arch}"
}

install_via_pnpm() {
  log "Installing via pnpm…"
  if [ -n "${want_version}" ]; then
    pnpm add -g "${PACKAGE}@${want_version}"
  else
    pnpm add -g "${PACKAGE}"
  fi
}

install_via_npm() {
  log "Installing via npm…"
  if [ -n "${want_version}" ]; then
    npm install -g "${PACKAGE}@${want_version}"
  else
    npm install -g "${PACKAGE}"
  fi
}

install_via_yarn() {
  log "Installing via yarn…"
  if [ -n "${want_version}" ]; then
    yarn global add "${PACKAGE}@${want_version}"
  else
    yarn global add "${PACKAGE}"
  fi
}

install_via_bun() {
  log "Installing via bun…"
  if [ -n "${want_version}" ]; then
    bun add -g "${PACKAGE}@${want_version}"
  else
    bun add -g "${PACKAGE}"
  fi
}

install_binary() {
  local platform tag url tmp
  platform="$(detect_platform)" || return 1
  if [ -z "${want_version}" ]; then
    tag="$(curl -fsSL "https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest" | grep -E '"tag_name"' | head -1 | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')"
    if [ -z "${tag}" ]; then
      err "Could not detect latest release. Pass --version <tag> explicitly."
      return 1
    fi
  else
    tag="cli-v${want_version}"
  fi
  url="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${tag}/${BIN_NAME}-${platform}"
  log "Downloading ${url}"
  mkdir -p "${install_dir}"
  tmp="$(mktemp)"
  if ! curl -fsSL "${url}" -o "${tmp}"; then
    err "Download failed."
    rm -f "${tmp}"
    return 1
  fi
  chmod +x "${tmp}"
  mv "${tmp}" "${install_dir}/${BIN_NAME}"
  log "Installed to ${install_dir}/${BIN_NAME}"
  case ":${PATH}:" in
    *":${install_dir}:"*) ;;
    *) log "Add ${install_dir} to your PATH:  echo 'export PATH=\"${install_dir}:\$PATH\"' >> ~/.bashrc" ;;
  esac
}

main() {
  if ${prefer_binary}; then
    install_binary
    return
  fi
  if command -v pnpm >/dev/null 2>&1; then
    install_via_pnpm
  elif command -v npm >/dev/null 2>&1; then
    install_via_npm
  elif command -v yarn >/dev/null 2>&1; then
    install_via_yarn
  elif command -v bun >/dev/null 2>&1; then
    install_via_bun
  else
    log "No Node package manager found. Falling back to standalone binary."
    install_binary
    return
  fi
  log "Installed. Run:  ${BIN_NAME}"
}

main "$@"
