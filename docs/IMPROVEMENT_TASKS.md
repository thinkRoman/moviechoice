# MovieChoice — Improvement Task List

> Current product is usable. These tasks fine-tune recommendations, family UX, and reliability — ordered by impact.

**Last updated:** 2026-08-06  
**Status:** Open  
**Related:** Friday Picks inspiration, per-user PIN history, Movies & Shows Picks

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Do next — biggest quality / trust win |
| **P1** | Core product polish |
| **P2** | Important, can wait |
| **P3** | Nice to have |

---

## P0 — Recommendation quality

### Task 1 — Liked-title seeding into picks
**Goal:** Thumbs up / favorites should steer the next shortlist (“more like this”).

**Work:**
- [ ] Collect liked / favorited title IDs per user from `UserMovie` / taste signals
- [ ] For up to ~3 seeds per media type, call TMDB `/movie/{id}/recommendations` and `/tv/{id}/recommendations`
- [ ] Merge into the candidate pool with a `recHits`-style boost
- [ ] Still enforce selected streaming providers (no bypass)
- [ ] Still exclude watched / dismissed / recent history

**Done when:** A title marked 👍 increases odds of related picks on the next refresh, only on allowed services.

---

### Task 2 — Make feedback reshape the next round
**Goal:** Watched, thumbs down, and thumbs up clearly change future picks.

**Work:**
- [ ] Confirm “Seen it” never returns (already filtered; add regression test around API)
- [ ] Thumbs down → stronger neighborhood suppression (related genres/titles), not only exact ID
- [ ] Surface short copy on Picks: “Your 👍/👎 and Watched list shape the next round”

**Done when:** Owner and a member (e.g. ash) each see feedback affect *their* next list only.

---

### Task 3 — Weekly Friday-style refresh
**Goal:** Honor the family weekly rhythm; `weeklyRefresh` should mean something.

**Work:**
- [ ] If `weeklyRefresh` is on, auto-offer or auto-generate a fresh list after Friday (or configurable weekday)
- [ ] Keep a “Refresh picks” manual control
- [ ] Show “Week of …” consistently with when the list was generated

**Done when:** Families get a predictable weekly shortlist without hunting for the button.

---

## P1 — Product / UX

### Task 4 — Stronger streaming availability guarantee
**Goal:** Never recommend something the household can’t stream.

**Work:**
- [ ] Keep discovery filter + post-enrichment provider check
- [ ] If enrichment finds no matching flatrate provider, replace with next candidate
- [ ] Show primary service clearly on each card (already started; harden edge cases)

**Done when:** Spot-checks on Netflix-only / Prime-only settings never show wrong services.

---

### Task 5 — In-app TV detail pages
**Goal:** Shows feel first-class like movies.

**Work:**
- [ ] Add `/shows/[id]` (or unified `/titles/[type]/[id]`) detail route
- [ ] Cast, overview, where to watch, library actions
- [ ] Point Picks “Details” links for TV into the app

**Done when:** Movie and show detail flows match in quality; no forced TMDB bounce for basic details.

---

### Task 6 — Unify visual system (or intentional split)
**Goal:** Home / Settings / Picks feel like one product.

**Work:**
- [ ] Decide: all light Friday-style, all dark cinematic, or “Picks is light / rest is dark” on purpose
- [ ] Align fonts, buttons, nav (mobile bottom nav already adapts on `/for-you`)
- [ ] Apply tokens in CSS variables once

**Done when:** A new user doesn’t feel they’ve switched apps on Picks.

---

### Task 7 — Per-member first-run onboarding
**Goal:** Invited PIN users (ash, etc.) set services + counts before first Recommend.

**Work:**
- [ ] Detect empty recommendation settings on first login
- [ ] Short flow: streaming services → movie/show counts → optional taste note
- [ ] Then land on Movies & Shows Picks

**Done when:** New members don’t hit an empty/broken picks state.

---

## P2 — Reliability / ops

### Task 8 — Faster picks generation (cache enrichment)
**Goal:** Cut latency and TMDB cost.

**Work:**
- [ ] Cache enriched title metadata (runtime, genres, language, providers) in `CatalogCache` or similar
- [ ] Parallelize carefully with a concurrency limit
- [ ] Reuse cache across users when provider region matches

**Done when:** Typical refresh feels snappy; fewer redundant TMDB detail calls.

---

### Task 9 — Clearer empty and error states
**Goal:** Users know what to do when lists fail or are empty.

**Work:**
- [ ] Empty: “Choose streaming services in Settings”
- [ ] OpenAI down: still show picks with overview fallback (already); say blurbs are limited
- [ ] TMDB failure: friendly retry, not a blank page

**Done when:** No dead-end screens without a next action.

---

### Task 10 — Production env checklist
**Goal:** Vercel always has what the app needs.

**Work:**
- [ ] Confirm in Vercel: `MONGODB_URI`, `MONGODB_DB`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `OWNER_EMAIL`, `OWNER_PIN`, `TMDB_API_READ_ACCESS_TOKEN`, `OPENAI_API_KEY`, Resend vars
- [ ] Document in README / ops note (no secret values)

**Done when:** Fresh preview + production deploys don’t fail on missing config.

---

### Task 11 — History controls
**Goal:** Families can reset “don’t show again” when the shortlist feels stuck.

**Work:**
- [ ] “Fresh start” control to clear or trim `recommendationHistory`
- [ ] Optional: shorter suppression window vs forever-until-watched

**Done when:** Users can intentionally get new variety without losing watched data.

---

## P3 — Nice to have

### Task 12 — Family Takes (shared comments)
**Goal:** Optional social layer from the Friday Picks reference.

**Work:**
- [ ] Per-title comments scoped to household / membership
- [ ] Private vs share-with-family toggle
- [ ] Only build if real usage demand appears

**Done when:** Comments persist per user/household and show on Picks cards.

---

### Task 13 — Trim unused auth paths
**Goal:** PIN invite is the real path; remove dead Google/WhatsApp surface if unused.

**Work:**
- [ ] Audit remaining Google / WhatsApp routes and UI
- [ ] Remove or hide anything not in production use
- [ ] Keep docs aligned with PIN + Owner bootstrap

**Done when:** Sign-in story is one clear path.

---

## Suggested build order

1. Task 1 — Liked-title seeding  
2. Task 2 — Feedback reshapes next round  
3. Task 4 — Streaming guarantee harden  
4. Task 7 — Per-member onboarding  
5. Task 5 — TV detail pages  
6. Task 3 — Weekly refresh  
7. Task 8 — Enrichment cache  
8. Task 6 — Visual unification  
9. Tasks 9–13 as capacity allows  

---

## Notes

- All personalization must stay **per `userId`** (Owner vs ash, etc.) — Profile, `UserMovie`, recommendation history.
- OpenAI should keep explaining; TMDB + ranking should keep selecting (Friday Picks architecture).
- Prefer shipping one P0 task end-to-end over starting many in parallel.
