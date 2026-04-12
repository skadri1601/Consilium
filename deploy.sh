#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/skadri1601/Consilium.git"
INSTALL_DIR="/opt/consilium"
COMPOSE_FILE="docker-compose.droplet.yml"

echo "=== Consilium Droplet Deploy ==="

if ! command -v docker &>/dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! docker compose version &>/dev/null; then
    echo "ERROR: Docker Compose plugin not found. Install it with:"
    echo "  apt-get install docker-compose-plugin"
    exit 1
fi

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Updating repository..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo ""
    echo "No .env file found. Creating from template..."
    cp "$INSTALL_DIR/.env.droplet.example" "$INSTALL_DIR/.env"
    echo "IMPORTANT: Edit $INSTALL_DIR/.env with your values before continuing."
    echo "  nano $INSTALL_DIR/.env"
    echo ""
    echo "Then re-run this script."
    exit 0
fi

echo "Building and starting services..."
cd "$INSTALL_DIR"
docker compose -f "$COMPOSE_FILE" build
docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "Setting up monitor agent..."
if [ ! -d "$INSTALL_DIR/agents/.venv" ]; then
    python3 -m venv "$INSTALL_DIR/agents/.venv"
fi
"$INSTALL_DIR/agents/.venv/bin/pip" install -q -r "$INSTALL_DIR/agents/requirements.txt"

CRON_MARKER="# consilium-agents"
if ! crontab -l 2>/dev/null | grep -q "$CRON_MARKER"; then
    echo "Adding cron jobs..."
    (
        crontab -l 2>/dev/null || true
        echo "*/5 * * * * cd $INSTALL_DIR && agents/.venv/bin/python -m agents.bots.monitor_agent --interval 0 >> /var/log/consilium-monitor.log 2>&1 $CRON_MARKER"
        echo "0 8 * * * cd $INSTALL_DIR && agents/.venv/bin/python -m agents.bots.briefing_agent >> /var/log/consilium-briefing.log 2>&1 $CRON_MARKER"
    ) | crontab -
fi

echo ""
echo "=== Deploy Complete ==="
echo ""
docker compose -f "$COMPOSE_FILE" ps
echo ""

DOMAIN=$(grep -oP '^DOMAIN=\K.*' "$INSTALL_DIR/.env" 2>/dev/null | tr -d '"' || echo "your-domain")
echo "Endpoints:"
echo "  Web API:  https://$DOMAIN/api/v1/health"
echo "  Agents:   https://$DOMAIN/health"
echo "  MCP:      https://$DOMAIN/mcp"
echo "  Docs:     https://$DOMAIN/agents/docs"
echo ""
echo "MCP config for Claude Desktop:"
echo "  {\"url\": \"https://$DOMAIN/mcp\"}"
