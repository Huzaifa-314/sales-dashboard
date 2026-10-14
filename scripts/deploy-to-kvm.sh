#!/usr/bin/env bash
set -euo pipefail

ssh infinita-kvm "bash -se" <<'EOF'
  if [ ! -d /opt/sales-dashboard/.git ]; then
    git clone --branch main https://github.com/Huzaifa-314/sales-dashboard.git /opt/sales-dashboard
  fi

  cd /opt/sales-dashboard
  git pull --ff-only origin main
  docker compose up --build --detach --wait
EOF
