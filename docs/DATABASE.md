# MovieChoice — Database Design

> **Purpose:** This document defines the MongoDB database schema, data model, and data flow for MovieChoice v1. It implements the data requirements defined in PRD.md and supports the architecture defined in ARCHITECTURE.md.
>
> **Scope:** Covers all MongoDB collections, indexes, relationships, and data flow for user data, taste signals, and catalog caching.
>
> **Dependencies:** [ARCHITECTURE.md](./ARCHITECTURE.md) — System Architecture
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

## 1. Database Overview

| Aspect | Value |
|--------|-------|
| **Database** | MongoDB (Atlas) |
| **OXM Library** | Mongoose |
| **Region** | US-only for v1 |
| **Multi-tenant** | No (single-tenant per instance) |
| **Encryption** | At-rest encryption (Atlas); TLS in transit |

---

## 2. Collection Schema

### 2.1 Users Collection

User account data managed by NextAuth.

```typescript
interface User {
  _id: ObjectId;
  id: string;                    // NextAuth primary key
  name: string;
  email: string;                 // Unique, verified
  emailVerified: Date;
  image: string;                 // Profile photo URL
  authProvider: 'google' | 'resend';
  createdAt: Date;
  updatedAt: Date;

  // Indexes
  // UNIQUE on email
  // DEFAULT on createdAt
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | NextAuth primary key |
| `name` | String | Yes | Display name |
| `email` | String | Yes | Unique email address |
| `emailVerified` | Date | Yes (email) | When email was verified |
| `image` | String | No | Profile photo URL |
| `authProvider` | Enum | Yes | Authentication method used |
| `createdAt` | Date | Yes | Account creation date |
| `updatedAt` | Date | Yes | Last update date |

---

### 2.2 Profiles Collection

Household profiles under a single user account.

```typescript
interface Profile {
  _id: ObjectId;
  id: string;
  userId: ObjectId;              // Reference to Users
  name: string;
  avatar: string;                // Avatar identifier (icon name or URL)
  isPrimary: boolean;
  subscriptions: string[];       // Service IDs: 'netflix', 'prime', etc.
  tasteSignals: TasteSignalRef[]; // Reference array to TasteSignals
  createdAt: Date;
  updatedAt: Date;

  // Indexes
  // UNIQUE on { userId, name }
  // INDEX on userId
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Profile unique identifier |
| `userId` | ObjectId | Yes | Parent user reference |
| `name` | String | Yes | Profile display name |
| `avatar` | String | Yes | Avatar identifier |
| `isPrimary` | Boolean | Yes | Whether this is the primary profile |
| `subscriptions` | String[] | Yes | Array of service IDs the user subscribes to |
| `tasteSignals` | ObjectId[] | No | References to taste signal documents |
| `createdAt` | Date | Yes | Profile creation date |
| `updatedAt` | Date | Yes | Last update date |

---

### 2.3 TasteSignals Collection

Individual taste signals (thumbs, ratings, seen marks).

```typescript
interface TasteSignal {
  _id: ObjectId;
  id: string;
  profileId: ObjectId;           // Reference to Profiles
  titleId: string;               // TMDB ID (movie or TV show)
  titleType: 'movie' | 'tv_show';
  type: 'thumbs_up' | 'thumbs_down' | 'rating' | 'seen' | 'favorite';
  value: number;                 // Rating value (1-5) if type is 'rating', else null
  createdAt: Date;

  // Indexes
  // INDEX on { profileId, createdAt }
  // INDEX on { profileId, type }
  // INDEX on { titleId }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Unique signal identifier |
| `profileId` | ObjectId | Yes | Profile that generated this signal |
| `titleId` | String | Yes | TMDB ID of the title |
| `titleType` | Enum | Yes | Type of title (movie or tv_show) |
| `type` | Enum | Yes | Signal type |
| `value` | Number | Conditional | Rating value (1-5) for 'rating' type |
| `createdAt` | Date | Yes | Signal creation date |

---

### 2.4 SavedLists Collection

User saved recommendation lists.

```typescript
interface SavedList {
  _id: ObjectId;
  id: string;
  profileId: ObjectId;           // Reference to Profiles
  name: string;                  // e.g., "Watch Tonight", "Weekend Picks"
  items: SavedListItem[];
  createdAt: Date;
  updatedAt: Date;

