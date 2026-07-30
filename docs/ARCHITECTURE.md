# MovieChoice — System Architecture

> **Purpose:** This document defines the high-level system architecture for MovieChoice v1. It describes the components, data flow, deployment model, and infrastructure that implement the product requirements defined in PRD.md.
>
> **Scope:** Covers the system architecture: client (PWA), backend (API), database, AI layer, catalog integration, and deployment infrastructure.
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

## 1. Architecture Overview

### 1.1 Design Goals

| Goal | How It's Achieved |
|------|-------------------|
| **API-first** | Backend is a reusable API; the PWA is just the first client |
| **Resilient** | If AI is down, the deterministic engine continues to function |
| **Grounded** | AI never invents data; all responses are backed by the verified catalog |
| **Fast** | Recommendations served in under 30 seconds; cached catalog data reduces latency |
| **Region-aware** | Region is a first-class field throughout the system |

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │   PWA (Web)  │  │  Tablet UI   │  │  Desktop Browser     │ │
│  │ (Next.js 16) │  │ (Responsive) │  │  (Responsive)        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
│         │                  │                      │            │
│         └──────────────────┴──────────────────────┘            │
└────────────────────────────────┬───────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js API Layer                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js App Router (Server)                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │  Auth    │  │  User    │  │ Quick    │  │ Explore│  │  │
│  │  │ (NextAuth)│  │ Profile  │  │ Pick API │  │  API   │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Catalog  │  │  Taste   │  │ Rec.     │  │  AI          │  │
│  │ Provider  │  │ Engine   │  │ Engine   │  │  Layer       │  │
│  │           │  │          │  │          │  │              │  │
│  │ TMDB/     │  │ Filter   │  │ Scoring  │  │ OpenAI       │  │
│  │ JustWatch │  │ + Match  │  │ + Rank   │  │ (GPT-4o)     │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MongoDB                                │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │  Users   │  │ Profiles │  │  Taste   │  │ Saved  │  │  │
│  │  │  & Auth  │  │ & Subs.  │  │ Signals  │  │ Lists  │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Cache Layer (Redis/Memcached)             │  │
│  │  ┌──────────┐  ┌──────────┐                              │  │
│  │  │ Catalog  │  │ Session  │                              │  │
│  │  │  Data    │  │  Data    │                              │  │
│  │  └──────────┘  └──────────┘                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  │
│  │   TMDB   │  │  NextAuth    │  │  OpenAI  │  │  Vercel  │  │
│  │  (Catalog)│  │  (Google,    │  │  (AI)    │  │  (Deploy)│  │
│  │          │  │   Apple,      │  │          │  │          │  │
│  │          │  │   Email)      │  │          │  │          │  │
│  └──────────┘  └──────────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Client (PWA)

| Aspect | Detail |
|--------|--------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Form Handling** | react-hook-form + zod validation |
| **State Management** | React Context + React Query (server state) |
| **PWA** | next-pwa for installability, offline support |
| **Icons** | lucide-react |
| **Charts** | recharts (for analytics, if needed) |
| **Date Handling** | date-fns |

**Client Responsibilities:**
- Render Quick Pick tap-based flow
- Render Explore discovery surface
- Handle authentication (NextAuth providers)
- Collect taste signals (thumbs, ratings)
- Display AI-generated explanations
- Manage household profile selection
- PWA install prompt and offline fallback

### 2.2 API Layer (Next.js Server Routes)

| Route Group | Purpose | Key Endpoints |
|-------------|---------|---------------|
| **Auth** | User authentication via NextAuth | `/api/auth/*` (NextAuth built-in) |
| **User** | User profile management | `POST /api/user/profile`, `GET /api/user/profile`, `PUT /api/user/profile` |
| **Quick Pick** | Generate recommendation | `POST /api/quick-pick` |
| **Explore** | Discovery queries | `GET /api/explore/collections`, `GET /api/explore/friday-picks`, `GET /api/explore/trending`, `GET /api/explore/hidden-gems` |
| **Catalog** | Catalog search and detail | `GET /api/catalog/search`, `GET /api/catalog/:id` |
| **Taste** | Taste signal management | `POST /api/taste/thumbs`, `POST /api/taste/rating`, `POST /api/taste/seen` |
| **Saved** | Saved lists | `GET /api/saved`, `POST /api/saved`, `DELETE /api/saved/:id` |
| **AI** | AI refinement and explanation | `POST /api/ai/refine`, `POST /api/ai/explain` |

