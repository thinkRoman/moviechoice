# MovieChoice — API Contract

> **Purpose:** This document defines the API contract for MovieChoice v1. It specifies all endpoints, request/response shapes, authentication requirements, and error handling.
>
> **Scope:** Covers all API routes for authentication, user profiles, Quick Pick, Explore, catalog, taste signals, saved lists, and AI refinement.
>
> **Dependencies:** [ARCHITECTURE.md](./ARCHITECTURE.md) — System Architecture
>
> **Source Documents:** [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md), [DECISIONS.md](./DECISIONS.md), [DATABASE.md](./DATABASE.md)

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1-draft |
| **Status** | Draft |
| **Owner** | Ashwani |
| **Last Updated** | 2026-07-23 |
| **Source Documents** | [DISCOVERY.md](./DISCOVERY.md), [PRODUCT.md](./PRODUCT.md), [PRD.md](./PRD.md), [DECISIONS.md](./DECISIONS.md), [DATABASE.md](./DATABASE.md) |

---

## 1. API Overview

| Aspect | Value |
|--------|-------|
| **Base URL** | `https://moviechoice.vercel.app/api` (production) |
| **Protocol** | HTTPS only |
| **Format** | JSON (request and response) |
| **Auth** | NextAuth session cookie (same-site) |
| **Rate Limiting** | Vercel rate limiting (configurable) |
| **CORS** | Restricted to `https://moviechoice.vercel.app` |

---

## 2. Authentication

All protected endpoints require an active NextAuth session.

| Header | Value | Description |
|--------|-------|-------------|
| `Cookie` | `next-auth.session.token=<token>` | NextAuth session cookie |
| `Content-Type` | `application/json` | Request body format |

### 2.1 Session Helper

