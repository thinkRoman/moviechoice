# MovieChoice — Product Overview

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.2-draft |
| **Status** | Draft |
| **Owner** | Ashwani |
| **Last Updated** | 2026-07-23 |
| **Source Documents** | [DISCOVERY.md](./DISCOVERY.md) |

---

> **Purpose:** This document defines the product vision, positioning, target users, core experience, and strategic boundaries for MovieChoice. It serves as the product authority for all downstream requirements, architecture, and delivery documentation.
>
> **Scope:** Covers the v1 product scope: what MovieChoice is, who it serves, the problems it solves, how it works, and what it deliberately excludes from v1.
>
> **Dependencies:** None. This document is the foundational product artifact.
>
> **Source Documents:** [DISCOVERY.md](./DISCOVERY.md)

---

## 1. Vision

**MovieChoice eliminates streaming decision fatigue by delivering the perfect recommendation — instantly.**

People have more content than ever but less time to choose. MovieChoice solves the paradox of choice by understanding who is watching, their mood, how much time they have, and what they already pay for — then recommending the best movie or TV show in under 30 seconds.

It should feel like **talking to a trusted friend who knows every movie and every streaming service.**

---

## 2. Elevator Pitch

MovieChoice is a mobile-first app that eliminates streaming decision fatigue by delivering personalized, trusted recommendations in seconds — not minutes. It understands who's watching, their mood, their subscriptions, and their taste, then recommends the best movie or TV show they can watch right now. It feels like talking to a friend who knows every movie and every streaming service.

---

## 3. Mission

Help people decide what to watch tonight — and make that decision one they can trust.

---

## 4. Why We Exist

People spend more time browsing for something to watch than actually watching it. The frustration is real:

- You sit down after a long day, eager to unwind.
- You open your streaming apps. Scroll. Scroll. Scroll.
- You check what you have. Nothing looks right. You close the app.
- Thirty minutes later, you're more tired than when you started.

This is **decision fatigue** amplified by **choice overload**. Having more options should be liberating — but at a certain point, it becomes paralyzing. The problem isn't that there's nothing to watch. The problem is that finding it requires work the user doesn't have energy for.

MovieChoice exists so people can **stop browsing and start enjoying their evening.** We take the weight off the user by doing the heavy lifting — knowing their subscriptions, their taste, who's watching — and delivering a recommendation they can trust instantly.

The goal isn't to give them more options. It's to give them **one great answer.**

---

## 5. Target Users

### Primary User

**The Couch Viewer**

- Watches content on a shared couch device (TV, tablet, or large screen)
- Has a phone or tablet in hand while browsing
- Shares streaming subscriptions with household members or guests
- Experiences "scroll paralysis" — spending more time browsing than watching
- Wants a quick, confident recommendation — not a search tool

### Secondary Users

- **The Solo Viewer** — Watching alone, wants something that matches their taste
- **The Household Shared Account User** — One account, multiple people with different tastes
- **The Guest** — Temporary viewer who hasn't set up a profile yet

### User Needs

| Need | How MovieChoice Addresses It |
|------|------------------------------|
| "What should we watch tonight?" | Delivers a confident recommendation in under 30 seconds |
| "I don't know what I feel like" | Tap-based mood selection removes the need to articulate preferences |
| "I have limited time tonight" | "How much time do you have?" filter surfaces fitting options |
| "I already pay for these services" | Recommends only content available on the user's subscribed services |
| "I want something my family will like" | Household profiles let the app learn each person's taste |
| "I've watched everything you suggested" | AI refinement assistant enables natural-language iteration |

---

## 6. What MovieChoice Is Not

It is important to distinguish what MovieChoice is from what it is not.

| Not This | Why |
|----------|-----|
| **A streaming service** | MovieChoice does not host or stream content. It recommends content available on other services. |
| **A media player** | MovieChoice does not play video. It directs users to the service where the content is available. |
| **A review site** | MovieChoice does not aggregate critic reviews or user ratings. Recommendations are personalized, not popularity-driven. |
| **A social network** | There are no feeds, followers, or public profiles in v1. This is a personal recommendation tool. |
| **A general-purpose AI chatbot** | The AI assistant is narrow and grounded — it helps with movie and show discovery only. It does not answer general questions. |

---

## 7. Problems Being Solved

### The Problem

- **Streaming decision fatigue:** Users spend 10-30 minutes browsing before watching.
- **Subscription fragmentation:** Content is spread across 8+ services; users forget what they have access to.
- **Cold-start personalization:** New users get no value until they've built up a taste history.
- **Shared-device friction:** Multiple tastes on one device; "who's watching?" is never answered well.
- **Generic recommendations:** Algorithmic "because you watched" suggestions lack context and personality.

### The Cost of Not Solving This

