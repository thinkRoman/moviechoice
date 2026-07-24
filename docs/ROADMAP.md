# MovieChoice — Implementation Roadmap

> **Purpose:** This document defines the phased implementation roadmap for MovieChoice v1. It breaks the product into sequential, shippable phases with clear goals, tasks, and validation criteria.
>
> **Scope:** Covers all phases from project setup through launch, organized by dependency and delivery priority.
>
> **Dependencies:** [PRD.md](./PRD.md) — Product Requirements Document
>
> **Source Documents:** [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md), [DECISIONS.md](./DECISIONS.md)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1-draft |
| **Status** | Draft |
| **Owner** | Ashwani |
| **Last Updated** | 2026-07-23 |
| **Source Documents** | [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md), [DECISIONS.md](./DECISIONS.md) |

---

## 1. Roadmap Overview

```
Phase 1: Foundation (Week 1-2)
  ├── Project setup
  ├── Database schema
  ├── Auth (Google + Resend)
  └── Basic API structure

Phase 2: Core Product (Week 3-5)
  ├── User profiles & household
  ├── Quick Pick flow (backend)
  ├── Quick Pick flow (frontend)
  └── Catalog integration (TMDB)

Phase 3: Discovery & Personalization (Week 6-8)
  ├── Explore mode
  ├── Taste signals
  ├── Personalization engine
  └── Saved lists

Phase 4: AI & Polish (Week 9-10)
  ├── AI interpretation layer
  ├── AI explanation layer
  ├── PWA features
  └── UI polish

Phase 5: Launch (Week 11-12)
  ├── Testing
  ├── Deployment
  └── Monitoring
```

---

## 2. Phase 1: Foundation

### Goal

Establish the project scaffold, database, authentication, and core API structure.

### Tasks

| # | Task | Estimated Effort | Dependencies |
|---|------|-----------------|--------------|
| 1.1 | Initialize Next.js 16 project with TypeScript, Tailwind, shadcn/ui | 1 day | — |
| 1.2 | Configure pnpm, ESLint, TypeScript strict mode | 0.5 day | 1.1 |
| 1.3 | Set up MongoDB Atlas cluster and connection | 0.5 day | — |
| 1.4 | Implement Mongoose models (User, Profile, TasteSignal, SavedList, CatalogCache) | 2 days | 1.3 |
| 1.5 | Configure NextAuth with Google OAuth | 1 day | — |
| 1.6 | Configure NextAuth with Resend email magic-link | 1 day | — |
| 1.7 | Implement auth API routes (`/api/auth/*`) | 0.5 day | 1.5, 1.6 |
| 1.8 | Implement profile management API (`/api/user/profile`) | 1.5 days | 1.4 |
| 1.9 | Set up Vercel project and environment variables | 0.5 day | — |
| 1.10 | Create `.env.example` | 0.5 day | — |

### Validation Criteria

- [ ] `pnpm dev` starts the development server
- [ ] Google sign-in works
- [ ] Email magic-link sign-in works
- [ ] Profile CRUD API responds correctly
- [ ] MongoDB Atlas connection is stable
- [ ] Environment variables documented in `.env.example`

### Deliverables

- Initialized Next.js project
- MongoDB schema and Mongoose models
- Working authentication (Google + Resend)
- Profile management API
- `.env.example`

---

## 3. Phase 2: Core Product

### Goal

Deliver the complete Quick Pick experience — the hero flow that answers "What should we watch tonight?" in under 30 seconds.

### Tasks

| # | Task | Estimated Effort | Dependencies |
|---|------|-----------------|--------------|
| 2.1 | Implement TMDB CatalogProvider abstraction | 1.5 days | — |
| 2.2 | Implement TMDB data fetcher (metadata + availability) | 2 days | 2.1 |
| 2.3 | Implement CatalogCache model and caching logic | 1 day | 2.2 |
| 2.4 | Implement recommendation engine (Filter → Score → Rank) | 2 days | 2.2 |
| 2.5 | Implement `/api/quick-pick` endpoint | 1 day | 2.4 |
| 2.6 | Implement `/api/catalog/search` endpoint | 1 day | 2.2 |
| 2.7 | Implement `/api/catalog/:titleId` endpoint | 0.5 day | 2.2 |
| 2.8 | Build Quick Pick Screen 1: Who's Watching? (profile selection) | 1 day | 1.8 |
| 2.9 | Build Quick Pick Screen 2: Mood Selection | 1 day | — |
| 2.10 | Build Quick Pick Screen 3: Time Selection | 1 day | — |
| 2.11 | Build Quick Pick Screen 4: Services Confirmation | 1 day | 1.8 |
| 2.12 | Build Quick Pick Screen 5: Recommendation Result | 2 days | 2.5 |
| 2.13 | Build recommendation card component | 1 day | 2.12 |
| 2.14 | Build poster card component (for Explore reuse) | 1 day | — |
| 2.15 | Build service badge component | 0.5 day | — |
| 2.16 | Implement mobile-responsive layout | 1 day | 2.8-2.13 |
| 2.17 | Implement guest (anonymous) flow | 1 day | 2.8 |

