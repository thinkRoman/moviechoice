# Long-Term Architecture Recommendations

## Executive recommendation

Keep MovieChoice as a **modular monolith** for the foreseeable future.

Do not split the product into microservices. The recommendation engine needs clean internal boundaries, not network boundaries. A Next.js application, MongoDB, a typed catalog adapter, background-capable jobs, and well-isolated domain modules can support the next several years while remaining understandable to a small team.

The central architecture should be:

```text
UI / API
  → application use cases
    → recommendation orchestration
      → pure policy engine
      → catalog provider
      → profile/taste/library repositories
      → recommendation run repository
      → explanation service
```

The pure engine must not import Next.js, Mongoose, TMDB, OpenAI, or environment variables.

## Architectural principles

1. **One recommendation engine, many experiences.** Quick Pick, Friday Picks, hidden gems, and collections configure the same engine.
2. **Hard constraints are invariants.** Region, provider availability, safety, and explicit exclusions are validated after candidate merge and before response.
3. **External providers terminate at adapters.** TMDB and AI response shapes do not leak into domain code.
4. **Interactions are facts; taste summaries are projections.** Store what the viewer did, derive what it means.
5. **Recommendations are reproducible.** Persist input, policy version, deterministic seed, score breakdown, and catalog evidence.
6. **AI is downstream and optional.** Engine output is complete without AI.
7. **IDs, not labels, carry identity.** Use catalog IDs, profile IDs, provider IDs, and reason codes.
8. **No duplicate persistence models.** A concept has one source of truth and optional read projections.
9. **Version behavior that affects trust.** Ranking policies, catalog mappings, and prompts must be versioned.
10. **Prefer explicit simplicity.** Add queues, alternate databases, or services only after measured need.

## Recommended folder structure

```text
src/
  app/
    (public)/
    (authenticated)/
      quick-pick/
      explore/
      my-movies/
      settings/
    api/
      catalog/
      library/
      profiles/
      recommendations/
      taste/
      settings/

  components/
    catalog/
    library/
    profiles/
    recommendations/
    settings/
    ui/

  domains/
    catalog/
      catalog-provider.ts
      catalog-types.ts
      provider-directory.ts
      availability-policy.ts
      adapters/
        tmdb/
          tmdb-client.ts
          tmdb-mappers.ts
          tmdb-provider.ts
          tmdb-types.ts
      cache/
        catalog-cache.ts

    profiles/
      profile.ts
      profile-repository.ts
      profile-service.ts
      profile-schemas.ts

    library/
      library-entry.ts
      library-repository.ts
      library-service.ts
      library-schemas.ts

    taste/
      taste-signal.ts
      taste-repository.ts
      taste-summary.ts
      taste-service.ts

    recommendations/
      context.ts
      candidate.ts
      result.ts
      reason-codes.ts
      policy/
        policy.ts
        policy-registry.ts
        friday-picks-v1.ts
      sources/
        discover-source.ts
        liked-seed-source.ts
        collection-source.ts
      filters/
        availability-filter.ts
        content-filter.ts
        quality-filter.ts
        history-filter.ts
        runtime-filter.ts
      scoring/
        features.ts
        score.ts
        weights.ts
      ranking/
        diversity-ranker.ts
        composition.ts
        stable-exploration.ts
      engine.ts
      orchestrator.ts
      recommendation-repository.ts

    explanations/
      deterministic-explainer.ts
      explanation-service.ts
      ai/
        ai-client.ts
        prompts.ts
        schemas.ts

  infrastructure/
    auth/
    db/
      mongoose.ts
      models/
    cache/
    observability/
    jobs/

  shared/
    errors/
    validation/
    ids/
    time/
    result/

  test/
    fixtures/
    factories/
    golden/
```

### Why `domains/`

The current `lib/` directory mixes domain logic, provider clients, authentication, database access, and migrations. Moving new work into domain-oriented modules makes boundaries visible without forcing a multi-package monorepo.

Existing modules should migrate gradually. Do not perform a large folder-only refactor before feature value.

## Service boundaries

### Catalog domain

Owns:

- media-neutral title metadata;
- search/discover;
- provider directory;
- availability evidence;
- external catalog IDs;
- mapping and caching.

Does not own:

- user subscriptions;
- ranking weights;
- watched history;
- explanation prose.

Recommended interface:

