# MovieChoice — Actionable Task List

> **Purpose:** This document contains actionable, executable tasks derived from the ROADMAP.md. Each task is a discrete unit of work ready for implementation.
>
> **Scope:** Covers all tasks from project setup through launch, organized by phase with priority and dependencies.
>
> **Dependencies:** [ROADMAP.md](./ROADMAP.md) — Implementation Roadmap
>
> **Source Documents:** [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md), [DECISIONS.md](./DECISIONS.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DATABASE.md](./DATABASE.md), [API.md](./API.md)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1-draft |
| **Status** | Draft |
| **Owner** | Ashwani |
| **Last Updated** | 2026-07-23 |
| **Source Documents** | [ROADMAP.md](./ROADMAP.md) |

---

## Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0 (Blocking)** | Must be done first — nothing else can proceed without it |
| **P1 (High)** | Core product — blocks user-facing features |
| **P2 (Medium)** | Important but can wait |
| **P3 (Low)** | Nice to have |

---

## Phase 1: Foundation

### Task 1.1 — Initialize Next.js 16 Project [P0]

**Description:** Initialize the Next.js 16 project with TypeScript, Tailwind CSS, and shadcn/ui.

**Commands:**
```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
pnpm add lucide-react react-hook-form zod recharts date-fns next-pwa
pnpm add -D @types/node @types/react @types/react-dom typescript
```

**Files to create/modify:**
- `package.json` (dependencies)
- `tsconfig.json` (strict mode, path aliases)
- `tailwind.config.ts`
- `next.config.ts` (PWA configuration)

**Acceptance Criteria:**
- [ ] `pnpm dev` starts successfully
- [ ] TypeScript compiles without errors
- [ ] ESLint passes

---

### Task 1.2 — Configure .env.example [P0]

**Description:** Create `.env.example` with all required environment variables.

**File:** `.env.example`

**Content:**
```
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/moviechoice?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_SECRET=generate-a-random-32-char-string-here
NEXTAUTH_URL=http://localhost:3000

# TMDB
TMDB_API_KEY=your-tmdb-api-key-here
TMDB_BASE_URL=https://api.themoviedb.org/3

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_DEFAULT_MODEL=gpt-4o
OPENAI_MAX_TOKENS=1000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Resend (Email Magic-Link)
RESEND_API_KEY=your-resend-api-key-here
EMAIL_FROM=admin@mail.thinkroman.com

# Cache
CACHE_TTL=3600
```

**Acceptance Criteria:**
- [ ] All required variables documented
- [ ] Placeholder values are clear

---

### Task 1.3 — Set Up MongoDB Connection [P0]

**Description:** Configure MongoDB connection using Mongoose.

**Files:**
- `lib/mongodb.ts`

**Acceptance Criteria:**
- [ ] Connection string loaded from environment
- [ ] Connection pooling configured
- [ ] Error handling for connection failures

---

### Task 1.4 — Implement Mongoose Models [P0]

**Description:** Create all Mongoose schema models.

**Files:**
- `models/Profile.ts`
- `models/TasteSignal.ts`
- `models/SavedList.ts`
- `models/CatalogCache.ts`

**Acceptance Criteria:**
- [ ] All models defined with proper schemas
- [ ] Indexes configured
- [ ] TypeScript interfaces exported

---

### Task 1.5 — Configure NextAuth (Google + Resend) [P0]

**Description:** Configure NextAuth with Google OAuth and Resend email magic-link.

**Files:**
- `lib/auth.ts`
- `api/auth/[...nextauth]/route.ts`

**Acceptance Criteria:**
- [ ] Google sign-in works
- [ ] Email magic-link sign-in works
- [ ] Session management configured

---

### Task 1.6 — Implement Profile API [P1]

**Description:** Implement profile CRUD API routes.

**Files:**
- `app/api/user/profile/route.ts` (GET, POST)
- `app/api/user/profile/[id]/route.ts` (PUT, DELETE)

**Acceptance Criteria:**
- [ ] GET returns user + profiles
- [ ] POST creates profile
- [ ] PUT updates profile
- [ ] DELETE removes profile
- [ ] Auth required on all endpoints

---

## Phase 2: Core Product

### Task 2.1 — Implement CatalogProvider Abstraction [P0]

**Description:** Create the catalog data source abstraction and TMDB implementation.

**Files:**
- `lib/catalog/provider.ts` (interface)
- `lib/catalog/tmdb-provider.ts` (implementation)
- `lib/catalog/index.ts` (factory)

**Acceptance Criteria:**
- [ ] CatalogProvider interface defined
- [ ] TMDB implementation fetches metadata + availability
- [ ] Region-aware data retrieval

---

### Task 2.2 — Implement Catalog Caching [P1]