  // Indexes
  // INDEX on { profileId, createdAt }
}
```

```typescript
interface SavedListItem {
  titleId: string;               // TMDB ID
  titleType: 'movie' | 'tv_show';
  title: string;
  posterUrl: string;
  recommendationId: string;      // ID of the recommendation that generated this
  savedAt: Date;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | List unique identifier |
| `profileId` | ObjectId | Yes | Owner profile |
| `name` | String | Yes | List name |
| `items` | SavedListItem[] | Yes | Items in the list |
| `createdAt` | Date | Yes | List creation date |
| `updatedAt` | Date | Yes | Last update date |

---

### 2.5 CatalogCache Collection

Cached catalog data from TMDB.

```typescript
interface CatalogCache {
  _id: ObjectId;
  titleId: string;               // TMDB ID (unique)
  titleType: 'movie' | 'tv_show';
  title: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;                // Average rating (0-10)
  runtime: number;               // Runtime in minutes (movies) or episode length (TV)
  seasons?: number;              // For TV shows
  episodes?: number;             // For TV shows
  genres: string[];
  cast: string[];
  description: string;
  releaseYear: number;
  availability: WatchProvider[];  // Per-region watch providers
  region: string;                // Market region (US for v1)
  cachedAt: Date;
  ttl: number;                   // Time-to-live in seconds
  expiresAt: Date;               // cachedAt + ttl (computed)

  // Indexes
  // UNIQUE on { titleId, region }
  // INDEX on expiresAt (TTL index)
  // INDEX on { region, availability.serviceId }
}
```

```typescript
interface WatchProvider {
  serviceId: string;             // 'netflix', 'prime', 'disney', etc.
  serviceName: string;
  type: 'flatrate' | 'rent' | 'buy';
  link: string;                  // Watch link
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `titleId` | String | Yes | TMDB ID (unique per region) |
| `titleType` | Enum | Yes | Movie or TV show |
| `title` | String | Yes | Title name |
| `posterUrl` | String | Yes | Poster image URL |
| `backdropUrl` | String | Yes | Backdrop image URL |
| `rating` | Number | Yes | Average rating (0-10 scale) |
| `runtime` | Number | Yes | Runtime in minutes |
| `seasons` | Number | Conditional | Number of seasons (TV shows) |
| `episodes` | Number | Conditional | Total episodes (TV shows) |
| `genres` | String[] | Yes | Genre tags |
| `cast` | String[] | Yes | Cast members |
| `description` | String | Yes | Overview/description |
| `releaseYear` | Number | Yes | Release year |
| `availability` | WatchProvider[] | Yes | Watch provider data |
| `region` | String | Yes | Market region |
| `cachedAt` | Date | Yes | Cache timestamp |
| `ttl` | Number | Yes | TTL in seconds |
| `expiresAt` | Date | Yes | Expiration (computed) |

---

## 3. Data Relationships

```
┌──────────────┐       ┌──────────────────┐
│   Users      │ 1 ──▶ │   Profiles       │
│              │       │                  │
│ id           │       │ id               │
│ email        │       │ userId (FK)      │
│ authProvider │       │ name             │
└──────────────┘       │ subscriptions[]  │
                         │ tasteSignals[]   │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
          ┌──────────────┐ ┌──────────┐ ┌──────────────┐
          │ TasteSignals │ │ SavedList│ │   (future)   │
          │              │ │          │ │              │
          │ id           │ │ id       │ │              │
          │ profileId(FK)│ │ profileId│ │              │
          │ titleId      │ │ name     │ │              │
          │ type         │ │ items[]  │ │              │
          │ value        │ └──────────┘ │              │
          └──────────────┘              │              │
                                        │              │
                              ┌─────────┤              │
                              ▼         │              │
                        ┌──────────┐    │              │
                        │CatalogCache│   │              │
                        │          │◀───┘              │
                        └──────────┘                   │
                                                       │
                              ┌────────────────────────┘
                              ▼
                        ┌──────────┐
                        │External  │
                        │(TMDB)    │
                        └──────────┘
```

---

## 4. Indexes

### 4.1 Required Indexes

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| Users | `email` | Unique | Fast auth lookup by email |
| Profiles | `{ userId, name }` | Unique | Prevent duplicate profile names per user |
| Profiles | `userId` | Default | Fast user-to-profile lookup |
| TasteSignals | `{ profileId, createdAt }` | Default | Fast profile taste history query |
| TasteSignals | `{ profileId, type }` | Default | Fast taste signal type aggregation |
| TasteSignals | `titleId` | Default | Title-based taste lookup |
| SavedLists | `{ profileId, createdAt }` | Default | Fast profile list lookup |
| CatalogCache | `{ titleId, region }` | Unique | Prevent duplicate cache entries |
| CatalogCache | `expiresAt` | TTL | Auto-expire stale cache entries |
| CatalogCache | `{ region, availability.serviceId }` | Default | Subscription filter queries |

---

## 5. Data Flow

### 5.1 Quick Pick Data Flow

```
User selects profile
    ▼
Query: Profiles.find({ userId }) → get profile + subscriptions
    ▼
Query: TasteSignals.find({ profileId }).sort({ createdAt: -1 }) → load taste history
    ▼
Query: CatalogCache.find({ region: 'US', availability.serviceId: { $in: subscriptions } }) → get catalog
    ▼
Filter → Score → Rank (in-memory)
    ▼
Return top N recommendations
```

### 5.2 Taste Signal Storage Flow

```
User thumbs up/down or rates
    ▼
Insert: TasteSignals.insertOne({ profileId, titleId, titleType, type, value })
    ▼
Update: Profiles.updateOne({ $push: { tasteSignals: signalId } })
    ▼
Invalidate: Delete cached recommendations for this profile
    ▼
Confirmation returned to client
```

### 5.3 Catalog Cache Refresh Flow

```
Recommendation Engine needs catalog data
    ▼
Query: CatalogCache.find({ expiresAt: { $gt: now } })
    ▼
Cache HIT → Return cached data
Cache MISS → Fetch from TMDB API → Store in CatalogCache with TTL → Return
    ▼
Cached data returned to Recommendation Engine
```

---

## 6. Mongoose Models

### 6.1 User Model (NextAuth Adapter)

```typescript
// Uses next-auth mongodb adapter
// See: https://next-auth.js.org/v4/configuration/database
```

### 6.2 Profile Model

```typescript
import { Schema, model, models } from 'mongoose';

export interface IProfile extends Document {
  id: string;
  userId: Schema.Types.ObjectId;
  name: string;
  avatar: string;
  isPrimary: boolean;
  subscriptions: string[];
  tasteSignals: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>({
  id: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  isPrimary: { type: Boolean, required: true, default: false },
  subscriptions: [{ type: String, required: true }],
  tasteSignals: [{ type: Schema.Types.ObjectId, ref: 'TasteSignal' }],
}, { timestamps: true });

ProfileSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Profile = models.Profile || model<IProfile>('Profile', ProfileSchema);
```

### 6.3 TasteSignal Model

```typescript
export interface ITasteSignal extends Document {
  id: string;
  profileId: Schema.Types.ObjectId;
  titleId: string;
  titleType: 'movie' | 'tv_show';
  type: 'thumbs_up' | 'thumbs_down' | 'rating' | 'seen' | 'favorite';
  value: number | null;
  createdAt: Date;
}

const TasteSignalSchema = new Schema<ITasteSignal>({
  id: { type: String, required: true, unique: true },
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  titleId: { type: String, required: true, index: true },
  titleType: { type: String, required: true, enum: ['movie', 'tv_show'] },
  type: { type: String, required: true, enum: ['thumbs_up', 'thumbs_down', 'rating', 'seen', 'favorite'] },
  value: { type: Number, default: null },
}, { timestamps: true });

TasteSignalSchema.index({ profileId: 1, createdAt: -1 });
TasteSignalSchema.index({ profileId: 1, type: 1 });

export const TasteSignal = models.TasteSignal || model<ITasteSignal>('TasteSignal', TasteSignalSchema);
```

### 6.4 SavedList Model

```typescript
export interface ISavedList extends Document {
  id: string;
  profileId: Schema.Types.ObjectId;
  name: string;
  items: Array<{
    titleId: string;
    titleType: 'movie' | 'tv_show';
    title: string;
    posterUrl: string;
    recommendationId: string;
    savedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const SavedListSchema = new Schema<ISavedList>({
  id: { type: String, required: true, unique: true },
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true, index: true },
  name: { type: String, required: true },
  items: [{
    titleId: { type: String, required: true },
    titleType: { type: String, required: true, enum: ['movie', 'tv_show'] },
    title: { type: String, required: true },
    posterUrl: { type: String, required: true },
    recommendationId: { type: String, required: true },
    savedAt: { type: Date, required: true },
  }],
}, { timestamps: true });

SavedListSchema.index({ profileId: 1, createdAt: -1 });

export const SavedList = models.SavedList || model<ISavedList>('SavedList', SavedListSchema);
```

### 6.5 CatalogCache Model

```typescript
export interface ICatalogCache extends Document {
  titleId: string;
  titleType: 'movie' | 'tv_show';
  title: string;
  posterUrl: string;
  backdropUrl: string;
  rating: number;
  runtime: number;
  seasons?: number;
  episodes?: number;
  genres: string[];
  cast: string[];
  description: string;
  releaseYear: number;
  availability: Array<{
    serviceId: string;
    serviceName: string;
    type: 'flatrate' | 'rent' | 'buy';
    link: string;
  }>;
  region: string;
  cachedAt: Date;
  ttl: number;
  expiresAt: Date;
}

const CatalogCacheSchema = new Schema<ICatalogCache>({
  titleId: { type: String, required: true },
  titleType: { type: String, required: true, enum: ['movie', 'tv_show'] },
  title: { type: String, required: true },
  posterUrl: { type: String, required: true },
  backdropUrl: { type: String, required: true },
  rating: { type: Number, required: true },
  runtime: { type: Number, required: true },
  seasons: { type: Number },
  episodes: { type: Number },
  genres: [{ type: String, required: true }],
  cast: [{ type: String, required: true }],
  description: { type: String, required: true },
  releaseYear: { type: Number, required: true },
  availability: [{
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    type: { type: String, required: true, enum: ['flatrate', 'rent', 'buy'] },
    link: { type: String, required: true },
  }],
  region: { type: String, required: true },
  cachedAt: { type: Date, required: true },
  ttl: { type: Number, required: true },
}, { timestamps: true });

CatalogCacheSchema.index({ titleId: 1, region: 1 }, { unique: true });
CatalogCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CatalogCacheSchema.index({ region: 1, 'availability.serviceId': 1 });

export const CatalogCache = models.CatalogCache || model<ICatalogCache>('CatalogCache', CatalogCacheSchema);
```

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **MongoDB Atlas tier** — What tier (M0/M1/M2/M5) for v1? | Cost, performance, scalability | Ashwani |
| 2 | **Catalog cache TTL** — What is the exact TTL value? | Data freshness vs. rate limit trade-off | Ashwani |
| 3 | **Data retention policy** — How long to keep taste signals? | Storage cost, personalization quality | Ashwani |
| 4 | **Backup strategy** — What is the backup and recovery plan? | Data loss risk | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — data model implements product decisions |
| [PRODUCT.md](./PRODUCT.md) | Product vision — data model supports Quick Pick, Explore, profiles |
| [PRD.md](./PRD.md) | Product requirements — data model implements REQ-400 series (profiles, taste) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — data layer section defines MongoDB as the database |
| [DECISIONS.md](./DECISIONS.md) | Decisions — P-005 (household profiles), P-017 (catalog source) |
| [API.md](./API.md) | API contract — endpoints consume these collections |