#!/bin/bash
#
# sync-env.sh - Sync .env.local to .env
#
# Usage: ./scripts/sync-env.sh
#

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Syncing environment files...${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local not found!"
    echo "Run: cp .env.example .env.local"
    exit 1
fi

# Backup existing .env if it exists
if [ -f .env ]; then
    cp .env .env.backup
    echo "Backed up existing .env to .env.backup"
fi

# Copy .env.local to .env
cp .env.local .env

echo -e "${GREEN}✓${NC} Synced .env.local → .env"

# Show file sizes
echo ""
echo "File sizes:"
ls -lh .env .env.local | awk '{print "  " $9 " - " $5}'

# Verify they're identical
if diff -q .env .env.local > /dev/null; then
    echo -e "${GREEN}✓${NC} Files are identical"
else
    echo -e "${YELLOW}⚠${NC} Warning: Files differ!"
fi

echo ""
echo "Done! Environment files are in sync."
