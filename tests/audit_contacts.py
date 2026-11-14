#!/usr/bin/env python3
"""Contact touchpoints in page bodies stay on About and cases.
The site-wide header and mobile menu may include Telegram and email CTAs."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARK = re.compile(r"tel:|mailto:|max\.ru|t\.me/|wa\.me|Позвонить Алексею|Позвонить Игорю", re.I)
ABOUT = ROOT / "o-nas" / "index.html"
CASES = ROOT / "keysy-ii" / "index.html"
CALC = ROOT / "kalkulyator" / "index.html"
ALLOWED_CONTACT_PAGES = {ABOUT.resolve(), CASES.resolve(), CALC.resolve()}
# Calculator tool scripts (client /kalkulyator/ and unlisted internal /kp/) build the
# "send request" links and KP contact pages, so they may carry Telegram/email.
TOOL_DIRS = {(ROOT / "kalkulyator").resolve(), (ROOT / "kp").resolve()}
CHROME_OK = re.compile(r"mailto:bilariuss@yandex\.ru|t\.me/bilarius", re.I)
ok = True


def main_span(text):
    a = text.find("<main")
    b = text.find("</main>")
    return a, b


def in_range(pos, spans):
    return any(a <= pos < b for a, b in spans)


def chrome_spans(text):
    spans = []
    for m in re.finditer(r"<header\b", text):
        end = text.find("</header>", m.start())
        if end != -1:
            spans.append((m.start(), end + len("</header>")))
    i = text.find('<div class="menu"')
    if i != -1:
        depth = 0
        j = i
        while j < len(text):
            if text.startswith("<div", j):
                depth += 1
                j += 4
                continue
            if text.startswith("</div>", j):
                depth -= 1
                j += 6
                if depth == 0:
                    spans.append((i, j))
                    break
                continue
            j += 1
    return spans


for path in sorted(ROOT.rglob("*")):
    if path.suffix not in {".html", ".txt", ".xml", ".js"}:
        continue
    if "studio-preview" in path.name:
        continue
    if path.resolve().parent in TOOL_DIRS and path.resolve() != CALC.resolve():
        continue
    text = path.read_text(encoding="utf-8")
    hits = list(MARK.finditer(text))
    if not hits:
        continue
    a, b = main_span(text)
    chrome = chrome_spans(text)
    unexpected = []
    for m in hits:
        snippet = text[max(0, m.start() - 20): m.end() + 40]
        in_main = a != -1 and b != -1 and a <= m.start() < b
        in_chrome = in_range(m.start(), chrome)
        if in_main:
            if path.resolve() not in ALLOWED_CONTACT_PAGES:
                unexpected.append(m)
            continue
        if in_chrome and CHROME_OK.search(snippet):
            continue
        unexpected.append(m)
    if unexpected:
        print(f"FAIL {path.relative_to(ROOT)} has {len(unexpected)} unexpected contact markers")
        ok = False
        continue
    if path.resolve() not in ALLOWED_CONTACT_PAGES:
        continue
    main = text[a:b]
    if path.resolve() == ABOUT.resolve():
        needed = ["tel:+79212013252", "tel:+79238240461", "mailto:bilariuss@yandex.ru", "max.ru", "t.me/bilarius"]
    else:
        needed = ["mailto:bilariuss@yandex.ru", "t.me/bilarius"]
    for item in needed:
        if item not in main:
            print(f"FAIL {path.relative_to(ROOT)} main missing {item}")
            ok = False

home = (ROOT / "index.html").read_text(encoding="utf-8")
for gone in ("Позвонить Алексею", "Позвонить Игорю", "tel:+79212013252", "tel:+79238240461"):
    if gone in home:
        print(f"FAIL homepage still contains {gone}")
        ok = False
if 'id="calc"' not in home or "<output>" not in home:
    print("FAIL homepage calculator markup missing")
    ok = False
calc = home[home.find('id="calc"'):home.find("</form>", home.find('id="calc"'))]
if MARK.search(calc):
    print("FAIL calculator still has a contact action")
    ok = False
if "Калькулятор ничего не отправляет" not in home and "ничего не отправляет" not in home:
    print("FAIL calculator does not state that it does not submit")
    ok = False

nav = home.split('<nav class="nav"', 1)[1].split("</nav>", 1)[0]
mob = home.split('Мобильное меню">', 1)[1].split("</nav>", 1)[0]
for label, block in (("desktop", nav), ("mobile", mob)):
    if "automation.html" not in block or "bitrix.html" not in block:
        print(f"FAIL {label} menu missing service pages")
        ok = False
    if "kontakty" in block:
        print(f"FAIL {label} menu still links to contacts")
        ok = False

if "kontakty/" in (ROOT / "sitemap.xml").read_text(encoding="utf-8"):
    print("FAIL sitemap still lists contacts")
    ok = False
if not (ROOT / "kontakty" / "index.html").read_text(encoding="utf-8").startswith("<!doctype html>"):
    print("FAIL contacts redirect missing")
    ok = False

if ok:
    print("ok: contacts in About/cases main; header may use Telegram and email; homepage calls gone")
    sys.exit(0)
sys.exit(1)