```ts
interface CatalogProvider {
  discover(query: DiscoverQuery): Promise<CatalogCandidatePage>;
  recommendations(ref: CatalogTitleRef): Promise<CatalogCandidate[]>;
  search(query: CatalogSearchQuery): Promise<CatalogSearchPage>;
  getTitle(ref: CatalogTitleRef): Promise<CatalogTitle | null>;
  getAvailability(
    refs: CatalogTitleRef[],
    region: RegionCode,
  ): Promise<Map<CatalogTitleKey, AvailabilityEvidence>>;
  listProviders(region: RegionCode): Promise<StreamingProvider[]>;
}
```

### Profile domain

Owns:

- viewer identity within an account/household;
- default region;
- provider subscriptions;
- confirmed durable preferences;
- age/content settings;
- primary profile selection.

It should not embed raw taste events.

### Library domain

Owns:

- watchlist;
- watched state and timestamp;
- favorites;
- hidden state if the product chooses to unify title-state flags;
- named collections through a separate collection aggregate.

It does not interpret taste.

### Taste domain

Owns interaction facts:

- thumbs up/down;
- rating;
- accepted;
- skipped;
- not interested;
- source and context;
- timestamps.

It produces a derived taste summary, but raw signals remain authoritative.

### Recommendation domain

Owns:

- context schema;
- policies;
- candidate provenance;
- hard filters;
- score features and weights;
- diversity;
- composition;
- deterministic seed;
- reason codes;
- run persistence.

It does not fetch TMDB directly or call AI.

### Explanation domain

Owns:

- deterministic reason templates;
- AI explanation requests;
- validated structured output;
- prompt versions;
- fallback behavior.

It receives selected recommendations; it cannot change them.

## Recommendation engine location and shape

### Pure engine

The core should be a pure function over normalized inputs:

```ts
type RankCandidates = (
  input: RecommendationEngineInput,
) => RecommendationEngineOutput;
```

Input includes:

- normalized context;
- profile/taste features;
- candidates with provenance;
- availability evidence;
- watched/hidden/recent impressions;
- policy;
- deterministic seed.

Output includes:

- ranked recommendation items;
- excluded candidates with reason codes for diagnostics;
- score breakdown;
- diversity/composition decisions;
- policy and seed metadata.

### Orchestrator

The orchestrator performs I/O:

1. validates request and resolves viewer context;
2. loads profile, library, taste, and recent impressions;
3. selects a policy;
4. asks candidate sources for bounded pools;
5. resolves availability;
6. invokes the pure engine;
7. enriches selected items;
8. persists the run;
9. asks the explanation service for prose;
10. returns the result.

This split makes ranking fast to test and easy to replay.

## Candidate source design

Each source returns provenance:

```ts
type CandidateEvidence =
  | { source: 'discover'; queryId: string; position: number }
  | { source: 'liked-seed'; seed: CatalogTitleRef; position: number }
  | { source: 'editorial'; collectionId: string; position: number }
  | { source: 'trending'; region: string; position: number };
```

A merged candidate preserves all evidence. Scoring can then distinguish:

- repeated appearance across distinct liked seeds;
- appearance in both discover and seed sources;
- accidental duplication from pagination.

## Policy architecture

A policy is configuration plus a limited set of hooks, not a forked engine.

```ts
interface RecommendationPolicy {
  version: string;
  quality: QualityThresholds;
  candidateBudget: CandidateBudget;
  hardFilters: HardFilterConfig;
  weights: ScoreWeights;
  diversity: DiversityConfig;
  composition: CompositionConfig;
  exposure: ExposureConfig;
}
```

Examples:

- `quick-pick-v1`
- `friday-picks-v1`
- `hidden-gems-v1`
- `family-consensus-v1`

Policies live in a registry and are immutable after production use. Tuning creates a new version.

## Database evolution

### Current problems

- `Profile.userId` is unique despite household-profile requirements.
- profile-embedded taste overlaps `TasteSignal`.
- `SavedList` overlaps the new `UserMovie`.
- user IDs are inconsistently typed across models.
- active My Movies state is user-scoped while product taste is profile-oriented.
- no recommendation run or impression model exists.

### Recommended ownership model

```text
Account / Household
  ├── Users (authentication and permissions)
  └── Profiles (viewer taste and defaults)
```

If full household accounts are deferred, introduce the boundary in types first and map one user to one account.

### Recommended models

#### `Profile`

- `_id`
- `accountId`
- `name`
- `avatar`
- `isPrimary`
- `region`
- `providerIds`
- `confirmedPreferences`
- `contentSettings`
- timestamps

Index:

- `{ accountId: 1, name: 1 }`
- partial unique `{ accountId: 1, isPrimary: 1 }` where primary

