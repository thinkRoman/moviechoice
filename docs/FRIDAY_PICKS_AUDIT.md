# Friday Picks Architectural Audit

## Scope and method

This audit treats `reference/Friday-Picks-READONLY-REFERENCE.zip` as a historical, read-only reference. The archive was inspected in place; it was not extracted, modified, executed, or treated as an active repository.

The purpose of this audit is to identify recommendation intelligence and product rules worth transplanting into MovieChoice. It is not a proposal to preserve Friday Picks as a second system.

## Executive assessment

Friday Picks is a compact family entertainment application built around one unusually sound product decision: **the catalog and deterministic ranking choose titles; AI only explains them**.

Its implementation is intentionally small:

- a static single-page application in `index.html`;
- Vercel Node serverless functions under `api/`;
- MongoDB for shared and per-person items;
- browser `localStorage` for preferences, recommendation history, ratings, and watched titles;
- TMDB for metadata, discovery, recommendations, and JustWatch-derived availability;
- OpenAI for recommendation blurbs and an unrelated general chat feature;
- Google Places for cinema and place discovery.

The recommendation engine is valuable, but the surrounding architecture is not suitable for direct import. The engine is embedded in one endpoint, important state lives only in one browser, inputs rely on free-form strings, ranking contains non-reproducible randomness, and recommendation-seeded candidates can bypass the streaming-provider filter. MovieChoice should preserve the philosophy and formalize the rules—not copy the endpoint.

## Overall architecture

### Runtime topology

```text
Static browser application
  ├── localStorage
  │   ├── services and genres
  │   ├── taste note
  │   ├── weekly picks and history
  │   ├── thumbs and watched titles
  │   └── cached PIN and member name
  └── Vercel serverless APIs
      ├── /api/picks       → TMDB + OpenAI
      ├── /api/upcoming    → TMDB
      ├── /api/ask         → OpenAI
      ├── /api/places      → Google Places
      ├── /api/items       → MongoDB
      ├── /api/login       → USERS env + MongoDB override
      ├── /api/setpin      → MongoDB
      ├── /api/roster      → USERS env
      └── /api/cron        → keep-warm response only
```

### Module inventory

| Module | Responsibility |
|---|---|
| `index.html` | Entire client UI, navigation, local state, preferences, weekly refresh, exclusions, feedback, watchlist, watched list, Family Takes, places, cinema, and chat |
| `api/picks.js` | Candidate discovery, filtering, scoring, ranking, enrichment, and explanation generation |
| `api/_tmdb.js` | TMDB authentication, provider resolution, genre mapping, image URLs, language rotation, and title normalization |
| `api/_db.js` | Cached MongoDB connection and PIN-based identity helpers |
| `api/items.js` | Generic shared/private item storage |
| `api/upcoming.js` | Now-playing and future theatrical calendar |
| `api/ask.js` | General-purpose AI chat with web search |
| `api/places.js` | Google Places discovery and cinema lookup |
| `api/login.js`, `roster.js`, `setpin.js` | Family roster and PIN access |
| `api/cron.js`, `vercel.json` | Friday scheduled invocation; it does not actually precompute picks |

## Recommendation pipeline

### 1. Preference assembly in the browser

The browser sends:

- enabled streaming-service names;
- enabled genre labels;
- a recency window (`2`, `5`, `10`, `20`, or effectively any year);
- whether international emphasis is enabled;
- desired movie and show counts;
- recently liked title strings;
- an exclusion list;
- a free-form taste note.

The exclusion list combines:

- watched titles;
- thumbs-down titles;
- the last 120 previously shown titles.

The client retains up to 200 historical recommendations and refreshes automatically after the most recent Friday when an existing list is stale.

### 2. Provider and genre resolution

`api/_tmdb.js` converts user-facing service names to TMDB provider IDs using:

1. a hard-coded alias map for common services;
2. the live TMDB US movie-provider list;
3. exact or constrained prefix matching for unknown labels.

It maps app genre labels separately for movies and television. Multiple providers and genres are joined with `|`, expressing OR semantics.

### 3. Deterministic catalog discovery

`api/picks.js` runs parallel TMDB `/discover/movie` and `/discover/tv` requests:

- US watch region;
- selected watch providers;
- `flatrate` monetization only;
- adult content excluded;
- minimum vote count and rating;
- optional minimum release date;
- selected genres;
- animation/family/kids exclusions unless the user requested family-oriented genres;
- movie runtime of at least 65 minutes;
- optional limited-series discovery;
- two general pages per media type;
- extra international-language searches when international emphasis is enabled.

