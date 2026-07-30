# Friday Picks to MovieChoice Module Mapping

## Decision framework

The classifications in this document refer to **capability and business-logic migration**, not file copying. “Import unchanged” means the rule can be preserved unchanged behind MovieChoice interfaces; it does not mean copying legacy JavaScript verbatim.

| Classification | Meaning |
|---|---|
| Import unchanged | Preserve the business rule or policy exactly, implemented within MovieChoice |
| Import with adaptation | Preserve the intent but change data types, boundaries, security, or mechanics |
| Merge with existing MovieChoice implementation | Extend an existing MovieChoice module as the single source of truth |
| Replace | The capability is valuable, but its implementation should be superseded |
| Leave behind | Do not carry the capability into the current MovieChoice product |

## Executive mapping

| Friday Picks Module | MovieChoice Equivalent | Recommendation | Reason |
|---|---|---|---|
| `api/picks.js` | Planned recommendation engine and Quick Pick API; not implemented | Replace | Preserve its policies, but split the monolithic endpoint into typed candidate, filter, score, rank, availability, and explanation modules |
| `api/_tmdb.js` | `src/lib/tmdb.ts`; planned `CatalogProvider` | Merge with existing MovieChoice implementation | MovieChoice already owns TMDB auth and catalog UI; expand it behind a provider interface rather than introduce a second TMDB client |
| Browser services/genres/taste settings | `Profile.preferences`; profile API | Merge with existing MovieChoice implementation | Profile settings should be authoritative and server-backed; browser-only state must disappear |
| Browser ratings/watched/history | `TasteSignal`, `UserMovie`, planned recommendation events | Merge with existing MovieChoice implementation | Keep one canonical interaction model; do not retain title-string localStorage histories |
| OpenAI blurb generation | Planned AI explanation layer | Import with adaptation | Preserve AI-after-ranking, but use structured inputs, schema validation, IDs, reason codes, and prompt versioning |
| `api/items.js` | `UserMovie`, `SavedList`, future notes/household modules | Replace | Generic arbitrary payload storage conflicts with typed, evolvable domain models |
| Friday refresh logic | Planned Friday Picks collection/run scheduler | Import with adaptation | Preserve the ritual and staleness rule, but generate versioned server-side runs and support explicit refresh semantics |
| PIN roster/auth modules | NextAuth/Auth.js, `User`, member access | Leave behind | MovieChoice already has a more secure identity system; plaintext PIN and env roster behavior must not return |
| `api/upcoming.js` | Current TMDB upcoming row; future cinema collection | Import with adaptation | Useful product behavior, but should use the catalog provider, caching, typed release status, and bounded enrichment |
| Family Takes | No active equivalent | Import with adaptation, later | Taste notes attached to a title are valuable, but require a scoped product decision and typed profile/household ownership |
| General Ask chat | Planned bounded AI refinement | Leave behind | General web-search chat contradicts MovieChoice’s focused entertainment-assistant positioning |
| Places and restaurant log | No equivalent | Leave behind | Valuable in a family hub, but outside “what should I watch tonight?” |
| Static PWA shell | Next.js App Router and manifest | Replace | MovieChoice already provides the modern application platform |

## Recommendation engine mapping

