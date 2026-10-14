#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="infinita-kvm"
REMOTE_DIR="/opt/sales-dashboard"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"
rsync -az --delete \
  --exclude '.git' \
  --exclude '.next' \
  --exclude 'node_modules' \
  --exclude '.env*' \
  --exclude '*.log' \
  --exclude '*.tsbuildinfo' \
  "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"

ssh "$REMOTE_HOST" "bash -se" <<'EOF'
  cd /opt/sales-dashboard
  docker compose up --build --detach --wait
EOF