#### `LibraryEntry`

- `accountId`
- optional `profileId` according to approved ownership
- `titleRef`
- `watchlist`
- `favorite`
- `watched`
- `watchedAt`
- `hidden`
- timestamps

Unique:

- ownership scope + `titleRef.source` + `titleRef.mediaType` + `titleRef.sourceId`

#### `TasteSignal`

- `accountId`
- `profileId`
- `titleRef`
- `type`
- optional `value`
- `context`
- `source`
- `occurredAt`

Do not force one row per title if event history matters. If only latest state is required, maintain a separate projection.

#### `TasteSummary`

- `profileId`
- derived feature vector/preferences;
- source watermark;
- algorithm version;
- updatedAt.

This is disposable and rebuildable.

#### `RecommendationRun`

- `_id`
- `accountId`
- `profileIds`
- `mode`
- `context`
- `contextHash`
- `policyVersion`
- `seed`
- `catalogSnapshotAt`
- `status`
- `items`
- timestamps.

Each item stores:

- title reference;
- rank;
- total score;
- feature breakdown;
- reason codes;
- source evidence;
- availability evidence reference/snapshot;
- explanation and explanation version;
- surfaced/accepted/replaced timestamps as appropriate.

#### `RecommendationImpression`

Optional separate model if run arrays become too large:

- run ID;
- profile IDs;
- title reference;
- rank;
- outcome;
- reason;
- timestamps.

#### `Collection`

Use only for named user/editorial collections. Do not use it for default watchlist/watched/favorite flags.

#### `CatalogCache`

Prefer a cache repository interface. MongoDB can remain the first implementation, but data should be typed by cache category and version.

### Migration strategy

- Add new fields/models without deleting old ones.
- Dual-read only when necessary; avoid prolonged dual-write.
- Backfill canonical media type and IDs.
- Verify counts and ownership in dry-run migrations.
- Switch one read path at a time.
- Remove obsolete fields only after production verification and backup.

## API organization

### Principles

- APIs expose use cases, not database collections.
- Route handlers validate/authenticate and delegate.
- Domain errors map centrally to HTTP responses.
- Version recommendation policy internally; avoid premature URL versioning.
- Use idempotency keys for recommendation run creation/refresh where retries matter.

### Recommended endpoints

```text
POST /api/recommendations/quick-pick
POST /api/recommendations/friday-picks
POST /api/recommendations/runs/:runId/replace
POST /api/recommendations/runs/:runId/refine
POST /api/recommendations/runs/:runId/outcomes

GET  /api/catalog/search
GET  /api/catalog/titles/:mediaType/:sourceId
GET  /api/catalog/providers

GET  /api/profiles
POST /api/profiles
PATCH /api/profiles/:profileId

GET  /api/library
PUT  /api/library/:mediaType/:sourceId

POST /api/taste/signals
GET  /api/taste/summary
```

### Recommendation response

Return:

- run ID;
- policy version;
- normalized context;
- ranked items;
- verified availability;
- deterministic reason codes/text;
- optional AI explanation status;
- structured relaxation options when empty.

Do not expose internal raw weights by default, but keep them persisted.

## Reusable modules

The most reusable modules should be:

- catalog title/reference types;
- provider directory and alias mapper;
- availability validator;
- recommendation context schema;
- hard-filter library;
- feature calculators;
- deterministic score function;
- diversity/composition ranker;
- stable seeded PRNG;
- reason-code builder;
- deterministic explanation templates;
- repository interfaces;
- external-service timeout/retry utility;
- policy and prompt registries.

Reuse should happen through typed composition, not a generic “items” abstraction.

## Caching strategy

Use caching to protect latency and rate limits, not to blur freshness.

| Data | Suggested initial TTL | Notes |
|---|---:|---|
| Provider directory | 7 days | Invalidate on mapping/version change |
| Genre/configuration metadata | 7 days | Stable |
| Title details | 24 hours | Refresh on explicit details if stale |
| Search/discover pages | 5–15 minutes | Context-independent catalog response |
| Availability | 1–6 hours | Shorter where provider accuracy matters |
| Recommendation run | Stable for run/week | Recompute only by explicit policy |
| AI explanation | Tied to run/prompt version | Never outlive changed facts |

Use request coalescing to prevent cache stampedes. Cache keys must include region, media type, parameters, adapter version, and relevant language.

## Background work

Do not add a queue immediately.

Start with:

- idempotent scheduled Friday generation;
- lazy generation fallback on first open;
- bounded background taste-summary refresh;
- retryable, observable jobs.

