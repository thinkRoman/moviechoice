# Product Evolution: MovieChoice as the Premium Successor to Friday Picks

## Product thesis

MovieChoice should not become a larger catalog browser. It should become a **decision service**.

The premium evolution of Friday Picks is not “more recommendations.” It is:

- a faster path to one trusted choice;
- confidence that the title is actually included on a service the viewer has;
- memory that works across devices and household members;
- transparent learning from lightweight feedback;
- enough novelty to stay interesting without becoming obscure;
- explanations that feel personal but remain grounded;
- a weekly ritual plus an immediate tonight flow.

The recommendation engine is the product. The interface should make its judgment feel effortless, inspectable, and correct.

## Product positioning

### Recommended promise

> MovieChoice knows who is watching, what fits tonight, and what you can already stream—then makes the choice for you.

### Primary job

“What should we watch tonight?”

### Secondary jobs

- “Give me another option without starting over.”
- “Help us agree when several people are watching.”
- “Remember what I liked, disliked, and already watched.”
- “Show me something excellent I would not find myself.”
- “Give me a reliable weekly shortlist.”

### What MovieChoice should not become

- another infinite poster wall;
- a general-purpose chatbot;
- a social network;
- a provider availability search engine with no opinion;
- an AI that confidently invents titles or streaming claims;
- a settings-heavy recommender that makes users configure the algorithm.

## Onboarding

### Recommended experience

Use progressive onboarding, not a mandatory questionnaire.

1. **Immediate value:** let a new viewer get a high-quality generic Quick Pick with minimal context.
2. **Service selection:** ask for streaming services when it materially improves the result, ideally through recognizable provider tiles.
3. **Taste bootstrap:** offer a fast swipe/tap set of known titles or genres after the first value moment.
4. **Profile creation:** explain the benefit—better picks and shared household support—rather than requiring identity before value.
5. **Taste note:** make this optional and show how MovieChoice interpreted it.

### Improvements over both systems

- Do not ask for service names as free text.
- Do not force users to articulate taste before they trust the product.
- Do not make every viewer repeat household-level subscriptions.
- Ask whether the profile is an adult, teen, or child only if that meaningfully controls content.
- Support “watching with someone else” as a session context without forcing a permanent merged profile.

### Recommended cold-start strategy

Use a quality-first baseline:

- selected services;
- tonight context;
- broad popularity confidence;
- diversity;
- a controlled discovery slot.

Avoid pretending that generic popularity is personalization.

## Home screen

### Current issue

The active home is a polished generic TMDB browse page. Trending, Popular, Top Rated, and Coming Soon are useful catalog views, but they do not deliver the core promise.

### Recommended hierarchy

1. **Primary hero:** “What should we watch tonight?” with a one-tap start or resumed context.
2. **Tonight’s best bet:** one current recommendation when enough context exists.
3. **Friday Picks:** the stable weekly shortlist.
4. **Continue deciding:** recently viewed recommendation run, if unresolved.
5. **Personalized collections:** hidden gems, because you liked, under two hours, international picks.
6. **Generic browse:** trending and upcoming, lower on the page.

### Design principle

The first screen should ask for a decision, not attention. Poster rails are supporting material.

## Recommendation flow

### Recommended flow

The default flow should usually be three decisions, not five:

1. **Who is watching?** Use the last/primary profile by default; only interrupt when ambiguous.
2. **What fits tonight?** Mood and time in one compact surface.
3. **Choose for me.** Apply saved providers automatically.

Return:

- one lead recommendation;
- two credible alternatives;
- a concise grounded reason;
- included provider(s);
- runtime and content fit;
- clear actions.

### Actions

- **Play / Where to watch**
- **Save**
- **Seen**
- **Not for us**
- **Replace this**
- **Change tonight’s filters**
- **Tell MovieChoice more**

### Why one lead plus alternatives

One title honors the promise to decide. Alternatives preserve agency and household negotiation without returning to an infinite grid.

### No-result behavior

Never silently violate a hard preference. Explain the bottleneck:

> Nothing met the quality bar on Netflix under 90 minutes. Try up to two hours, or include Prime Video.

The user chooses which constraint to relax.

## Personalization

### Signal hierarchy

Not all interactions mean the same thing.

