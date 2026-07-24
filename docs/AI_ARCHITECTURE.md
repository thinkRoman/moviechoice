# MovieChoice — AI Architecture

> **Purpose:** This document defines the AI architecture for MovieChoice v1. It covers the AI interpretation layer, AI explanation layer, grounding mechanism, tool/function-calling contract with OpenAI, and graceful degradation strategy.
>
> **Scope:** Covers AI system design, prompts, tool definitions, error handling, and cost management.
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

## 1. AI Architecture Overview

### 1.1 Design Goals

| Goal | How It's Achieved |
|------|-------------------|
| **Grounded responses** | AI never free-generates titles; it queries the deterministic engine and catalog |
| **Low latency** | AI calls complete in < 3 seconds |
| **Graceful degradation** | If AI is down, the deterministic engine continues to function |
| **Cost control** | Token usage is minimized; caching reduces redundant calls |
| **Tool-based** | AI uses function-calling to interact with the system |

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Input Layer                          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Quick Pick   │  │  Explore     │                            │
│  │ AI Refine    │  │  AI Chat     │                            │
│  └──────┬───────┘  └──────┬───────┘                            │
│         │                  │                                    │
│         └──────────────────┘                                    │
│                            │                                    │
│                        HTTP POST                              │
│                    /api/ai/refine                               │
│                    /api/ai/explain                              │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Gateway Service                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              POST /api/ai/gateway                         │  │
│  │                                                          │  │
│  │  1. Validate input                                       │  │
│  │  2. Check cache (AI response cache)                      │  │
│  │  3. Route to appropriate layer:                          │  │
│  │     ┌─────────────────────┐  ┌────────────────────┐     │  │
│  │     │ Interpretation      │  │ Explanation        │     │  │
│  │     │ Layer               │  │ Layer              │     │  │
│  │     └─────────────────────┘  └────────────────────┘     │  │
│  │  4. Call OpenAI API (Claude → OpenAI)                   │  │
│  │  5. Validate AI output                                    │  │
│  │  6. Cache response                                       │  │
│  │  7. Return structured result                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬───────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   OpenAI API (GPT-4o)                          │
│  ┌─────────────────────┐  ┌────────────────────┐              │
│  │ Interpretation      │  │ Explanation        │              │
│  │ (system prompt +    │  │ (system prompt +   │              │
│  │  tools + user input)│  │  user context)     │              │
│  └─────────────────────┘  └────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. AI Interpretation Layer

### 2.1 Purpose

Translates natural language input into structured filter parameters that the deterministic recommendation engine can use.

### 2.2 Input

```json
{
  "profileId": "prof_abc123",
  "context": {
    "mood": ["suspenseful", "dark"],
    "time": "90-120",
    "services": ["netflix", "prime"],
    "titleType": "all"
  },
  "input": "I loved The Bear but want something lighter"
}
```

### 2.3 System Prompt

```
You are MovieChoice's AI interpretation assistant. Your job is to translate the user's natural language input into structured filter parameters for the recommendation engine.

You must NEVER invent titles, genres, or availability data. Always ground your response in the provided context.

Available tools:
- searchCatalog: Search the verified catalog for titles
- getCatalogDetails: Get detailed information about a specific title
- getProfileTaste: Get the user's taste profile and history
- getStreamingAvailability: Get streaming availability for a title in the user's region

When the user's input requires catalog data to interpret correctly, use the appropriate tool.
When the user's input is purely about preferences, return structured parameters directly.

Return your response as a JSON object with the following structure:
{
  "parsedMood": string[] | null,
  "excludeGenres": string[] | null,
  "includeGenres": string[] | null,
  "timeRange": string | null,
  "titleType": "movie" | "tv_show" | null,
  "minRating": number | null,
  "maxRating": number | null,
  "releaseYearMin": number | null,
  "releaseYearMax": number | null,
  "excludeKeywords": string[] | null,
  "boost": string[] | null,
  "needsCatalogSearch": boolean,
  "catalogSearchQuery": string | null
}

If any field cannot be determined from the input, set it to null.
```

### 2.4 Tool Definitions

#### searchCatalog