### 4. Taste-seeded collaborative discovery

For up to three liked seed titles per media type, the engine:

1. strips a trailing year from the title;
2. searches TMDB by title;
3. selects the first match;
4. calls TMDB `/recommendations`;
5. adds those titles to the candidate pool.

Repeated appearances are treated as stronger recommendation evidence.

### 5. Filtering and deduplication

Candidates are removed when they:

- lack a title or poster;
- fail the media-specific quality gate;
- match a watched, disliked, or previously shown normalized title;
- contain blocked family/animation genres when those genres were not requested;
- fall outside the requested recency range.

Candidates deduplicate by TMDB ID. Each duplicate increments `recHits`.

### 6. Ranking

For every surviving candidate:

```text
score =
  (TMDB rating - minimum rating) × 12
  + min(recHits, 4) × 22
  + log10(max(vote count, 10)) × 4
  + 10 when international is enabled and original language is not English
  + max(0, release year - 2015) × 0.6
  + random value from 0 to 9
```

The list is sorted descending and sliced to the requested movie/show counts.

### 7. Detail and availability enrichment

Selected titles are individually fetched from TMDB with watch-provider details. Enrichment adds:

- runtime or series length;
- up to two genre names;
- US flat-rate services;
- a primary service;
- a TMDB details link.

### 8. AI explanation

OpenAI receives only the already selected titles, their year and truncated overview, plus the free-form taste note. It returns one warm sentence per title.

If OpenAI is missing, fails, returns invalid JSON, or produces no line for a title, the engine falls back to a truncated TMDB overview. Recommendation selection still succeeds.

## Ranking logic assessment

### What is good

- **Quality is a gate, not merely a boost.** Low-confidence titles cannot compensate with popularity or AI enthusiasm.
- **Collaborative evidence is weighted heavily.** A repeated result from liked-title neighborhoods meaningfully outranks a generic discovery candidate.
- **Vote count is logarithmic.** Established titles gain confidence without allowing blockbuster scale to dominate completely.
- **Recency is gentle.** Newness matters, but does not erase older high-quality titles.
- **International preference is a controlled boost.** It changes rank without dropping the quality threshold.
- **Exclusions are applied before ranking.** The engine does not waste top slots on titles the user has already rejected or seen.

### What needs correction

- **Randomness is not seeded.** Identical input cannot be reproduced, tested, explained, or compared reliably.
- **`recHits` conflates evidence sources.** Duplicate discover calls and true recommendation overlap both increment the same field.
- **The score is uncalibrated.** Constants are reasonable heuristics but have no recorded evaluation dataset or acceptance metric.
- **No diversity pass exists.** Several results can cluster around one franchise, genre, language, or seed.
- **No explicit novelty/familiarity balance exists.** Vote count, recency, and recommendation overlap implicitly control it.
- **No negative taste similarity is scored.** Dislikes remove exact titles but do not suppress related genres, franchises, or neighborhoods.
- **The random term can overpower subtle quality differences.** A nine-point range is large relative to several other components.

## Filtering pipeline assessment

### Business rules worth preserving

- US region and subscription availability are default hard constraints.
- Only flat-rate availability counts for the “included with what I pay for” promise.
- Movies under 65 minutes are excluded from movie-night recommendations.
- Movies require at least 300 votes and 6.6 average rating.
- Shows require at least 150 votes and 7.0 average rating.
- Adult content is always excluded.
- Watched, disliked, and recently shown titles are excluded.
- Animation/family/kids content is suppressed by default but allowed when intentionally selected.
- An empty result is treated honestly: broaden filters rather than lowering quality invisibly.

### Important defect

Candidates produced by TMDB `/recommendations` are added directly to the pool and are **not passed through a provider-aware discovery query**. The later `enrich` call reports availability but does not reject unavailable titles. Therefore a liked-adjacent title can rank highly even when it is not included on any selected service.

This violates the product promise and must be fixed in MovieChoice by applying availability as a final invariant to every candidate, regardless of source.

### Other weaknesses

