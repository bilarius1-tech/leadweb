#!/usr/bin/env bash
# Выкладка статики leadweb → /opt/apps/vaybik-main (только после «задеплой»).
set -euo pipefail

SRC="${SITE_SRC:-/opt/vaybik-site-src}"
DEST="${SITE_DEST:-/opt/apps/vaybik-main}"
CONTAINER="${SITE_CONTAINER:-vaybik-main}"

cd "$SRC"
git pull --ff-only

STAMP="$(date +%Y%m%d-%H%M)"
BACKUP="$DEST/backup-$STAMP"
DIST="$SRC/dist"

echo "==> Сборка dist/"
rm -rf "$DIST"
mkdir -p "$DIST"
rsync -a \
  --exclude '.git/' \
  --exclude 'dist/' \
  --exclude 'tests/' \
  --exclude 'scripts/' \
  --exclude 'kontakty/' \
  --exclude 'studio-preview.html' \
  --exclude 'nginx.conf' \
  --exclude 'README.md' \
  --exclude 'AGENTS.md' \
  --exclude '.gitignore' \
  --exclude '.nojekyll' \
  --exclude '*.md' \
  ./ "$DIST/"

echo "==> Бэкап → $BACKUP"
mkdir -p "$BACKUP"
cp -a "$DEST/html" "$BACKUP/html"
cp -a "$DEST/nginx.conf" "$BACKUP/nginx.conf"

echo "==> rsync dist → html/"
rsync -a --delete "$DIST/" "$DEST/html/"

echo "==> nginx.conf (через cat, сохранить inode mount)"
# Важно: не mv/rsync файла — bind-mount держит старый inode.
cat "$SRC/nginx.conf" > "$DEST/nginx.conf"

echo "==> nginx -t && reload"
if ! docker exec "$CONTAINER" nginx -t; then
  echo "ERROR: nginx -t failed, восстанавливаю конфиг из бэкапа"
  cat "$BACKUP/nginx.conf" > "$DEST/nginx.conf"
  docker exec "$CONTAINER" nginx -t
  docker exec "$CONTAINER" nginx -s reload || true
  exit 1
fi
docker exec "$CONTAINER" nginx -s reload

echo "OK: выложено. Бэкап: $BACKUP"
echo "Откат: $SRC/scripts/rollback-site.sh $BACKUP"
