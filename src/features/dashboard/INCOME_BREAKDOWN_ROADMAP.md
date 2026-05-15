# Income Breakdown Roadmap

This document tracks the next correctness and UX improvements for the
hierarchical dashboard income chart so we keep the implementation aligned with
the product intent: honest, cash-like, and easy to inspect.

## Goals

- Keep the chart strictly focused on cash-like income.
- Make transfer-related classifications more truthful and easier to interpret.
- Reduce visual drift by aligning chart styling with Chakra UI v3 semantic
  color tokens and dashboard surface patterns.
- Improve accessibility and usability across mouse, touch, and keyboard input.

## Approved Direction

### 1. Keep transfers cash-like

- Exclude `transfer_to_vesting` from the transfers income bucket.
- Do not treat power-ups as liquid income.
- Preserve transfer buckets only for liquid inbound value, such as HIVE or HBD
  transfers and savings withdrawals that reach the account as spendable balance.

### 2. Delegation-linked transfer attribution

- Keep the current `From delegatees` bucket because it answers a useful,
  trustworthy question:
  "How much liquid value did I receive from accounts I delegate to?"
- Do not claim causation between delegation and transfer.
- Add a future improvement to classify historical transfers against delegation
  history for the selected range, not only the current live delegatee set.

Implementation note:
- The current implementation uses the present outgoing delegation set to
  attribute historical transfers. This can misclassify older transfers if the
  delegation relationship changed after the transfer happened.

### 3. Chakra-native color system

- Replace hardcoded hex palettes in the chart component.
- Assign each top-level category a Chakra `colorPalette` identity:
  - `author` -> `green`
  - `curation` -> `purple`
  - `interest` -> `orange`
  - `witness` -> `cyan`
  - `transfers` -> `red`
- Style chart surfaces, labels, and legend states with semantic palette tokens
  where possible, including tokens such as:
  - `colorPalette.fg`
  - `colorPalette.muted`
  - `colorPalette.subtle`
  - `colorPalette.emphasized`
  - `colorPalette.solid`
  - `colorPalette.border`
- Ensure the chart remains legible in both light and dark mode without relying
  on fixed rgba values for primary states.

### 4. Make percentages explicit

- Keep all percentages total-based, not parent-based.
- Label them clearly so the user understands each percentage is a share of total
  income for the selected range.
- Avoid ambiguous presentations that could be read as "share of parent
  category."

### 5. Hide empty categories

- Hide zero-value subcategories from the legend and outer ring.
- Hide zero-value categories from the legend and inner ring if all of their
  children are zero.
- If every category is zero, keep the panel visible but render an empty-state
  version of the chart instead of misleading slices.

### 6. Improve interaction and accessibility

- Support click or tap to pin a hovered category or subcategory.
- Support keyboard focus and activation for legend rows and chart slices.
- Add accessible names for interactive chart elements.
- Preserve the current quick-hover behavior for desktop while making the chart
  usable on touch devices.

### 7. Align the panel with dashboard surfaces

- Refactor hardcoded chart container colors, borders, and text colors to use
  Chakra UI semantic tokens and shared dashboard surface patterns.
- Keep the compact two-ring visual design, but make it feel native to the
  dashboard instead of a standalone imported mock.

## Suggested Implementation Order

1. Exclude power-ups from transfers income.
2. Hide zero-value categories and subcategories.
3. Clarify percentage labeling as total-based.
4. Refactor palette and surface styling to Chakra semantic tokens.
5. Add pinned selection plus keyboard and touch-friendly interaction.
6. Improve historical delegatee attribution using delegation history.

## Acceptance Notes

- The chart should never imply a non-cash event is income.
- Transfer labels should stay honest even when attribution is incomplete.
- Any future historical-attribution improvement must be documented in code and
  tests because it changes the trust model of the metric.