**Description:** Implement short-TTL caching for catalog data.

**Files:**
- `lib/catalog/cache.ts`

**Acceptance Criteria:**
- [ ] Cache hits return stored data
- [ ] Cache misses fetch from TMDB
- [ ] TTL-based expiration

---

### Task 2.3 — Implement Recommendation Engine [P0]

**Description:** Implement the deterministic recommendation engine (Filter → Score → Rank).

**Files:**
- `lib/recommendation/engine.ts`
- `lib/recommendation/filter.ts`
- `lib/recommendation/score.ts`
- `lib/recommendation/rank.ts`

**Acceptance Criteria:**
- [ ] Filter by subscriptions, region, time, mood
- [ ] Score by taste match, popularity, hidden gem boost
- [ ] Rank and return top N results
- [ ] Performance < 2 seconds

---

### Task 2.4 — Implement Quick Pick API [P0]

**Description:** Implement the `/api/quick-pick` endpoint.

**Files:**
- `app/api/quick-pick/route.ts`

**Acceptance Criteria:**
- [ ] Accepts profileId, mood, time, services, count
- [ ] Returns recommendations with "why recommended"
- [ ] Works for guests and logged-in users

---

### Task 2.5 — Implement Catalog API [P1]

**Description:** Implement catalog search and detail endpoints.

**Files:**
- `app/api/catalog/search/route.ts`
- `app/api/catalog/[titleId]/route.ts`

**Acceptance Criteria:**
- [ ] Search returns paginated results
- [ ] Detail returns full title data with availability

---

### Task 2.6 — Build Quick Pick Screens [P0]

**Description:** Build all 5 Quick Pick screens.

**Files:**
- `app/(app)/quick-pick/page.tsx`
- `components/quick-pick/ProfileSelection.tsx`
- `components/quick-pick/MoodSelection.tsx`
- `components/quick-pick/TimeSelection.tsx`
- `components/quick-pick/ServicesConfirmation.tsx`
- `components/quick-pick/RecommendationResult.tsx`

**Acceptance Criteria:**
- [ ] All 5 screens render correctly
- [ ] Flow navigation works (Next/Back)
- [ ] Mobile-responsive
- [ ] Animations applied

---

### Task 2.7 — Build UI Components [P1]

**Description:** Build reusable UI components.

**Files:**
- `components/ui/RecommendationCard.tsx`
- `components/ui/PosterCard.tsx`
- `components/ui/ServiceBadge.tsx`
- `components/ui/ProfileCard.tsx`
- `components/ui/MoodCard.tsx`
- `components/ui/TimeCard.tsx`

**Acceptance Criteria:**
- [ ] All components styled with Tailwind
- [ ] All components responsive
- [ ] All components accessible

---

### Task 2.8 — Implement Guest Flow [P1]

**Description:** Implement anonymous user experience.

**Files:**
- `hooks/useGuestSession.ts`
- Updates to Quick Pick screens

**Acceptance Criteria:**
- [ ] Guest users can complete full Quick Pick
- [ ] Guest session persists across refresh
- [ ] Sign-up prompt after first recommendation

---

## Phase 3: Discovery & Personalization

### Task 3.1 — Implement Taste Signal API [P1]

**Description:** Implement taste signal endpoints.

**Files:**
- `app/api/taste/thumbs/route.ts`
- `app/api/taste/rating/route.ts`
- `app/api/taste/seen/route.ts`

**Acceptance Criteria:**
- [ ] All endpoints store signals correctly
- [ ] Auth required
- [ ] Taste aggregates updated

---

### Task 3.2 — Implement Taste Signal UI [P1]

**Description:** Implement thumbs and rating UI components.

**Files:**
- `components/taste/ThumbsUpDown.tsx`
- `components/taste/StarRating.tsx`

**Acceptance Criteria:**
- [ ] Thumbs up/down works
- [ ] Star rating (1-5) works
- [ ] Visual feedback on interaction

---

### Task 3.3 — Implement Explore APIs [P1]

**Description:** Implement all Explore endpoints.

**Files:**
- `app/api/explore/collections/route.ts`
- `app/api/explore/friday-picks/route.ts`
- `app/api/explore/hidden-gems/route.ts`
- `app/api/explore/trending/route.ts`
- `app/api/explore/award-winners/route.ts`
- `app/api/explore/curated-lists/route.ts`

**Acceptance Criteria:**
- [ ] All endpoints return correct data
- [ ] Personalization applied when profileId provided

---

### Task 3.4 — Build Explore Screens [P1]

**Description:** Build Explore home screen and tab components.

