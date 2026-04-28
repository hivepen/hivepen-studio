# Hivepen Studio Analytics & Discovery Cache Roadmap

This roadmap covers the first analytics surface for Hivepen Studio and the
client-side discovery cache that supports fast everyday curation workflows.

## Goals

- Make account and community discovery feel immediate on repeat visits.
- Persist high-value discovery data for curators and researchers who revisit the
  same entities often.
- Establish `/analytics` as the connected-account command center for post reward
  performance and future income analysis.
- Keep analytics hooks reusable so profile-level analytics can be added later
  without reworking the aggregation layer.

## Discovery Cache Strategy

### Persistence rules

- Use `localStorage` only for v1 persistence.
- Persist normalized account and community entities keyed by canonical name/id.
- Persist search-result buckets keyed by normalized query text and entity type.
- Persist recents and frequency counters independently so relevance survives
  bucket eviction.

### Freshness and retention

- Entity snapshots expire after 7 days.
- Search-result buckets expire after 30 days.
- Analytics aggregate snapshots expire after 24 hours.
- Keep up to 50 recent/frequent accounts and 50 recent/frequent communities.
- Keep up to 40 cached search buckets per entity type.

### Refresh behavior

- Return cached results immediately when available.
- Prefer exact, recent, and frequently used matches before older cached items.
- Refresh network-backed discovery results in the background and reseed the
  cache without blocking the UI.
- Seed recents/frequency data from explicit selections and successful lookups.

### First consumers

- `/users`
- `/communities`
- `/search` author suggestions
- `CommunityCombobox`
- `/analytics` account-level aggregates

## Delivery Sequence

### Phase 1 — Foundation

- [x] Document analytics and cache architecture.
- [ ] Add typed discovery cache storage utilities and tests.
- [ ] Add typed analytics aggregation utilities and tests.

### Phase 2 — Discovery Speed

- [ ] Hydrate cached account search results on `/users`.
- [ ] Hydrate cached community search results on `/communities`.
- [ ] Surface cached author suggestions on `/search`.
- [ ] Surface recent/frequent community picks in `CommunityCombobox`.

### Phase 3 — Analytics v1

- [ ] Build connected-account analytics route states: connected, loading, empty,
  and ready.
- [ ] Add summary cards for total tracked rewards, average reward per post, and
  tracked post count.
- [ ] Add monthly post rewards trend for the last 12 months.
- [ ] Cache account-level analytics aggregates for 24 hours and refresh in the
  background.

### Phase 4 — Roadmap Backlog

- [ ] All-time post reward performance.
- [ ] Monthly income.
- [ ] Weekly income.
- [ ] Curation rewards.
- [ ] Community performance comparisons.
- [ ] Deeper post statistics and breakdowns.

## Notes

- The first chart is intentionally scoped to connected-account post rewards to
  ship a useful analytics foundation quickly.
- Current build-size warnings are baseline and should not be treated as blockers
  unless this work materially worsens them.
