#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="infinita-kvm"
REMOTE_DIR="/opt/sales-dashboard"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_DIR'"
ssh "$REMOTE_HOST" "bash -se" <<'EOF'
  if docker exec sales-dashboard-app-1 test -f /data/crm.sqlite 2>/dev/null; then
    timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
    mkdir -p /root/sales-dashboard-backups
    docker exec sales-dashboard-app-1 node /app/scripts/backup-crm.mjs /tmp/crm-backup.sqlite
    docker cp sales-dashboard-app-1:/tmp/crm-backup.sqlite "/root/sales-dashboard-backups/crm-${timestamp}.sqlite"
    chmod 600 "/root/sales-dashboard-backups/crm-${timestamp}.sqlite"
    docker exec sales-dashboard-app-1 rm /tmp/crm-backup.sqlite
  fi
EOF
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