```json
{
  "name": "searchCatalog",
  "description": "Search the verified catalog for titles matching the query",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query derived from user input"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum number of results (default: 10)",
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

#### getCatalogDetails

```json
{
  "name": "getCatalogDetails",
  "description": "Get detailed information about a specific title from the verified catalog",
  "parameters": {
    "type": "object",
    "properties": {
      "titleId": {
        "type": "string",
        "description": "TMDB ID of the title"
      }
    },
    "required": ["titleId"]
  }
}
```

#### getProfileTaste

```json
{
  "name": "getProfileTaste",
  "description": "Get the user's taste profile and history for context-aware interpretation",
  "parameters": {
    "type": "object",
    "properties": {
      "profileId": {
        "type": "string",
        "description": "Profile ID to get taste data for"
      }
    },
    "required": ["profileId"]
  }
}
```

### 2.5 Output Example

**User Input:** "I loved The Bear but want something lighter"

**AI Output:**
```json
{
  "parsedMood": ["light", "feel-good", "comedy"],
  "excludeGenres": ["drama"],
  "timeRange": null,
  "titleType": null,
  "minRating": 7,
  "maxRating": null,
  "releaseYearMin": null,
  "releaseYearMax": null,
  "excludeKeywords": null,
  "boost": null,
  "needsCatalogSearch": true,
  "catalogSearchQuery": "The Bear"
}
```

---

## 3. AI Explanation Layer

### 3.1 Purpose

Generates personalized "why recommended" text that explains why a specific title was recommended to a specific user.

### 3.2 Input

```json
{
  "profileId": "prof_abc123",
  "title": {
    "titleId": "tt1234567",
    "titleType": "movie",
    "title": "The Dark Knight",
    "posterUrl": "https://image.tmdb.org/p/poster.jpg",
    "rating": 8.5,
    "runtime": 152,
    "genres": ["Action", "Crime", "Drama"],
    "releaseYear": 2008,
    "cast": ["Christian Bale", "Heath Ledger"],
    "description": "When the menace known as the Joker wreaks havoc...",
    "availability": [
      { "serviceId": "netflix", "serviceName": "Netflix", "type": "flatrate" }
    ]
  },
  "context": {
    "mood": ["suspenseful", "dark"],
    "time": "90-120",
    "services": ["netflix"]
  }
}
```

### 3.3 System Prompt

```
You are MovieChoice's AI explanation assistant. Your job is to generate a personalized, warm, and confident explanation of why a title was recommended.

Rules:
1. NEVER invent facts about the title. Use only the provided title data.
2. Keep the explanation to 1-2 sentences.
3. Reference the user's specific context (mood, time, services, taste).
4. Use a warm, conversational tone — like a trusted friend making a recommendation.
5. Never mention the recommendation engine, algorithms, or technical details.
6. If the user has taste data, reference their preferences.
7. Always mention the streaming service(s) where the title is available.

Example format:
"Based on your taste for [preference] and your [mood] mood, I recommend [title]. It's [description] and available on [service]."
```

### 3.4 Output Example

```json
{
  "explanation": "Based on your taste for suspenseful crime dramas and your Netflix subscription, I recommend The Dark Knight. It's a gripping crime thriller with Heath Ledger's iconic Joker performance — perfect for a dark movie night."
}
```

---

## 4. AI Flow Integration

### 4.1 Quick Pick + AI Refinement

```
User enters natural language
    ▼
/api/ai/refine (POST)
    ▼
AI Gateway Service:
  1. Validate input
  2. Load profile taste (getProfileTaste tool)
  3. Call OpenAI with interpretation system prompt + tools
    ▼
OpenAI API (GPT-4o):
  - Parses natural language
  - Uses tools if catalog search needed
  - Returns structured parameters
    ▼
Validate AI output
    ▼
Pass structured parameters to Recommendation Engine
    ▼
Get recommendations from deterministic engine
    ▼
/api/ai/explain (POST) → Generate "why recommended" text
    ▼
Return recommendations + explanation to client
```

### 4.2 Explore + AI Chat

```
User enters natural language in Explore
    ▼
/api/ai/refine (POST)
    ▼
Same flow as Quick Pick + AI Refinement
    ▼