| Signal | Meaning | Recommended strength |
|---|---|---:|
| Watched and loved | Strong positive taste evidence | Very high |
| Thumbs up | Positive recommendation evidence | High |
| Favorite | Strong affinity/library state | High |
| Accepted recommendation | Contextual positive evidence | Medium-high |
| Watched | Exclusion plus weak/unknown taste until rated | Medium |
| Saved | Intent, not necessarily taste | Medium-low |
| Skipped/replaced | Weak contextual negative | Low |
| Thumbs down / not interested | Strong negative | High |
| Hidden | Hard suppression until restored | Hard |

### Principles

- Distinguish permanent taste from tonight’s mood.
- Distinguish “I have seen it” from “I liked it.”
- Distinguish “not tonight” from “never recommend this.”
- Do not overfit after one interaction.
- Let users inspect and correct what MovieChoice thinks they like.
- Treat household sessions as an aggregation problem, not a merged permanent profile.

### Household recommendation strategies

Offer one default strategy: **least objection with shared upside**.

The engine should:

- apply every viewer’s hard exclusions;
- avoid strong dislikes from any viewer;
- reward overlap in positive preferences;
- reserve a modest discovery opportunity;
- explain the shared fit.

Advanced controls such as “favor Alex tonight” can come later.

## Settings

### Recommended structure

Keep settings understandable as human preferences, not model controls:

- Profiles and household
- Streaming services
- Taste and content preferences
- Languages and subtitles
- Watched and hidden titles
- Notifications and Friday Picks
- Privacy and data
- Account and access

### Avoid

- exposing score weights;
- requiring genre micromanagement;
- mixing tonight-only filters into permanent settings;
- storing unmatched free-form provider or genre strings as canonical values.

### Trust feature

Add “What MovieChoice knows about me,” showing:

- confirmed tastes;
- recent signals;
- hidden titles;
- connected services;
- controls to correct or reset them.

## Streaming services

### Product requirement

“Available” must mean:

- correct region;
- currently observed;
- included with subscription when that mode is selected;
- provider identified canonically;
- evidence fresh enough for the claim.

### Recommended UX

- Select services once during onboarding/settings.
- Apply them automatically.
- Let the user temporarily add or remove a service for one session.
- Clearly label rental/purchase results if the user opts to browse beyond subscriptions.
- Display all matching subscribed providers, not an arbitrary first provider.
- Provide “report availability issue.”

### Future

Support bundles, ad tiers, channels, and region changes only when the provider source can represent them accurately.

## Genre preferences

### Recommendation

Genres should be a weak-to-medium preference layer, not the whole taste model.

Use:

- broad likes;
- broad dislikes;
- tonight-only desired genres;
- hard content exclusions;
- inferred affinities from title interactions.

Separate non-genre concepts:

- International
- Limited series
- Hidden gem
- Family night
- Mind-bending
- Slow burn
- Comfort watch

These belong to languages, format, discovery strategy, audience, mood, or tone—not a flat genre array.

## Taste notes

Friday Picks’ free-form taste note is valuable because it captures nuance that checkboxes miss.

### Premium implementation

Show two layers:

1. the user’s original note;
2. MovieChoice’s structured interpretation.

Example:

> “We love Korean thrillers but not graphic horror. My partner gets bored with slow starts.”

Interpreted as:

- Korean-language affinity: positive
- Thriller: positive
- Graphic violence: avoid
- Slow pacing: negative
- Household context: two viewers

The user can confirm, edit, or reject each inference.

### Safety rule

The original note is never injected directly as authority into ranking or provider claims. It is converted to a validated context patch.

## Refresh experience

Friday Picks’ refresh button is useful but semantically ambiguous.

### Recommended refresh actions

- **Replace this title:** preserve context and other results.
- **New lineup:** create a new deterministic run and record impressions.
- **Broaden choices:** show which constraint will change.
- **Not tonight:** weak temporary negative.
- **Never show this:** hard title suppression.

### Premium behavior

Explain why the replacement differs:

> Swapped for a faster-paced option on Netflix, while keeping your under-two-hours limit.

Do not mark every refresh as a dislike.

## Watched titles

### Recommended behavior

- Watched titles are excluded from ordinary recommendations.
- Watched does not imply liked.
- Prompt for optional lightweight feedback after marking watched.
- Support catalog search for manual history entry.
- Store watched date when known.
- Allow rewatch mode explicitly.
- If a title is in a series/franchise, do not automatically suppress related titles unless the user dislikes them.

### Migration principle

Use canonical catalog IDs and media types. Preserve legacy title text only as import metadata.

## Hidden titles

Hidden is distinct from thumbs down.

