# MovieChoice — Product Requirements Document

> **Purpose:** This document defines the product requirements for MovieChoice v1. It translates the product vision from PRODUCT.md into actionable, testable requirements organized by feature area.
>
> **Scope:** Covers all v1 product requirements including user accounts, Quick Pick mode, Explore mode, personalization, catalog integration, and AI capabilities.
>
> **Dependencies:** [PRODUCT.md](./PRODUCT.md) — Product Overview
>
> **Source Documents:** [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1-draft |
| **Status** | Draft |
| **Owner** | Ashwani |
| **Last Updated** | 2026-07-23 |
| **Source Documents** | [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md) |

---

## 1. Product Summary

### 1.1 Overview

MovieChoice is a mobile-first Progressive Web App that eliminates streaming decision fatigue by delivering personalized, trusted recommendations in seconds. It understands who is watching, their mood, their available time, and their streaming subscriptions — then recommends the best movie or TV show they can watch right now.

### 1.2 Product Goals

| Goal | Description |
|------|-------------|
| **Eliminate decision fatigue** | Users get a confident recommendation in under 30 seconds |
| **Deliver day-one value** | First-time users get excellent recommendations with zero setup |
| **Personalize over time** | Recommendations improve as the app learns each user's taste |
| **Respect subscriptions** | Only recommend content available on services the user already pays for |

### 1.3 Success Criteria

| Criterion | Target |
|-----------|--------|
| Time to first recommendation | < 30 seconds from app open |
| First-time user experience | Full Quick Pick available without sign-up |
| Recommendation acceptance | User acts on the recommendation (saves, re-views, or navigates to result) |
| Retention | Measurable week-over-week increase |

---

## 2. User Types

### 2.1 Guest (Anonymous User)

- Has not created an account
- Gets the full Quick Pick experience immediately
- Can save results but not profiles or taste history
- Prompted to sign up to save their data

**Requirements:**
- REQ-001: Guest users can complete the full Quick Pick flow without signing in
- REQ-002: Guest users receive a prompt to sign up after their first recommendation
- REQ-003: Guest sessions persist across browser refreshes (local storage)

### 2.2 Registered User

- Has created an account via email magic-link, Google, or Apple
- Has a household profile with subscriptions and taste history
- Gets personalized recommendations

**Requirements:**
- REQ-004: Users can sign up via email magic-link, Google, and Apple
- REQ-005: Users can create and manage household profiles (Netflix-style)
- REQ-006: Users can set their streaming subscriptions during onboarding
- REQ-007: Users can update subscriptions and taste data in Settings

### 2.3 Household Profile

- A lightweight profile under a single account
- Has independent taste, subscriptions, and watch history
- Selected via "Who's watching?" step

**Requirements:**
- REQ-008: Each account supports multiple household profiles (minimum 8)
- REQ-009: Each household profile has independent taste signals (thumbs up/down, ratings)
- REQ-010: Quick Pick applies recommendations to the selected profile

---

## 3. Quick Pick Mode (Core Feature)

### 3.1 Overview

Quick Pick is the hero flow — the fastest possible recommendation experience. It answers "What should we watch tonight?" in under 30 seconds via a tap-based flow.

### 3.2 Quick Pick Flow Steps

#### Step 1: Who's Watching?

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-100 |
| **Description** | User selects who is watching from household profiles |
| **Input** | List of household profile names + avatars |
| **Default** | Last selected profile, or "New Guest" if none |
| **Output** | Selected profile ID (or guest session ID) |
| **Notes** | First-time users see "Continue as Guest" and "Sign Up" options |

**Requirements:**
- REQ-101: Display household profile avatars and names as tappable cards
- REQ-102: If the user has no profiles, show "Create a profile" option
- REQ-103: Guest users see "Continue as Guest" and "Sign Up" options

#### Step 2: What Mood Are You In?

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-102 |
| **Description** | User selects their mood via tap-based cards |
| **Input** | Mood options (tap-based cards) |
| **Default** | None — user must select |
| **Output** | Selected mood tag(s) |

**Requirements:**
- REQ-104: Display mood options as large, tappable cards with icons and labels
- REQ-105: Support single or multiple mood selection (minimum 1, maximum 3)
- REQ-106: Mood examples: Uplifting, Suspenseful, Feel-Good, Mind-Bending, Dark, Relaxing, Emotional, Adventurous

#### Step 3: How Much Time Do You Have?

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-103 |
| **Description** | User selects their available time window |
| **Input** | Time options (tap-based cards) |
| **Default** | None — user must select |
| **Output** | Selected time range |

**Requirements:**
- REQ-107: Display time options as large, tappable cards
- REQ-108: Time options examples: "Under 30 min," "Under 90 min," "Movie night (90-120 min)," "Marathon (2+ hours)"
- REQ-109: Time filter maps to runtime/episode-length filtering against catalog metadata

#### Step 4: Which Streaming Services?

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-104 |
| **Description** | User confirms or modifies their streaming service filter |
| **Input** | User's saved subscriptions (pre-filled) + toggle to "All Services" |
| **Default** | User's saved subscriptions from profile |
| **Output** | Final service filter applied to recommendation |

**Requirements:**
- REQ-1010: Pre-fill with user's saved subscriptions from profile
- REQ-1011: Show a temporary toggle: "My Services" (default) vs "All Services"
- REQ-1012: Users can temporarily override their subscriptions for this search only (does not save to profile)
- REQ-1013: Service list includes: Netflix, Prime Video, Apple TV+, Disney+, Max, Hulu, Peacock, Paramount+, Crunchyroll, AMC+, and others

#### Recommendation Result

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-105 |
| **Description** | Display a confident recommendation with explanation |
| **Input** | Profile + Mood + Time + Services |
| **Output** | Recommended title with poster, title, rating, runtime, services, and "why recommended" explanation |

**Requirements:**
- REQ-1016: Display recommended title with poster, title, year, rating, runtime, and available services
- REQ-1017: Display a personalized explanation of why this title was recommended
- REQ-1018: Provide "Not quite right" option to re-generate or refine
- REQ-1019: Provide "Save" option to save the recommendation to the user's list
- REQ-1020: Provide "Refine with AI" option to invoke natural-language refinement

---

### 3.3 AI Refinement (Quick Pick Escape Hatch)

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-106 |
| **Description** | User can refine recommendations via natural language on any screen |
| **Input** | Natural language text |
| **Output** | Updated recommendation(s) |

**Requirements:**
- REQ-1021: AI refines within the existing filter context (does not ignore prior selections)
- REQ-1022: AI is always grounded in the verified catalog — never invents titles or availability
- REQ-1023: If AI is unavailable, the deterministic engine continues to function normally
- REQ-1024: AI examples: "I loved The Bear but want something lighter," "My wife hates horror," "Nothing with subtitles," "Give me something underrated"

---

## 4. Explore Mode

### 4.1 Overview

Explore is a richer discovery surface for browsing and planning. It serves users who want to browse beyond a single tonight-decision.

### 4.2 Explore Features

| Feature | Requirement ID | Description |
|---------|---------------|-------------|
| Curated Collections | REQ-200 | Pre-built themed collections (e.g., "Date Night," "Family Friendly," "Award Winners") |
| Friday Picks | REQ-201 | Weekly curated selections updated every Friday |
| Hidden Gems | REQ-202 | Underrated titles with high match score but low awareness |
| Award Winners | REQ-203 | Academy Award, Golden Globe, and other major award winners |
| Trending | REQ-204 | Titles gaining traction across the user base |
| AI Conversations | REQ-205 | Deeper discovery dialogue for users who want to browse with AI guidance |
| Curated Lists | REQ-206 | Editor-selected lists by genre, decade, director, theme |

**Requirements:**
- REQ-207: Explore uses the same subscription filter as Quick Pick (profile-based)
- REQ-208: Explore results are personalized based on the selected profile's taste
- REQ-209: Each Explore item displays poster, title, rating, and available services
- REQ-210: Users can tap any Explore item to see full details and recommendation rationale

---

## 5. Onboarding

### 5.1 Overview

Onboarding occurs for first-time registered users. It collects the data needed for personalized recommendations.

### 5.2 Onboarding Steps

| Step | Requirement ID | Description |
|------|---------------|-------------|
| 1. Sign Up / Sign In | REQ-300 | Email magic-link, Google, or Apple |
| 2. Create Household Profile | REQ-301 | Name, avatar for the primary user |
| 3. Select Streaming Subscriptions | REQ-302 | Tap to select from a list of services |
| 4. Initial Taste Signals (Optional) | REQ-303 | Select a few favorite movies/shows to bootstrap personalization |

**Requirements:**
- REQ-304: Onboarding is skippable at any step except sign-in
- REQ-305: Users who skip subscriptions get a generic experience until they complete it
- REQ-306: Users who skip taste signals can add them later in Settings
- REQ-307: After onboarding, the user is taken directly to Quick Pick with their first recommendation

---

## 6. Profile & Settings

### 6.1 Household Profile Management

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-400 |
| **Description** | Users can manage household profiles |

**Requirements:**
- REQ-401: Add, edit, rename, delete household profiles (minimum 1, maximum 8)
- REQ-402: Each profile has a name and avatar selection
- REQ-403: Each profile has independent streaming subscriptions
- REQ-404: Each profile has independent taste signals

### 6.2 Taste Signals

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-401 |
| **Description** | Taste signals are captured in-app — ratings, thumbs, watch history entered by the user |
| **Source** | In-app signals only (no external imports in v1) |

**Requirements:**
- REQ-405: Users can thumbs-up or thumbs-down any recommended title
- REQ-406: Users can rate titles on a scale (e.g., 1-5 stars)
- REQ-407: Users can mark titles as "Seen it" to exclude from future recommendations
- REQ-408: Users can manually add favorite movies/shows to a list
- REQ-409: Taste signals are used to personalize recommendations for the specific profile

### 6.3 Settings

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-402 |
| **Description** | Users can manage their account, subscriptions, and preferences |

**Requirements:**
- REQ-410: Users can update their streaming subscriptions
- REQ-411: Users can view and edit their taste signals
- REQ-412: Users can view and manage their saved lists
- REQ-413: Users can manage household profiles
- REQ-414: Users can sign out

---

## 7. Catalog & Content

### 7.1 Catalog Source

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-500 |
| **Description** | The verified catalog supplies metadata and streaming availability |
| **Source** | TMDB only, behind a `CatalogProvider` abstraction |
| **Region** | US-only for v1 |

**Requirements:**
- REQ-501: Catalog supplies title metadata (title, poster, rating, runtime, genre, cast, description)
- REQ-502: Catalog supplies watch-provider (streaming availability) data via TMDB's JustWatch integration
- REQ-503: The `CatalogProvider` abstraction allows swapping in or layering a paid availability API later
- REQ-504: Region is a first-class field throughout the catalog

### 7.2 Catalog Freshness

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-501 |
| **Description** | Streaming availability data must be kept reasonably fresh |
| **Strategy** | On-demand fetch + short-TTL cache in MongoDB for v1 |

**Requirements:**
- REQ-505: Catalog data is cached with a short TTL
- REQ-506: On-demand fetch is used when cache misses occur
- REQ-507: Rate limiting is respected for the catalog provider (TMDB)

---

## 8. AI Architecture

### 8.1 AI Layers

| Layer | Requirement ID | Description |
|-------|---------------|-------------|
| AI Interpretation | REQ-600 | Understands natural-language refinements from the user |
| AI Explanation | REQ-601 | Explains why a title was recommended |

**Requirements:**
- REQ-602: AI provider is Claude (Anthropic), latest models
- REQ-603: AI uses tool/function-calling to query the deterministic engine and catalog
- REQ-604: AI is never allowed to free-generate titles or availability
- REQ-605: AI explanation layer produces personalized "why recommended" text
- REQ-606: If AI is unavailable, the deterministic engine continues to function normally

---

## 9. Platform & Technical Constraints

### 9.1 Platform

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-700 |
| **Description** | MovieChoice is a mobile-first PWA with an excellent desktop experience |

**Requirements:**
- REQ-701: The app is a Progressive Web App (PWA)
- REQ-702: The app is mobile-first with responsive design for tablet and desktop
- REQ-703: The app is installable as a PWA on mobile devices

### 9.2 Technology Stack

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-701 |
| **Description** | The approved technology stack |

**Stack:**
- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui
- MongoDB
- NextAuth
- Vercel
- Claude (Anthropic)

### 9.3 Architecture

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-702 |
| **Description** | API-first architecture |

**Requirements:**
- REQ-703: The backend is structured as a reusable API
- REQ-704: Future native apps can consume the same API

### 9.4 Region & Language

| Field | Value |
|-------|-------|
| **Requirement ID** | REQ-703 |
| **Description** | v1 supports US region and English language |

**Requirements:**
- REQ-705: v1 UI and content are English-only
- REQ-706: The UI is localization-ready (string externalization)
- REQ-707: v1 supports US region only, with region-aware data model

---

## 10. Non-Goals (v1)

These are explicitly **out of scope** for v1. Refer to PRODUCT.md §12 for the complete list.

**Summary of v1 non-goals:**
- No native iOS/Android apps
- No TV or voice apps
- No household/multi-device sync
- No multi-region support
- No pure-chatbot / typing-first experience
- No custom catalog ingestion or scraping
- No paid availability provider in v1
- No social/community features
- No content playback or deep-linking guarantees
- No monetization surface

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **TMDB terms of use** — Does TMDB's ToS permit our intended usage for a production app? | Could force an earlier move to a paid provider | Ashwani |
| 2 | **Playback hand-off** — Do we deep-link to provider apps/web, or show informational only? | Affects the end of the Quick Pick flow | Ashwani |
| 3 | **Friday Picks definition** — Are they curated by editors or algorithmic? | Affects Explore mode implementation | Ashwani |
| 4 | **Mood options** — What is the final set of mood options? | Affects Quick Pick UI and recommendation logic | Ashwani |
| 5 | **Time-to-first-value target** — What is the specific metric target for first-time users? | Affects performance requirements | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — all requirements derive from it |
| [PRODUCT.md](./PRODUCT.md) | Product overview — requirements implement the product vision |
| [DECISIONS.md](./DECISIONS.md) | Log of all approved product and architectural decisions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture that implements these requirements |
| [USER_FLOWS.md](./USER_FLOWS.md) | Detailed user flows for Quick Pick, Explore, and onboarding |