### 2.3 Service Layer

#### 2.3.1 Catalog Provider Service

| Aspect | Detail |
|--------|--------|
| **Purpose** | Abstraction over catalog/availability data sources |
| **v1 Implementation** | TMDB via JustWatch integration |
| **Interface** | `CatalogProvider.getMetadata(titleId)`, `CatalogProvider.getAvailability(region)` |
| **Caching** | Short-TTL cache in MongoDB for availability data |
| **Rate Limiting** | Respect TMDB rate limits |
| **Future Swap** | Can layer in Watchmode/JustWatch paid provider |

#### 2.3.2 Taste Engine Service

| Aspect | Detail |
|--------|--------|
| **Purpose** | Collect and process user taste signals |
| **Inputs** | Thumbs up/down, ratings, "Seen it" marks, manually added favorites |
| **Output** | Taste profile per household member (genre preferences, actor preferences, director preferences, mood affinity) |
| **Storage** | MongoDB taste signals collection |

#### 2.3.3 Recommendation Engine Service

| Aspect | Detail |
|--------|--------|
| **Purpose** | Fast, deterministic recommendation generation |
| **Inputs** | Profile taste + mood + time + services + region |
| **Algorithm** | Filter → Score → Rank |
| **Output** | Ranked list of recommendations |
| **Performance** | < 2 seconds for full recommendation generation |