- Wasted time and frustration
- Subscription churn (users cancel services they don't actively use)
- Content creators losing audiences because discovery is broken

---

## 8. Product Principles

These eight principles guide every product, design, and engineering decision. They are enduring — not features.

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Decide in seconds** | Speed is the product. The default path to a great recommendation must be effortless and fast — no typing required. |
| 2 | **Feel like a trusted friend** | The tone is warm, confident, and knowledgeable — a friend who knows every movie and every streaming service, not a search box. |
| 3 | **Never make the user repeat themselves** | What the app already knows (subscriptions, tastes, who's watching) is remembered and reused automatically. |
| 4 | **Recommend what they can watch right now** | The default is always content available immediately on services the user already pays for. |
| 5 | **AI enhances, never replaces** | The deterministic engine is the source of truth; AI interprets and explains, but never drives or gates the core experience. |
| 6 | **Always grounded, always honest** | The AI never invents titles or availability. Every claim is backed by the verified catalog. |
| 7 | **Resilient by design** | If the AI is unavailable, the product keeps working normally on the deterministic engine. |
| 8 | **Instant for newcomers, smarter over time** | First-time users get excellent recommendations with zero setup friction; the experience personalizes as it learns. |

---

## 9. Core User Experience

### The Quick Pick Flow

The default experience is a **tap-based, zero-typing flow** designed to deliver a recommendation in under 30 seconds:

| Step | Question | How It Works |
|------|----------|--------------|
| 1 | **Who's watching?** | Select from household profiles (Netflix-style). First-time users get a full experience without signing in. |
| 2 | **What mood are you in?** | Tap-based mood selection (e.g., "Uplifting," "Suspenseful," "Feel-Good," "Mind-Bending"). |
| 3 | **How much time do you have?** | Tap-based time filter (e.g., "Under 30 min," "Movie night," "Marathon"). |
| 4 | **Which streaming services?** | Auto-filled from the user's profile subscriptions. A temporary toggle lets them browse all services. |

**Result:** A confident recommendation with an explanation of why it was chosen.

### The AI Escape Hatch

Every screen includes an AI assistant for natural-language refinement:

- *"I loved The Bear but want something lighter"*
- *"My wife hates horror"*
- *"Nothing with subtitles"*
- *"Only movies under two hours"*
- *"Give me something underrated"*

AI is an escape hatch for refinement — **not a gate to the core experience.**

---

## 10. Modes of Operation

### 10.1 Quick Pick Mode

**The hero flow.** The fastest possible recommendation experience, designed to answer "What should we watch tonight?" in under 30 seconds via the tap-based flow.

### 10.2 Explore Mode

**Richer discovery.** A deeper surface for browsing and planning:

- Curated collections
- Friday Picks (weekly curated selections)
- Hidden gems (underrated titles)
- Award winners
- Trending titles
- AI conversations (deeper discovery dialogue)
- Curated lists

### When Each Mode Is Used

| Scenario | Mode |
|----------|------|
| "Let's just watch something tonight" | Quick Pick |
| "I want to browse what's good this week" | Explore |
| "I'm planning for the weekend" | Explore |
| "Refine my Quick Pick result" | Quick Pick (AI escape hatch) |

---

## 11. Success Metrics

### Core Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Time to recommendation** | From app open to first recommendation | < 30 seconds |
| **Acceptance rate** | Percentage of recommendations the user acts on | High (define baseline) |
| **Time to first value** | For first-time users, time until first recommendation | < 10 seconds (zero setup) |
| **Retention** | Users returning within 7 days | Increasing over time |
| **Personalization lift** | Quality delta between new-user and returning-user recommendations | Measurable improvement |

### Product Health

| Metric | Definition |
|--------|-----------|
| **Quick Pick completions** | How often users complete the full flow |
| **AI refinement usage** | How often users invoke the AI escape hatch |
| **Profile setup rate** | Percentage of users who create a household profile |
| **Subscription filter accuracy** | Recommendations match what users actually have access to |

---

## 12. Non-Goals (MVP)

These are deliberately **not** part of v1. Listing them protects scope.

| Non-Goal | Why It's Excluded |
|----------|------------------|
| **No native apps** | iOS/Android are PWA-only for v1 (native is roadmap) |
| **No TV or voice apps** | Apple TV / Android TV / voice assistants are deferred |
| **No household/multi-device sync** | Household profiles exist under one account, but real-time sync is deferred |
| **No multi-region support** | v1 is US-only, though the data model is region-aware |
| **No pure-chatbot / typing-first experience** | The AI never becomes the primary interface; tap-first is the default |
| **No custom catalog ingestion or scraping** | We rely on the catalog provider — we do not build or maintain our own crawler |
| **No paid availability provider in v1** | Deferred behind the catalog abstraction |
| **No social/community features** | No feeds, friends, sharing graphs, or public profiles in v1 |
| **No content playback or deep-linking guarantees** | MovieChoice recommends; it does not stream content itself |
| **No monetization surface** | Pricing, ads, and subscriptions are out of scope for v1 |

---

## 13. Future Vision

Beyond v1, MovieChoice has a clear roadmap:

| Area | Future State |
|------|-------------|
| **Native apps** | iOS and Android apps that reuse the same backend |
| **TV companion apps** | Apple TV and Android TV apps for large-screen control |
| **Voice assistant integration** | "Hey Siri, ask MovieChoice what to watch" |
| **Household sync** | Real-time cross-device synchronization across all household members |
| **Multi-region** | Expansion to UK, CA, AU and other English markets |
| **External data imports** | Import watch history from streaming accounts (future, not v1) |
| **Content playback** | Deep-link into provider apps for immediate playback |

---

## Open Questions

| # | Question | Why It Matters | Owner |
|---|----------|---------------|-------|
| 1 | **TMDB terms of use** — Does TMDB's ToS permit our intended usage (including availability via JustWatch integration) for a production app? | Could force an earlier move to a paid availability provider | Ashwani |
| 2 | **Playback hand-off** — When a user selects a recommended title, do we deep-link to the provider's app/web, or show informational only? | Affects the end of the Quick Pick flow and provider integrations | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — all decisions in this document derive from it |
| [PRD.md](./PRD.md) | Product requirements derived from this product overview |
| [DECISIONS.md](./DECISIONS.md) | Log of all approved product and architectural decisions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture that implements this product |