### Validation Criteria

- [ ] Full Quick Pick flow works end-to-end (guest + logged-in)
- [ ] Recommendation generated in < 2 seconds
- [ ] TMDB data cached correctly
- [ ] Mobile-responsive on all breakpoints
- [ ] Guest users get full Quick Pick experience
- [ ] Logged-in users get profile-based recommendations

### Deliverables

- Working Quick Pick flow (all 5 screens)
- TMDB catalog integration with caching
- Recommendation engine
- Mobile-responsive UI

---

## 4. Phase 3: Discovery & Personalization

### Goal

Deliver Explore mode, taste signal collection, personalization, and saved lists.

### Tasks

| # | Task | Estimated Effort | Dependencies |
|---|------|-----------------|--------------|
| 3.1 | Implement taste signal API (`/api/taste/thumbs`, `/api/taste/rating`, `/api/taste/seen`) | 1.5 days | 1.4 |
| 3.2 | Implement taste signal UI components (thumbs, rating) | 1 day | 3.1 |
| 3.3 | Implement Explore collections API (`/api/explore/collections`) | 1.5 days | 2.2 |
| 3.4 | Implement Friday Picks API (`/api/explore/friday-picks`) | 1 day | 2.2 |
| 3.5 | Implement hidden gems API (`/api/explore/hidden-gems`) | 1 day | 2.2, 3.2 |
| 3.6 | Implement trending API (`/api/explore/trending`) | 1 day | 2.2 |
| 3.7 | Implement award winners API (`/api/explore/award-winners`) | 1 day | 2.2 |
| 3.8 | Implement curated lists API (`/api/explore/curated-lists`) | 1 day | 2.2 |
| 3.9 | Build Explore home screen (tabs) | 1.5 days | 3.3-3.8 |
| 3.10 | Build Explore tab components (Collections, Friday Picks, Hidden Gems, Trending, Award Winners, Curated Lists) | 3 days | 3.3-3.8 |
| 3.11 | Implement saved lists API (`/api/saved`) | 1.5 days | 1.4 |
| 3.12 | Build saved lists UI | 1.5 days | 3.11 |
| 3.13 | Implement household profile management (add/edit/delete) | 2 days | 1.8 |
| 3.14 | Implement onboarding flow | 2 days | 1.5, 1.6, 1.8 |
| 3.15 | Implement taste bootstrap (select favorites during onboarding) | 1 day | 3.2 |

### Validation Criteria

- [ ] All Explore tabs display correct data
- [ ] Taste signals are stored and affect recommendations
- [ ] Saved lists work for logged-in users
- [ ] Guest users can save (prompted to sign up)
- [ ] Household profile management works (add/edit/delete)
- [ ] Onboarding flow works end-to-end

### Deliverables

- Explore mode (all 6 tabs)
- Taste signal collection
- Personalized recommendations
- Saved lists
- Household profile management
- Onboarding flow

---

## 5. Phase 4: AI & Polish

### Goal

Deliver AI refinement, AI explanation, PWA features, and UI polish.

### Tasks

| # | Task | Estimated Effort | Dependencies |
|---|------|-----------------|--------------|
| 4.1 | Implement AI gateway service (`/api/ai/gateway`) | 2 days | — |
| 4.2 | Implement AI interpretation layer (OpenAI system prompt + tools) | 2 days | 4.1 |
| 4.3 | Implement AI explanation layer (OpenAI system prompt) | 1.5 days | 4.1 |
| 4.4 | Implement `/api/ai/refine` endpoint | 1 day | 4.2 |
| 4.5 | Implement `/api/ai/explain` endpoint | 0.5 day | 4.3 |
| 4.6 | Implement AI response caching | 1 day | 4.1 |
| 4.7 | Build AI refinement input component (bottom sheet) | 1 day | 4.4 |
| 4.8 | Implement PWA manifest configuration | 0.5 day | — |
| 4.9 | Implement PWA install prompt | 1 day | 4.8 |
| 4.10 | Implement offline fallback screen | 0.5 day | — |
| 4.11 | Implement splash screen | 0.5 day | — |
| 4.12 | UI polish: animations, transitions, loading states | 3 days | All phases |
| 4.13 | Implement dark mode | 1 day | 4.12 |
| 4.14 | Accessibility audit and fixes | 2 days | 4.12 |