- Search-based seed resolution can pick the wrong remake or a TV/movie title with the same name.
- Title-string exclusions are less reliable than TMDB IDs.
- Normalization removes English articles but does not resolve aliases, translations, or remakes.
- Provider discovery uses the movie provider list even when resolving services for shows.
- Genre mappings are approximate; “biopic” and “thriller” for TV are inferred through broad genre IDs.
- “International” is a preference flag, not a true genre, but is mixed into the genre list.
- Content certification and household age suitability are not part of the recommendation filter.

## Streaming-provider handling

Friday Picks correctly recognizes that provider availability is central, not decorative.

Strengths:

- selected services are applied at discovery time;
- monetization is restricted to flat-rate;
- provider IDs are deduplicated;
- aliases cover renamed and legacy services such as Max;
- dynamic provider lookup supports niche services;
- all available flat-rate providers are returned for the chosen title.

Weaknesses:

- provider names are the stored identity, making renames and localization fragile;
- the provider map is process-memory cached without expiry;
- results are US-only and region is hard-coded;
- loose matching can still resolve an unintended channel variant;
- the displayed primary service is simply the first returned provider, not necessarily one the user selected;
- recommendation-seeded candidates can bypass availability filtering;
- no availability timestamp or evidence is persisted, so stale claims cannot be audited.

MovieChoice should store canonical provider IDs and region, display localized names from the catalog adapter, and attach an availability assertion to every recommendation result.

## AI prompt strategy

### Recommendation blurbs

The prompt has a narrow, correct role:

- one sentence;
- maximum 22 words;
- warm and specific;
- explains why the viewer might press play tonight;
- receives only selected titles;
- returns a JSON array in the same order.

This is the strongest AI decision in Friday Picks. It prevents the model from inventing catalog entries or overriding ranking.

Weaknesses:

- output is parsed from the first bracketed text rather than validated against a schema;
- title ID is not included in the response, so order drift can attach the wrong explanation;
- the taste note is unstructured and untrusted;
- explanations are not fact-checked against structured reasons;
- fallback to an overview changes the meaning from “why for you” to “what it is”;
- no prompt/version/model metadata is persisted;
- no latency, token, cost, or quality telemetry is recorded.

### Ask-anything chat

`api/ask.js` is intentionally broad and defaults to web search. That is outside MovieChoice’s focused product promise. It should be left behind unless a future, separately approved product strategy introduces a bounded entertainment concierge.

## TMDB usage

Friday Picks uses TMDB for:

- `/discover/movie` and `/discover/tv`;
- `/search/movie` and `/search/tv`;
- title `/recommendations`;
- title details;
- watch providers;
- images;
- now playing;
- upcoming theatrical releases;
- release dates, certifications, and trailers.

Positive patterns:

- real catalog candidates precede AI;
- JustWatch-derived provider data is used as a filter;
- partial upstream failure is tolerated for secondary candidate sources;
- enrichment is deferred until after ranking, reducing detail requests.

Technical debt:

- both v3 query-key and v4 Bearer authentication are supported under one ambiguous variable;
- requests have no explicit timeout, retry budget, circuit breaker, or rate-limit handling;
- caching is limited to Next/Vercel behavior and one in-memory provider map;
- multiple per-title enrichment calls create an N+1 pattern;
- safe fallbacks often suppress diagnostic context;
- no typed catalog boundary exists;
- no attribution/evidence object travels with availability.

## MongoDB usage

MongoDB stores:

- generic `items` for Family Takes, watchlists, and restaurant logs;
- custom PIN overrides in `credentials`.

The generic item document contains:

- `section`;
- optional `key`;
- `owner`;
- `shared`;
- arbitrary `payload`;
- `createdAt`.

Strengths:

- cached serverless connection;
- simple owner/shared access rule;
- owner-scoped deletion;
- one storage mechanism enabled rapid product experimentation.

Weaknesses:

- arbitrary payloads have no schema validation or migration strategy;
- section strings are effectively hidden collection types;
- there are no documented indexes for common item queries;
- identity is a mutable display name;
- PINs are stored and cached in plaintext;
- PINs appear in query strings for GET requests;
- local and Mongo state can disagree;
- watch history and preferences are not server-backed;
- no household/account boundary exists beyond names and shared flags.

## Product strengths

- Solves one concrete job: “What should I watch tonight?”
- Produces a small, confident list instead of another infinite catalog.
- Learns from lightweight signals: thumbs, watched titles, and history.
- Remembers services and genres instead of repeatedly asking.
- Establishes a weekly ritual and refresh cadence.
- Balances movies and shows explicitly.
- Makes international discovery a rotation, not an unbounded novelty request.
- Gives honest no-result guidance rather than silently degrading quality.
- Makes feedback’s future effect legible to the user.
- Keeps AI optional and downstream of verified selection.

