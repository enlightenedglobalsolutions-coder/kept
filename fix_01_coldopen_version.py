#!/usr/bin/env python3
"""
Kept — Fix 01: cold-open version stamp (EGS-STANDARDS §2 row 2).

Run from the same folder as index.html:
    python3 fix_01_coldopen_version.py

Kept set window.EGS_VERSION and displayed it NOWHERE. Its own comment at the
service-worker block has claimed "update banner + version stamp" since it was
written; only the update banner was ever built. So there has been no way to
tell a landed deploy from a failed one from inside the app.

TWO STAMPS, because Kept has TWO cold-open paths:
  * #lock — shown when a PIN is set. It is position:fixed inset:0 z-index:100,
    an opaque full-screen overlay, so anything in the shell behind it is
    covered. The version has to be ON the lock screen or it is unreadable
    before unlocking, which is precisely the "before any PIN" case §2 names.
  * the shell — when no PIN is set, lockGate() goes straight to render() and
    the first screen is Your People. A stamp after #app is visible there and
    on every later screen.

Both are filled by one pass over [data-egs-version] from window.EGS_VERSION, so
they cannot drift apart.

Carries EGS-STD:coldopen-version so egs-deploy.sh --full can assert it.

This is the memorial app: the stamps are additive, sit outside every render
path, and touch no data, no storage key and no existing markup.

Backs up first, exact anchors, ==1 guards, atomic, node --check.
"""
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

HTML = Path("index.html")
MARKER = "EGS-STD:coldopen-version"

STAMP_STYLE = ("font-size:10px;letter-spacing:.06em;opacity:.55;"
               "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;text-align:center")

# 1 ── populate pass, right after the version is declared
A_DECL = "<script>window.EGS_VERSION = '2026.08.01-1149';</script>"
R_DECL = """<script>window.EGS_VERSION = '2026.08.01-1149';</script>
<!-- EGS-STD:coldopen-version -->
<script>
/* One source for every visible stamp. Runs on DOMContentLoaded so the lock
   screen carries it too — that is the only screen a returning PIN user sees
   before unlocking, and the shell behind it is covered by an opaque overlay. */
document.addEventListener('DOMContentLoaded', function () {
  var v = window.EGS_VERSION || 'dev build';
  var els = document.querySelectorAll('[data-egs-version]');
  for (var i = 0; i < els.length; i++) {
    els[i].textContent = 'Kept \\u00b7 EGS \\u00b7 v' + v;
  }
});
</script>"""

# 2 ── on the lock screen, below the PIN error line
A_LOCK = '  <div class="err" id="lock-err"></div>\n</div>'
R_LOCK = ('  <div class="err" id="lock-err"></div>\n'
          f'  <div data-egs-version style="{STAMP_STYLE};margin-top:26px">—</div>\n</div>')

# 3 ── in the shell, visible on every unlocked screen incl. the first one
A_APP = '<div id="app"></div>'
R_APP = ('<div id="app"></div>\n'
         f'<div data-egs-version style="{STAMP_STYLE};padding:18px 0 26px">—</div>')

EDITS = [
    ("populate pass + EGS-STD marker", A_DECL, R_DECL),
    ("stamp on the lock screen", A_LOCK, R_LOCK),
    ("stamp in the shell", A_APP, R_APP),
]


def die(msg):
    print("  ABORT: " + msg)
    sys.exit(1)


def main():
    if not HTML.exists():
        die("index.html not found — run this from the app folder")
    src = HTML.read_text(encoding="utf-8")

    if MARKER in src:
        print("  already applied — nothing to do")
        return

    stamp = time.strftime("%Y%m%d-%H%M%S")
    bak = HTML.with_suffix(HTML.suffix + f".bak.{stamp}")
    shutil.copy2(HTML, bak)
    print(f"== Backup ==\n  {bak}")

    print("== Edits ==")
    out = src
    for label, anchor, repl in EDITS:
        n = out.count(anchor)
        if n != 1:
            die(f"{label}: anchor matched {n} times, expected exactly 1")
        out = out.replace(anchor, repl)
        print(f"  PASS  {label}")

    HTML.write_text(out, encoding="utf-8")

    # ---- validate --------------------------------------------------------
    print("== Validate ==")
    blocks = re.findall(r"<script[^>]*>(.*?)</script>", out, re.S)
    tmp = Path("/tmp/kept_fix01_check.js")
    tmp.write_text("\n;\n".join(x for x in blocks if x.strip()), encoding="utf-8")
    r = subprocess.run(["node", "--check", str(tmp)], capture_output=True, text=True)
    if r.returncode != 0:
        shutil.copy2(bak, HTML); die("inline JS failed node --check (restored):\n" + r.stderr)
    print("  PASS  inline JS parses")

    lock = re.search(r'<div id="lock"[\s\S]*?\n</div>', out)
    if not lock or "data-egs-version" not in lock.group(0):
        shutil.copy2(bak, HTML)
        die("the lock screen has no stamp — the before-PIN case is not covered")
    print("  PASS  lock screen carries a stamp (before-PIN case)")

    if not re.search(r'<div id="app"></div>\n<div data-egs-version', out):
        shutil.copy2(bak, HTML)
        die("the shell has no stamp — the no-PIN cold open is not covered")
    print("  PASS  shell carries a stamp (no-PIN cold open)")

    if out.count("data-egs-version") != 3:      # 2 elements + 1 selector
        shutil.copy2(bak, HTML)
        die(f"expected 2 stamp elements + 1 selector, found {out.count('data-egs-version')}")
    print("  PASS  2 stamp elements, 1 populate selector")

    # the memorial app: nothing about storage or data may have moved
    for guard in ("punchlist", "kept.installPromptDismissed"):
        if src.count(guard) != out.count(guard):
            shutil.copy2(bak, HTML); die(f"{guard} occurrences changed (restored)")
    print("  PASS  storage names untouched (punchlist, prefixed install key)")

    print("\ndone — version readable before unlocking and on the first screen")


if __name__ == "__main__":
    main()