**Files:**
- `app/(app)/explore/page.tsx`
- `components/explore/CollectionsTab.tsx`
- `components/explore/FridayPicksTab.tsx`
- `components/explore/HiddenGemsTab.tsx`
- `components/explore/TrendingTab.tsx`
- `components/explore/AwardWinnersTab.tsx`
- `components/explore/CuratedListsTab.tsx`

**Acceptance Criteria:**
- [ ] All tabs render correctly
- [ ] Tab switching works
- [ ] Scrollable grids
- [ ] Mobile-responsive

---

### Task 3.5 — Implement Saved Lists [P1]

**Description:** Implement saved lists API and UI.

**Files:**
- `app/api/saved/route.ts`
- `app/api/saved/[id]/route.ts`
- `app/api/saved/[id]/item/[titleId]/route.ts`
- `components/saved/SavedLists.tsx`
- `components/saved/SavedListItems.tsx`

**Acceptance Criteria:**
- [ ] Create/list/delete saved lists
- [ ] Add/remove items
- [ ] Auth required

---

### Task 3.6 — Implement Household Profile Management [P1]

**Description:** Implement profile management (add/edit/delete).

**Files:**
- `components/profiles/ProfileManager.tsx`
- `components/profiles/ProfileForm.tsx`

**Acceptance Criteria:**
- [ ] Add profile (max 8)
- [ ] Edit profile
- [ ] Delete profile (with confirmation)
- [ ] Set primary profile

---

### Task 3.7 — Implement Onboarding Flow [P1]

**Description:** Implement the onboarding wizard.

**Files:**
- `app/(app)/onboarding/page.tsx`
- `components/onboarding/WelcomeStep.tsx`
- `components/onboarding/ProfileStep.tsx`
- `components/onboarding/SubscriptionStep.tsx`
- `components/onboarding/TasteStep.tsx`

**Acceptance Criteria:**
- [ ] All steps render correctly
- [ ] Skippable at any step
- [ ] First recommendation shown after onboarding

---

## Phase 4: AI & Polish

### Task 4.1 — Implement AI Gateway [P0]

**Description:** Implement the AI gateway service.

**Files:**
- `lib/ai/gateway.ts`
- `lib/ai/cache.ts`

**Acceptance Criteria:**
- [ ] Input validation
- [ ] Cache check before API call
- [ ] Response caching

---

### Task 4.2 — Implement AI Interpretation Layer [P0]

**Description:** Implement AI interpretation with OpenAI system prompt and tools.

**Files:**
- `lib/ai/interpretation.ts`
- `lib/ai/tools/searchCatalog.ts`
- `lib/ai/tools/getCatalogDetails.ts`
- `lib/ai/tools/getProfileTaste.ts`

**Acceptance Criteria:**
- [ ] Natural language parsed to structured params
- [ ] Tool-calling works for catalog queries
- [ ] Output validation

---

### Task 4.3 — Implement AI Explanation Layer [P0]

**Description:** Implement AI explanation with OpenAI system prompt.

**Files:**
- `lib/ai/explanation.ts`

**Acceptance Criteria:**
- [ ] Personalized "why recommended" text generated
- [ ] Grounded in catalog data
- [ ] 1-2 sentences max

---

### Task 4.4 — Implement AI Endpoints [P1]

**Description:** Implement AI API endpoints.

**Files:**
- `app/api/ai/refine/route.ts`
- `app/api/ai/explain/route.ts`

**Acceptance Criteria:**
- [ ] Both endpoints respond correctly
- [ ] Auth optional
- [ ] Error handling

---

### Task 4.5 — Build AI Refinement UI [P1]

**Description:** Build the AI refinement input component.

**Files:**
- `components/ai/AIRefinementInput.tsx`

**Acceptance Criteria:**
- [ ] Bottom sheet overlay
- [ ] Text input with send/cancel
- [ ] Loading state during AI processing

---

### Task 4.6 — Implement PWA Features [P1]

**Description:** Implement PWA manifest, install prompt, offline fallback, splash screen.