| Friday Picks Capability | MovieChoice Equivalent | Recommendation | Reason and target treatment |
|---|---|---|---|
| `/discover/movie` candidate source | Planned `CatalogProvider.discover` | Import with adaptation | Keep provider-aware discovery; return typed candidates with region and availability evidence |
| `/discover/tv` candidate source | No active TV catalog support | Import with adaptation | Add media-type parity through the same provider interface, not a parallel TV engine |
| TMDB `/recommendations` seeds | Planned taste candidate source | Import with adaptation | Seed by canonical TMDB ID and media type; record source provenance; never search by title when an ID exists |
| Two general discover pages | No equivalent | Import with adaptation | Preserve bounded breadth, but make budgets configurable and based on candidate sufficiency |
| International language searches | Explore/Friday Picks concept only | Import with adaptation | Preserve rotating language exploration as a policy with deterministic run seeds and profile opt-in |
| Provider ID aliases | No active provider module | Import with adaptation | Seed canonical aliases, then resolve from TMDB; persist canonical provider ID rather than display name |
| Dynamic provider resolution | Planned catalog abstraction | Merge with existing MovieChoice implementation | Put provider lookup and caching inside the TMDB adapter |
| Movie genre mapping | `Profile.preferences.genres`; TMDB genres | Import with adaptation | Define canonical internal genre IDs and mapping tables; separate user concepts such as “International” from catalog genres |
| TV genre mapping | No active equivalent | Import with adaptation | Add as the TV portion of one taxonomy service |
| Quality gate: movies ≥300 votes and ≥6.6 | Planned hard filters | Import unchanged initially | It is a proven baseline. Version it as policy and recalibrate only through measured evaluation |
| Quality gate: shows ≥150 votes and ≥7.0 | Planned hard filters | Import unchanged initially | Preserve the separate media threshold |
| Movie runtime ≥65 minutes | Planned time/runtime filter | Import unchanged for “movie night” | Retain as a semantic guard; other Quick Pick time modes may intentionally use different limits |
| Adult exclusion | Product safety requirement | Import unchanged | Must remain a hard invariant |
| Recency window | Planned Quick Pick context | Import with adaptation | Support exact runtime/release constraints in a typed request; distinguish permanent preference from tonight-only choice |
| Kids/family suppression unless requested | `Profile.ageRange`; planned filters | Import with adaptation | Preserve intent, but combine genre intent with certification/age settings and household context |
| Limited-series source | Explore/Quick Pick planned TV support | Import with adaptation | Keep as a candidate source using verified TMDB fields and tests |
| Watched-title exclusion | `UserMovie.watched`; `TasteSignal` planned | Merge with existing MovieChoice implementation | `UserMovie` should provide canonical watched IDs; make exclusion profile-aware |
| Disliked-title exclusion | `TasteSignal.thumbs_down` | Merge with existing MovieChoice implementation | Use the dedicated interaction source, not title strings |
| Recently shown exclusion | No active model | Import with adaptation | Store recommendation impressions/runs server-side with expiry and reason |
| Title normalization | Search and display strings | Replace | Canonical IDs eliminate most normalization; keep normalization only for legacy/manual imports |
| Candidate deduplication by TMDB ID | Planned engine | Import unchanged | Identity should be `{catalogSource, mediaType, catalogId}` to avoid collisions |
| Duplicate occurrence as signal | Planned feature computation | Import with adaptation | Track per-source evidence instead of one ambiguous `recHits` counter |
| Rating uplift | Planned scorer | Import unchanged initially | Preserve the starting formula as a versioned feature |
| Recommendation-overlap uplift | Planned scorer | Import with adaptation | Preserve its importance, but count distinct seed/source evidence only |
| Logarithmic vote-count uplift | Planned scorer | Import unchanged initially | A sensible confidence prior that avoids linear popularity dominance |
| International bonus | Planned scorer | Import with adaptation | Make it profile/context dependent and avoid equating all non-English titles |
| Gentle recency bonus | Planned scorer | Import unchanged initially | Preserve as one feature, versioned and observable |
| `Math.random()` variation | No equivalent | Replace | Use a deterministic seed based on profile, context, policy version, and recommendation run |
| Top-N movie/show slices | Quick Pick count/context | Import with adaptation | Preserve intentional composition, but let a composition policy allocate slots |
| Post-rank detail enrichment | Current `getMovieDetails` | Merge with existing MovieChoice implementation | Keep enrichment after selection and introduce batched/bounded catalog calls |
| First returned provider as primary | No equivalent | Replace | Prefer a user-subscribed provider and return all verified options |
| Empty-result message | Current general error states | Import with adaptation | Return structured relaxation suggestions without silently violating hard constraints |

## Catalog and TMDB mapping

