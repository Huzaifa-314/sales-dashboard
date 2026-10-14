#!/usr/bin/env bash
set -e

# Configuration
REMOTE_HOST="infinita-kvm"
REMOTE_DIR="/var/www/sales-dashboard"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> 1. Syncing project to $REMOTE_HOST:$REMOTE_DIR..."
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_DIR"

rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.system_generated' \
  "$LOCAL_DIR/" "$REMOTE_HOST:$REMOTE_DIR/"

echo "==> 2. Installing dependencies & building on $REMOTE_HOST..."
ssh "$REMOTE_HOST" "bash -s" << 'EOF'
  cd /var/www/sales-dashboard
  npm install --production=false
  npm run build
  
  # Ensure PM2 is installed and start/restart service
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart sales-dashboard || pm2 start ecosystem.config.cjs
    pm2 save
  else
    echo "PM2 not found. Starting in background..."
    nohup npm start -- -p 3000 > app.log 2>&1 &
  fi
  echo "==> Deployment to infinita-kvm completed successfully!"
EOF
