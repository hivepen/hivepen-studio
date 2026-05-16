# Dashboard Roadmap

This roadmap replaces the older analytics and income-breakdown planning notes.
It is intentionally opinionated about feasibility: we should prefer a smaller
set of truthful charts over a larger set of impressive but weakly supported
visuals.

The temporary inspiration file at
[`docs/hive-dashboard-examples.temp.html`](/Users/carlosepc/Desktop/repos/Hivepen/Hivepen%20Studio/hivepen-studio/docs/hive-dashboard-examples.temp.html)
contains strong visual directions, but several concepts there assume data we do
not currently have from public Hive APIs or would require substantial
inference. This document separates those clearly.

## Current Data We Actually Have

The current dashboard can already aggregate these public data sources:

- Account posts and comments for the selected range.
- Account reward history from `get_account_history`, including:
  author rewards, curation rewards, savings interest, witness rewards, and
  selected inbound transfers.
- Outgoing delegations from public wallet APIs.
- Global chain properties and median HIVE/HBD price.
- Wallet/profile-level account metrics already fetched elsewhere in the app.

This means we can reliably compute:

- Reward income over time, both bucketed and daily.
- Reward composition by type.
- Post-level payout, vote, and comment stats.
- Publishing cadence and engagement counts.
- Transfer and delegation-derived summaries, with clearly documented limits.

This does **not** automatically mean we can reliably compute:

- Exact vote timing behavior for all votes cast.
- Community-level curation allocation by HP unless we explicitly track vote
  targets and derive it ourselves.
- Witness rank history unless we query historical witness state over time.
- RC usage composition unless we model operation costs or find a trustworthy
  upstream source.
- Forward-looking projections that appear more certain than they are.

## Feasibility Review

### High value, feasible now or with light aggregation

These are good candidates because they are useful and grounded in public data we
already fetch or can derive with modest extra work.

#### 1. Daily reward calendar heatmap

- Status: Implemented
- Why it works:
  We already have timestamped reward history and can aggregate by UTC day.
- Notes:
  Keep one cell per day, independent of the selected dashboard bucket unit.

#### 2. Reward trend and composition charts

- Status: Implemented
- Why it works:
  Weekly/monthly buckets and daily reward aggregation are already available.
- Notes:
  We now have stacked bars, sunburst, and daily calendar views that cover most
  reward questions without inference.

#### 3. Post performance scatter plot

- Feasibility: High
- Data support:
  We already have per-post total reward, author reward, votes, comments, title,
  creation date, and top posts.
- Useful questions answered:
  Which posts overperform on payout vs. engagement? Which posts earned well
  despite lower vote count?
- Caveat:
  Bubble size based on word count is only feasible if we also fetch or derive
  body length reliably. If not, use comments or age instead.

#### 4. Payout distribution over time

- Feasibility: High
- Data support:
  We already have post-level payouts and creation timestamps.
- Recommended form:
  Boxplot by week or month, or a simpler violin/histogram alternative if
  boxplot UX feels too dense.
- Useful questions answered:
  Are rewards getting more consistent, or are a few spikes driving the total?

#### 5. Community reward breakdown

- Feasibility: Medium-high
- Data support:
  Posts already carry community metadata; author rewards can be grouped by
  community. We can also separate posts vs. comments where metadata exists.
- Recommended form:
  Sunburst or treemap by community, then reward source.
- Caveat:
  Comment-to-community attribution may be weaker than post attribution,
  depending on available metadata on comment entries.

#### 6. Savings and delegation summary charts

- Feasibility: Medium-high
- Data support:
  Savings interest and current outgoing delegations are public and already
  touched by the dashboard.
- Recommended form:
  Compact treemap or ranked bar list for delegation relationships, plus a small
  savings-interest trend.
- Caveat:
  Historical delegation state is not fully modeled yet, so time-based
  delegation attribution must be labeled carefully.

### Feasible, but only with additional aggregation work

These are realistic, but we should only build them if they answer a clear user
question that the existing dashboard does not already cover.

#### 7. Vote timing heatmap by weekday × hour

- Feasibility: Medium
- Data support:
  Only feasible if account history or other public endpoints expose enough vote
  operations for votes cast by the user. This is different from reward history.
- Useful if:
  We want a true curation-behavior panel.
- Caveat:
  If we cannot fetch a trustworthy vote-cast history at acceptable cost, we
  should not ship a simulated or partial version.

#### 8. Incoming delegation treemap

- Feasibility: Medium
- Data support:
  Likely possible from public delegation APIs, but we currently fetch outgoing
  delegations, not incoming delegations.
