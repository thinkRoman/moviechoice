# MovieChoice Evolution Implementation Roadmap

## Objective

Evolve MovieChoice into the definitive “what should I watch tonight?” product by transplanting Friday Picks’ proven recommendation philosophy into MovieChoice’s typed, modern platform.

This roadmap deliberately prioritizes:

1. correctness before personalization sophistication;
2. observable deterministic behavior before AI;
3. reuse of MovieChoice modules before new systems;
4. low-risk vertical slices that can be evaluated independently;
5. one source of truth for catalog, identity, preferences, and interactions.

## Non-negotiable invariants

- TMDB is a catalog source, not the recommendation engine.
- Every recommendation must exist in the verified catalog.
- Every “available on your services” claim must carry current region/provider evidence.
- Hard filters may not be silently relaxed.
- AI may interpret constraints and explain chosen titles; it may not select or invent titles.
- The same engine powers Quick Pick, Friday Picks, and personalized Explore collections.
- Recommendation policy and prompt versions must be recorded.
- A recommendation result must be reproducible from its stored input, policy version, and deterministic seed.

## Phase 0 — Architecture decisions and baseline protection

### Goal

Resolve current model contradictions before adding engine behavior.

### Work

- Decide the identity hierarchy:
  - account/household;
  - user;
  - viewer profile;
  - guest session.
- Decide whether watchlists are account-level, profile-level, or optionally shared.
- Make watched state and recommendation feedback profile-level.
- Resolve `Profile.userId` uniqueness versus household-profile requirements.
- Choose one taste source of truth:
  - immutable/append-friendly `TasteSignal` interactions;
  - derived taste summaries on profile as projections only.
- Resolve `SavedList` versus `UserMovie`:
  - library entry for default watchlist/watched/favorite state;
  - named collection model only for custom collections.
- Define a media-neutral catalog ID:

```ts
type CatalogTitleRef = {
  source: 'tmdb';
  mediaType: 'movie' | 'tv';
  sourceId: number;
};
```

- Decide whether anonymous-first remains a requirement or the invite-only access model is authoritative.
- Establish recommendation success measures and a small human-rated evaluation set.

### Validation

- Approved architecture decision records.
- No duplicate ownership semantics across models.
- Migration strategy documented before schema changes.
- Existing My Movies behavior has regression tests and an explicit migration path.

### Risk

Low implementation risk, high leverage. Skipping this phase creates permanent duplication.

## Phase 1 — Catalog foundation and provider correctness

### Goal

Turn the existing `tmdb.ts` client into a reusable catalog boundary capable of powering recommendations without creating a second TMDB integration.

### Work

- Define `CatalogProvider` operations:
  - discover;
  - search;
  - details;
  - recommendations;
  - availability;
  - provider directory;
  - now playing/upcoming.
- Implement TMDB as the first adapter using the existing Bearer auth.
- Add media-neutral catalog DTOs.
- Add region and availability evidence to title results.
- Canonicalize provider identity by TMDB provider ID.
- Map display aliases only at the adapter/UI boundary.
- Add request timeouts, bounded retries, typed upstream errors, and request correlation.
- Introduce cache interfaces and explicit TTL policies:
  - provider directory: long TTL;
  - metadata/details: medium/long TTL;
  - availability: short TTL;
  - discovery/search: short TTL.
- Add bounded concurrency for title enrichment.
- Preserve TMDB and JustWatch attribution.

### Validation

- Contract tests for the provider interface.
- Fixture-backed adapter tests for movies, TV, providers, and availability.
- Invariant test: any “included” availability contains region, provider ID, monetization type, and observation time.
- Real-API smoke test outside the deterministic unit suite.
- No direct TMDB calls outside the adapter.

### Risk

Low-to-medium. It modernizes an existing module and unlocks all subsequent work.

## Phase 2 — Recommendation Engine v1: Friday Picks baseline

### Goal

Implement a pure, deterministic, testable engine that matches the valuable Friday Picks baseline without UI or AI dependency.

### Work

Create engine stages:

1. normalize context;
2. gather candidates;
3. apply hard filters;
4. compute features;
5. score;
6. diversify/re-rank;
7. validate availability;
8. compose result;
9. build deterministic reasons.

Initial hard policies:

- adult content excluded;
- selected region required;
- selected flat-rate providers required;
- movie threshold: 300 votes and 6.6 rating;
- TV threshold: 150 votes and 7.0 rating;
- movie-night runtime floor: 65 minutes;
- watched/disliked/recently shown IDs excluded;
- age/certification rules where verified;
- family/animation suppression only when context indicates it.

Initial score features:

- rating above threshold;
- distinct liked-seed recommendation evidence;
- logarithmic vote confidence;
- profile/context international affinity;
- gentle recency;
- deterministic exploration jitter.

Improvements over Friday Picks:

- canonical IDs, never title-string seeds;
- candidate source provenance;
- availability enforced for every candidate source;
- deterministic seeded exploration;
- diversity across franchise, genre, language, decade, and seed;
- structured score breakdown and reason codes.

