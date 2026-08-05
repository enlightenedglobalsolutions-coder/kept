// ============================================================================
//  test_standards.js — Kept against EGS-STANDARDS §2.
//
//  ROW 2 (cold-open version stamp). Kept has TWO cold-open paths and a test
//  that checks only one of them passes on a build that is blind in the other:
//    * PIN set    -> #lock, an opaque full-screen overlay. A stamp in the shell
//                    behind it is COVERED, so it must be on the lock screen.
//    * no PIN     -> lockGate() calls render() directly; first screen is the
//                    shell, so the shell needs its own.
//  Both are asserted here, by location, not merely "a stamp exists".
//
//  Also guards Tier-1 rule 9: Kept's storage name `punchlist` is PERMANENT,
//  and its install key stays prefixed (fixed in 7feb8bf; the bare key is a
//  live cross-app bug in Notebuilt and Roadside).
// ============================================================================
const fs = require('fs');
const path = require('path');

let p = 0, f = 0;
const ok = (n, c, x) => { c ? (p++, console.log("  PASS " + n))
                            : (f++, console.log("  FAIL " + n + (x === undefined ? "" : " [" + x + "]"))); };

const HERE = __dirname;
const HTML = fs.readFileSync(path.join(HERE, 'index.html'), 'utf8');

// ---- §2 row 2 · cold-open version stamp ------------------------------------
ok("EGS_VERSION is declared", /window\.EGS_VERSION = '[^']*'/.test(HTML));
ok("version is in the deploy-rewritable form",
   /window\.EGS_VERSION = '\d{4}\.\d{2}\.\d{2}-\d{4}'/.test(HTML));
ok("EGS-STD:coldopen-version marker present", HTML.indexOf('EGS-STD:coldopen-version') !== -1);

// path 1 — PIN set: the lock screen must carry it, because #lock covers the shell
const lock = /<div id="lock"[\s\S]*?\n<\/div>/.exec(HTML);
ok("lock screen found", !!lock);
ok("COLD OPEN (PIN set): lock screen carries a stamp",
   !!lock && lock[0].indexOf('data-egs-version') !== -1);
ok("lock screen is the opaque overlay this assumes",
   /#lock\{position:fixed;inset:0;[^}]*z-index:100/.test(HTML));

// path 2 — no PIN: lockGate goes straight to render(), first screen is the shell
ok("COLD OPEN (no PIN): shell carries a stamp",
   /<div id="app"><\/div>\n<div data-egs-version/.test(HTML));
ok("no-PIN path really does skip the lock",
   /if\(!settings\.pinHash\)\{ \$lock\.classList\.add\('hidden'\); showShell\(true\); render\(\);/.test(HTML));

// one source of truth
ok("exactly 2 stamp elements + 1 selector",
   (HTML.match(/data-egs-version/g) || []).length === 3,
   (HTML.match(/data-egs-version/g) || []).length);
ok("both stamps read window.EGS_VERSION",
   /querySelectorAll\('\[data-egs-version\]'\)/.test(HTML) && /var v = window\.EGS_VERSION/.test(HTML));
ok("version literal appears exactly once (the declaration)",
   (HTML.match(/2026\.\d{2}\.\d{2}-\d{4}/g) || []).length === 1,
   (HTML.match(/2026\.\d{2}\.\d{2}-\d{4}/g) || []).length);

// ---- Tier 1 rule 9 · permanent storage names -------------------------------
// NOTE: EGS-STANDARDS §1 rule 9 and the portfolio both say "Kept keeps
// `punchlist`". That is wrong, and verified so: `punchlist` is the storage name
// of a DIFFERENT app — /Volumes/AI Storage/punch-list, its own PWA with its own
// manifest and service worker. Kept has always used `kept`. The two were
// conflated because the portfolio row once read "(KEPT / punch-list)".
// Asserting the REAL names, because a future "restore" to punchlist on the
// strength of that rule would orphan every Kept user's data — exactly the harm
// rule 9 exists to prevent.
ok("IndexedDB name is 'kept'", /indexedDB\.open\('kept'/.test(HTML));
ok("localStorage keys are kept.*-prefixed",
   ['kept.people', 'kept.memories', 'kept.settings'].every((k) => HTML.indexOf("'" + k + "'") !== -1));
ok("no 'punchlist' name has leaked in from the other app",
   HTML.indexOf('punchlist') === -1);
ok("install-dismiss key stays PREFIXED (7feb8bf)",
   HTML.indexOf("'installPromptDismissed'") === -1);
ok("prefixed key is the one in use", /kept\.installPromptDismissed/.test(HTML));

// ---- standing rules --------------------------------------------------------
ok("no eval", !/\beval\s*\(/.test(HTML));

// §2 row 12: zero NEW inline onclick — the legacy count must not INCREASE.
// Kept carries 23 as legacy debt; this pins the ceiling rather than pretending
// it is zero.
const ONCLICK_BASELINE = 23;
const onclicks = (HTML.match(/onclick=/g) || []).length;
ok("inline onclick count has not increased (legacy ceiling " + ONCLICK_BASELINE + ")",
   onclicks <= ONCLICK_BASELINE, onclicks);

// Kept deletes by rebuilding the array with filter(), not splice()
const delLines = HTML.split('\n')
  .map((line, i) => ({ line, n: i + 1 }))
  .filter((r) => /\.filter\((?:x|m|p)=>(?:x|m|p)(?:\.id)?!==/.test(r.line));
ok("delete paths exist to check", delLines.length > 0, delLines.length);
// Kept guards with an early return on a PRECEDING line —
//   b.onclick=()=>{ if(!confirm('Delete this memory?'))return; memories=memories.filter(...)
// so a same-line check would wrongly report all three as unguarded. Scan back
// to the start of the enclosing handler instead.
const allLines = HTML.split('\n');
const unguarded = delLines.filter((r) => {
  for (let i = r.n - 1; i >= Math.max(0, r.n - 6); i--) {
    const l = allLines[i];
    if (/if\(!confirm\([\s\S]*?\)\)\s*return;/.test(l)) return false;   // guarded
    if (/onclick=|addEventListener\(/.test(l)) break;                   // hit handler top
  }
  return true;
});
ok("every delete is confirm-guarded (" + delLines.length + " checked)",
   unguarded.length === 0, unguarded.map((r) => r.n).join(','));

console.log("\n" + p + " passed, " + f + " failed");
process.exit(f ? 1 : 0);
