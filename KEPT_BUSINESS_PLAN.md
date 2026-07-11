# Kept — Business Plan (Draft v1)
*Enlightened Global Solutions · Working draft, July 2026*

## The idea, in one line
A quiet, private, on-device place to keep photos and memories of the people
you've loved — visited on your own terms, never pushed at you. Personal-first;
a funeral-home/monument-company sales channel is a possible later phase, not
the starting point.

## Why this, not the physical-plaque business
We researched the QR-code-on-headstone market first. It's saturated — 15+
active competitors (Living Legacy, Turning Hearts, Life's QR, Farewelling,
Scan2Remember, Memorygram, and others), one already Canadian and
industry-award-winning (Life's QR, Niagara Falls, ON — ICCFA 2023). The real
unsolved problem in that whole category is **hosting permanence**: if the
company folds, the physical plaque becomes a dead link forever. Every buyer's
guide in that space flags this as the #1 risk and has no real fix.

Kept sidesteps that problem at the root: it's personal-first and local-first.
There's no third-party hosting to fail, because there's no hosting — data
lives on the person's own device, same as every other EGS app. The physical
memorial (plaque/QR) becomes an optional *later* product built on top of a
personal app that already works and that Edwin already uses himself, rather
than a company built to sell a plaque from day one.

## Product principles
- **Presence without pressure.** No notifications, no badges, no "come back"
  nudges. You visit when you choose to. This is the entire design philosophy,
  not a feature.
- **Local-first, privacy-first.** Same architecture as Notebuilt/WFD: single-file
  PWA, IndexedDB for photos, no account, no server, no tracking.
- **One-time fee, no subscription.** Matches EGS convention and directly
  answers the market's biggest documented complaint (subscription lapses ->
  dead memorial).
- **Dignified, not novel.** Calm sage/ivory palette, serif type for names,
  no gimmicks (no "Discover feed," no social virality mechanics like some
  competitors have).

## V1 (built)
- Add people you've loved (name, relation, dates, a short note)
- Photos per person (camera + library, local storage, downscaled for size)
- Memories: short journal-style entries per person, optionally with a photo
- Simple full-screen photo viewer
- Optional PIN app-lock (this data is more sensitive than almost anything
  else EGS has built — locking it by default-available, not default-on,
  matches Notebuilt's pattern but deserves revisiting)
- Full backup/export and restore, same JSON-based pattern as other EGS apps
- No ads, no accounts, no notifications, ever

## Deliberately deferred (not v1)
- Photo zoom/rotate/markup (Notebuilt already proved this pattern — cheap to
  port over once the core app is validated)
- Sharing a person's page with other family members
- The physical QR/plaque product and funeral-home channel
- "Save as a discreet installable app" for a *specific loved one's page* to
  hand to another family member (distinct from installing the whole app) —
  worth real thought before building, see Open Questions below

## The eventual business layer (Phase 2+, not now)
If/when this becomes something to sell:

**Positioning:** "The only memorial platform where the company folding
can't kill your memories, because we were never holding them."

**Two real, provable differentiators found in research:**
1. **Canadian data residency**, stated plainly and provably (most competitors
   are US-hosted; even the Canadian-founded Life's QR's actual hosting
   location isn't publicly confirmed). "Never leaves Canada" is a concrete
   claim, not a vibe.
2. **A structurally-backed permanence guarantee**, modeled on Ontario's
   legally-regulated cemetery Care & Maintenance trust funds (a % of every
   sale into an untouchable trust, only the yield spent on hosting). This is
   provable and legally precedented in Ontario — but needs real legal advice
   before it's marketed as a "guarantee." Hosting a static memorial page
   costs a small fraction of what physical cemetery upkeep costs, so the
   required trust is proportionally far smaller and more sustainable than
   the cemetery-fund version — but even *those* funds fail to keep pace
   ~40% of the time per industry data, so "guaranteed" needs an honest
   asterisk, not marketing language.

**Go-to-market, if pursued:**
- Phase 1: Personal use, refine based on real use over months, not weeks.
- Phase 2: Soft launch to a small circle, gather honest feedback.
- Phase 3: If there's real pull, build the physical QR/plaque add-on and
  approach funeral homes *in person* — this is explicitly where Edwin's
  own strength (good with people) is the actual asset, more than the code.
  Expect a slow, relationship-driven sales cycle; funeral directors are
  conservative and the pitch is likely one they've heard before from
  someone else. The differentiator has to be trust + relationship +
  the two provable claims above, not "we also have a QR product."

**Pricing anchor:** Market range for physical QR memorial products is
roughly $30–200 CAD one-time. Not a differentiator by itself — just the
going rate to be aware of if/when a plaque product is added.

## Real risks to keep in view (from the research)
- QR codes in unattended public places are a documented phishing vector
  ("quishing") — FTC/FBI have both warned about swapped QR stickers. Any
  future physical-plaque product should print the human-readable URL next
  to the code (verified best practice) so visitors can check the destination.
- ~20% of cemeteries restrict or ban attached plaques; national/veteran
  cemeteries (Arlington, VA) generally don't allow them at all.
- Digital memorial content is a documented target for "digital grave
  robbers" — hackers specifically target deceased people's accounts because
  no one's actively watching them. Local-first storage sidesteps most of
  this by design (nothing centralized to breach), which is worth stating
  plainly in any future marketing.
- The QR-code-usage-is-dead narrative is outdated (COVID reversed it hard —
  ~68-84% of people have scanned one), but the demographic who actually
  visits graves most (55+) is the group least represented among QR users.
  Relevant only if/when the physical-plaque layer gets built.

## Open questions for Edwin (no rush — revisit later)
1. Should PIN lock be pushed harder given how sensitive this data is (e.g.
   suggested on first add, not just buried in Settings)?
2. The "install a specific person's page as its own discreet app" idea —
   genuinely interesting, not something any competitor does, but needs real
   design thought: is it one installable app with multiple people inside
   (current v1 approach), or could/should a single person's page be
   shareable as its own installable artifact for another family member?
3. Rename "Kept" or keep it? Easy to change later (same pattern as every
   other EGS app — one constant at the top of the file).
4. Should there ever be a lightweight way to share one memory or one
   person's page with a family member, or does that break the "quiet,
   personal, mine" principle entirely? Worth sitting with before deciding.

---
*This is a living document — update as the app and thinking evolve.*