**Files:**
- `app/manifest.ts`
- `public/manifest.json`
- `app/sw.ts` (service worker)
- `components/pwa/InstallPrompt.tsx`
- `components/pwa/OfflineFallback.tsx`
- `components/pwa/SplashScreen.tsx`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`

**Acceptance Criteria:**
- [ ] PWA installable on mobile
- [ ] Offline fallback works
- [ ] Splash screen displays

---

### Task 4.7 — UI Polish [P1]

**Description:** Apply animations, transitions, and dark mode.

**Files:**
- `app/globals.css` (design tokens, dark mode)
- Updates to all components

**Acceptance Criteria:**
- [ ] All animations applied
- [ ] Dark mode works
- [ ] Loading states consistent
- [ ] Motion respects `prefers-reduced-motion`

---

### Task 4.8 — Accessibility Audit [P2]

**Description:** Audit and fix accessibility issues.

**Tasks:**
- Verify WCAG 2.1 AA compliance
- Fix focus indicators
- Verify keyboard navigation
- Verify screen reader support

**Acceptance Criteria:**
- [ ] Color contrast 4.5:1+
- [ ] Touch targets 44px+
- [ ] Full keyboard navigation
- [ ] Screen reader tested

---

## Phase 5: Launch

### Task 5.1 — Testing [P0]

**Description:** End-to-end and performance testing.

**Tasks:**
- E2E test all flows
- Performance test (time to recommendation)
- Security audit

**Acceptance Criteria:**
- [ ] All flows pass
- [ ] Time to recommendation < 30 seconds
- [ ] No security vulnerabilities

---

### Task 5.2 — Deployment [P0]

**Description:** Deploy to Vercel and configure production.

**Tasks:**
- Create Vercel project
- Configure production environment variables
- Set up error monitoring

**Acceptance Criteria:**
- [ ] Production URL accessible
- [ ] All env vars configured
- [ ] Error monitoring active

---

### Task 5.3 — README [P1]

**Description:** Create project README.

**File:** `README.md`

**Content:**
- Project overview
- Setup instructions
- Environment variables
- Deployment guide
- Tech stack

**Acceptance Criteria:**
- [ ] Complete setup instructions
- [ ] All env vars documented
- [ ] Deployment guide included

---

### Task 5.4 — .gitignore [P0]

**Description:** Ensure proper .gitignore.

**File:** `.gitignore`

**Must exclude:**
- node_modules/
- .next/
- .env*
- *.log
- .DS_Store

**Acceptance Criteria:**
- [ ] All sensitive files excluded
- [ ] Build artifacts excluded

---

## Task Summary

| Phase | Tasks | P0 | P1 | P2 | P3 |
|-------|-------|----|----|----|----|
| **Phase 1: Foundation** | 6 | 5 | 1 | 0 | 0 |
| **Phase 2: Core Product** | 8 | 3 | 4 | 1 | 0 |
| **Phase 3: Discovery** | 7 | 0 | 7 | 0 | 0 |
| **Phase 4: AI & Polish** | 8 | 3 | 4 | 1 | 0 |
| **Phase 5: Launch** | 4 | 3 | 1 | 0 | 0 |
| **Total** | **33** | **14** | **17** | **2** | **0** |

---

## Execution Order

```
Task 1.1 → Task 1.2 → Task 1.3 → Task 1.4 → Task 1.5 → Task 1.6
    ↓
Task 2.1 → Task 2.2 → Task 2.3 → Task 2.4 → Task 2.5
    ↓
Task 2.6 → Task 2.7 → Task 2.8
    ↓
Task 3.1 → Task 3.2 → Task 3.3 → Task 3.4 → Task 3.5 → Task 3.6 → Task 3.7
    ↓
Task 4.1 → Task 4.2 → Task 4.3 → Task 4.4 → Task 4.5
    ↓
Task 4.6 → Task 4.7 → Task 4.8
    ↓
Task 5.1 → Task 5.2 → Task 5.3 → Task 5.4
```

---

## Open Questions

| # | Question | Blocks | Owner |
|---|----------|--------|-------|
| 1 | **TMDB ToS compliance** — Has it been verified? | Task 2.1 | Ashwani |
| 2 | **Playback hand-off** — Deep-link or informational? | Task 2.6 | Ashwani |
| 3 | **Mood options** — Final set? | Task 2.6 | Ashwani |
| 4 | **Friday Picks definition** — Editor or algorithmic? | Task 3.3 | Ashwani |
| 5 | **MongoDB Atlas tier** — M0/M1/M2/M5? | Task 1.3 | Ashwani |
| 6 | **Catalog cache TTL** — Exact value? | Task 2.2 | Ashwani |
| 7 | **Timeline** — Is 12 weeks acceptable? | All phases | Ashwani |
| 8 | **Team size** — How many developers? | Effort estimation | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [ROADMAP.md](./ROADMAP.md) | Source — tasks derived from roadmap |
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — all tasks implement product decisions |
| [PRODUCT.md](./PRODUCT.md) | Product vision — tasks deliver product goals |
| [PRD.md](./PRD.md) | Product requirements — tasks implement REQ items |
| [DECISIONS.md](./DECISIONS.md) | Decisions — tasks reflect all FINAL decisions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — tasks implement architecture |
| [DATABASE.md](./DATABASE.md) | Database design — tasks implement schema |
| [API.md](./API.md) | API contract — tasks implement endpoints |
| [USER_FLOWS.md](./USER_FLOWS.md) | User flows — tasks implement flows |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Design system — tasks implement components |
| [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) | AI architecture — tasks implement AI layer |