## Technical strengths

- Very small dependency and operational surface.
- Parallel candidate acquisition.
- Enrichment after selection.
- Graceful AI degradation.
- Simple, explainable score.
- Provider-aware discovery.
- Explicit quality thresholds.
- Clear separation between primary recommendation behavior and secondary entertainment features, even though the code is physically monolithic.

## Weaknesses and technical debt

### Architecture

- The entire client is a 652-line HTML file with global mutable state and string-generated markup.
- The recommendation engine combines transport, catalog access, policy, scoring, enrichment, and AI.
- There are no domain types or service interfaces.
- Client and server validation are incomplete.
- Errors are frequently swallowed.
- There are no automated tests.

### Data and identity

- Critical personalization data is device-local.
- Cross-device and multi-device consistency are impossible.
- User identity is name/PIN based.
- PIN credentials are insecure.
- Title identity is often a display string instead of a TMDB ID and media type.
- Watchlist, watched history, and taste signals have incompatible persistence locations.

### Recommendation correctness

- Availability is not invariant across all candidate sources.
- Seed-title matching is ambiguous.
- Randomness prevents reproducibility.
- Diversity, saturation, and exploration policies are implicit.
- No score breakdown is returned.
- No evaluation harness or recommendation-event log exists.

### Operations

- The Friday cron does not generate or cache recommendations; it only returns a timestamp.
- No structured logging, tracing, metrics, or alerting exists.
- No upstream timeout or backoff policy exists.
- No prompt or policy versioning exists.

## Hidden gems

These less obvious ideas deserve preservation:

1. **Recent-exposure suppression:** retaining and excluding a rolling history prevents the product from feeling repetitive even when explicit feedback is sparse.
2. **Rotating international languages:** a deterministic weekly rotation creates breadth without lowering the global quality gate.
3. **Separate media quality gates:** television and movie vote behavior differs; one threshold would be misleading.
4. **Minimum movie runtime:** it protects the semantic promise of “movie night.”
5. **Kids-content intent switch:** family content is excluded by default but becomes eligible when explicitly requested.
6. **Duplicate-source strength:** overlap among candidate sources is useful evidence, even though provenance must be modeled more accurately.
7. **Friday ritual:** refresh timing is a product mechanic, not only caching.
8. **Small list composition:** explicit movie/show counts reinforce confidence and variety.
9. **No-result honesty:** filter relaxation should be user-visible and controlled.
10. **AI degradation:** the product remains useful when AI is unavailable.

## Opportunities for improvement

### Recommendation quality

- Preserve source provenance and score each source independently.
- Use stable seeded exploration rather than `Math.random()`.
- Enforce availability after candidate merge and again before response.
- Use TMDB IDs for seeds and exclusions.
- Add a diversity/re-ranking pass across genre, franchise, language, decade, and seed.
- Distinguish “safe familiar pick,” “best match,” and “discovery pick.”
- Learn weights from acceptance outcomes only after a deterministic baseline is measurable.

### Product intelligence

- Convert taste notes into reviewed structured constraints and soft preferences.
- Add household aggregation strategies: consensus, least-objection, and viewer-specific weighting.
- Separate permanent preferences from tonight-only context.
- Record why a recommendation was skipped, hidden, accepted, or refreshed.
- Make refresh behavior explicit: replace one, refresh all, or broaden constraints.

### Engineering

- Decompose the engine into candidate sources, hard filters, feature computation, scorer, diversity ranker, and explanation builder.
- Version policies and prompts.
- Create golden-scenario and invariant tests.
- Store recommendation runs and item-level score breakdowns.
- Put TMDB behind a typed `CatalogProvider`.
- Add bounded concurrency, timeouts, caching, and rate-limit handling.

## Final judgment

Friday Picks should not be imported as code. Its **recommendation contract and business rules should be imported as specifications**.

The heart worth transplanting is:

```text
verified available candidates
→ hard quality and context gates
→ taste-adjacent evidence
→ transparent weighted ranking
→ controlled diversity and freshness
→ AI explanation after selection
```

Everything around that heart should use MovieChoice’s typed Next.js application, authenticated data model, API boundaries, and test infrastructure.