| Friday Picks Module | MovieChoice Equivalent | Recommendation | Reason |
|---|---|---|---|
| `_tmdb.tmdb()` | `tmdbFetch()` | Merge with existing MovieChoice implementation | Retain MovieChoice’s single Bearer-token auth method and add timeouts, typed errors, retries, and observability |
| v3/v4 dual auth under `TMDB_API_KEY` | `TMDB_API_READ_ACCESS_TOKEN` | Leave behind | MovieChoice has standardized on one v4 Bearer token |
| `poster()` and `backdrop()` | `imageUrl()` | Merge with existing MovieChoice implementation | One image URL policy should serve the entire app |
| Provider list cache | `CatalogCache` model is present but unused | Import with adaptation | Use a typed cache interface; cache provider metadata and availability separately with explicit TTLs |
| Movie detail enrichment | `getMovieDetails()` | Merge with existing MovieChoice implementation | Expand the existing detail DTO to include availability, language, certification, and media type |
| Upcoming/now-playing APIs | Home `upcoming` row | Merge with existing MovieChoice implementation | Build one cinema collection service; avoid separate direct-TMDB pathways |
| TMDB links and attribution | Current footer | Merge with existing MovieChoice implementation | Preserve attribution and add JustWatch attribution where availability is shown |
| JustWatch search link | No formal handoff module | Import with adaptation | Use verified provider links where available; use search only as a clearly labeled fallback |
| Letterboxd search link | No equivalent | Leave behind for v1 | It does not advance the core decision flow; reconsider as an optional details integration |

## Personalization and state mapping

| Friday Picks State/Behavior | MovieChoice Equivalent | Recommendation | Reason |
|---|---|---|---|
| `fp-state` localStorage | `Profile`, `TasteSignal`, `UserMovie`, recommendation runs | Replace | Personalization must be server-backed, profile-scoped, typed, and portable |
| Service toggles | `Profile.preferences.streamingServices` | Merge with existing MovieChoice implementation | Convert string names to canonical provider IDs and region |
| Genre toggles | `Profile.preferences.genres` | Merge with existing MovieChoice implementation | Use one canonical preference taxonomy |
| Free-form taste note | No active field | Import with adaptation | Store original text plus derived structured preferences, provenance, and user confirmation |
| Movie/show count | Planned Quick Pick context | Import with adaptation | Use recommendation composition preferences with safe defaults |
| Year floor | Planned context filters | Import with adaptation | Preserve choices but model them as a recency constraint |
| Thumbs up/down map | `TasteSignal`; favorites in `UserMovie` | Merge with existing MovieChoice implementation | Define semantics: favorite is a library state; thumbs are recommendation feedback |
| Watched list | `UserMovie.watched` | Merge with existing MovieChoice implementation | Extend to media type/profile and keep `watchedAt` |
| Recommendation history | No active model | Import with adaptation | Add recommendation impression/run records rather than expanding `UserMovie` |
| Weekly picks cache | No active model | Import with adaptation | Persist recommendation runs separately from catalog cache |
| PIN cache | Auth.js session | Leave behind | Never store credentials in browser localStorage |
| Watchlist in Mongo generic items | `UserMovie.inWatchlist`; `SavedList` | Merge with existing MovieChoice implementation | Select one library source of truth; do not preserve generic items |

## AI mapping

| Friday Picks AI Capability | MovieChoice Equivalent | Recommendation | Reason |
|---|---|---|---|
| One-line “why” prompt | Planned explanation layer | Import with adaptation | Preserve scope and tone; pass structured reason facts and request keyed JSON output |
| Taste note in explanation prompt | Planned profile taste context | Import with adaptation | Use a bounded summary of confirmed preferences and relevant signals |
| JSON array parser | Planned structured output | Replace | Use schema-constrained output keyed by recommendation item ID |
| Overview fallback | Planned graceful degradation | Replace | Generate a deterministic explanation from score reasons; do not relabel synopsis as personalization |
| AI excluded from ranking | MovieChoice product principle | Import unchanged | This is a non-negotiable architectural invariant |
| General Ask with web search | Planned bounded AI refinement | Leave behind | Replace only with catalog-grounded entertainment refinement, not general chat |
| Responses API fallback to chat completions | Planned AI gateway | Import with adaptation | Centralize provider/model fallback, observability, budgets, and output validation |

## Data and collaboration mapping

