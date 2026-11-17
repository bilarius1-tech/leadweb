# vaybik.ru (leadweb)

Статический сайт студии **Вайбик**. Источник: этот репозиторий. Прод: `https://vaybik.ru/` (nginx в `/opt/apps/vaybik-main`). Админка хаба — отдельно: `https://vaybik.ru/admin` (не трогать отсюда).

Рабочая копия на сервере: `/opt/vaybik-site-src`. Remote: `git@github-leadweb:bilarius1-tech/leadweb.git`.

## Деплой (только после «задеплой»)

```bash
/opt/vaybik-site-src/scripts/deploy-site.sh
```

Скрипт: `git pull` → сборка `dist/` (без `tests/`, `kontakty/`, `studio-preview.html`) → бэкап `html/` + `nginx.conf` в `/opt/apps/vaybik-main/backup-<дата>/` → rsync в `html/` → запись `nginx.conf` через `cat` (сохраняет inode bind-mount) → `nginx -t` + reload.

Не меняет: `docker-compose.yml`, labels Traefik, `/opt/proxy`, хаб `/admin`, region, VPN, firewall.

## Откат

```bash
/opt/vaybik-site-src/scripts/rollback-site.sh /opt/apps/vaybik-main/backup-YYYYMMDD-HHMM
```

## Локальная проверка nginx

```bash
# собрать dist как при деплое, затем:
docker run --rm \
  -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$PWD/dist:/usr/share/nginx/html:ro" \
  nginx:alpine nginx -t
```

## GitHub Pages (заглушки)

Только после того, как vaybik.ru живой, и только с «да»:

```bash
scripts/make-pages-stubs.sh
# затем пуш ветки gh-pages и переключение Source в настройках Pages
```

## Метрика

`js/metrika.js` — заготовка. ID пустой → ничего не грузится. Когда будет счётчик — одна строка `YM_ID`.

## URL

| Было | Стало |
|------|--------|
| `/automation.html` | `/avtomatizaciya-1c/` (301) |
| `/bitrix.html` | `/bitrix/` (301) |
| `/kontakty/` | `/o-nas/` (301) |
| `/leadweb/...` | `/...` (301) |
