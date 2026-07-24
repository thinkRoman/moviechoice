# MovieChoice — Outstanding Questions

> The single place to resolve everything still unsettled before we design the architecture.
> Sourced from the `OPEN` and `Pending Decision` items in [`DISCOVERY.md`](./DISCOVERY.md), plus new questions surfaced while reviewing it.
>
> **How to use:** Each question carries a **Status**. When a decision is made, set Status to `RESOLVED`, record the decision, and graduate it into a `FINAL` decision in `DISCOVERY.md`.

**Last updated:** 2026-07-23

**Priority legend:** 🟥 Blocking (architecture can't start without it) · 🟨 Important (shapes design, has a safe default) · 🟩 Deferrable (can decide during build)

---

## Authentication 🟥

- **Status:** OPEN
- **Question:** Should users be able to use MovieChoice without creating an account?
- **Options:**
  - Anonymous first
  - Sign in first
- **Recommendation:** Anonymous first — deliver a great Quick Pick immediately, prompt to sign up to save.
- **Impact:** Recommendation quality
- **Decision Owner:** Ashwani

---

## Auth Providers 🟥

- **Status:** OPEN
- **Question:** Which sign-in methods should MovieChoice support?
- **Options:**
  - Email magic-link + Google + Apple
  - Email / password only
  - Social providers only (Google / Apple)
- **Recommendation:** Email magic-link + Google + Apple — low friction, mobile-friendly, passwordless.
- **Impact:** Onboarding friction, mobile UX
- **Decision Owner:** Ashwani

---

## Household Profiles ("Who's Watching?") 🟥

- **Status:** OPEN
- **Question:** How do we model who is watching on a shared couch device?
- **Options:**
  - Lightweight household profiles under one account (Netflix-style)
  - Ad-hoc guests per session (no stored profiles)
  - Separate accounts per person
- **Recommendation:** Lightweight household profiles under one account — one login, multiple tastes; sets up future household sync.
- **Impact:** Personalization, Quick Pick flow, future household sync
- **Decision Owner:** Ashwani

---

## Taste Signals 🟨

- **Status:** OPEN
- **Question:** Where do like/dislike and taste signals come from?
- **Options:**
  - In-app signals only (thumbs, ratings, "seen it", skips)
  - Also import history from streaming accounts
- **Recommendation:** In-app signals only — no external dependency, fully controllable.
- **Impact:** Personalization quality, data model
- **Decision Owner:** Ashwani

---

## Catalog Data Source 🟥

- **Status:** OPEN
- **Question:** Where does the verified catalog (metadata + streaming availability) come from for v1?
- **Options:**
  - TMDB only, behind a `CatalogProvider` abstraction
  - TMDB (metadata) + a paid availability API (Watchmode / JustWatch)
  - Paid provider only
- **Recommendation:** TMDB only behind an abstraction — cheap, fast to ship, upgradeable later without rework.
- **Impact:** Availability accuracy, cost, "watch it now" promise
- **Decision Owner:** Ashwani

---

## Region Support 🟥

- **Status:** OPEN
- **Question:** How many regions must v1 support?
- **Options:**
  - US-only for v1, region modeled as a first-class field
  - A few English markets (US, UK, CA, AU)
  - Multi-region from day one
- **Recommendation:** US-only, region-aware data model — maximizes accuracy now, expandable later.
- **Impact:** Data model, availability accuracy, scope
- **Decision Owner:** Ashwani

---

## Catalog Freshness & Sync 🟨

- **Status:** OPEN
- **Question:** How do we keep constantly-changing availability data fresh?
- **Options:**
  - On-demand fetch + short-TTL cache in MongoDB
  - Scheduled background sync of the full catalog
  - Hybrid: cache on demand + periodic refresh of popular titles
- **Recommendation:** On-demand fetch + short-TTL cache for v1; revisit if rate limits bite.
- **Impact:** Accuracy, cost, TMDB rate limits
- **Decision Owner:** Ashwani

---

## AI Provider 🟥

- **Status:** OPEN
- **Question:** Which LLM powers the AI interpretation and explanation layers?
- **Options:**
  - Claude (Anthropic), latest models
  - Another provider
- **Recommendation:** Claude — strong grounding/tool-use, fits the API-first, grounded design.
- **Impact:** AI quality, cost, grounding approach
- **Decision Owner:** Ashwani

---

## AI Grounding Mechanism 🟨

- **Status:** OPEN
- **Question:** How does the AI stay grounded so it never invents titles or availability?
- **Options:**
  - Tool / function-calling: AI queries the deterministic engine + catalog, never free-generates titles
  - Retrieval-augmented prompt (inject candidate titles into context)
  - Hybrid
- **Recommendation:** Tool/function-calling, with candidates injected as needed.
- **Impact:** Trust, hallucination risk, latency
- **Decision Owner:** Ashwani

---

## Instant-Start vs. Save 🟥

- **Status:** OPEN
- **Question:** If anonymous use is allowed, when do we prompt to sign up?
- **Options:**
  - Anonymous session first, prompt to sign up to save
  - Require sign-up before first recommendation
  - Fully anonymous allowed; account optional forever
- **Recommendation:** Anonymous session first, prompt to save — depends on the Authentication decision above.
- **Impact:** Conversion, personalization persistence
- **Decision Owner:** Ashwani

---

## Time Budget Semantics 🟩

- **Status:** OPEN
- **Question:** What does "How much time do you have?" filter against?
- **Options:**
  - Movie runtime and TV episode length from catalog metadata
  - Also model "how many episodes fit" for series
- **Recommendation:** Runtime + episode length for v1.
- **Impact:** Quick Pick flow, catalog metadata needs
- **Decision Owner:** Ashwani

---

## Playback Hand-off 🟨

- **Status:** OPEN
- **Question:** What happens when a user selects a recommended title?
- **Options:**
  - Deep-link out to the provider's app/web where available, else show where to watch
  - Informational only (show the service name, no link)
- **Recommendation:** Deep-link out where available.
- **Impact:** End of Quick Pick flow, provider integrations
- **Decision Owner:** Ashwani

---

## Language & Localization 🟩

- **Status:** OPEN
- **Question:** What languages does v1 support?
- **Options:**
  - English-only UI and content for v1
  - Localization-ready from the start
- **Recommendation:** English-only for v1 (consistent with US-only region).
- **Impact:** Scope, i18n effort
- **Decision Owner:** Ashwani

---

## Resolved → moved to DISCOVERY.md

_(Nothing resolved yet. As each question is answered, set its Status to `RESOLVED`, add the row below, and record the FINAL decision in `DISCOVERY.md`.)_

| Question | Decision | Date | Reflected in DISCOVERY.md |
|----------|----------|------|---------------------------|
| — | — | — | — |