**Filter Phase:**
- Apply subscription filter (user's services or "all services")
- Apply region filter (US for v1)
- Apply time filter (runtime/episode-length matching)
- Apply mood filter (genre/tone matching)

**Score Phase:**
- Taste match score (based on user's taste signals)
- Popularity boost (trending within user base)
- Hidden gem boost (high match score, low awareness)

**Rank Phase:**
- Sort by composite score
- Deduplicate by title
- Return top N results

#### 2.3.4 AI Layer Service

| Aspect | Detail |
|--------|--------|
| **Provider** | OpenAI (GPT-4o), latest models |
| **Interpretation Layer** | Translates natural language into structured filter parameters |
| **Explanation Layer** | Generates personalized "why recommended" text |
| **Grounding** | Tool/function-calling — AI queries the deterministic engine and catalog, never free-generates titles |
| **Degradation** | If AI is unavailable, the deterministic engine continues to function normally |

**AI Flow:**
```
User input (natural language)
    ▼
AI Interpretation Layer (OpenAI)
    ▼
Structured parameters (mood, genre, constraints)
    ▼
Deterministic Recommendation Engine
    ▼
Ranked recommendations
    ▼
AI Explanation Layer (OpenAI)
    ▼
Personalized "why recommended" text
```

### 2.4 Data Layer

#### 2.4.1 MongoDB Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **Users** | Auth and account data | userId, email, authProvider, createdAt, status |
| **Profiles** | Household profiles | profileId, userId, name, avatar, subscriptions[], tasteSignals[], createdAt |
| **TasteSignals** | Taste history | signalId, profileId, titleId, type (thumbs/rating/seen), value, createdAt |
| **SavedLists** | User saved items | listId, profileId, items[], createdAt, updatedAt |
| **CatalogCache** | Cached catalog data | titleId, metadata, availability, region, cachedAt, ttl |

#### 2.4.2 Catalog Data Model (Cached)

| Field | Type | Description |
|-------|------|-------------|
| titleId | String | TMDB ID |
| titleType | Enum | movie / tv_show |
| title | String | Title name |
| posterUrl | String | Poster image URL |
| backdropUrl | String | Backdrop image URL |
| rating | Number | Average rating |
| runtime | Number | Runtime in minutes (movies) / episode length (TV) |
| genres | String[] | Genre tags |
| cast | String[] | Cast members |
| description | String | Overview/description |
| availability | Object[] | Watch-provider data per region |
| region | String | Market region (US for v1) |

---

## 3. Data Flow

### 3.1 Quick Pick Flow

```
User selects profile
    ▼
Client sends { profileId, mood, time, services }
    ▼
Recommendation Engine:
  1. Load profile taste signals
  2. Load user's subscriptions
  3. Query Catalog Provider for availability
  4. Filter by services, region, time, mood
  5. Score by taste match
  6. Rank and return top N
    ▼
Client displays recommendation
    ▼
User can: save, refine (AI), or accept
```

### 3.2 AI Refinement Flow

```
User enters natural language
    ▼
Client sends { profileId, context, userInput }
    ▼
AI Interpretation Layer:
  1. Parse natural language
  2. Extract filter parameters
  3. Merge with existing context
    ▼
Pass merged parameters to Recommendation Engine
    ▼
Return new recommendations
    ▼
AI Explanation Layer:
  1. Generate "why recommended" text
  2. Return with recommendations
```

### 3.3 Taste Signal Flow

```
User thumbs up/down or rates
    ▼
Client sends { profileId, titleId, type, value }
    ▼
Taste Engine:
  1. Store signal in MongoDB
  2. Update profile taste aggregates
  3. Invalidate recommendation cache
    ▼
Confirmation returned to client
```

---

## 4. Deployment Architecture

### 4.1 Infrastructure

| Component | Platform | Details |
|-----------|----------|---------|
| **Frontend + API** | Vercel | Next.js deployment, serverless functions |
| **Database** | MongoDB (Atlas) | Managed MongoDB cluster |
| **AI** | OpenAI API | Cloud-based LLM |
| **Catalog** | TMDB API | External data source |
| **Auth** | NextAuth | OAuth providers (Google, Resend Email) |
| **PWA** | Vercel CDN | Global edge network |

### 4.2 Environment Configuration

| Environment | Purpose |
|-------------|---------|
| **Development** | Local development with mock data |
| **Staging** | Pre-production testing |
| **Production** | Live user-facing environment |

### 4.3 Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `TMDB_API_READ_ACCESS_TOKEN` | TMDB API Read Access Token (Bearer authentication) | Yes |
| `OPENAI_API_KEY` | OpenAI API access | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth encryption key | Yes |
| `NEXTAUTH_URL` | NextAuth callback URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Yes |
| `RESEND_API_KEY` | Resend email magic-link | Yes |
| `EMAIL_FROM` | Email sender address (admin@mail.thinkroman.com) | Yes |
| `CACHE_TTL` | Catalog cache TTL in seconds | No (default: 3600) |

---

## 5. Security

| Aspect | Approach |
|--------|----------|
| **Authentication** | NextAuth with OAuth providers |
| **Authorization** | Profile-scoped API routes (user can only access their own data) |
| **Data Encryption** | MongoDB at-rest encryption; TLS in transit |
| **API Security** | CORS restrictions, rate limiting, input validation (zod) |
| **PWA Security** | HTTPS-only, secure cookies, Content-Security-Policy headers |
| **Secrets Management** | Environment variables via Vercel; never hardcoded |

---

## 6. Performance

| Metric | Target | How |
|--------|--------|-----|
| **Time to recommendation** | < 30 seconds end-to-end | Fast deterministic engine; cached catalog data |
| **API response time** | < 2 seconds | Filter → Score → Rank pipeline; cached catalog |
| **PWA load time** | < 3 seconds on 4G | Next.js code splitting; image optimization; PWA caching |
| **Catalog cache hit rate** | > 80% | Short-TTL cache for availability data |

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **Cache strategy** — What is the exact TTL for catalog cache? | Affects data freshness vs. rate limit trade-off | Ashwani |
| 2 | **Redis vs. MongoDB caching** — Should we use a dedicated Redis cache layer or stick with MongoDB TTL collections? | Affects infrastructure complexity and cost | Ashwani |
| 3 | **Vercel serverless function limits** — Are there timeout constraints for recommendation generation? | Affects engine design (may need streaming) | Ashwani |
| 4 | **TMDB ToS compliance** — Has TMDB's terms been verified for production use? | Could force earlier move to paid provider | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — architecture implements product decisions |
| [PRODUCT.md](./PRODUCT.md) | Product vision — architecture serves the product goals |
| [PRD.md](./PRD.md) | Product requirements — architecture implements REQ-700 series |
| [DECISIONS.md](./DECISIONS.md) | Decisions — P-010 (PWA), P-011 (stack), P-012 (API-first) |
| [DATABASE.md](./DATABASE.md) | Detailed database schema and data model |
| [API.md](./API.md) | API contract — endpoints and request/response shapes |