Additional: Return curated results from Explore endpoints
```

---

## 5. AI Caching

### 5.1 Response Cache

| Field | Type | Description |
|-------|------|-------------|
| `cacheKey` | String | SHA-256 of (profileId + context + input) |
| `response` | Object | AI interpretation response |
| `expiresAt` | Date | TTL-based expiration (1 hour) |

**Cache Strategy:**
- Cache AI interpretation responses for the same (profile, context, input)
- Cache hits skip the OpenAI API call entirely
- Reduces latency and cost

### 5.2 Cache Keys

| Scenario | Cache Key |
|----------|-----------|
| AI refinement | `ai:refine:{profileId}:{contextHash}:{inputHash}` |
| AI explanation | `ai:explain:{profileId}:{titleId}:{contextHash}` |

---

## 6. Error Handling

### 6.1 Error Categories

| Error | HTTP Status | Recovery |
|-------|-------------|----------|
| OpenAI API unavailable | 503 | Show "AI temporarily unavailable — showing deterministic results" |
| OpenAI API rate limited | 429 | Retry with exponential backoff (max 3 attempts) |
| OpenAI API invalid input | 400 | Show "I didn't quite get that — try again" |
| OpenAI API timeout | 504 | Show "Try again" button |
| AI output validation failure | 400 | Fallback to deterministic engine |

### 6.2 Degradation Path

```
AI Call Fails
    ▼
Is it a validation error?
  ├── Yes → Return deterministic result with note
  └── No → Continue
        ▼
Is it a rate limit?
  ├── Yes → Retry (max 3 attempts)
  └── No → Continue
        ▼
All retries failed
    ▼
Return deterministic result
    ▼
Show toast: "AI is temporarily unavailable — showing deterministic results"
```

---

## 7. Cost Management

### 7.1 Token Budget

| Metric | Target |
|--------|--------|
| Max tokens per interpretation call | 2,000 |
| Max tokens per explanation call | 1,000 |
| Max daily AI calls per user | 50 |
| Estimated monthly cost (v1) | <$100 (1,000 MAU) |

### 7.2 Cost Optimization

| Strategy | Implementation |
|----------|----------------|
| Response caching | Cache identical (profile, context, input) combinations |
| Input normalization | Normalize inputs before cache lookup |
| Tool result caching | Cache catalog search results used by AI |
| Model selection | Use GPT-4o for complex tasks, GPT-4o-mini for simple tasks |

---

## 8. Model Selection

### 8.1 Primary Model

| Model | Use Case |
|-------|----------|
| **GPT-4o** | AI interpretation (complex natural language parsing) |

### 8.2 Fallback Model

| Model | Use Case |
|-------|----------|
| **GPT-4o-mini** | AI explanation (simple text generation), simple interpretation tasks |

### 8.3 Model Routing

```
Input complexity assessment:
  ├── Complex (requires catalog search, taste analysis) → GPT-4o
  ├── Medium (requires taste analysis) → GPT-4o
  └── Simple (explanation only, simple refinement) → GPT-4o-mini
```

---

## Open Questions

| # | Question | Impact | Owner |
|---|----------|--------|-------|
| 1 | **OpenAI model selection** — GPT-4o vs. GPT-4o-mini vs. o3-mini? | Cost, latency, capability trade-off | Ashwani |
| 2 | **AI response cache TTL** — How long to cache AI responses? | Cost vs. freshness trade-off | Ashwani |
| 3 | **Rate limiting thresholds** — How many AI calls per user per day? | Cost control | Ashwani |
| 4 | **AI explanation personalization depth** — How detailed should explanations be? | UX quality, token usage | Ashwani |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [DISCOVERY.md](./DISCOVERY.md) | Source of truth — AI architecture implements P-007, P-008, P-009 |
| [PRODUCT.md](./PRODUCT.md) | Product vision — AI enhances (never replaces) the deterministic engine |
| [PRD.md](./PRD.md) | Product requirements — AI implements REQ-600, REQ-601 series |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture — AI layer section defines service component |
| [DATABASE.md](./DATABASE.md) | Database design — AI uses CatalogCache and TasteSignals |
| [API.md](./API.md) | API contract — AI endpoints (/api/ai/refine, /api/ai/explain) |
| [DECISIONS.md](./DECISIONS.md) | Decisions — P-009 (OpenAI), P-008 (AI grounding) |