### Validation Criteria

- [ ] AI refinement works for all example inputs
- [ ] AI explanations are personalized and accurate
- [ ] AI gracefully degrades when unavailable
- [ ] PWA installable on mobile
- [ ] Offline fallback works
- [ ] Dark mode works
- [ ] WCAG 2.1 AA compliant

### Deliverables

- AI interpretation layer
- AI explanation layer
- AI refinement UI
- PWA features (install, offline, splash)
- Polished UI with dark mode
- Accessibility compliance

---

## 6. Phase 5: Launch

### Goal

Test, deploy, and monitor the production launch.

### Tasks

| # | Task | Estimated Effort | Dependencies |
|---|------|-----------------|--------------|
| 5.1 | End-to-end testing (all flows) | 2 days | Phase 4 |
| 5.2 | Performance testing (time to recommendation < 30s) | 1 day | 5.1 |
| 5.3 | Security audit (auth, API, data) | 1 day | 5.1 |
| 5.4 | TMDB ToS compliance review | 0.5 day | — |
| 5.5 | Production deployment to Vercel | 0.5 day | 5.3 |
| 5.6 | Configure production environment variables | 0.5 day | 5.5 |
| 5.7 | Set up error monitoring (Sentry/Vercel) | 1 day | 5.5 |
| 5.8 | Create README.md | 1 day | — |
| 5.9 | Create .gitignore | 0.5 day | — |
| 5.10 | Launch monitoring setup | 1 day | 5.7 |

### Validation Criteria

- [ ] All flows pass E2E testing
- [ ] Time to recommendation < 30 seconds
- [ ] No security vulnerabilities
- [ ] Production deployment successful
- [ ] Error monitoring active
- [ ] README.md complete

### Deliverables

- Production deployment
- Monitoring setup
- README.md
- Launch checklist

---

## 7. Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| **Phase 1: Foundation** | 2 weeks | Auth, DB, API structure |
| **Phase 2: Core Product** | 3 weeks | Quick Pick flow, catalog, recommendation engine |
| **Phase 3: Discovery** | 3 weeks | Explore mode, taste signals, personalization |
| **Phase 4: AI & Polish** | 2 weeks | AI refinement, PWA, UI polish |
| **Phase 5: Launch** | 2 weeks | Testing, deployment, monitoring |
| **Total** | **12 weeks** | **MovieChoice v1** |

---

## 8. Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **Timeline** — Is 12 weeks acceptable? | Project planning | Ashwani |
| 2 | **Team size** — How many developers? | Effort estimation | Ashwani |
| 3 | **TMDB ToS** — Has compliance been verified? | Could block launch | Ashwani |
| 4 | **Playback hand-off** — Deep-link or informational? | Quick Pick end-flow | Ashwani |
| 5 | **Mood options** — Final set of moods? | Quick Pick UI | Ashwani |
| 6 | **Friday Picks definition** — Editor or algorithmic? | Explore implementation | Ashwani |
| 7 | **MongoDB Atlas tier** — M0/M1/M2/M5? | Cost, performance | Ashwani |
| 8 | **Catalog cache TTL** — Exact value? | Data freshness | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — roadmap implements all product decisions |
| [PRODUCT.md](./PRODUCT.md) | Product vision — roadmap delivers the product goals |
| [PRD.md](./PRD.md) | Product requirements — roadmap tasks map to REQ items |
| [DECISIONS.md](./DECISIONS.md) | Decisions — roadmap reflects all FINAL decisions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — roadmap implements the architecture |
| [DATABASE.md](./DATABASE.md) | Database design — roadmap includes schema implementation |
| [API.md](./API.md) | API contract — roadmap includes all API endpoints |
| [USER_FLOWS.md](./USER_FLOWS.md) | User flows — roadmap includes all flow implementations |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Design system — roadmap includes UI component implementation |
| [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) | AI architecture — roadmap includes AI layer implementation |
| [TODO.md](./TODO.md) | Actionable tasks — derived from this roadmap |