- Useful if:
  We want a better “who powers this account” view.
- Caveat:
  We should confirm endpoint coverage and pagination costs first.

#### 9. HIVE price vs. reward income comparison

- Feasibility: Medium
- Data support:
  Partially feasible because we already compute HIVE/HBD conversion from median
  price, but historical price correlation requires historical price series, not
  just the current median.
- Useful if:
  We want to explain whether income swings came from activity or token price.
- Caveat:
  Needs a trustworthy historical price source. Without that, this chart should
  not be built.

#### 10. Publishing cadence and consistency views

- Feasibility: High
- Data support:
  We already have timestamps for posts/comments and can derive gaps, streaks,
  and cadence.
- Recommended form:
  Calendar streaks, interval histograms, or cadence score cards.
- Caveat:
  This is useful, but lower priority than reward and performance charts.

### Possible visually, but weakly supported or too inferential right now

These are the charts we should avoid unless the data story gets much stronger.

#### 11. Curator profile radar vs. top-100 average

- Feasibility: Low
- Reason:
  The “top-100 curator average” comparison requires a defensible benchmark
  dataset and carefully defined metrics. We do not currently have that.
- Risk:
  The chart could look polished while being mostly invented.

#### 12. Hive Power flow sankey

- Feasibility: Low-medium
- Reason:
  A sankey implies causal flow between HP, voting, author rewards, savings, and
  delegation that we cannot honestly model from current public data.
- Risk:
  It is visually attractive but can overclaim how one bucket “flows” into
  another.
- Recommendation:
  Prefer simpler allocation or relationship charts unless we can back each edge
  with a real metric.

#### 13. HP accumulation projection

- Feasibility: Low
- Reason:
  We can project mathematically, but the result would be highly assumption-led
  and easy to overread as predictive.
- Recommendation:
  If we ever do this, it should be explicitly framed as a scenario tool, not a
  dashboard fact view.

#### 14. Witness rank timeline

- Feasibility: Low
- Reason:
  Historical witness rank is not part of our current dashboard inputs and would
  need a dedicated data source or historical snapshots.
- Recommendation:
  Do not implement until we have real historical witness data.

#### 15. RC usage breakdown

- Feasibility: Low
- Reason:
  Publicly deriving RC consumption by category is non-trivial and easy to get
  wrong.
- Recommendation:
  Avoid until we have a trustworthy model or an upstream API that already does
  this.

## Recommended Delivery Plan

### Phase 1: Finish the trustworthy dashboard core

- [x] Reward income stacked bar chart
- [x] Reward income daily calendar heatmap
- [x] Income breakdown sunburst
- [ ] Post performance scatter plot
- [ ] Payout distribution chart by week or month
- [ ] Community reward breakdown chart

Why this phase:
- These views all rest on data we already fetch or can derive with modest extra
  aggregation.
- Together they answer the highest-value creator questions:
  what earned, when it earned, what type of income it was, and which content
  drove it.

### Phase 2: Add carefully scoped curation views

- [ ] Verify whether vote-cast history is fetchable and affordable.
- [ ] If yes, add weekday × hour vote timing heatmap.
- [ ] If yes, consider top communities by curation activity or votes cast.
- [ ] If no, document the limitation and skip those charts.

Why this phase:
- Curation analytics are useful, but only if they are grounded in real vote
  activity rather than reward proxies.

### Phase 3: Delegation and account structure

- [ ] Confirm incoming delegation API coverage.
- [ ] Add incoming delegation treemap or ranked bar list.
- [ ] Add clearer delegation-linked transfer summaries where truthful.

Why this phase:
- This adds wallet/account context without pretending delegation explains all
  earnings behavior.

### Phase 4: Optional advanced analytics

- [ ] Historical price correlation, only if a trustworthy historical price
      source is added.
- [ ] Publishing cadence visualizations.
- [ ] Scenario-based projection tooling, only if clearly labeled as modeled and
      not factual.

Why this phase:
- These are valuable but not as essential as the core earnings and content
  performance views.

## Recommended Next Charts

If we continue implementation immediately, the best next additions are:

1. Post performance scatter plot
2. Payout distribution chart
3. Community reward breakdown sunburst or treemap

This order maximizes utility while staying honest about what the public data can
support.

## Charts We Should Explicitly Avoid For Now

- Curator radar benchmark
- HP flow sankey
- Witness rank timeline
- RC usage breakdown
- Projection-heavy growth charts presented as facts

These are not rejected forever, but they should stay out of the dashboard until
we can support them with data that is strong enough to deserve the visual
confidence those chart types imply.
