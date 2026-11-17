#!/usr/bin/env bash
# Собирает orphan-ветку gh-pages с заглушками → vaybik.ru.
# НЕ пушит и НЕ переключает источник GitHub Pages.
# Запускать только после «да» Алексея и когда https://vaybik.ru уже живой.
set -euo pipefail

SRC="${SITE_SRC:-/opt/vaybik-site-src}"
STUBS="$(mktemp -d /tmp/vaybik-stubs-XXXX)"
KEEP="/tmp/vaybik-gh-pages-ready"
trap 'rm -rf "$STUBS"' EXIT

cd "$SRC"

python3 - "$STUBS" <<'PY'
import json, re, sys
from pathlib import Path

out = Path(sys.argv[1])
sm = Path("sitemap.xml").read_text(encoding="utf-8")
paths = re.findall(r"<loc>https://vaybik\.ru(/[^<]*)</loc>", sm)
extra = ["/automation.html", "/bitrix.html", "/kontakty/", "/kontakty", "/leadweb/", "/leadweb", "/leadweb/uslugi/"]
# старый путь на Pages → канон на vaybik.ru
CANON = {
    "/automation.html": "/avtomatizaciya-1c/",
    "/bitrix.html": "/bitrix/",
    "/kontakty": "/o-nas/",
    "/kontakty/": "/o-nas/",
}
seen = []
for p in paths + extra:
    if p not in seen:
        seen.append(p)

def canon_path(path: str) -> str:
    if path in CANON:
        return CANON[path]
    if path.startswith("/leadweb/"):
        return path[len("/leadweb") :] or "/"
    if path == "/leadweb":
        return "/"
    return path

def stub(path: str) -> None:
    target = "https://vaybik.ru" + canon_path(path)
    if path == "/":
        file = out / "index.html"
    elif path.endswith(".html"):
        file = out / path.lstrip("/")
    else:
        file = out / path.strip("/") / "index.html"
    file.parent.mkdir(parents=True, exist_ok=True)
    t = json.dumps(target)
    file.write_text(
        f"""<!doctype html>
<html lang=\"ru\">
<head>
<meta charset=\"utf-8\">
<title>Переезд на vaybik.ru</title>
<link rel=\"canonical\" href=\"{target}\">
<meta name=\"robots\" content=\"noindex,follow\">
<meta http-equiv=\"refresh\" content=\"0; url={target}\">
<script>location.replace({t});</script>
</head>
<body>
<p>Сайт переехал: <a href=\"{target}\">{target}</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )

for p in seen:
    stub(p)

(out / "404.html").write_text(
    """<!doctype html>
<html lang=\"ru\">
<head>
<meta charset=\"utf-8\">
<title>Переезд на vaybik.ru</title>
<meta name=\"robots\" content=\"noindex,follow\">
<script>
(function () {
  var path = location.pathname || \"/\";
  if (path.indexOf(\"/leadweb/\") === 0) path = path.slice(\"/leadweb\".length) || \"/\";
  else if (path === \"/leadweb\") path = \"/\";
  var map = {\"/automation.html\": \"/avtomatizaciya-1c/\", \"/bitrix.html\": \"/bitrix/\", \"/kontakty\": \"/o-nas/\", \"/kontakty/\": \"/o-nas/\"};
  if (map[path]) path = map[path];
  var target = \"https://vaybik.ru\" + path + (location.search || \"\") + (location.hash || \"\");
  var link = document.createElement(\"link\");
  link.rel = \"canonical\";
  link.href = target;
  document.head.appendChild(link);
  location.replace(target);
})();
</script>
</head>
<body>
<p>Сайт переехал на <a href=\"https://vaybik.ru/\">https://vaybik.ru/</a></p>
</body>
</html>
""",
    encoding="utf-8",
)
(out / ".nojekyll").write_text("", encoding="utf-8")
print(f"stubs: {len(seen)} paths")
PY

rm -rf "$KEEP"
git clone --quiet --shared --no-checkout "$SRC" "$KEEP"
cd "$KEEP"
git checkout --quiet --orphan gh-pages
git rm -rf . >/dev/null 2>&1 || true
# clear any leftover tracked files from index
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -a "$STUBS"/. .
git add -A
git -c user.email="deploy@vaybik.ru" -c user.name="vaybik-deploy" commit -m "chore(pages): заглушки canonical → vaybik.ru" >/dev/null

echo "OK: orphan gh-pages в $KEEP"
echo "Пуш (только после «да»):"
echo "  git -C $KEEP push git@github-leadweb:bilarius1-tech/leadweb.git gh-pages:gh-pages"
echo "Потом в GitHub → Settings → Pages → branch gh-pages / (root). Сам не переключаю."
