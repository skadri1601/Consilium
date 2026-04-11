#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS=()

cleanup() {
  echo -e "\n${YELLOW}Shutting down all services...${NC}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null
  echo -e "${GREEN}All services stopped.${NC}"
  return 0
}

trap 'cleanup; exit 0' SIGINT SIGTERM EXIT

detect_os() {
  case "$(uname -s)" in
    Linux*)   echo "linux"; return 0 ;;
    Darwin*)  echo "mac"; return 0 ;;
    CYGWIN*|MINGW*|MSYS*) echo "windows"; return 0 ;;
    *)        echo "unknown"; return 0 ;;
  esac
}

check_command() {
  local cmd_name="$1"
  if ! command -v "$cmd_name" &>/dev/null; then
    echo -e "${RED}Error: ${cmd_name} is not installed.${NC}" >&2
    return 1
  fi
  return 0
}

OS=$(detect_os)
echo -e "${CYAN}Consilium - AI Council Platform${NC}"
echo -e "${CYAN}================================${NC}"
echo -e "Detected OS: ${GREEN}${OS}${NC}\n"

echo -e "${YELLOW}Checking prerequisites...${NC}"
MISSING=0
for cmd in node pnpm; do
  if ! check_command "$cmd"; then
    MISSING=1
  fi
done

if [[ "$MISSING" -eq 1 ]]; then
  echo -e "\n${RED}Install missing dependencies and try again.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VERSION" -lt 20 ]]; then
  echo -e "${RED}Node.js 20+ required (found v${NODE_VERSION}).${NC}"
  exit 1
fi

echo -e "${GREEN}All prerequisites met.${NC}\n"

if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  cd "$ROOT_DIR" && pnpm install
  echo ""
fi

if [[ -f "$ROOT_DIR/.env.local" && ! -f "$ROOT_DIR/.env" ]]; then
  cp "$ROOT_DIR/.env.local" "$ROOT_DIR/.env"
  echo -e "${GREEN}Copied .env.local -> .env${NC}"
fi

echo -e "${YELLOW}Building shared package...${NC}"
cd "$ROOT_DIR" && pnpm --filter @consilium/shared build 2>/dev/null || true

echo -e "${YELLOW}Generating Prisma client...${NC}"
cd "$ROOT_DIR" && pnpm db:generate 2>/dev/null || true
echo ""

echo -e "${CYAN}Starting services...${NC}\n"

echo -e "  ${GREEN}[web]${NC}     Next.js on http://localhost:3000"
cd "$ROOT_DIR" && pnpm --filter @consilium/web dev &
PIDS+=($!)

echo -e "  ${GREEN}[api]${NC}     NestJS on http://localhost:4000"
cd "$ROOT_DIR" && pnpm --filter @consilium/api dev &
PIDS+=($!)

HAS_PYTHON=false
if command -v python3 &>/dev/null || command -v python &>/dev/null; then
  HAS_PYTHON=true
fi

if [[ "$HAS_PYTHON" == true && -d "$ROOT_DIR/apps/agents" ]]; then
  PYTHON_CMD="python3"
  if ! command -v python3 &>/dev/null; then
    PYTHON_CMD="python"
  fi

  if [[ -f "$ROOT_DIR/apps/agents/pyproject.toml" ]]; then
    if command -v poetry &>/dev/null; then
      echo -e "  ${GREEN}[agents]${NC}  FastAPI on http://localhost:8000"
      cd "$ROOT_DIR/apps/agents" && poetry run uvicorn src.main:app --reload --port 8000 &
      PIDS+=($!)
    else
      echo -e "  ${YELLOW}[agents]${NC}  Skipped (poetry not installed)"
    fi
  fi
else
  echo -e "  ${YELLOW}[agents]${NC}  Skipped (Python not found)"
fi

echo ""
echo -e "${GREEN}All services started. Press Ctrl+C to stop.${NC}"
echo -e "${CYAN}================================${NC}"
echo -e "  Web:    http://localhost:3000"
echo -e "  API:    http://localhost:4000"
echo -e "  Docs:   http://localhost:4000/api/docs"
echo -e "${CYAN}================================${NC}\n"

wait
