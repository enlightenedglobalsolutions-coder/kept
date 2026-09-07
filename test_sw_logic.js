// ============================================================================
//  test_sw_logic.js — the platform sw_logic.js suite, ported for KEPT.
//  Ported 2026-09-07: KEPT carried a pre-raceTimeout skeleton copy — on a
//  network that connects but never answers (captive portal, jobsite wifi),
//  fetch stayed pending, the catch never fired, and the app hung on a blank
//  screen. Same class of bug that took down Notebuilt on 2026.08.12-1407.
//  See platform/test_sw_logic.js for the canonical suite.
// ============================================================================
const L = require('./sw_logic.js');
let p=0,f=0; const ok=(n,c,x)=>{ c?(p++,console.log("  PASS "+n)):(f++,console.log("  FAIL "+n+" ["+x+"]")); };

ok("cacheName format", L.cacheName("kept","2026.07.19-1808")==="egs-kept-2026.07.19-1808");

// stale-cache cleanup: keep current, delete old SAME app, never touch OTHER apps
let keys=["egs-kept-2026.07.18-1000","egs-kept-2026.07.19-1808","egs-stagger-2026.07.19-0900","random-cache"];
let del=L.staleCaches(keys,"kept","2026.07.19-1808");
ok("deletes old same-app cache", del.includes("egs-kept-2026.07.18-1000"));
ok("keeps current cache", !del.includes("egs-kept-2026.07.19-1808"));
ok("never touches OTHER app cache", !del.includes("egs-stagger-2026.07.19-0900"));
ok("ignores non-egs caches", !del.includes("random-cache"));
ok("exactly 1 to delete here", del.length===1, del.length);

// strategy: the crux — HTML is network-first, assets swr
ok("navigation -> network-first", L.strategyFor("navigate","")==="network-first");
ok("html accept -> network-first", L.strategyFor("cors","text/html,*/*")==="network-first");
ok("icon -> stale-while-revalidate", L.strategyFor("cors","image/png")==="stale-while-revalidate");
ok("script -> swr", L.strategyFor("cors","application/javascript")==="stale-while-revalidate");

// version format
ok("valid version accepted", L.isValidVersion("2026.07.19-1808"));
ok("bad version rejected", !L.isValidVersion("v3"));
ok("DEV placeholder rejected", !L.isValidVersion("DEV"));

// SW_DEADLINE — the race. Fake timers so the suite stays instant and
// deterministic: nothing here waits on a real clock.
function fakeTimers(){
  var q=[], n=0;
  return { set:function(fn,ms){ n++; q.push({id:n,fn:fn,ms:ms}); return n; },
           clear:function(id){ q=q.filter(function(t){ return t.id!==id; }); },
           fire:function(){ var due=q; q=[]; due.forEach(function(t){ t.fn(); }); },
           pending:function(){ return q.length; } };
}
const hang = () => new Promise(function(){});            // never settles: the captive-portal case

// A suite that AWAITS a promise which never settles does not fail — the event
// loop drains and node exits 0, so a hang reads as a pass. That is the same
// shape as the bug this file tests for, and it bit this suite: with the
// deadline mutated out, only one assertion logged FAIL and the process still
// exited 0. Both guards below exist so silence can never mean success.
const WATCHDOG = setTimeout(() => {
  console.log("  FAIL suite did not finish — a promise never settled");
  process.exit(1);
}, 5000);
// Await, but never forever: an unsettled promise becomes a named failure.
const within = (pr, label) => Promise.race([
  pr,
  new Promise((r) => setTimeout(() => r("__NEVER_SETTLED__"), 1000))
]).then((v) => { if (v === "__NEVER_SETTLED__") console.log("  (hung: " + label + ")"); return v; });

(async () => {
  // 1. healthy network wins, fallback never consulted
  let usedFallback=false, T=fakeTimers();
  let r = await L.raceTimeout(Promise.resolve("NET"), 3500, ()=>{usedFallback=true;return "CACHE";}, T);
  ok("fast network wins the race", r==="NET", r);
  ok("fallback not consulted when network wins", !usedFallback);
  ok("timer cleared when network wins", T.pending()===0, T.pending());

  // 2. THE BUG: a network that hangs must not hang the app
  T=fakeTimers();
  let pending = L.raceTimeout(hang(), 3500, ()=>"CACHE", T);
  ok("timer armed while the network hangs", T.pending()===1, T.pending());
  T.fire();
  ok("hanging network falls back to cache", (await within(pending,"hanging network"))==="CACHE");

  // 3. a REJECTING network (true offline) still falls back — old behaviour kept
  T=fakeTimers();
  r = await L.raceTimeout(Promise.reject(new Error("offline")), 3500, ()=>"CACHE", T);
  ok("rejected network falls back to cache", r==="CACHE", r);
  ok("timer cleared on rejection too", T.pending()===0, T.pending());

  // 4. a late network answer must NOT override what was already served
  T=fakeTimers();
  let release; const slow = new Promise(function(res){ release=res; });
  let served = L.raceTimeout(slow, 3500, ()=>"CACHE", T);
  T.fire();
  ok("deadline serves cache first", (await served)==="CACHE");
  release("LATE-NET");
  await slow;
  ok("late network does not change what was served", (await served)==="CACHE");

  // 5. the constant is a sane deadline, not a placeholder
  ok("NET_TIMEOUT_MS in the 3-4s band", L.NET_TIMEOUT_MS>=3000 && L.NET_TIMEOUT_MS<=4000, L.NET_TIMEOUT_MS);

  // 6. SW_TIMER_RECEIVER — the regression that shipped and broke the flagship.
  // Browsers enforce a Web IDL receiver on setTimeout; node does not, so this
  // simulates it. `{set:setTimeout}` + `T.set(...)` calls with `this === T` and
  // a real browser answers "Illegal invocation" — inside a Promise executor
  // that is a rejection, respondWith() gets it, and the navigation dies.
  // Without this shim node cannot see the bug at all.
  const realSetTimeout = global.setTimeout;
  global.setTimeout = function(fn, ms){
    if (this !== global && this !== undefined && this !== globalThis) {
      throw new TypeError("Illegal invocation");
    }
    return realSetTimeout(fn, ms);
  };
  let receiverOk = false, receiverErr = null;
  try {
    receiverOk = (await L.raceTimeout(Promise.resolve("NET"), 3500, () => "CACHE")) === "NET";
  } catch (e) { receiverErr = e.name + ": " + e.message; }
  let hangOk = false;
  try {
    hangOk = (await L.raceTimeout(new Promise(function(){}), 20, () => "CACHE")) === "CACHE";
  } catch (e) { receiverErr = receiverErr || (e.name + ": " + e.message); }
  global.setTimeout = realSetTimeout;
  ok("default timers survive a Web IDL receiver check (fast path)", receiverOk, receiverErr);
  ok("default timers survive a Web IDL receiver check (deadline path)", hangOk, receiverErr);

  clearTimeout(WATCHDOG);
  console.log("\n"+p+" passed, "+f+" failed"); process.exit(f?1:0);
})();
