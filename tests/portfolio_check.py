#!/usr/bin/env python3
"""Portfolio page includes the two new sites; the homepage showcase is gone."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
home = (ROOT / "index.html").read_text(encoding="utf-8")
port = (ROOT / "portfolio" / "index.html").read_text(encoding="utf-8")
errors = 0

def without_chrome(html):
    import re
    html = re.sub(r"<header\b[\s\S]*?</header>", "", html, count=1)
    i = html.find('<div class="menu"')
    if i != -1:
        depth = 0
        j = i
        while j < len(html):
            if html.startswith("<div", j):
                depth += 1
                j += 4
                continue
            if html.startswith("</div>", j):
                depth -= 1
                j += 6
                if depth == 0:
                    html = html[:i] + html[j:]
                    break
                continue
            j += 1
    return html


def fail(msg):
    global errors
    errors += 1
    print("FAIL:", msg)

if 'id="cases"' in home or "case-dkbani" in home or "Все проекты" in home:
    fail("homepage still has the work showcase")
for label, block_name in (("desktop", '<nav class="nav"'), ("mobile", "Мобильное меню")):
    block = home.split(block_name, 1)[1].split("</nav>", 1)[0]
    if 'href="/portfolio/"' not in block:
        fail(f"homepage {label} menu missing portfolio")
body_home = without_chrome(home)
if "tel:" in body_home or "mailto:" in body_home or "Позвонить Алексею" in body_home:
    fail("homepage contact action returned")

for needle in (
    "Семейная клиника ДНК",
    "Обновлённый сайт клиники на WordPress + Elementor: современный вид, понятные страницы услуг и удобная запись.",
    "https://dnk-med.ru/",
    "Валдай — Первый километр",
    "Партнёрский сайт «Валдай — Первый километр» работает на сервере клиента и собирает заявки по коммерческой технике.",
    "https://valdai.onekm-stt.ru/",
    "Фабричные бани",
    "https://dkbani.ru/",
    "Спортивный клуб «Реверанс»",
    "https://reverans.online/",
    'width="782" height="1588"',
    "case-dnk-782.webp",
    "case-valdai-782.webp",
):
    if needle not in port:
        fail(f"portfolio missing {needle}")
body_port = without_chrome(port)
if "tel:" in body_port or "mailto:" in body_port or "max.ru" in body_port:
    fail("portfolio has a contact action")
for name in (
    "case-dnk.jpg",
    "case-dnk-782.webp",
    "case-dnk-400.webp",
    "case-valdai.jpg",
    "case-valdai-782.webp",
    "case-valdai-400.webp",
):
    if not (ROOT / "img" / name).exists():
        fail(f"missing image {name}")

if errors:
    print(f"{errors} failed")
    sys.exit(1)
print("ok: portfolio has DNA and Valdai; homepage showcase removed")