### Validation

- Pure unit tests for every hard filter and score feature.
- Golden scenarios covering:
  - cold start;
  - international viewer;
  - family night;
  - limited time;
  - narrow subscriptions;
  - watched-heavy history;
  - no-result case.
- Metamorphic tests:
  - adding a watched flag cannot improve that title’s rank;
  - removing a provider cannot retain titles exclusive to it;
  - identical input/seed/policy gives identical output;
  - AI availability cannot change selected titles.
- Comparison harness that runs representative inputs against documented Friday Picks behavior.

### Risk

Medium, but isolated. No production route should depend on it until evaluation passes.

## Phase 3 — Streaming preferences and profile integration

### Goal

Make “available on services I already pay for” reliable and effortless.

### Work

- Store provider IDs plus region on profiles.
- Build onboarding/service settings against the provider directory.
- Separate:
  - saved subscription defaults;
  - temporary tonight-only provider overrides.
- Add service rename/deprecation handling.
- Build availability-aware recommendation context.
- Migrate legacy string service names through explicit alias resolution.
- Show the exact included provider(s) on results.
- Add “browse beyond my services” as an explicit mode, never an implicit relaxation.

### Validation

- Service settings persist across devices.
- Renamed provider aliases map to one canonical ID.
- Every default recommendation is included on at least one selected service.
- Temporary overrides do not mutate profile defaults.
- Empty-provider and no-match states offer actionable recovery.

### Risk

Medium. Provider data quality is external; evidence and freshness must be visible.

## Phase 4 — Taste signals, watched state, and recommendation memory

### Goal

Unify MovieChoice’s existing library with profile-level recommendation learning.

### Work

- Finalize the My Movies library as the single default library state.
- Extend library identity to media type.
- Scope watched state according to the approved profile/account decision.
- Implement recommendation feedback:
  - thumbs up;
  - thumbs down;
  - not interested;
  - already watched;
  - accepted/started;
  - skipped/refreshed.
- Add recommendation runs and impressions:
  - input context hash;
  - candidate/result IDs;
  - rank and score breakdown;
  - policy version;
  - surfaced/accepted timestamps.
- Replace Friday Picks’ local history with a time-bounded impression exclusion policy.
- Derive taste summaries asynchronously or on read; do not duplicate raw signals in multiple sources of truth.
- Support manual watched-title entry through catalog search, not arbitrary strings where possible.

### Validation

- Feedback affects later runs in the expected direction.
- Watched titles never reappear under the normal policy.
- A recommendation refresh creates an impression reason without marking the title disliked.
- Cross-device history is consistent.
- Existing watchlist/watched/favorite API behavior remains intact after migration.

### Risk

Medium-to-high because it touches existing uncommitted My Movies work. Use additive migrations and regression tests.

## Phase 5 — Taste notes and preference interpretation

### Goal

Preserve the expressiveness of Friday Picks’ taste note without letting free text become an unbounded ranking input.

### Work

- Store:
  - original taste note;
  - structured interpretation;
  - interpretation version;
  - confirmation status;
  - last interpreted time.
- Define a constrained preference schema:
  - liked/disliked genres;
  - language/subtitle preference;
  - tone and intensity;
  - content exclusions;
  - pacing;
  - era affinity;
  - discovery appetite;
  - examples by canonical title ID.
- Use deterministic parsing for known controls.
- Use AI only to propose structured changes from free text.
- Show the interpretation for user review and correction.
- Merge permanent taste with tonight-only context using explicit precedence.

### Validation

- The same confirmed structured taste yields the same engine inputs.
- Unsupported or ambiguous text never becomes a hidden hard filter.
- Users can inspect and remove derived preferences.
- AI failure leaves saved structured preferences and the engine functional.

### Risk

Medium. The main risk is invisible over-personalization; confirmation and provenance reduce it.

## Phase 6 — Quick Pick vertical slice

### Goal

Deliver the core job in under 30 seconds using the new engine.

### Work

- Implement a compact Quick Pick flow:
  - who is watching;
  - tonight’s mood;
  - available time;
  - confirm saved services only when needed;
  - recommendation result.
- Prefer defaults and remembered context.
- Return a small ranked set, with one confident lead recommendation.
- Provide deterministic “why” immediately.
- Actions:
  - watch/save;
  - seen;
  - not quite right;
  - replace this;
  - refine.
- Persist the run and impressions.
- Support a guest context if anonymous-first remains approved.

### Validation

- First recommendation in under 10 seconds for cached catalog paths.
- Full flow in under 30 seconds.
- Guest and authenticated behavior match the approved identity decision.
- No-result recovery is explicit and does not silently break hard constraints.
- Browser, mobile, accessibility, API, and data persistence tests pass.

### Risk

Medium. It is the first user-facing engine integration, but built on validated lower layers.

## Phase 7 — Friday Picks and refresh experience

### Goal