Introduce a durable queue only when:

- job volume grows;
- scheduled work exceeds function limits;
- retries need persistence;
- multiple consumers exist.

## Observability

### Required structured events

- catalog request outcome/latency/cache status;
- candidate counts by source;
- exclusion counts by reason;
- availability validation failures;
- recommendation run latency by stage;
- no-result cause;
- AI latency/cost/fallback;
- user outcome signals;
- policy version.

### Recommendation trace

Every run should be answerable without logs alone:

```text
request context
→ candidates and source evidence
→ exclusions
→ features and scores
→ diversity decisions
→ selected results
→ availability evidence
→ explanation version
→ user outcome
```

Do not log secrets, raw private taste notes, or unnecessary personal identifiers.

## Testing strategy

### Unit tests

- title/provider/genre mapping;
- every hard filter;
- every feature calculation;
- score weights;
- stable randomness;
- diversity and composition;
- deterministic reasons;
- context precedence;
- ownership rules.

### Property and metamorphic tests

- identical input and seed produce identical output;
- filtered titles never re-enter during diversity ranking;
- removing a provider cannot increase eligibility;
- watched/hidden titles never appear in standard mode;
- AI cannot affect title selection;
- output contains no duplicate title references;
- requested counts and composition are respected when sufficient candidates exist.

### Golden scenario tests

Store small, reviewed candidate fixtures and expected ranked outputs for representative viewer contexts. Golden changes require an explicit policy-version update and review.

### Contract tests

- `CatalogProvider`;
- repositories;
- route schemas;
- AI structured output;
- cache behavior.

### Integration tests

- MongoDB indexes and ownership;
- recommendation orchestration with fake provider/repositories;
- migration dry runs;
- route authentication and idempotency.

### End-to-end tests

- onboarding to first pick;
- provider settings;
- mark watched/like/dislike;
- replace recommendation;
- Friday Picks stability;
- AI-off fallback;
- mobile layout and accessibility;
- empty and upstream-error states.

### Real-provider smoke tests

Run separately from deterministic tests:

- real TMDB Bearer authentication;
- known title details;
- provider directory;
- availability response;
- rate/error behavior.

Never make the standard unit suite depend on live TMDB.

## Security and privacy

- Keep external API tokens server-only.
- Continue a single TMDB Bearer-token mechanism.
- Never put credentials or PINs in query strings/localStorage.
- Authorize by canonical account/profile ownership at repositories/use cases.
- Validate all route inputs.
- Treat taste notes as private user content.
- Minimize AI payloads to relevant structured context.
- Define retention and deletion for taste signals and recommendation runs.
- Rate-limit expensive catalog and AI endpoints.

## Performance targets

Suggested budgets:

| Stage | Target |
|---|---:|
| Context/profile load | <100 ms cached |
| Candidate retrieval | <800 ms cached, <2 s cold |
| Pure filter/score/rank | <50 ms for typical pool |
| Availability validation | <500 ms cached |
| Deterministic result | <2 s typical |
| Optional AI explanation | <3 s, streamed or attached later |

The UI should render deterministic recommendations without waiting for AI wording.

## Scalability path

### Current to early growth

- Next.js modular monolith;
- MongoDB with proper indexes;
- Next.js/data cache plus Mongo cache repository;
- Vercel scheduled functions;
- stateless engine.

### Medium growth

- dedicated cache such as Redis only when measured;
- durable job/queue for weekly generation and projections;
- read-optimized recommendation/impression queries;
- provider request rate coordination;
- analytics warehouse fed from privacy-reviewed events.

### Large scale

Possible later separations:

- catalog ingestion/availability service;
- recommendation computation worker;
- feature/taste projection pipeline.

These are deployment decisions, not reasons to weaken domain boundaries now.

## Architecture decisions to approve first

1. Account/household/profile ownership model.
2. Anonymous-first versus invite-only product direction.
3. Library scope and the future of `SavedList`.
4. Taste event source of truth.
5. Canonical media-neutral title identity.
6. Recommendation run retention.
7. Provider availability freshness promise.
8. Initial recommendation policy thresholds and evaluation set.

## Final recommendation

Build the recommendation engine as a small, pure, versioned domain inside MovieChoice. Surround it with typed adapters and repositories, not with duplicated services.

The long-term advantage will not come from a more complex algorithm. It will come from:

- correct inputs;
- explicit policies;
- verified availability;
- unified user memory;
- reproducible results;
- disciplined evaluation;
- AI that adds warmth without taking control.
