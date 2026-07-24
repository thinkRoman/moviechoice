# MovieChoice — Decision Log

> **Purpose:** This document records every approved product and architectural decision for MovieChoice. It provides a chronological and categorical record of decisions that shape the product's direction and implementation.
>
> **Scope:** Covers all FINAL decisions from DISCOVERY.md and any new decisions made during architecture and implementation.
>
> **Dependencies:** [DISCOVERY.md](./DISCOVERY.md) — Source of truth for all decisions
>
> **Source Documents:** [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1-draft |
| **Status** | Draft |
| **Owner** | Ashwani |
| **Last Updated** | 2026-07-23 |
| **Source Documents** | [DISCOVERY.md](./DISCOVERY.md) |

---

## Decision Format

Each decision is recorded with:

| Field | Description |
|-------|-------------|
| **Date** | When the decision was made |
| **ID** | Unique identifier (e.g., DEC-001) |
| **Decision** | What was decided |
| **Status** | FINAL / OPEN / DEFERRED |
| **Rationale** | Why this decision was made |
| **Impact** | What is affected by this decision |
| **Affected Documents** | Which documents reference this decision |

---

## Product Decisions

### P-001: Product Vision

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | MovieChoice solves one problem: **"What should we watch tonight?"** It eliminates streaming decision fatigue by understanding who is watching, their mood, available time, streaming subscriptions, and past likes/dislikes, then recommending the best movie or TV show in seconds. |
| **Status** | FINAL |
| **Rationale** | People spend more time browsing than watching. A single, sharply-defined job creates a focused product and a clear north star for every downstream decision. |
| **Impact** | All product, design, and engineering decisions |
| **Affected Documents** | DISCOVERY.md §2.1, PRODUCT.md §1, PRD.md §1 |

### P-002: Personalization Principle

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | The engine becomes **increasingly personalized over time**, while still delivering **excellent instant recommendations for first-time users** (no cold-start wall). |
| **Status** | FINAL |
| **Rationale** | Long-term retention comes from learning the user; day-one value comes from working immediately without setup. |
| **Impact** | Onboarding design, recommendation algorithm, user model |
| **Affected Documents** | DISCOVERY.md §2.2, PRODUCT.md §8, PRD.md §2 |

### P-003: Anonymous-First Access

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **Anonymous-first.** A first-time user gets the **full Quick Pick experience without an account**. MovieChoice prompts them to **sign up (or sign in) to save** their profile, subscriptions, taste history, and lists. |
| **Status** | FINAL |
| **Rationale** | Delivers day-one value instantly, minimizes onboarding friction, and converts to accounts precisely where accounts matter — persistence and personalization. |
| **Impact** | Onboarding flow, user model, data persistence |
| **Affected Documents** | DISCOVERY.md §4.1, PRODUCT.md §5, PRD.md §2 |

### P-004: Authentication Providers

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **Google sign-in + Resend email magic-link** (via NextAuth). Passwordless. |
| **Status** | FINAL |
| **Rationale** | Low friction, mobile-friendly, and no password management burden for users or the team. Resend provides reliable email delivery. |
| **Impact** | Auth implementation, onboarding flow, email infrastructure |
| **Affected Documents** | DISCOVERY.md §4.2, PRODUCT.md §5, PRD.md §2, .env.example |

### P-005: Household Profiles

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **Lightweight household profiles under a single account** (Netflix-style). One login, multiple member profiles, each with its own taste. The Quick Pick "Who's watching?" step selects among them. |
| **Status** | FINAL |
| **Rationale** | Fits the shared-couch reality, enables per-member personalization, and lays the groundwork for future household sync without committing to it now. |
| **Impact** | User model, Quick Pick flow, recommendation personalization |
| **Affected Documents** | DISCOVERY.md §4.3, PRODUCT.md §5, PRD.md §2 |

### P-006: Core Interaction Model

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **Hybrid, with a strong bias toward speed.** The default experience **never requires typing** — it is a tap-based flow. Every screen also includes an AI assistant for natural-language refinement. |
| **Status** | FINAL |
| **Rationale** | The product promise is "Decide in seconds." Tap-first guarantees speed for the majority; AI is an escape hatch for refinement, not a gate. |
| **Impact** | UI design, Quick Pick flow, AI integration |
| **Affected Documents** | DISCOVERY.md §5.1, PRODUCT.md §9, PRD.md §3 |

### P-007: Recommendation Engine Layering

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | Three distinct layers: (1) Deterministic recommendation engine — source of truth. (2) AI interpretation layer — understands natural-language refinements. (3) AI explanation layer — explains why something was recommended. |
| **Status** | FINAL |
| **Rationale** | Keeps latency, cost, and reliability under control while still delivering the "magic" of natural language and human-feeling explanations. |
| **Impact** | System architecture, AI integration, backend design |
| **Affected Documents** | DISCOVERY.md §5.2, PRODUCT.md §9, PRD.md §8 |

### P-008: AI Grounding & Resilience

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | The AI must **always ground responses in the verified catalog** — it may **never invent movies or streaming availability.** If the AI is unavailable, **MovieChoice continues working normally** using the deterministic engine. |
| **Status** | FINAL |
| **Rationale** | Trust is the core brand value; an ungrounded or hard-down recommender would break the "trusted friend" promise. |
| **Impact** | AI architecture, error handling, catalog integration |
| **Affected Documents** | DISCOVERY.md §5.3, PRODUCT.md §8, PRD.md §8 |

### P-009: AI Provider

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **OpenAI (GPT-4o), latest models.** |
| **Status** | FINAL |
| **Rationale** | Strong grounding and tool-use, and a natural fit for the API-first, grounded design. |
| **Impact** | AI architecture, cost model, vendor lock-in |
| **Affected Documents** | DISCOVERY.md §5.4, PRODUCT.md §8, PRD.md §8, .env.example |

### P-010: Platform — Mobile-First PWA

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **Mobile-first Progressive Web App (PWA).** Primary experience is a user on the couch with a phone or tablet. It must also provide an **excellent desktop experience**. |
| **Status** | FINAL |
| **Rationale** | A PWA delivers the native-feeling couch companion without app-store friction, is fastest to iterate, and works everywhere instantly. |
| **Impact** | Platform choice, deployment, user experience |
| **Affected Documents** | DISCOVERY.md §3.1, PRODUCT.md §9, PRD.md §9 |

### P-011: Technology Stack

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, MongoDB, NextAuth, Vercel, PWA. |
| **Status** | FINAL |
| **Rationale** | A modern, cohesive, Vercel-native stack that supports SSR, an API layer, and a polished component system out of the box. |
| **Impact** | All implementation, infrastructure, deployment |
| **Affected Documents** | DISCOVERY.md §3.2, PRODUCT.md §9, PRD.md §9 |

### P-012: API-First Architecture

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | The architecture is **API-first**, so future native apps (and other clients) can reuse the same backend. |
| **Status** | FINAL |
| **Rationale** | Prevents a costly rewrite when native/TV/voice clients arrive; the web PWA becomes just the first client of a shared API. |
| **Impact** | Backend design, API contracts, future expansion |
| **Affected Documents** | DISCOVERY.md §3.3, PRD.md §9 |

### P-013: Quick Pick Mode

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **Quick Pick** — the fastest possible recommendation experience, designed to answer "What should we watch tonight?" in **under 30 seconds**, via the tap-based flow. |
| **Status** | FINAL |
| **Rationale** | Directly serves the core job and the "Decide in seconds" promise. |
| **Impact** | Core feature design, UX priority, performance targets |
| **Affected Documents** | DISCOVERY.md §6.1, PRODUCT.md §10, PRD.md §3 |

### P-014: Explore Mode

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **Explore** — a richer discovery surface including: collections, Friday Picks, hidden gems, award winners, trending titles, AI conversations, and curated lists. |
| **Status** | FINAL |
| **Rationale** | Serves planning, browsing, and repeat engagement beyond the single tonight-decision. |
| **Impact** | Secondary feature design, content curation |
| **Affected Documents** | DISCOVERY.md §6.2, PRODUCT.md §10, PRD.md §4 |

### P-015: Subscriptions in Profile

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | Subscriptions are part of the **user profile and settings**, not the recommendation flow. During onboarding, every user selects their subscribed services. These become the **default filter for all recommendations**, applied automatically. |
| **Status** | FINAL |
| **Rationale** | Removes friction from the core flow and reinforces the "watch it now on something you already pay for" promise. |
| **Impact** | User model, onboarding, recommendation filtering |
| **Affected Documents** | DISCOVERY.md §7.1, PRODUCT.md §9, PRD.md §6 |

### P-016: Services Toggle

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | A **temporary toggle** available in the experience: `✓ My Streaming Services` (default) vs `○ All Streaming Services`. |
| **Status** | FINAL |
| **Rationale** | Supports "what if" browsing without mutating the stored profile. |
| **Impact** | Quick Pick flow, Explore mode, subscription filter |
| **Affected Documents** | DISCOVERY.md §7.2, PRODUCT.md §9, PRD.md §3 |

### P-017: Catalog Source

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **TMDB only, behind a `CatalogProvider` abstraction.** TMDB supplies metadata, posters, and watch-provider (availability) data via its JustWatch integration. |
| **Status** | FINAL |
| **Rationale** | Ships the real product fast and cheap; the abstraction contains the risk of TMDB's less-complete availability data and makes a future upgrade a localized change, not a rewrite. |
| **Impact** | Catalog integration, data model, future provider swaps |
| **Affected Documents** | DISCOVERY.md §8.1, PRODUCT.md §6, PRD.md §7 |

### P-018: Region Support

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **US-only for v1**, with **region modeled as a first-class field** throughout the catalog and availability data from day one. |
| **Status** | FINAL |
| **Rationale** | US-only maximizes availability accuracy and simplicity for v1; region-aware modeling preserves the future roadmap without upfront multi-region cost. |
| **Impact** | Data model, catalog integration, future expansion |
| **Affected Documents** | DISCOVERY.md §8.2, PRODUCT.md §6, PRD.md §7 |

### P-019: Language Support

| Field | Value |
|-------|-------|
| **Date** | 2026-07-23 |
| **Decision** | **English-only UI and content for v1**, consistent with US-only region support. The UI should be localization-ready (string externalization) for future expansion. |
| **Status** | FINAL |
| **Rationale** | English-only for v1 is consistent with US-only region; keeping the UI localization-ready avoids rework when expanding to other markets. |
| **Impact** | UI design, i18n preparation |
| **Affected Documents** | DISCOVERY.md §8.3, PRD.md §9 |

---

## Deferred Decisions

These decisions are **planned but out of v1 scope**. They are recorded here so v1 architecture can be built to accommodate them without rework.

| ID | Decision | Future State | Affected Documents |
|----|----------|-------------|-------------------|
| D-001 | Native iOS and Android applications | PWA-only for v1; native apps reuse the same backend | DISCOVERY.md §3.4 |
| D-002 | Apple TV and Android TV companion apps | TV companion apps for large-screen control | DISCOVERY.md §3.4 |
| D-003 | Voice assistant integration | "Hey Siri, ask MovieChoice what to watch" | DISCOVERY.md §3.4 |
| D-004 | Household synchronization across devices | Real-time cross-device sync across all household members | DISCOVERY.md §3.4 |

---

## Open Questions

These decisions are **pending** and must be resolved before or during architecture/implementation.

| ID | Question | Impact | Owner | Status |
|----|----------|--------|-------|--------|
| O-001 | **TMDB terms of use** — Does TMDB's ToS permit our intended usage (including availability via JustWatch integration) for a production app? | Could force an earlier move to a paid provider | Ashwani | OPEN |
| O-002 | **Playback hand-off** — When a user selects a recommended title, do we deep-link to the provider's app/web, or show informational only? | Affects the end of the Quick Pick flow and provider integrations | Ashwani | OPEN |
| O-003 | **Friday Picks definition** — Are they curated by editors or algorithmic? | Affects Explore mode implementation | Ashwani | OPEN |
| O-004 | **Mood options** — What is the final set of mood options for Quick Pick? | Affects Quick Pick UI and recommendation logic | Ashwani | OPEN |
| O-005 | **Time-to-first-value target** — What is the specific metric target for first-time users? | Affects performance requirements | Ashwani | OPEN |

---

## Pending Decisions from Discovery

These were flagged during discovery as pending. They are listed here for tracking.

| ID | Decision | Impact | Source |
|----|----------|--------|--------|
| A4 | v1 UI and content are **English-language**, consistent with US-only region. | Localization scope. | DISCOVERY.md §10 |
| A5 | TMDB's terms of use permit our intended usage (including availability via JustWatch integration) for a production app. | Could force an earlier move to a paid provider. | DISCOVERY.md §10 |
| A6 | Likes/dislikes and taste signals are captured **in-app** (ratings, thumbs, watch history entered by the user) — not imported from streaming accounts. | Determines how personalization data is sourced. | DISCOVERY.md §10 |
| A8 | MovieChoice recommends titles but does not itself play them; launching playback (deep-link vs. informational) is an open UX detail. | Affects the end of the Quick Pick flow. | DISCOVERY.md §10 |
| A9 | "Available time" maps to runtime/episode-length filtering against catalog metadata. | Feasibility of the "How much time?" step. | DISCOVERY.md §10 |

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **TMDB terms of use** — Does TMDB's ToS permit our intended usage for a production app? | Could force an earlier move to a paid provider | Ashwani |
| 2 | **Playback hand-off** — Do we deep-link to provider apps/web, or show informational only? | Affects the end of the Quick Pick flow | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — all decisions originate from it |
| [PRODUCT.md](./PRODUCT.md) | Product vision — decisions support the product goals |
| [PRD.md](./PRD.md) | Product requirements — decisions inform the requirements |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — architectural decisions recorded here |
| [ROADMAP.md](./ROADMAP.md) | Build roadmap — decisions shape the implementation plan |