Restore Friday Picks as a premium recurring product ritual powered by the same engine.

### Work

- Define a weekly recommendation context and composition policy.
- Generate or lazily materialize a versioned weekly run per profile.
- Use profile timezone for staleness and week labels.
- Preserve a controlled international rotation.
- Provide:
  - replace one title;
  - refresh the full list;
  - keep current filters;
  - broaden a selected constraint;
  - explain why a title changed.
- Suppress recent exposures without permanently hiding everything shown.
- Add notification support only after the weekly list has proven engagement.

### Validation

- One stable list per profile/week/policy version unless the user refreshes.
- Refresh produces traceable changes.
- No duplicate or recently surfaced title leakage beyond policy.
- Weekly run generation is idempotent.
- Scheduled generation and lazy fallback produce equivalent results.

### Risk

Low-to-medium after Quick Pick, because it reuses the same engine and context model.

## Phase 8 — AI explanation and bounded refinement

### Goal

Add warmth and natural-language control without compromising recommendation truth.

### Work

- Build a centralized AI gateway with:
  - model routing;
  - timeout and retry policy;
  - structured output validation;
  - prompt/version tracking;
  - cost and latency telemetry;
  - per-user budgets.
- Explanation input includes only:
  - selected title facts;
  - selected provider facts;
  - structured engine reasons;
  - relevant confirmed taste/context.
- Return explanations keyed by recommendation item ID.
- Provide a deterministic template fallback based on reason codes.
- Build bounded refinement:
  - AI converts text to a validated `RecommendationContextPatch`;
  - the engine re-runs;
  - AI never returns titles directly.
- Show interpreted changes before or alongside results.

### Validation

- AI outage changes wording only, never selected titles for the same engine run.
- No output can name an unavailable provider or unverified title.
- Schema-invalid output falls back safely.
- Prompt injection in taste notes cannot alter system boundaries.
- Cost, latency, and fallback rate are observable.

### Risk

Medium, intentionally delayed until the deterministic product is proven.

## Phase 9 — Home and Explore evolution

### Goal

Turn the current generic TMDB home into a personalized decision surface.

### Work

- Make the lead action “Pick something for tonight.”
- Add a compact “Continue your last decision” state when relevant.
- Add personalized rails backed by the engine:
  - Friday Picks;
  - hidden gems;
  - because you liked;
  - under your available time;
  - international discovery;
  - leaving a service soon, only with verified data.
- Keep generic trending/popular as secondary cold-start or browse content.
- Build collections through the same candidate/filter/rank primitives.
- Add editorial collections only through a typed curation source.

### Validation

- Home has one obvious primary action.
- Personalized rails do not violate availability or exclusion invariants.
- Collection definitions are reusable and testable.
- Performance budgets hold with cached/batched catalog calls.

### Risk

Low after engine maturity; mostly composition and UX.

## Phase 10 — Evaluation, tuning, and scale

### Goal

Improve recommendation quality without losing explainability.

### Work

- Establish offline evaluation from anonymized/consented interaction data.
- Track:
  - recommendation acceptance;
  - replace/refresh rate;
  - provider mismatch reports;
  - watched-after-recommendation;
  - diversity and repetition;
  - time to decision;
  - no-result rate.
- Use feature flags for policy versions.
- Run shadow scoring before weight changes.
- Add controlled experiments only when sample size supports them.
- Evaluate learned ranking as a later re-ranker, never before sufficient data.
- Add multi-region providers behind the same adapter.
- Consider alternate availability sources behind `CatalogProvider`.

### Validation

- Policy changes can be compared offline and rolled back.
- Every production recommendation records enough evidence to reproduce it.
- No PII is required for aggregate quality metrics.
- SLOs exist for latency, availability, and provider freshness.

## Recommended release gates

| Gate | Required evidence |
|---|---|
| Catalog ready | Provider contract tests, availability invariants, cache behavior |
| Engine ready | Golden scenarios, deterministic replay, policy review |
| Profile integration ready | Migration tests, cross-device behavior, ownership audit |
| Quick Pick beta | End-to-end browser tests, latency target, no-result UX |
| Friday Picks beta | Weekly idempotence, refresh semantics, exposure suppression |
| AI ready | Grounding tests, deterministic fallback, budget telemetry |
| General availability | Evaluation baseline, rollback plan, operational dashboards |

## What should not be built yet

- A second recommendation implementation for Explore.
- A general-purpose assistant.
- Restaurant or broad Places features.
- Learned ranking before deterministic evaluation data exists.
- Multi-region UI before US availability correctness is proven.
- Public social feeds.
- Provider deep links presented as guaranteed playback without evidence.

## Recommended first implementation slice after approval

The safest high-value slice is:

1. catalog provider interface and TMDB adapter;
2. canonical provider directory and availability;
3. pure Friday Picks baseline filters/scorer;
4. fixture-backed golden tests;
5. an internal-only evaluation endpoint or script.

It proves the recommendation heart without changing the production UI or user data.
