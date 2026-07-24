# MovieChoice — Product Discovery

> A structured record of the product decisions made during discovery.
> Each decision entry captures the **Question**, the **Final Decision**, the **Rationale**, and a **Status** (`FINAL` / `OPEN` / `DEFERRED`).
> Only final agreed decisions are recorded here — not intermediate discussion.

**Last updated:** 2026-07-23

---

## 1. Product Principles

The core philosophy that should guide every product, design, and engineering decision. These are enduring principles, not features.

1. **Decide in seconds.** Speed is the product. The default path to a great recommendation must be effortless and fast — no typing required.
2. **Feel like a trusted friend.** The tone is warm, confident, and knowledgeable — a friend who knows every movie and every streaming service, not a search box.
3. **Never make the user repeat themselves.** What the app already knows (subscriptions, tastes, who's watching) is remembered and reused automatically.
4. **Recommend what they can watch right now.** The default is always content available immediately on services the user already pays for.
5. **AI enhances, never replaces.** The deterministic engine is the source of truth; AI interprets and explains, but never drives or gates the core experience.
6. **Always grounded, always honest.** The AI never invents titles or availability. Every claim is backed by the verified catalog.
7. **Resilient by design.** If the AI is unavailable, the product keeps working normally on the deterministic engine.
8. **Instant for newcomers, smarter over time.** First-time users get excellent recommendations with zero setup friction; the experience personalizes as it learns.

---

## 2. Product Vision

### 2.1 Core problem & vision

- **Question:** What is the core job MovieChoice does for its user?
- **Final Decision:** MovieChoice solves one problem — **"What should we watch tonight?"** It eliminates streaming decision fatigue by understanding *who* is watching, their *mood*, *available time*, *streaming subscriptions*, and *past likes/dislikes*, then recommending the best movie or TV show in seconds. It should feel like **talking to a trusted friend who knows every movie and every streaming service.**
- **Rationale:** People spend more time browsing than watching. A single, sharply-defined job creates a focused product and a clear north star for every downstream decision.
- **Status:** `FINAL`

### 2.2 Personalization principle

- **Question:** How personalized should recommendations be, and what about first-time users?
- **Final Decision:** The engine becomes **increasingly personalized over time**, while still delivering **excellent instant recommendations for first-time users** (no cold-start wall).
- **Rationale:** Long-term retention comes from learning the user; day-one value comes from working immediately without setup.
- **Status:** `FINAL`

---

## 3. Platform & Technology

### 3.1 Primary platform & form factor

- **Question:** Where will people actually use MovieChoice?
- **Final Decision:** **Mobile-first Progressive Web App (PWA).** Primary experience is a user on the couch with a phone or tablet. It must feel like a native mobile app while remaining instantly accessible from any browser. It must also provide an **excellent desktop experience** for planning ahead and browsing.
- **Rationale:** A PWA delivers the native-feeling couch companion without app-store friction, is fastest to iterate, and works everywhere instantly.
- **Status:** `FINAL`

### 3.2 Technology stack

- **Question:** What stack do we build on?
- **Final Decision:**
  - Next.js 16 (App Router)
  - TypeScript
  - Tailwind CSS
  - shadcn/ui
  - MongoDB
  - NextAuth
  - Vercel
  - Progressive Web App (PWA)
- **Rationale:** A modern, cohesive, Vercel-native stack that supports SSR, an API layer, and a polished component system out of the box.
- **Status:** `FINAL`

### 3.3 API-first architecture

- **Question:** How should the backend be structured given the future roadmap?
- **Final Decision:** The architecture is **API-first**, so future native apps (and other clients) can reuse the same backend.
- **Rationale:** Prevents a costly rewrite when native/TV/voice clients arrive; the web PWA becomes just the first client of a shared API.
- **Status:** `FINAL`

### 3.4 Future roadmap (not in v1 scope)

- **Question:** What is explicitly deferred beyond v1?
- **Final Decision:** Planned but **out of v1 scope**:
  - Native iOS and Android applications
  - Apple TV and Android TV companion apps
  - Voice assistant integration
  - Household synchronization across devices
- **Rationale:** Kept visible so v1 architecture (API-first, region-aware, profile-based subscriptions) is built to accommodate them without rework.
- **Status:** `DEFERRED`

---

## 4. Identity, Accounts & Household

### 4.1 Anonymous-first access & sign-up to save

- **Question:** Should users be able to use MovieChoice without creating an account, and when do we prompt sign-up?
- **Final Decision:** **Anonymous-first.** A first-time user gets the **full Quick Pick experience without an account**. MovieChoice prompts them to **sign up (or sign in) to save** their profile, subscriptions, taste history, and lists. Personalization persists once they have an account.
- **Rationale:** Delivers day-one value instantly (supports the "instant for newcomers" principle), minimizes onboarding friction, and converts to accounts precisely where accounts matter — persistence and personalization.
- **Status:** `FINAL`

### 4.2 Authentication providers

- **Question:** Which sign-in methods should MovieChoice support?
- **Final Decision:** **Email magic-link, Google, and Apple** (via NextAuth). Passwordless.
- **Rationale:** Low friction, mobile-friendly, and no password management burden for users or the team.
- **Status:** `FINAL`

### 4.3 Household profiles ("Who's watching?")

- **Question:** How do we model who is watching on a shared couch device?
- **Final Decision:** **Lightweight household profiles under a single account** (Netflix-style). One login, multiple member profiles, each with its own taste. The Quick Pick "Who's watching?" step selects among them. *(Real-time cross-device household **sync** remains deferred — see §3.4.)*
- **Rationale:** Fits the shared-couch reality, enables per-member personalization, and lays the groundwork for future household sync without committing to it now.
- **Status:** `FINAL`

---

## 5. Interaction & Recommendation Architecture

### 5.1 Core interaction model

- **Question:** How literally do we take "talking to a trusted friend"?
- **Final Decision:** **Hybrid, with a strong bias toward speed.** The default experience **never requires typing** — it is a beautiful, tap-based flow:
  - Who's watching?
  - What mood are you in?
  - How much time do you have?
  - Which streaming services do you have? *(defaulted from profile — see §7)*
  
  Every screen **also** includes an AI assistant for natural-language refinement (e.g., *"I loved The Bear but want something lighter,"* *"My wife hates horror,"* *"Nothing with subtitles,"* *"Only movies under two hours,"* *"Give me something underrated."*).
- **Rationale:** The product promise is **"Decide in seconds."** Tap-first guarantees speed for the majority; AI is an escape hatch for refinement, not a gate.
- **Status:** `FINAL`

### 5.2 Recommendation engine layering

- **Question:** How do the deterministic engine and the AI relate?
- **Final Decision:** Three distinct layers:
  1. **Deterministic recommendation engine** — fast, inexpensive, reliable; the source of truth.
  2. **AI interpretation layer** — understands natural-language refinements.
  3. **AI explanation layer** — explains *why* something was recommended.
  
  The AI **enhances** the engine; it **never replaces** it.
- **Rationale:** Keeps latency, cost, and reliability under control while still delivering the "magic" of natural language and human-feeling explanations.
- **Status:** `FINAL`

### 5.3 AI grounding & graceful degradation

- **Question:** How do we prevent hallucination and handle AI outages?
- **Final Decision:** The AI must **always ground responses in the verified catalog** — it may **never invent movies or streaming availability.** If the AI is unavailable, **MovieChoice continues working normally** using the deterministic engine.
- **Rationale:** Trust is the core brand value; an ungrounded or hard-down recommender would break the "trusted friend" promise.
- **Status:** `FINAL`

### 5.4 AI provider

- **Question:** Which LLM powers the AI interpretation and explanation layers?
- **Final Decision:** **Claude (Anthropic), latest models.**
- **Rationale:** Strong grounding and tool-use, and a natural fit for the API-first, grounded design. Graceful degradation (§5.3) still applies if the provider is unavailable.
- **Status:** `FINAL`

---

## 6. Product Structure — Modes

### 6.1 Quick Pick mode

- **Question:** What is the hero flow?
- **Final Decision:** **Quick Pick** — the fastest possible recommendation experience, designed to answer "What should we watch tonight?" in **under 30 seconds**, via the tap-based flow.
- **Rationale:** Directly serves the core job and the "Decide in seconds" promise.
- **Status:** `FINAL`

### 6.2 Explore mode

- **Question:** What is the richer discovery experience?
- **Final Decision:** **Explore** — a richer discovery surface including: collections, **Friday Picks**, hidden gems, award winners, trending titles, AI conversations, and curated lists.
- **Rationale:** Serves planning, browsing, and repeat engagement beyond the single tonight-decision.
- **Status:** `FINAL`

---

## 7. Streaming Subscriptions

### 7.1 Subscriptions live in the profile, not the flow

- **Question:** Where do a user's streaming subscriptions belong?
- **Final Decision:** Subscriptions are part of the **user profile and settings**, not the recommendation flow. During **onboarding**, every user selects their subscribed services (e.g., Netflix, Prime Video, Apple TV+, Disney+, Max, Hulu, Peacock, Paramount+, Crunchyroll, AMC+, and others). These become the **default filter for all recommendations**, applied automatically. Users can update them anytime in **Settings**. Users should **never have to repeatedly tell MovieChoice which services they have.**
- **Rationale:** Removes friction from the core flow and reinforces the "watch it now on something you already pay for" promise.
- **Status:** `FINAL`

### 7.2 Temporary services toggle

- **Question:** How can users look beyond their own subscriptions occasionally?
- **Final Decision:** A **temporary toggle** available in the experience:
  - `✓ My Streaming Services` (default)
  - `○ All Streaming Services`
  
  The default always recommends content the user can watch **immediately** on services they already pay for.
- **Rationale:** Supports "what if" browsing (and future upsell/discovery) without mutating the stored profile.
- **Status:** `FINAL`

---

## 8. Catalog Data & Region

### 8.1 Catalog data source

- **Question:** Where does the verified catalog (metadata + streaming availability) come from for v1?
- **Final Decision:** **TMDB only, behind a `CatalogProvider` abstraction.** TMDB supplies metadata, posters, and watch-provider (availability) data via its JustWatch integration — enough to power the subscription filter in v1. The abstraction allows swapping in or layering a paid availability API (e.g., Watchmode / JustWatch) later without touching the recommendation engine or UI.
- **Rationale:** Ships the real product fast and cheap; the abstraction contains the risk of TMDB's less-complete availability data and makes a future upgrade a localized change, not a rewrite.
- **Status:** `FINAL`

### 8.2 Region support

- **Question:** How many regions must v1 support?
- **Final Decision:** **US-only for v1**, with **region modeled as a first-class field** throughout the catalog and availability data from day one, so multi-region becomes a data expansion rather than a rewrite.
- **Rationale:** US-only maximizes availability accuracy and simplicity for v1; region-aware modeling preserves the future roadmap without upfront multi-region cost.
- **Status:** `FINAL`

### 8.3 Language support

- **Question:** What languages does v1 support?
- **Final Decision:** **English-only UI and content for v1**, consistent with US-only region support. The UI should be localization-ready (string externalization) for future expansion.
- **Rationale:** English-only for v1 is consistent with US-only region; keeping the UI localization-ready avoids rework when expanding to other markets.
- **Status:** `FINAL`

---

## 9. Non-Goals (MVP)

What we are deliberately **not** building in v1. Listing these protects scope and keeps the team focused on "Decide in seconds."

- **No native apps.** iOS/Android are PWA-only for v1 (native is roadmap — see §3.4).
- **No TV or voice apps.** Apple TV / Android TV / voice assistants are deferred (§3.4).
- **No household/multi-device sync.** Household profiles exist under one account (§4.3), but **real-time synchronization across devices** is deferred (§3.4).
- **No multi-region support.** v1 is US-only, though the data model is region-aware (§8.2).
- **No pure-chatbot / typing-first experience.** The AI never becomes the primary interface; tap-first is the default (§5.1).
- **No custom catalog ingestion or availability scraping.** We rely on the `CatalogProvider` (TMDB) — we do not build or maintain our own availability crawler (§8.1).
- **No paid availability provider in v1.** Deferred behind the abstraction (§8.1).
- **No social/community features.** No feeds, friends, sharing graphs, or public profiles in v1.
- **No content playback or deep-linking guarantees.** MovieChoice recommends; it does not stream content itself. (Whether we deep-link into providers is an open design detail — see Pending Decisions.)
- **No monetization surface.** Pricing, ads, and subscriptions are out of scope for v1.

> Note: Items in this list that overlap with §3.4 are `DEFERRED`; the rest are explicit MVP scope boundaries. None contradict a `FINAL` decision.

---

## 10. Pending Decisions

Pending Decisions made during discovery that are **not yet explicitly confirmed** and should be validated before or during architecture. These are candidates to become questions or decisions later.

| # | Pending Decision | Impact if wrong |
|---|-----------|-----------------|
| A4 | v1 UI and content are **English-language**, consistent with US-only region. | Localization scope. |
| A5 | TMDB's terms of use permit our intended usage (including availability via JustWatch integration) for a production app. | Could force an earlier move to a paid provider (§8.1). |
| A6 | Likes/dislikes and taste signals are captured **in-app** (ratings, thumbs, watch history entered by the user) — not imported from streaming accounts. | Determines how personalization data is sourced (§2.2). |
| A8 | MovieChoice recommends titles but does not itself play them; launching playback (deep-link vs. informational) is an open UX detail. | Affects the end of the Quick Pick flow and provider integrations. |
| A9 | "Available time" maps to runtime/episode-length filtering against catalog metadata. | Feasibility of the "How much time?" step (§5.1). |

> All pending decisions are **unconfirmed** and carry no `FINAL` status. Raise them for decision as needed.
> *(A1, A2, A3, and A7 were resolved and promoted to `FINAL` — see §4.1, §4.2, §4.3, and §5.4. Original IDs are retained; gaps are intentional.)*

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| **MovieChoice** | The product: a mobile-first PWA that answers "What should we watch tonight?" |
| **Quick Pick** | The hero, tap-based flow designed to deliver a recommendation in under 30 seconds (§6.1). |
| **Explore** | The richer discovery mode: collections, Friday Picks, hidden gems, award winners, trending, curated lists, and AI conversations (§6.2). |
| **Verified Catalog** | The trusted, authoritative dataset of titles and their streaming availability that all recommendations and AI responses must be grounded in (§5.3, §8.1). |
| **`CatalogProvider`** | The abstraction layer over the catalog/availability data source (TMDB for v1), allowing future providers to be swapped in without rework (§8.1). |
| **Deterministic Recommendation Engine** | The fast, inexpensive, reliable core that produces recommendations and is the source of truth (§5.2). |
| **AI Interpretation Layer** | The AI component that understands natural-language refinements from the user (§5.2). |
| **AI Explanation Layer** | The AI component that explains *why* a title was recommended (§5.2). |
| **Anonymous-first** | New users get the full Quick Pick experience without an account; sign-up is prompted to save and personalize (§4.1). |
| **Household Profile** | A lightweight member profile under one account, each with its own taste; selected in the "Who's watching?" step (§4.3). |
| **Watch Provider** | A streaming service where a title is available (e.g., Netflix, Max), sourced via the catalog (§7.1, §8.1). |
| **Subscription Filter** | The automatic filter that limits recommendations to the user's subscribed services by default (§7.1). |
| **My / All Streaming Services toggle** | Temporary control switching between the user's own services (default) and all services (§7.2). |
| **Friday Picks** | A curated Explore collection (§6.2). |
| **Hidden Gems** | Underrated titles surfaced in Explore (§6.2). |
| **Cold-start** | The challenge of recommending well for a user with little/no history; MovieChoice must avoid a cold-start wall (§2.2). |
| **Region** | A first-class data field describing the market for availability; v1 supports US only (§8.2). |
| **PWA** | Progressive Web App — a browser-delivered app that behaves like a native mobile app (§3.1). |

---

## Open Items Summary

All **blocking** questions have been resolved and are recorded as `FINAL` (see §4, §5.4, §8). No section-level items remain `OPEN`.

Remaining **Pending Decisions** to validate before or during build: **A4, A5, A6, A8, A9 (§10)**. Roadmap items in §3.4 are `DEFERRED` by design.

---

## 12. Decision Log

Every `FINAL` decision, as concise one-line bullets. (`DEFERRED` items excluded — see §3.4; remaining `Pending Decisions` are in §10.)

- **Vision** — MovieChoice answers "What should we watch tonight?" and feels like a trusted friend who knows every movie and streaming service. *(§2.1)*
- **Personalization** — Increasingly personalized over time, yet instantly great for first-time users (no cold-start wall). *(§2.2)*
- **Platform** — Mobile-first PWA with an excellent desktop experience; native-app feel from the browser. *(§3.1)*
- **Stack** — Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, MongoDB, NextAuth, Vercel, PWA. *(§3.2)*
- **Architecture** — API-first so future clients reuse the same backend. *(§3.3)*
- **Anonymous-first access** — Full Quick Pick without an account; prompt to sign up to save and personalize. *(§4.1)*
- **Auth providers** — Email magic-link + Google + Apple, passwordless via NextAuth. *(§4.2)*
- **Household profiles** — Lightweight member profiles under one account power "Who's watching?". *(§4.3)*
- **Interaction** — Hybrid, speed-biased: tap-first default (never requires typing) with an AI refinement assistant on every screen. *(§5.1)*
- **Engine layering** — Deterministic engine (source of truth) + AI interpretation layer + AI explanation layer; AI enhances, never replaces. *(§5.2)*
- **AI grounding & resilience** — AI is always grounded in the verified catalog and never invents titles/availability; product works normally if AI is down. *(§5.3)*
- **AI provider** — Claude (Anthropic), latest models. *(§5.4)*
- **Quick Pick** — Hero tap-based flow delivering a recommendation in under 30 seconds. *(§6.1)*
- **Explore** — Discovery mode: collections, Friday Picks, hidden gems, award winners, trending, curated lists, AI conversations. *(§6.2)*
- **Subscriptions in profile** — Chosen at onboarding, stored on the profile, auto-applied as the default filter; never asked repeatedly; editable in Settings. *(§7.1)*
- **Services toggle** — Temporary `My Streaming Services` (default) vs `All Streaming Services` switch. *(§7.2)*
- **Catalog source** — TMDB only, behind a `CatalogProvider` abstraction. *(§8.1)*
- **Region** — US-only for v1, with a region-aware data model. *(§8.2)*