Server-side session retrieval (used internally by API routes):

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
const user = session?.user; // { id, name, email, image }
```

---

## 3. Auth Endpoints

### 3.1 GET `/api/auth/signin`

Initiate sign-in.

**Response:** `302 Redirect` to provider (Google or Resend email magic-link)

---

### 3.2 GET `/api/auth/signout`

Initiate sign-out.

**Response:** `302 Redirect` to home page

---

### 3.3 GET `/api/auth/callback/<provider>`

Provider callback handler (managed by NextAuth).

---

## 4. User Endpoints

### 4.1 GET `/api/user/profile`

Get the current user's profile data.

**Auth:** Required

**Response:** `200 OK`

```json
{
  "user": {
    "id": "usr_abc123",
    "name": "Ashwani",
    "email": "ashwani@example.com",
    "image": "https://example.com/avatar.jpg"
  },
  "profiles": [
    {
      "id": "prof_xyz789",
      "name": "Ashwani",
      "avatar": "robot",
      "isPrimary": true,
      "subscriptions": ["netflix", "prime", "disney"],
      "createdAt": "2026-07-23T00:00:00Z"
    }
  ]
}
```

---

### 4.2 POST `/api/user/profile`

Create or update a household profile.

**Auth:** Required

**Request:**

```json
{
  "action": "create",
  "name": "Family Profile",
  "avatar": "cat",
  "subscriptions": ["netflix", "prime", "hulu"]
}
```

**Response:** `201 Created`

```json
{
  "id": "prof_new456",
  "name": "Family Profile",
  "avatar": "cat",
  "isPrimary": false,
  "subscriptions": ["netflix", "prime", "hulu"],
  "createdAt": "2026-07-23T00:00:00Z"
}
```

---

### 4.3 PUT `/api/user/profile/:id`

Update a household profile.

**Auth:** Required

**Request:**

```json
{
  "name": "Updated Name",
  "subscriptions": ["netflix", "prime", "disney", "max"]
}
```

**Response:** `200 OK`

```json
{
  "id": "prof_new456",
  "name": "Updated Name",
  "avatar": "cat",
  "isPrimary": false,
  "subscriptions": ["netflix", "prime", "disney", "max"],
  "updatedAt": "2026-07-23T00:00:00Z"
}
```

---

### 4.4 DELETE `/api/user/profile/:id`

Delete a household profile.

**Auth:** Required

**Response:** `204 No Content`

---

## 5. Quick Pick Endpoints

### 5.1 POST `/api/quick-pick`

Generate a recommendation via the tap-based flow.

**Auth:** Optional (works for guests and logged-in users)

**Request:**

```json
{
  "profileId": "prof_xyz789",
  "mood": ["suspenseful", "dark"],
  "time": "90-120",
  "services": ["netflix", "prime"],
  "useMyServices": true,
  "count": 5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | String | Yes | Selected household profile ID |
| `mood` | String[] | Yes | Mood tags (max 3) |
| `time` | String | Yes | Time range: `under30`, `under90`, `90-120`, `2plus` |
| `services` | String[] | Conditional | Service IDs. If `useMyServices` is true, ignored (uses profile subscriptions) |
| `useMyServices` | Boolean | No | Use profile subscriptions (default: true) |
| `count` | Number | No | Number of recommendations (default: 5) |

**Response:** `200 OK`

```json
{
  "recommendations": [
    {
      "titleId": "tt1234567",
      "titleType": "movie",
      "title": "The Dark Knight",
      "posterUrl": "https://image.tmdb.org/p/poster.jpg",
      "backdropUrl": "https://image.tmdb.org/p/backdrop.jpg",
      "rating": 8.5,
      "runtime": 152,
      "genres": ["Action", "Crime", "Drama"],
      "releaseYear": 2008,
      "availability": [
        { "serviceId": "netflix", "serviceName": "Netflix", "type": "flatrate" }
      ],
      "why": "Based on your taste for suspenseful crime dramas and your Netflix subscription."
    }
  ],
  "context": {
    "profileId": "prof_xyz789",
    "mood": ["suspenseful", "dark"],
    "time": "90-120",
    "services": ["netflix"]
  }
}
```

---

### 5.2 POST `/api/quick-pick/refine`

Refine a recommendation via AI natural language input.

**Auth:** Optional

**Request:**

```json
{
  "profileId": "prof_xyz789",
  "context": {
    "mood": ["suspenseful", "dark"],
    "time": "90-120",
    "services": ["netflix"]
  },
  "input": "I loved Breaking Bad but want something lighter"
}
```

**Response:** `200 OK`

```json
{
  "recommendations": [
    {
      "titleId": "tt7654321",
      "titleType": "tv_show",
      "title": "Parks and Recreation",
      "posterUrl": "https://image.tmdb.org/p/poster.jpg",
      "rating": 8.0,
      "runtime": 22,
      "genres": ["Comedy", "Sitcom"],
      "releaseYear": 2009,
      "availability": [
        { "serviceId": "netflix", "serviceName": "Netflix", "type": "flatrate" }
      ],
      "why": "Lighter comedy with great writing, available on Netflix."
    }
  ],
  "refinedContext": {
    "mood": ["light", "feel-good"],
    "time": "under30",
    "services": ["netflix"]
  }
}
```

---

## 6. Explore Endpoints

### 6.1 GET `/api/explore/collections`

Get curated collections.

**Auth:** Optional

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `profileId` | String | No | Profile for personalization |
| `services` | String[] | No | Service filter |

**Response:** `200 OK`

```json
{
  "collections": [
    {
      "id": "date-night",
      "name": "Date Night",
      "description": "Perfect movies for a cozy evening in",
      "posterUrl": "https://image.tmdb.org/p/collection.jpg",
      "items": [
        {
          "titleId": "tt1111111",
          "title": "The Proposal",
          "posterUrl": "https://image.tmdb.org/p/poster.jpg",
          "rating": 6.9,
          "runtime": 108,
          "genres": ["Comedy", "Romance"]
        }
      ]
    }
  ]
}
```

---

### 6.2 GET `/api/explore/friday-picks`

Get Friday Picks (weekly curated selections).

**Auth:** Optional

**Response:** `200 OK`

```json
{
  "picks": [
    {
      "titleId": "tt2222222",
      "title": "Dune: Part Two",
      "posterUrl": "https://image.tmdb.org/p/poster.jpg",
      "rating": 8.3,
      "runtime": 166,
      "genres": ["Sci-Fi", "Adventure"],
      "releaseYear": 2024,
      "availability": [
        { "serviceId": "max", "serviceName": "Max", "type": "flatrate" }
      ],
      "pickReason": "Epic sci-fi masterpiece — perfect Friday night viewing"
    }
  ]
}
```

---

### 6.3 GET `/api/explore/hidden-gems`

Get hidden gem recommendations.

**Auth:** Optional

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `profileId` | String | No | Profile for personalization |
| `services` | String[] | No | Service filter |

**Response:** `200 OK`

```json
{
  "hiddenGems": [
    {
      "titleId": "tt3333333",
      "title": "The Handmaiden",
      "posterUrl": "https://image.tmdb.org/p/poster.jpg",
      "rating": 8.1,
      "runtime": 145,
      "genres": ["Drama", "Thriller"],
      "releaseYear": 2016,
      "availability": [
        { "serviceId": "netflix", "serviceName": "Netflix", "type": "flatrate" }
      ],
      "gemScore": 92
    }
  ]
}
```

---

### 6.4 GET `/api/explore/trending`

Get trending titles.

**Auth:** Optional

**Response:** `200 OK`

```json
{
  "trending": [
    {
      "titleId": "tt4444444",
      "title": "Oppenheimer",
      "posterUrl": "https://image.tmdb.org/p/poster.jpg",
      "rating": 8.4,
      "runtime": 180,
      "genres": ["Drama", "History"],
      "releaseYear": 2023,
      "trendScore": 98
    }
  ]
}
```

---

### 6.5 GET `/api/explore/award-winners`

Get award-winning titles.

**Auth:** Optional

**Response:** `200 OK`

```json
{
  "awardWinners": [
    {
      "titleId": "tt5555555",
      "title": "Parasite",
      "posterUrl": "https://image.tmdb.org/p/poster.jpg",
      "rating": 8.5,
      "runtime": 132,
      "genres": ["Thriller", "Drama"],
      "releaseYear": 2019,
      "awards": ["Academy Award - Best Picture", "Palme d'Or"]
    }
  ]
}
```

---

### 6.6 GET `/api/explore/curated-lists`

Get curated lists.

**Auth:** Optional

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `genre` | String | No | Filter by genre |
| `profileId` | String | No | Profile for personalization |

**Response:** `200 OK`

```json
{
  "curatedLists": [
    {
      "id": "best-of-2024",
      "name": "Best of 2024",
      "description": "The top-rated titles of the year",
      "itemCount": 25,
      "posterUrl": "https://image.tmdb.org/p/list.jpg"
    }
  ]
}
```

---

## 7. Catalog Endpoints

### 7.1 GET `/api/catalog/search`

Search the catalog.

**Auth:** Optional

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | String | Yes | Search query |
| `type` | String | No | Filter by type: `movie`, `tv_show`, `all` |
| `services` | String[] | No | Service filter |
| `limit` | Number | No | Results limit (default: 20, max: 50) |

**Response:** `200 OK`

```json
{
  "results": [
    {
      "titleId": "tt6666666",
      "titleType": "movie",
      "title": "Inception",
      "posterUrl": "https://image.tmdb.org/p/poster.jpg",
      "rating": 8.4,
      "releaseYear": 2010,
      "genres": ["Sci-Fi", "Action"]
    }
  ],
  "total": 150,
  "hasMore": true
}
```

---

### 7.2 GET `/api/catalog/:titleId`

Get detailed catalog information for a title.

**Auth:** Optional

**Response:** `200 OK`

```json
{
  "titleId": "tt1234567",
  "titleType": "movie",
  "title": "The Dark Knight",
  "posterUrl": "https://image.tmdb.org/p/poster.jpg",
  "backdropUrl": "https://image.tmdb.org/p/backdrop.jpg",
  "rating": 8.5,
  "runtime": 152,
  "genres": ["Action", "Crime", "Drama"],
  "cast": ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
  "description": "When the menace known as the Joker wreaks havoc...",
  "releaseYear": 2008,
  "availability": [
    { "serviceId": "netflix", "serviceName": "Netflix", "type": "flatrate" }
  ]
}
```

---

## 8. Taste Endpoints

### 8.1 POST `/api/taste/thumbs`

Record a thumbs up or down.

**Auth:** Required

**Request:**

```json
{
  "profileId": "prof_xyz789",
  "titleId": "tt1234567",
  "titleType": "movie",
  "direction": "up"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | String | Yes | Profile ID |
| `titleId` | String | Yes | TMDB title ID |
| `titleType` | String | Yes | `movie` or `tv_show` |
| `direction` | String | Yes | `up` or `down` |

**Response:** `200 OK`

```json
{
  "id": "sig_abc123",
  "type": "thumbs_up",
  "createdAt": "2026-07-23T00:00:00Z"
}
```

---

### 8.2 POST `/api/taste/rating`

Record a rating.

**Auth:** Required

**Request:**

```json
{
  "profileId": "prof_xyz789",
  "titleId": "tt1234567",
  "titleType": "movie",
  "value": 5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `profileId` | String | Yes | Profile ID |
| `titleId` | String | Yes | TMDB title ID |
| `titleType` | String | Yes | `movie` or `tv_show` |
| `value` | Number | Yes | Rating (1-5) |

**Response:** `200 OK`

```json
{
  "id": "sig_def456",
  "type": "rating",
  "value": 5,
  "createdAt": "2026-07-23T00:00:00Z"
}
```

---

### 8.3 POST `/api/taste/seen`

Mark a title as "seen it".

**Auth:** Required

**Request:**

```json
{
  "profileId": "prof_xyz789",
  "titleId": "tt1234567",
  "titleType": "movie"
}
```

**Response:** `200 OK`

```json
{
  "id": "sig_ghi789",
  "type": "seen",
  "createdAt": "2026-07-23T00:00:00Z"
}
```

---

## 9. Saved List Endpoints

### 9.1 GET `/api/saved`

Get the current user's saved lists.

**Auth:** Required

**Response:** `200 OK`

```json
{
  "lists": [
    {
      "id": "lst_001",
      "name": "Watch Tonight",
      "itemCount": 3,
      "createdAt": "2026-07-23T00:00:00Z",
      "updatedAt": "2026-07-23T00:00:00Z"
    }
  ]
}
```

---

### 9.2 POST `/api/saved`

Create a new saved list or add an item.

**Auth:** Required

**Request:**

```json
{
  "action": "create",
  "name": "Weekend Picks"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `action` | String | Yes | `create` or `add` |
| `name` | String | Conditional | List name (required for `create`) |
| `titleId` | String | Conditional | TMDB title ID (required for `add`) |
| `titleType` | String | Conditional | `movie` or `tv_show` (required for `add`) |

**Response (create):** `201 Created`

```json
{
  "id": "lst_002",
  "name": "Weekend Picks",
  "items": [],
  "createdAt": "2026-07-23T00:00:00Z"
}
```

---

### 9.3 DELETE `/api/saved/:id`

Delete a saved list.

**Auth:** Required

**Response:** `204 No Content`

---

### 9.4 DELETE `/api/saved/:id/item/:titleId`

Remove an item from a saved list.

**Auth:** Required

**Response:** `200 OK`

```json
{
  "message": "Item removed"
}
```

---

## 10. AI Endpoints

### 10.1 POST `/api/ai/explain`

Generate an explanation for a recommendation.

**Auth:** Optional

**Request:**

```json
{
  "profileId": "prof_xyz789",
  "titleId": "tt1234567",
  "titleType": "movie",
  "context": {
    "mood": ["suspenseful"],
    "time": "90-120",
    "services": ["netflix"]
  }
}
```

**Response:** `200 OK`

```json
{
  "explanation": "Based on your taste for suspenseful stories and your Netflix subscription, I recommend The Dark Knight. It's a gripping crime drama with a runtime of 152 minutes, available on Netflix."
}
```

---

## 11. Error Responses

### 11.1 Standard Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid mood selection",
    "details": [
      { "field": "mood", "issue": "Maximum 3 moods allowed" }
    ]
  }
}
```

### 11.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required or invalid session |
| `FORBIDDEN` | 403 | User does not have access to this resource |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | External service (TMDB, OpenAI) unavailable |

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **Pagination strategy** — Cursor-based or offset for catalog/search? | API design, performance | Ashwani |
| 2 | **Rate limiting thresholds** — What are the specific request limits per endpoint? | Cost, abuse prevention | Ashwani |
| 3 | **API versioning** — `/api/v1/` prefix or no versioning? | Future API evolution | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — API implements product decisions |
| [PRODUCT.md](./PRODUCT.md) | Product vision — API supports Quick Pick, Explore |
| [PRD.md](./PRD.md) | Product requirements — API implements REQ-100, REQ-200, REQ-400, REQ-500 series |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — API layer section defines route groups |
| [DATABASE.md](./DATABASE.md) | Database design — API endpoints consume these collections |
| [DECISIONS.md](./DECISIONS.md) | Decisions — P-006 (interaction model), P-013 (Quick Pick), P-014 (Explore) |