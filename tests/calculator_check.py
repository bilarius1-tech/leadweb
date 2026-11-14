#!/usr/bin/env python3
"""Calculator: public /kalkulyator/ hides internal pricing UI; /kp/ stays unlisted and noindex."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = 0


def fail(msg):
    global errors
    errors += 1
    print("FAIL:", msg)


client = (ROOT / "kalkulyator" / "index.html").read_text(encoding="utf-8")
internal = (ROOT / "kp" / "index.html").read_text(encoding="utf-8")
for bad in ("ставк", "Ставк", "налог", "Налог", "Часов", "ч/мес", 'id="rate"', 'id="tax"', "SHEETS_URL", "config.js", "docs.google.com"):
    if bad in client:
        fail(f"client calculator exposes {bad!r}")
if 'data-mode="client"' not in client:
    fail("client page is not in client mode")
for need in ("/leadweb/kalkulyator/data.js", "/leadweb/kalkulyator/calc.js", "t.me/bilarius", "mailto:bilariuss@yandex.ru", 'id="lcBrief"', 'id="lcPdf"'):
    if need not in client:
        fail(f"client calculator missing {need}")
if 'content="noindex,nofollow' not in internal:
    fail("internal /kp/ is not noindex,nofollow")
if 'data-mode="internal"' not in internal or "/leadweb/kalkulyator/calc.js" not in internal:
    fail("internal /kp/ does not use the shared engine")
if "/leadweb/kp/" in (ROOT / "sitemap.xml").read_text(encoding="utf-8"):
    fail("sitemap lists internal /kp/")
if "/leadweb/kp/" in (ROOT / "llms.txt").read_text(encoding="utf-8"):
    fail("llms.txt lists internal /kp/")
for path in ROOT.rglob("*.html"):
    if path.parent.name == "kp":
        continue
    if re.search(r'href="/leadweb/kp/', path.read_text(encoding="utf-8")):
        fail(f"{path.relative_to(ROOT)} links to internal /kp/")
home = (ROOT / "index.html").read_text(encoding="utf-8")
nav = home.split('<nav class="nav"', 1)[1].split("</nav>", 1)[0]
mob = home.split('Мобильное меню">', 1)[1].split("</nav>", 1)[0]
if "/leadweb/kalkulyator/" not in nav or "/leadweb/kalkulyator/" not in mob:
    fail("menu does not link the calculator")
data = (ROOT / "kalkulyator" / "data.js").read_text(encoding="utf-8")
if 'g:"host"' not in data or "Домен, хостинг и сервер" not in data:
    fail("domain/hosting section missing")
if '["custom","Дополнительно"]' in data:
    fail("global «Дополнительно» group is back")
if errors:
    print(f"{errors} failed")
    sys.exit(1)
print("ok: client calculator hides hours/rate/tax, internal /kp/ unlisted and noindex")