- **Thumbs down:** negative taste evidence.
- **Hide:** do not surface this title.
- **Not tonight:** temporary context.
- **Already watched:** ordinary exclusion with history.

Provide a Hidden Titles settings page with undo. Do not make suppression irreversible or invisible.

## Collections

### Recommended collection types

- Friday Picks
- Hidden Gems for You
- Because You Loved…
- Great Under 90 Minutes
- International Spotlight
- One-Season Stories
- Family Consensus
- Award Winners You Can Stream
- Leaving Soon, only with trustworthy availability data

### Architecture/product rule

Collections are not separate recommenders. Each is:

- a candidate-source configuration;
- a hard-filter policy;
- a scoring policy;
- a composition/diversity policy;
- an optional editorial seed set.

All collections use the same engine primitives and evidence model.

### Hidden gems

Define “hidden gem” explicitly. A possible starting definition:

- clears a high quality threshold;
- lower but sufficient vote count/popularity;
- strong profile match;
- not recently exposed;
- available on selected services.

Do not call low-confidence obscurity a gem.

## AI usage

### Appropriate roles

- Translate natural-language refinement into structured context.
- Summarize confirmed taste.
- Write warm explanations from verified engine reasons.
- Help users understand why no result matched.
- Suggest which constraint to relax, using engine-produced options.

### Inappropriate roles

- Selecting titles independently.
- Inventing availability.
- Generating a list from model memory.
- Acting as an unrestricted general assistant.
- Converting unreviewed free text into permanent hard exclusions.
- Hiding deterministic reasons behind vague prose.

### Explanation design

The deterministic engine should first produce:

```json
{
  "reasonCodes": [
    "MATCHED_LIKED_SEEDS",
    "AVAILABLE_ON_SELECTED_PROVIDER",
    "FITS_RUNTIME",
    "INTERNATIONAL_AFFINITY"
  ]
}
```

AI turns those facts into warmth. If AI fails, MovieChoice renders a good template from the same reason codes.

## Friday Picks as a product ritual

Preserve the Friday concept, but position it as one surface of the same intelligence.

Recommended behavior:

- a stable weekly list;
- profile-specific;
- generated in the viewer’s timezone;
- a deliberate movie/show composition;
- one controlled discovery/international slot;
- no repeated recent exposure;
- optional weekly notification;
- clear “updated this Friday” state;
- refresh does not mutate the canonical weekly list unless the user explicitly creates a new lineup.

## Premium trust and explainability

Each recommendation should be able to answer:

- Why this title?
- Why tonight?
- Why for these viewers?
- Where can I watch it?
- What would change the result?

The UI need not show a score, but the system must retain a score breakdown for support, evaluation, and deterministic fallback.

## Future roadmap

### Near term

- Recommendation Engine v1
- Provider-aware Quick Pick
- Unified watched/taste/library data
- Friday Picks weekly collection
- Structured taste notes
- Grounded explanations

### Medium term

- Household consensus ranking
- TV and limited-series maturity
- Better provider handoff and availability reporting
- Recommendation quality dashboard
- Offline/cached weekly picks
- Notifications
- Editorial collection tools

### Long term

- Multi-region catalog and providers
- Alternate availability provider behind the catalog interface
- Optional imports from watch-history sources where permitted
- Learned re-ranking trained on sufficient first-party outcomes
- Contextual modes such as travel, family visit, or rewatch night
- Privacy-preserving aggregate quality learning

### Explicitly deferred

- Social feed
- Public profiles
- General chat
- Restaurant and broad place discovery
- Playback hosting
- Unverified “leaving soon” claims

## Product metrics

### North-star behavior

The viewer accepts a recommendation and stops browsing.

### Recommended metrics

- time to first recommendation;
- time to accepted choice;
- acceptance/start rate;
- replace-one and refresh-all rate;
- no-result rate;
- availability mismatch reports;
- watched-after-recommendation;
- recent-title repetition rate;
- household consensus acceptance;
- explanation usefulness;
- AI fallback rate;
- weekly Friday Picks return rate.

Avoid optimizing clicks, scroll depth, or time in app. Success means leaving MovieChoice sooner with confidence.

## Final product recommendation

MovieChoice should combine:

- Friday Picks’ confidence, memory, weekly ritual, quality gates, provider constraints, and AI restraint;
- MovieChoice’s modern UI, typed platform, identity, persistence, and future extensibility;
- a stronger architecture than either system: deterministic, profile-aware, evidence-backed, reproducible, and measurable.

The premium version is not the one with the most features. It is the one users trust to make the decision.
