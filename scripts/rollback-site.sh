#!/usr/bin/env bash
# Откат html/ + nginx.conf из каталога бэкапа deploy-site.sh
set -euo pipefail

DEST="${SITE_DEST:-/opt/apps/vaybik-main}"
CONTAINER="${SITE_CONTAINER:-vaybik-main}"
BACKUP="${1:-}"

if [[ -z "$BACKUP" || ! -d "$BACKUP/html" || ! -f "$BACKUP/nginx.conf" ]]; then
  echo "Usage: $0 /opt/apps/vaybik-main/backup-YYYYMMDD-HHMM" >&2
  exit 1
fi

echo "==> Восстанавливаю html/ из $BACKUP"
rsync -a --delete "$BACKUP/html/" "$DEST/html/"

echo "==> Восстанавливаю nginx.conf"
cat "$BACKUP/nginx.conf" > "$DEST/nginx.conf"

echo "==> nginx -t && reload"
docker exec "$CONTAINER" nginx -t
docker exec "$CONTAINER" nginx -s reload

echo "OK: откат выполнен из $BACKUP"