| Friday Picks Capability | MovieChoice Equivalent | Recommendation | Reason |
|---|---|---|---|
| Generic `items` collection | Typed Mongoose models | Replace | Domain-specific schemas enable validation, indexes, migrations, and ownership rules |
| Private/shared flag | Household profiles are planned | Import with adaptation | Add explicit household visibility only where product-approved; default recommendation data should remain private |
| Family Takes | No equivalent | Import with adaptation, deferred | A title note is a useful taste signal and household memory, but not a Phase 1 engine dependency |
| Restaurant records | No equivalent | Leave behind | Outside MovieChoice’s scope |
| Credentials collection | `User` and Auth.js | Leave behind | Current identity architecture supersedes it |
| Name-based owner | Canonical user/profile IDs | Replace | Ownership must use immutable IDs |

## Client and experience mapping

| Friday Picks UI Capability | MovieChoice Equivalent | Recommendation | Reason |
|---|---|---|---|
| Static SPA shell | Next.js App Router | Replace | MovieChoice is the active modern UI foundation |
| Weekly Picks list | Planned Friday Picks collection | Import with adaptation | Present as a personalized home module and Explore destination |
| Floating refresh | Planned Quick Pick “Not Quite Right” | Import with adaptation | Refresh needs replace-one/refresh-all semantics, feedback capture, and stable constraints |
| Movies/shows sections | Current movie rows; no TV support | Import with adaptation | Preserve composition while adding media type to the catalog domain |
| Feedback buttons on cards | My Movies actions; planned taste signals | Merge with existing MovieChoice implementation | Add recommendation feedback without conflating it with library states |
| “Seen it” action | My Movies watched | Merge with existing MovieChoice implementation | Reuse the single watched source of truth |
| Watchlist action | My Movies watchlist | Merge with existing MovieChoice implementation | Continue the active feature; extend to shows and profiles rather than add another list |
| Settings chips and custom labels | Profile settings | Import with adaptation | Offer canonical choices first; treat unmatched free text as a taste note or mapped taxonomy request |
| Auto-refresh after Friday | No equivalent | Import with adaptation | Make run staleness server-side and timezone-aware |
| Cinema page | Current upcoming row | Import with adaptation, later | Useful adjacent mode, subordinate to recommendation work |
| Theater lookup | No equivalent | Leave behind initially | It adds Places dependency and does not improve recommendation quality |
| Explore Places | No equivalent | Leave behind | Outside the product |
| Restaurant Log | No equivalent | Leave behind | Outside the product |
| Install-on-iPhone guide | PWA manifest exists | Import with adaptation | Keep install education as contextual PWA UX, not a hard-coded browser-specific page |

## Current MovieChoice conflicts to resolve before transplant

| Conflict | Evidence | Recommendation |
|---|---|---|
| Household profiles versus one profile per user | `Profile.userId` is unique and API upserts one profile | Remove uniqueness, introduce household/account ownership, and scope preferences/taste/library deliberately |
| Embedded and separate taste signals | `Profile.tasteSignals` overlaps `TasteSignal` | Make `TasteSignal` the event/source of truth; maintain derived profile aggregates separately |
| `SavedList` versus `UserMovie` | Both model saved title state | Use `UserMovie`/library entries for default states; reserve a collection model for named collections only |
| User-level versus profile-level library | `UserMovie` uses `userId`; product promises per-profile taste | Decide that watchlist may be account-level or profile-level explicitly; watched and feedback should be profile-level |
| Movie-only catalog versus movie/show product | `tmdb.ts` exposes movie DTOs only | Introduce media-neutral catalog types before building the engine |
| Aspirational docs versus active code | APIs and engine in docs do not exist | Treat existing documents as intent, then update them after architecture approval to match the phased target |
| Anonymous-first vision versus invite-only auth | Product documents and active auth conflict | Make a product decision before designing recommendation identity and persistence |

## Recommended transplant boundary

Import these first:

1. quality gates;
2. provider and region hard filtering;
3. watched/disliked/recent-impression exclusion;
4. provider-aware discover sources;
5. liked-title recommendation sources using canonical IDs;
6. the initial weighted score;
7. international rotation;
8. honest no-result handling;
9. deterministic explanation fallback;
10. AI-after-ranking.

Do not import:

- the monolithic endpoint;
- localStorage personalization;
- name/PIN identity;
- generic Mongo payloads;
- dual TMDB auth;
- unseeded randomness;
- general chat;
- places and restaurant features.
